// Admin CRUD for the Growth/Pro-tier chatbots (see migration 017) --
// business info/prompt, lead alert email, "From" display name -- plus a
// per-chatbot leads list. Gated by the same x-admin-key every other admin
// route uses.
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}
router.use(requireAdminKey);

// GET /api/admin/chatbots — every chatbot, newest first.
router.get('/', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data, error } = await sb.from('chatbots').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Admin chatbots list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load chatbots' });
  }
});

// POST /api/admin/chatbots — create a new chatbot config.
router.post('/', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { business_name, prompt_info, lead_alert_email, from_name } = req.body || {};
  if (!business_name || !business_name.trim()) return res.status(400).json({ success: false, error: 'business_name is required' });
  if (!lead_alert_email || !lead_alert_email.trim()) return res.status(400).json({ success: false, error: 'lead_alert_email is required' });

  try {
    const { data, error } = await sb.from('chatbots').insert({
      business_name: business_name.trim(),
      prompt_info: (prompt_info || '').trim(),
      lead_alert_email: lead_alert_email.trim(),
      from_name: from_name && from_name.trim() ? from_name.trim() : null,
    }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin chatbots create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create chatbot' });
  }
});

// PATCH /api/admin/chatbots/:id — update any subset of fields, including status.
router.patch('/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { business_name, prompt_info, lead_alert_email, from_name, status } = req.body || {};
  const updates = { updated_at: new Date().toISOString() };
  if (business_name !== undefined) updates.business_name = business_name.trim();
  if (prompt_info !== undefined) updates.prompt_info = prompt_info.trim();
  if (lead_alert_email !== undefined) updates.lead_alert_email = lead_alert_email.trim();
  if (from_name !== undefined) updates.from_name = from_name && from_name.trim() ? from_name.trim() : null;
  if (status !== undefined) {
    if (!['active', 'paused'].includes(status)) return res.status(400).json({ success: false, error: "status must be 'active' or 'paused'" });
    updates.status = status;
  }

  try {
    const { data, error } = await sb.from('chatbots').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin chatbots update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update chatbot' });
  }
});

// DELETE /api/admin/chatbots/:id — cascades to its leads + conversations
// (ON DELETE CASCADE in migration 017), so this really does remove
// everything for that client's chatbot, not just the config row.
router.delete('/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { error } = await sb.from('chatbots').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin chatbots delete error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete chatbot' });
  }
});

// GET /api/admin/chatbots/:id/leads — this chatbot's captured leads, most
// recently active first, for the admin dashboard's leads panel (the
// Google Sheet is the version the sales team actually lives in day to
// day, this is just a read-only mirror for quick checks in-app).
router.get('/:id/leads', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data, error } = await sb.from('chatbot_leads')
      .select('*').eq('chatbot_id', req.params.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Admin chatbot leads list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load leads' });
  }
});

module.exports = router;
