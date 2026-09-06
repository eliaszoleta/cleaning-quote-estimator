const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { sendCompanyWelcomeEmail } = require('../services/email');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_KEY()) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY(), { auth: { persistSession: false } });
}

// Gates every route in this file. Deliberately a header the frontend only
// ever forwards from whatever the admin types into the login form at
// runtime, never a REACT_APP_* env var -- those get baked into the public
// JS bundle at build time and are readable by anyone, which would be fine
// for the cosmetic UI gate AdminPartners.js uses (the real protection there
// is Supabase RLS) but not for this endpoint, which uses the Supabase
// service role key server-side to read every subscriber's account and
// signup email. Fails closed if the key isn't set at all.
function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

router.use(requireAdminKey);

// Shared by /companies and the trial-email routes below -- every
// cleaning_company_configs row joined with that account's signup email and
// created_at (from the Supabase Admin API; auth users aren't a queryable
// table and require the service role key, never available from the
// browser).
async function listCompaniesWithConfig(sb) {
  const { data: configRows, error: cfgErr } = await sb
    .from('cleaning_company_configs')
    .select('company_id, config, updated_at');
  if (cfgErr) throw cfgErr;

  // Paginated defensively even though this account isn't near the
  // 1000/page default yet.
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
    updatedAt: row.updated_at || null,
    email: userById.get(row.company_id)?.email || null,
    signedUpAt: userById.get(row.company_id)?.created_at || null,
  }));
}

// GET /api/admin/companies — every subscriber account (name, signup email,
// trial/subscription status, services enabled, lead count). There's no
// self-serve equivalent of AdminPartners.js for the company/subscriber side
// of the product yet -- this is that.
router.get('/companies', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const rows = await listCompaniesWithConfig(sb);

    // Lead counts per company -- just the company_id column, counted in JS
    // (the Supabase JS client has no simple GROUP BY/count-by), fine at
    // this scale.
    const { data: leadRows, error: leadErr } = await sb
      .from('leads')
      .select('company_id')
      .is('deleted_at', null);
    if (leadErr) throw leadErr;
    const leadCounts = {};
    for (const row of leadRows || []) {
      if (!row.company_id) continue;
      leadCounts[row.company_id] = (leadCounts[row.company_id] || 0) + 1;
    }

    const companies = rows.map(row => {
      const { config } = row;
      const sub = computeSubscriptionStatus(config);
      const services = config.services || {};
      const enabledCount = Object.values(services).filter(s => s?.enabled !== false).length;
      return {
        companyId: row.companyId,
        companyName: config.companyName || '(unnamed)',
        email: row.email,
        signedUpAt: row.signedUpAt,
        lastConfigUpdate: row.updatedAt,
        subscription: sub,
        servicesEnabled: enabledCount,
        servicesTotal: Object.keys(services).length,
        serviceStates: config.serviceStates || [],
        leadCount: leadCounts[row.companyId] || 0,
        apiKeySet: !!config.apiKey,
      };
    });

    companies.sort((a, b) => new Date(b.signedUpAt || 0) - new Date(a.signedUpAt || 0));

    res.json({
      success: true,
      count: companies.length,
      activeCount: companies.filter(c => c.subscription.active).length,
      totalLeads: Object.values(leadCounts).reduce((s, n) => s + n, 0),
      data: companies,
    });
  } catch (err) {
    console.error('Admin companies list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load companies' });
  }
});

const TRIAL_EMAIL_SUBJECT = 'Your 30-day free trial is active — here\'s your embed code';

// GET /api/admin/companies/trial-email-preview — read-only. Lists exactly
// who a broadcast trial-activation email would go to (name, email) and who
// would be skipped (no email on file), plus the subject line, WITHOUT
// sending anything. Meant to be checked before ever calling the send route
// below -- see the actual recipient list and exact copy first.
router.get('/companies/trial-email-preview', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const rows = await listCompaniesWithConfig(sb);
    const recipients = rows.filter(r => r.email).map(r => ({ companyId: r.companyId, companyName: r.config.companyName || '(unnamed)', email: r.email }));
    const skipped = rows.filter(r => !r.email).map(r => ({ companyId: r.companyId, companyName: r.config.companyName || '(unnamed)' }));

    res.json({
      success: true,
      subject: TRIAL_EMAIL_SUBJECT,
      recipientCount: recipients.length,
      recipients,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (err) {
    console.error('Admin trial-email preview error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to build preview' });
  }
});

// POST /api/admin/companies/send-trial-email — the real send, to every
// company with an email on file. Requires { confirm: true } in the body on
// top of the x-admin-key header, as a second deliberate step so this can
// never fire from a GET, a bookmarked link, or a stray retry -- this sends
// real email to every current subscriber.
router.post('/companies/send-trial-email', async (req, res) => {
  if (req.body?.confirm !== true) {
    return res.status(400).json({ success: false, error: 'Refusing to send without { confirm: true } in the request body.' });
  }
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const rows = await listCompaniesWithConfig(sb);
    const recipients = rows.filter(r => r.email);

    const results = await Promise.all(recipients.map(async r => {
      const sent = await sendCompanyWelcomeEmail({ to: r.email, companyId: r.companyId, subject: TRIAL_EMAIL_SUBJECT });
      return { companyId: r.companyId, companyName: r.config.companyName || '(unnamed)', email: r.email, sent };
    }));

    const sentCount = results.filter(r => r.sent).length;
    res.json({
      success: true,
      sentCount,
      failedCount: results.length - sentCount,
      skippedCount: rows.length - recipients.length,
      results,
    });
  } catch (err) {
    console.error('Admin send-trial-email error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send trial emails' });
  }
});

module.exports = router;
