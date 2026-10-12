// Public API for the embeddable Growth/Pro-tier AI chatbot widget (see
// migration 017). One route, one Claude integration, serving every client's
// chatbot -- each request is scoped by :chatbotId, which the embed snippet
// on that client's own site carries (see the widget bundle this backend
// serves from /chat-widget.js).
//
// Contact-gate design: the model is instructed (system prompt) to greet
// normally, then ask for name + phone before anything substantial, then
// call the save_contact tool the moment it has both. The *enforcement*
// isn't a hard backend block on replying -- that would feel robotic for a
// stray early question -- it's that a lead only ever gets written to
// chatbot_leads (and alerted/synced) once save_contact actually fires with
// backend-validated values, never from free-text parsing of the
// conversation. Once that tool has fired, `tools` is omitted from every
// later request on this conversation so Claude can't call it again or get
// confused about whether it already has the contact info.
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { sendChatbotLeadAlertEmail } = require('../services/email');
const { syncLeadToSheet } = require('../services/chatbotSheetsSync');
const { summarizeConversation } = require('../services/chatbotSummary');

const MODEL = 'claude-haiku-5-5';

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

const SAVE_CONTACT_TOOL = {
  name: 'save_contact',
  description: "Call this the moment you have BOTH the visitor's full name and phone number from their own messages -- not placeholders, not guesses. Call it exactly once per conversation. Do this before getting into any substantial discussion of their needs.",
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: "The visitor's full name, exactly as they gave it" },
      phone: { type: 'string', description: "The visitor's phone number, exactly as they gave it" },
    },
    required: ['name', 'phone'],
    additionalProperties: false,
  },
};

// Keeps only the digits, and strips a leading US country code -- same
// normalization fmtPhone in email.js uses for display, but here it's the
// canonical stored form so chatbot_leads(chatbot_id, phone) actually
// matches a returning visitor regardless of how they typed it (dashes,
// parens, spaces, a leading +1). Returns null for anything that isn't a
// plain 10-digit US number -- extensions/international numbers are out of
// scope for this v1.
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

function buildSystemPrompt(chatbot, returningLead) {
  const parts = [
    `You are a friendly, concise live-chat assistant for ${chatbot.business_name}, a cleaning company. Keep replies short and conversational, like a text message -- 1-3 sentences unless real detail is genuinely needed.`,
    chatbot.prompt_info ? `Business info (use this to answer accurately; if something isn't covered here, say a team member will follow up rather than guessing):\n${chatbot.prompt_info}` : null,
    `Conversation rules:\n- Greet the visitor warmly and naturally first.\n- Before getting into anything substantial (services, pricing, scheduling, their specific situation), get their full name and phone number -- ask for both in one natural, low-friction message, not like a form.\n- The moment you have both, call the save_contact tool with those exact values. Only once, and only with real values the visitor actually gave you.\n- After that, continue naturally and help with whatever they need.`,
  ];
  if (returningLead?.last_summary) {
    parts.push(`This is a returning visitor. Here's a summary of your last conversation with them, for your own context only -- don't recite it verbatim, just use it to pick up naturally where you left off:\n${returningLead.last_summary}`);
  }
  return parts.filter(Boolean).join('\n\n');
}

function toAnthropicMessages(messages) {
  return (messages || []).map(m => ({ role: m.role, content: m.content }));
}

