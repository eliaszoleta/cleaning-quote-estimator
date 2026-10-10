// Shared engine behind the editable email-template system (admin dashboard's
// Email Marketing tab). Three jobs:
//
// 1. getTemplate(key) / getTemplateById(id) -- read a template, DB first
//    (so an admin's edits in the UI take effect immediately), falling back
//    to the hardcoded copy in emailTemplateDefaults.js only if the DB row
//    is missing (first boot before ensureSeeded has run, or Supabase is
//    briefly unreachable) -- so a template lookup failure never silently
//    breaks a lifecycle email that used to just always work.
// 2. render(template, vars) -- {{token}} substitution, used for every send,
//    manual or automated.
// 3. sendTemplatedEmail(...) -- the one function that actually calls Resend
//    and logs the result to email_sends, used by both the refactored
//    send*Email wrappers in email.js (automated, looked up by key) and the
//    admin's manual/bulk send routes (emailMarketing.js, looked up by id).
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const DEFAULTS = require('./emailTemplateDefaults');

const RESEND_API_BASE = 'https://api.resend.com';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getTemplate(key) {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('email_templates').select('*').eq('key', key).maybeSingle();
      if (!error && data) return data;
    } catch (err) {
      console.warn(`getTemplate(${key}) DB lookup failed, using built-in default:`, err.message);
    }
  }
  const def = DEFAULTS.find(d => d.key === key);
  if (!def) return null;
  return { id: null, key: def.key, name: def.name, category: 'lifecycle', subject: def.subject, html_body: def.html, text_body: def.text, variables: def.variables };
}

async function getTemplateById(id) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('email_templates').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// Upserted with ignoreDuplicates -- runs once at boot (see index.js), inserts
// the built-in lifecycle templates the first time this app connects to a
// fresh database, and is a silent no-op on every boot after that (including
// after an admin has edited one), so this never clobbers a saved edit.
async function ensureSeeded() {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const rows = DEFAULTS.map(d => ({
      key: d.key,
      name: d.name,
      category: 'lifecycle',
      subject: d.subject,
      html_body: d.html,
      text_body: d.text,
      variables: d.variables,
    }));
    const { error } = await sb.from('email_templates').upsert(rows, { onConflict: 'key', ignoreDuplicates: true });
    if (error) console.warn('ensureSeeded (email templates) failed:', error.message);
  } catch (err) {
    console.warn('ensureSeeded (email templates) exception:', err.message);
  }
}

// Unknown {{token}}s render as empty string rather than being left in
// literally -- a typo'd or since-removed variable name in a saved template
// shouldn't ship "{{oops}}" in a real email.
function apply(str, vars) {
  return String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));
}

function render(template, vars = {}) {
  return {
    subject: apply(template.subject, vars),
    html: apply(template.html_body ?? template.html, vars),
    text: apply(template.text_body ?? template.text, vars),
  };
}

// Every send -- automated or manual, individual or part of a bulk campaign
// -- goes through here and gets one row in email_sends, which is what the
// Email Marketing tab's KPI counts (sent/delivered/bounced/opened/etc) are
// built from. Logging failures are swallowed (warned, not thrown) so a
// logging hiccup never blocks or breaks the actual send.
async function logSend({ campaignId = null, templateId = null, templateKey = null, recipientEmail, recipientName = null, recipientType = null, recipientRef = null, subject = null, resendEmailId = null, status, failedReason = null }) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('email_sends').insert({
      campaign_id: campaignId,
      template_id: templateId,
      template_key: templateKey,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      recipient_type: recipientType,
      recipient_ref: recipientRef,
      subject,
      resend_email_id: resendEmailId,
      status,
      failed_reason: failedReason,
    }).select('id').maybeSingle();
    if (error) { console.warn('logSend failed:', error.message); return null; }
    return data?.id || null;
  } catch (err) {
    console.warn('logSend exception:', err.message);
    return null;
  }
}

// `template` can be a key (string, looked up via getTemplate -- the
// automated lifecycle path) or an already-fetched template row (the manual/
// bulk send path, which already has the row from the compose UI's
// selection and shouldn't re-fetch it once per recipient).
async function sendTemplatedEmail({ template, to, toName, vars = {}, subjectOverride, replyTo, campaignId = null, recipientType = null, recipientRef = null }) {
  const resolved = typeof template === 'string' ? await getTemplate(template) : template;
  const templateKey = typeof template === 'string' ? template : (resolved?.key || null);

  if (!resolved) {
    console.warn(`sendTemplatedEmail skipped: template "${template}" not found`);
    return { sent: false };
  }

  const rendered = render(resolved, vars);
  const subject = subjectOverride || rendered.subject;

  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn(`sendTemplatedEmail (${templateKey || resolved.id}) skipped: Resend not configured (RESEND_API_KEY)`);
    await logSend({ campaignId, templateId: resolved.id, templateKey, recipientEmail: to, recipientName: toName, recipientType, recipientRef, subject, status: 'failed', failedReason: 'RESEND_API_KEY not configured' });
    return { sent: false };
  }
  if (!to) {
    console.warn(`sendTemplatedEmail (${templateKey || resolved.id}) skipped: no recipient email`);
    return { sent: false };
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';

  try {
    const res = await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [to],
        subject,
        html: rendered.html,
        text: rendered.text,
        reply_to: replyTo || undefined,
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const resendEmailId = res.data?.id || null;
    await logSend({ campaignId, templateId: resolved.id, templateKey, recipientEmail: to, recipientName: toName, recipientType, recipientRef, subject, resendEmailId, status: 'sent' });
    return { sent: true, resendEmailId };
  } catch (err) {
    const reason = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.warn(`sendTemplatedEmail (${templateKey || resolved.id}) failed:`, reason);
    await logSend({ campaignId, templateId: resolved.id, templateKey, recipientEmail: to, recipientName: toName, recipientType, recipientRef, subject, status: 'failed', failedReason: reason });
    return { sent: false };
  }
}

module.exports = { getTemplate, getTemplateById, render, ensureSeeded, logSend, sendTemplatedEmail, getSupabase };
