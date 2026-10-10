// Admin Email Marketing tab: template CRUD, audience resolution (leads /
// companies / partners, with filters), individual sends, and bulk/scheduled
// campaigns. Every actual send (here or from the automated lifecycle
// wrappers in email.js) goes through emailTemplates.js's sendTemplatedEmail,
// which logs a row to email_sends -- that log is what GET /campaigns' KPI
// counts and GET /campaigns/:id's per-recipient list are built from.
//
// Actually dispatching a scheduled/bulk campaign's emails happens in
// services/emailCampaignScheduler.js, not here -- this file only creates
// the campaign row (status 'scheduled') and resolves/previews the
// audience; a "send now" campaign is just one whose scheduled_at is already
// in the past, picked up on the scheduler's next tick (within ~60s) rather
// than sent synchronously on this request, so a large audience can never
// turn a POST /campaigns call into a multi-minute hanging request.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { getTemplateById, sendTemplatedEmail } = require('../services/emailTemplates');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_KEY()) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY(), { auth: { persistSession: false } });
}

// Same gate as admin.js's own requireAdminKey (same ADMIN_API_KEY env var,
// same x-admin-key header) -- duplicated rather than imported since admin.js
// doesn't export it and this file is meant to stand alone, same as every
// other route file in this app defining its own getSupabase().
function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

router.use(requireAdminKey);

// ─── Templates ──────────────────────────────────────────────────────────────

// GET /api/admin/email-marketing/templates
router.get('/templates', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data, error } = await sb.from('email_templates').select('*').order('category', { ascending: true }).order('name', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('List email templates error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load templates' });
  }
});

