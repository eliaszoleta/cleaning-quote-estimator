const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// chatbot_conversations.messages stores the full raw transcript (every
// message, as jsonb) with nothing ever deleting it -- unlike
// public_estimate_attempts (see publicAttemptsCleanup.js, same pattern
// this mirrors), this table had no cleanup at all until now, so it grew
// unbounded for as long as the chatbot feature has existed.
//
// Safe to delete without losing the lead: chatbot_leads (the actual
// record -- name, phone, last_summary) is a separate table that doesn't
// reference conversations at all. The FK points the other way
// (chatbot_conversations.lead_id -> chatbot_leads.id), and the summary
// text gets copied onto the lead row itself at summarization time (see
// chatbotSummary.js), so the lead keeps its own permanent copy of "what
// they needed" independent of the raw transcript. This only ever deletes
// old message-by-message transcripts, never a lead or its summary.
//
// last_activity_at, not created_at -- a conversation that's still
// genuinely ongoing (rare, but the widget has no hard length cap) should
// never be swept just because it started more than 30 days ago; cutting
// on "30 days since anything happened" is what actually means abandoned/
// no longer useful. Same column the inactivity-sweep summarizer already
// indexes (chatbot_conversations_status_activity_idx), so this delete
// reuses that index too.
const RETENTION_DAYS = 30;

async function cleanupOldChatbotConversations() {
  const supabase = getSupabase();
  if (!supabase) return; // no Supabase configured (local file-fallback dev)

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  try {
    const { error } = await supabase.from('chatbot_conversations').delete().lt('last_activity_at', cutoff);
    if (error) console.warn('cleanupOldChatbotConversations failed:', error.message);
  } catch (err) {
    console.warn('cleanupOldChatbotConversations failed:', err.message);
  }
}

module.exports = { cleanupOldChatbotConversations };