// POST /api/chat/:chatbotId/message
// Body: { sessionToken: string|null, message: string }
router.post('/:chatbotId/message', async (req, res) => {
  const sb = getSupabase();
  const anthropic = getAnthropic();
  if (!sb) return res.status(503).json({ success: false, error: 'Not configured' });
  if (!anthropic) return res.status(503).json({ success: false, error: 'Chat is not configured yet' });

  const { chatbotId } = req.params;
  const { sessionToken, message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'message is required' });
  }

  try {
    const { data: chatbot, error: chatbotErr } = await sb
      .from('chatbots').select('*').eq('id', chatbotId).single();
    if (chatbotErr || !chatbot) return res.status(404).json({ success: false, error: 'Chatbot not found' });
    if (chatbot.status !== 'active') return res.status(403).json({ success: false, error: 'This chatbot is currently paused' });

    // Load the existing conversation by its session token, or start a new
    // one -- a missing/unknown token (first visit, or a cleared browser)
    // just means a fresh conversation, not an error.
    let conversation = null;
    if (sessionToken) {
      const { data } = await sb.from('chatbot_conversations')
        .select('*').eq('session_token', sessionToken).eq('chatbot_id', chatbotId).single();
      conversation = data || null;
    }
    if (!conversation) {
      const { data: created, error: createErr } = await sb.from('chatbot_conversations')
        .insert({ chatbot_id: chatbotId }).select('*').single();
      if (createErr) throw createErr;
      conversation = created;
    }

    let lead = conversation.lead_id
      ? (await sb.from('chatbot_leads').select('*').eq('id', conversation.lead_id).single()).data
      : null;

    const messages = toAnthropicMessages(conversation.messages);
    messages.push({ role: 'user', content: message.trim() });

    const gatheringContact = conversation.status === 'gathering_contact';
    const createParams = {
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: buildSystemPrompt(chatbot, lead), cache_control: { type: 'ephemeral' } }],
      messages,
    };
    if (gatheringContact) createParams.tools = [SAVE_CONTACT_TOOL];

    let response = await anthropic.messages.create(createParams);
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      const toolResults = [];
      let newlyCaptured = false;

      for (const block of toolUseBlocks) {
        if (block.name !== 'save_contact') {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'Unknown tool.', is_error: true });
          continue;
        }
        const name = String(block.input?.name || '').trim();
        const phone = normalizePhone(block.input?.phone);
        if (!name || name.length < 2) {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: "That name looks incomplete. Ask the visitor for their full name again." });
          continue;
        }
        if (!phone) {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: "That phone number isn't a valid 10-digit US number. Ask the visitor to double-check and resend it." });
          continue;
        }

        const { data: savedLead, error: leadErr } = await sb.from('chatbot_leads')
          .upsert({ chatbot_id: chatbotId, phone, name, updated_at: new Date().toISOString() }, { onConflict: 'chatbot_id,phone' })
          .select('*').single();
        if (leadErr) throw leadErr;

        lead = savedLead;
        newlyCaptured = true;
        conversation.lead_id = savedLead.id;
        conversation.status = 'active';

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: savedLead.last_summary
            ? `Saved. This is a returning visitor -- their last conversation summary is already in your system context above, use it to pick up naturally.`
            : 'Saved. You can continue the conversation normally now.',
        });
      }

      messages.push({ role: 'user', content: toolResults });

      // Second call: contact is handled, so the tool is no longer offered
      // (prevents a repeat call) and the system prompt is rebuilt in case
      // a returning-lead summary just became known this turn.
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: buildSystemPrompt(chatbot, lead), cache_control: { type: 'ephemeral' } }],
        messages,
      });
      messages.push({ role: 'assistant', content: response.content });

      if (newlyCaptured) {
        sendChatbotLeadAlertEmail({ chatbot, lead }).catch(err => console.warn('sendChatbotLeadAlertEmail failed:', err.message));
        syncLeadToSheet({ chatbot, lead }).catch(err => console.warn('syncLeadToSheet failed:', err.message));
      }
    }

    const replyText = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
      || "Sorry, could you say that again?";

    await sb.from('chatbot_conversations').update({
      messages,
      lead_id: conversation.lead_id,
      status: conversation.status,
      last_activity_at: new Date().toISOString(),
    }).eq('id', conversation.id);

    res.json({ success: true, sessionToken: conversation.session_token, reply: replyText, status: conversation.status });
  } catch (err) {
    console.error('chatWidget message error:', err.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/chat/:chatbotId/close -- fired when the visitor closes the
// chat window, so the summary + lead alert go out right away instead of
// waiting for checkIdleConversations' next sweep. A no-op (not an error)
// if the conversation never got past gathering_contact, was already
// summarized, or doesn't exist -- the widget calls this on every close
// without knowing which of those is true.
router.post('/:chatbotId/close', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Not configured' });
  const { sessionToken } = req.body || {};
  if (!sessionToken) return res.status(400).json({ success: false, error: 'sessionToken is required' });

  const { data: conversation } = await sb.from('chatbot_conversations')
    .select('id').eq('session_token', sessionToken).eq('chatbot_id', req.params.chatbotId).single();
  if (conversation) {
    summarizeConversation(conversation.id).catch(err => console.warn('summarizeConversation (close) failed:', err.message));
  }
  res.json({ success: true });
});

// GET /api/chat/:chatbotId/info -- lets the widget render a header and
// detect a paused/missing chatbot before showing the compose box at all.
router.get('/:chatbotId/info', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Not configured' });
  const { data: chatbot } = await sb.from('chatbots')
    .select('business_name, status').eq('id', req.params.chatbotId).single();
  if (!chatbot) return res.status(404).json({ success: false, error: 'Chatbot not found' });
  res.json({ success: true, businessName: chatbot.business_name, active: chatbot.status === 'active' });
});

module.exports = router;