// POST /api/admin/email-marketing/templates — always creates a free-form
// marketing template (key stays NULL); the built-in lifecycle templates are
// only ever created once, by ensureSeeded() at boot (see emailTemplates.js).
router.post('/templates', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  const { name, subject, html_body, text_body, variables } = req.body || {};
  if (!name || !subject || !html_body) {
    return res.status(400).json({ success: false, error: 'name, subject, and html_body are required' });
  }
  try {
    const { data, error } = await sb.from('email_templates').insert({
      name,
      category: 'marketing',
      subject,
      html_body,
      text_body: text_body || '',
      variables: Array.isArray(variables) ? variables : [],
    }).select('*').single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Create email template error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PATCH /api/admin/email-marketing/templates/:id — editable regardless of
// whether it's a built-in lifecycle template or a custom one (that's the
// whole point of migrating the lifecycle emails into this table). `key` and
// `category` are never accepted from the body -- changing a lifecycle
// template's key would silently break the code that looks it up by that
// exact string at send time.
router.patch('/templates/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  const { name, subject, html_body, text_body, variables } = req.body || {};
  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (subject !== undefined) updates.subject = subject;
  if (html_body !== undefined) updates.html_body = html_body;
  if (text_body !== undefined) updates.text_body = text_body;
  if (variables !== undefined) updates.variables = Array.isArray(variables) ? variables : [];

  try {
    const { data, error } = await sb.from('email_templates').update(updates).eq('id', req.params.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Update email template error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /api/admin/email-marketing/templates/:id — only free-form
// (key IS NULL) templates can be deleted; a lifecycle template's key is
// looked up directly by code (sendTrialEndingSoonEmail, etc.), so deleting
// that row would break the automated send, not just remove it from a list.
router.delete('/templates/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data: existing, error: fetchErr } = await sb.from('email_templates').select('key').eq('id', req.params.id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ success: false, error: 'Template not found' });
    if (existing.key) {
      return res.status(400).json({ success: false, error: "Built-in templates can't be deleted, only edited -- the app sends them automatically by this exact key." });
    }
    const { error } = await sb.from('email_templates').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete email template error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// ─── Audience resolution ────────────────────────────────────────────────────
// Shared by the audience-preview route and the scheduler (which imports
// resolveAudience directly, not over HTTP -- see emailCampaignScheduler.js).

// Mirrors admin.js's listCompaniesWithConfig -- duplicated rather than
// imported since admin.js doesn't export it, same reasoning as
// requireAdminKey above.
async function listCompanyContacts(sb) {
  const { data: configRows, error: cfgErr } = await sb.from('cleaning_company_configs').select('company_id, config');
  if (cfgErr) throw cfgErr;

  let users = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users = users.concat(data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  const userById = new Map(users.map(u => [u.id, u]));

  return (configRows || []).map(row => ({
    companyId: row.company_id,
    config: row.config || {},
    email: userById.get(row.company_id)?.email || null,
  }));
}

// `audience`: { sources: ['leads','companies','partners'], leadUserType,
// leadScope, companyActiveOnly, partnersActiveOnly } -- all filter fields
// optional/omittable, meaning "no filter" on that dimension.
async function resolveAudience(sb, audience = {}) {
  const sources = Array.isArray(audience.sources) && audience.sources.length ? audience.sources : ['leads', 'companies', 'partners'];
  const recipients = [];

  if (sources.includes('leads')) {
    let query = sb.from('leads').select('id, name, email, phone, state, zip, service_type, user_type, company_id, service_details').is('deleted_at', null);
    if (audience.leadScope === 'homepage') query = query.is('company_id', null);
    else if (audience.leadScope === 'company') query = query.not('company_id', 'is', null);
    if (audience.leadUserType === 'homeowner' || audience.leadUserType === 'business') query = query.eq('user_type', audience.leadUserType);
    const { data, error } = await query;
    if (error) throw error;
    (data || []).forEach(l => {
      if (!l.email) return;
      recipients.push({
        email: l.email, name: l.name || '', type: 'lead', ref: l.id,
        vars: { name: l.name || 'there', email: l.email, phone: l.phone || '', city: l.service_details?.city || '', state: l.state || '', zip: l.zip || '', service: l.service_type || '' },
      });
    });
  }

  if (sources.includes('companies')) {
    const companies = await listCompanyContacts(sb);
    companies.forEach(c => {
      if (!c.email) return;
      if (audience.companyActiveOnly) {
        const sub = computeSubscriptionStatus(c.config, c.email);
        if (!sub.active) return;
      }
      recipients.push({
        email: c.email, name: c.config.companyName || '', type: 'company', ref: c.companyId,
        vars: { name: c.config.companyName || 'there', companyName: c.config.companyName || '', email: c.email },
      });
    });
  }

  if (sources.includes('partners')) {
    let query = sb.from('partners').select('id, business_name, business_email, active');
    if (audience.partnersActiveOnly) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw error;
    (data || []).forEach(p => {
      if (!p.business_email) return;
      recipients.push({
        email: p.business_email, name: p.business_name || '', type: 'partner', ref: p.id,
        vars: { name: p.business_name || 'there', businessName: p.business_name || '', email: p.business_email },
      });
    });
  }

  // Dedupe by lowercased email -- the same person can plausibly show up as
  // both a lead and a company (e.g. a subscriber who also used their own
  // calculator), and nobody should get the same campaign email twice. First
  // match wins.
  const seen = new Set();
  return recipients.filter(r => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// POST /api/admin/email-marketing/audience/preview — read-only. Returns the
// resolved count and a capped sample so the compose UI can show "this will
// go to 214 people" (and a few examples) before anything is scheduled.
router.post('/audience/preview', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const recipients = await resolveAudience(sb, req.body?.audience || {});
    res.json({
      success: true,
      count: recipients.length,
      sample: recipients.slice(0, 20).map(r => ({ email: r.email, name: r.name, type: r.type })),
    });
  } catch (err) {
    console.error('Audience preview error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to resolve audience' });
  }
});

// ─── Individual send ────────────────────────────────────────────────────────

// POST /api/admin/email-marketing/send-individual — one email, right now,
// to either a known contact (recipientType + recipientRef, looked up
// server-side so the content can't be spoofed by a tampered client payload)
// or a freeform address (just `to`), not part of any campaign.
router.post('/send-individual', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  const { templateId, recipientType, recipientRef, to, vars } = req.body || {};
  if (!templateId) return res.status(400).json({ success: false, error: 'templateId is required' });

  try {
    const template = await getTemplateById(templateId);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

    let toEmail = to?.email;
    let toName = to?.name;
    let resolvedVars = { ...(vars || {}) };

    if (recipientType === 'lead' && recipientRef) {
      const { data: lead, error } = await sb.from('leads').select('*').eq('id', recipientRef).maybeSingle();
      if (error) throw error;
      if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
      toEmail = lead.email;
      toName = lead.name;
      resolvedVars = { name: lead.name || 'there', email: lead.email, phone: lead.phone || '', city: lead.service_details?.city || '', state: lead.state || '', zip: lead.zip || '', service: lead.service_type || '', ...resolvedVars };
    } else if (recipientType === 'company' && recipientRef) {
      const { data: cfgRow, error } = await sb.from('cleaning_company_configs').select('company_id, config').eq('company_id', recipientRef).maybeSingle();
      if (error) throw error;
      if (!cfgRow) return res.status(404).json({ success: false, error: 'Company not found' });
      const { data: userData } = await sb.auth.admin.getUserById(recipientRef);
      toEmail = userData?.user?.email || null;
      toName = cfgRow.config?.companyName || '';
      resolvedVars = { name: toName || 'there', companyName: toName, email: toEmail, ...resolvedVars };
    } else if (recipientType === 'partner' && recipientRef) {
      const { data: partner, error } = await sb.from('partners').select('*').eq('id', recipientRef).maybeSingle();
      if (error) throw error;
      if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });
      toEmail = partner.business_email;
      toName = partner.business_name;
      resolvedVars = { name: partner.business_name || 'there', businessName: partner.business_name, email: toEmail, ...resolvedVars };
    }

    if (!toEmail) return res.status(400).json({ success: false, error: 'No recipient email resolved' });

    const result = await sendTemplatedEmail({
      template,
      to: toEmail,
      toName,
      vars: resolvedVars,
      recipientType: recipientType || 'other',
      recipientRef: recipientRef || null,
    });

    if (!result.sent) return res.status(502).json({ success: false, error: 'Send failed -- check Resend is configured and the logs for details.' });
    res.json({ success: true, to: toEmail });
  } catch (err) {
    console.error('Send individual email error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// ─── Campaigns ──────────────────────────────────────────────────────────────

function summarizeSends(rows) {
  const s = { total: rows.length, queued: 0, sent: 0, delivered: 0, bounced: 0, failed: 0, skipped: 0, complained: 0, opened: 0 };
  rows.forEach(r => {
    if (s[r.status] !== undefined) s[r.status] += 1;
    if (r.opened_at) s.opened += 1;
  });
  // "Unopened" is scoped to mail that actually went out -- sent or
  // delivered -- not the whole recipient list, so a campaign that's still
  // half-queued doesn't read as mostly unopened.
  const wentOut = s.sent + s.delivered;
  s.unopened = Math.max(0, wentOut - s.opened);
  return s;
}

// GET /api/admin/email-marketing/campaigns
router.get('/campaigns', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data: campaigns, error: cErr } = await sb.from('email_campaigns').select('*').order('created_at', { ascending: false });
    if (cErr) throw cErr;

    const { data: templates, error: tErr } = await sb.from('email_templates').select('id, name');
    if (tErr) throw tErr;
    const templateNameById = new Map((templates || []).map(t => [t.id, t.name]));

    const ids = (campaigns || []).map(c => c.id);
    let sendsByCampaign = new Map();
    if (ids.length) {
      const { data: sends, error: sErr } = await sb.from('email_sends').select('campaign_id, status, opened_at').in('campaign_id', ids);
      if (sErr) throw sErr;
      sendsByCampaign = (sends || []).reduce((acc, s) => {
        if (!acc.has(s.campaign_id)) acc.set(s.campaign_id, []);
        acc.get(s.campaign_id).push(s);
        return acc;
      }, new Map());
    }

    const data = (campaigns || []).map(c => ({
      ...c,
      templateName: templateNameById.get(c.template_id) || '(deleted template)',
      kpis: summarizeSends(sendsByCampaign.get(c.id) || []),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('List campaigns error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load campaigns' });
  }
});

// POST /api/admin/email-marketing/campaigns — creates the campaign row only;
// see the file-level comment above for why sending itself is left to the
// scheduler rather than happening inline on this request.
router.post('/campaigns', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  const { templateId, name, audience, scheduledAt } = req.body || {};
  if (!templateId || !name) return res.status(400).json({ success: false, error: 'templateId and name are required' });

  try {
    const template = await getTemplateById(templateId);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

    const recipients = await resolveAudience(sb, audience || {});
    if (recipients.length === 0) return res.status(400).json({ success: false, error: 'This audience resolves to 0 recipients -- adjust the filters before scheduling.' });

    const { data, error } = await sb.from('email_campaigns').insert({
      template_id: templateId,
      name,
      audience: audience || {},
      status: 'scheduled',
      scheduled_at: scheduledAt || new Date().toISOString(),
    }).select('*').single();
    if (error) throw error;

    res.json({ success: true, data, recipientCount: recipients.length });
  } catch (err) {
    console.error('Create campaign error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// GET /api/admin/email-marketing/campaigns/:id — detail, with every
// recipient's current status (for the per-recipient KPI table).
router.get('/campaigns/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data: campaign, error: cErr } = await sb.from('email_campaigns').select('*').eq('id', req.params.id).maybeSingle();
    if (cErr) throw cErr;
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const { data: sends, error: sErr } = await sb.from('email_sends').select('*').eq('campaign_id', req.params.id).order('created_at', { ascending: false });
    if (sErr) throw sErr;

    res.json({ success: true, data: { campaign, sends: sends || [], kpis: summarizeSends(sends || []) } });
  } catch (err) {
    console.error('Campaign detail error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load campaign' });
  }
});

// POST /api/admin/email-marketing/campaigns/:id/cancel — only before the
// scheduler has started processing it; once status flips to 'sending' some
// recipients may have already gotten mail, so there's no clean "cancel" for
// that state, just letting it finish.
router.post('/campaigns/:id/cancel', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data: campaign, error: fetchErr } = await sb.from('email_campaigns').select('status').eq('id', req.params.id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (campaign.status !== 'scheduled') return res.status(400).json({ success: false, error: `Only scheduled campaigns can be canceled (this one is ${campaign.status}).` });

    const { error } = await sb.from('email_campaigns').update({ status: 'canceled' }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel campaign error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel campaign' });
  }
});

// ─── Resend webhook ─────────────────────────────────────────────────────────
// Delivery-event webhook -- Resend's dashboard (Webhooks) is configured to
// POST here for email.sent/delivered/bounced/opened/clicked/complained.
// Registered in index.js with express.raw() BEFORE express.json(), same
// pattern as the Stripe webhooks, since signature verification needs the
// exact raw request body. NOT behind requireAdminKey -- Resend can't send
// an x-admin-key header -- protected instead by verifying its Svix-format
// signature against RESEND_WEBHOOK_SECRET (from the Resend dashboard's
// webhook endpoint settings).
function verifyResendSignature(rawBody, headers) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  try {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

    return svixSignature.split(' ').some(part => {
      const sig = part.includes(',') ? part.split(',')[1] : part;
      if (!sig) return false;
      try {
        const a = Buffer.from(sig, 'base64');
        const b = Buffer.from(expected, 'base64');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    });
  } catch (err) {
    console.warn('verifyResendSignature error:', err.message);
    return false;
  }
}

async function webhookHandler(req, res) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');

  if (!verifyResendSignature(rawBody, req.headers)) {
    return res.status(401).json({ success: false, error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const emailId = event?.data?.email_id;
  if (!emailId) return res.json({ success: true });

  const now = new Date().toISOString();
  const updates = {};
  switch (event.type) {
    case 'email.sent': updates.status = 'sent'; break;
    case 'email.delivered': updates.status = 'delivered'; updates.delivered_at = now; break;
    case 'email.bounced': updates.status = 'bounced'; updates.bounced_at = now; break;
    case 'email.complained': updates.status = 'complained'; break;
    case 'email.opened': updates.opened_at = now; break;
    case 'email.clicked': updates.clicked_at = now; break;
    default: break; // email.delivery_delayed, email.failed (rare) -- no column mapped, row just keeps its last known status
  }

  if (Object.keys(updates).length === 0) return res.json({ success: true });

  try {
    await sb.from('email_sends').update(updates).eq('resend_email_id', emailId);
  } catch (err) {
    console.warn('Resend webhook: email_sends update failed:', err.message);
  }
  res.json({ success: true });
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
module.exports.resolveAudience = resolveAudience;
