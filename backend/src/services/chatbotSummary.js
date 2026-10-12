// Closes out a chatbot conversation: asks Claude for a structured summary
// of the transcript (what the visitor needs, urgency, other details for
// the sales team), stores it on chatbot_leads.last_summary (read back by
// routes/chatWidget.js next time that phone number returns), marks the
// conversation 'summarized', and fires the same lead-alert email + Sheets
// sync routes/chatWidget.js uses on capture -- this time with the summary
// filled in instead of the "still chatting" placeholder.
//
// Two triggers call summarizeConversation: an explicit POST
// /api/chat/:chatbotId/close from the widget (visitor closed the chat
// window), and checkIdleConversations below, polled from index.js on a
// short interval, for visitors who just wander off without closing
// anything -- same "setInterval is enough, no cron infra" reasoning as
// emailCampaignScheduler.js and bookingReminderScheduler.js.
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { sendChatbotLeadAlertEmail } = require('./email');
const { syncLeadToSheet } = require('./chatbotSheetsSync');

const MODEL = 'claude-haiku-5-5';
const IDLE_MINUTES = 10;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    needs: { type: 'string', description: 'What the visitor needs or was asking about, in a sentence or two' },
    urgency: { type: 'string', enum: ['low', 'medium', 'high'], description: 'How urgent this lead seems based on the conversation' },
    details: { type: 'string', description: "Other details useful to the sales team -- service type, area/address mentioned, timeline, anything specific they said" },
  },
  required: ['needs', 'urgency', 'details'],
  additionalProperties: false,
};

function transcriptText(messages) {
  return (messages || [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      const text = Array.isArray(m.content)
        ? m.content.filter(b => b.type === 'text').map(b => b.text).join(' ')
        : m.content;
      return text ? `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

async function summarizeConversation(conversationId) {
  const sb = getSupabase();
  const anthropic = getAnthropic();
  if (!sb || !anthropic) return false;

  const { data: conversation } = await sb.from('chatbot_conversations').select('*').eq('id', conversationId).single();
  if (!conversation || conversation.status !== 'active' || !conversation.lead_id) return false;

  const [{ data: chatbot }, { data: lead }] = await Promise.all([
    sb.from('chatbots').select('*').eq('id', conversation.chatbot_id).single(),
    sb.from('chatbot_leads').select('*').eq('id', conversation.lead_id).single(),
  ]);
  if (!chatbot || !lead) return false;

  const transcript = transcriptText(conversation.messages);
  if (!transcript) return false;

  // For a returning visitor, fold their existing summary into the prompt
  // and ask for an UPDATED one rather than summarizing this conversation
  // in isolation -- a short "is Friday still open?" follow-up shouldn't
  // wipe out the carpet-cleaning/timeline/address details a prior, longer
  // conversation already established. Still only ever one summary stored
  // (chatbot_leads.last_summary is overwritten, not appended to) -- no
  // version history, just the current best understanding of this lead.
  const priorSummaryBlock = lead.last_summary
    ? `This visitor has an existing summary from a previous conversation:\n${lead.last_summary}\n\nUpdate it based on this new conversation: keep anything still accurate, change anything that's changed (e.g. urgency, what they need, timeline), and add anything new. Don't just summarize the new conversation alone -- produce the single best current summary of this lead.\n\n`
    : '';

  let parsed;
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SUMMARY_SCHEMA } },
      messages: [{
        role: 'user',
        content: `${priorSummaryBlock}Summarize this live-chat conversation between a cleaning-company chatbot and a visitor, for the business's sales team. Visitor: ${lead.name}.\n\n${transcript}`,
      }],
    });
    const textBlock = response.content.find(b => b.type === 'text');
    parsed = textBlock ? JSON.parse(textBlock.text) : null;
  } catch (err) {
    console.warn('summarizeConversation: Claude call failed:', err.message);
    return false;
  }
  if (!parsed) return false;

  const summaryText = `Needs: ${parsed.needs}\nUrgency: ${parsed.urgency}\nDetails: ${parsed.details}`;
  const now = new Date().toISOString();

  await Promise.all([
    sb.from('chatbot_leads').update({ last_summary: summaryText, last_conversation_at: now, updated_at: now }).eq('id', lead.id),
    sb.from('chatbot_conversations').update({ status: 'summarized' }).eq('id', conversation.id),
  ]);

  const updatedLead = { ...lead, last_summary: summaryText };
  sendChatbotLeadAlertEmail({ chatbot, lead: updatedLead, summary: summaryText })
    .catch(err => console.warn('sendChatbotLeadAlertEmail (summary) failed:', err.message));
  syncLeadToSheet({ chatbot, lead: updatedLead, summary: summaryText })
    .catch(err => console.warn('syncLeadToSheet (summary) failed:', err.message));

  return true;
}

// Polled from index.js -- finds every 'active' conversation (contact
// already captured) that's gone quiet past IDLE_MINUTES and closes it out.
// 'gathering_contact' conversations that go idle are left alone: no lead
// was ever captured, so there's nothing to summarize or alert on.
async function checkIdleConversations() {
  const sb = getSupabase();
  if (!sb) return;

  const cutoff = new Date(Date.now() - IDLE_MINUTES * 60 * 1000).toISOString();
  const { data: idle, error } = await sb.from('chatbot_conversations')
    .select('id')
    .eq('status', 'active')
    .lt('last_activity_at', cutoff);
  if (error) { console.error('checkIdleConversations query failed:', error.message); return; }

  for (const row of (idle || [])) {
    await summarizeConversation(row.id).catch(err => console.warn(`summarizeConversation(${row.id}) failed:`, err.message));
  }
}

module.exports = { summarizeConversation, checkIdleConversations };
