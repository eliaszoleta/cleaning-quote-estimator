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

// POST /api/admin/companies/send-trial-email — the real send. Requires
// { confirm: true } in the body on top of the x-admin-key header, as a
// second deliberate step so this can never fire from a GET, a bookmarked
// link, or a stray retry -- this sends real email to real subscribers.
// Optional { companyIds: [...] } restricts the send to just those accounts
// (matched against the preview list) -- the account list mixes real
// subscribers with what look like personal test accounts (multiple
// eliaszoleta*@gmail.com addresses), so defaulting to "every company" was
// too blunt. Omit companyIds (or leave it out entirely) to send to
// everyone with an email on file, same as before.
router.post('/companies/send-trial-email', async (req, res) => {
  if (req.body?.confirm !== true) {
    return res.status(400).json({ success: false, error: 'Refusing to send without { confirm: true } in the request body.' });
  }
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const rows = await listCompaniesWithConfig(sb);
    let recipients = rows.filter(r => r.email);
    if (Array.isArray(req.body?.companyIds)) {
      const wanted = new Set(req.body.companyIds);
      recipients = recipients.filter(r => wanted.has(r.companyId));
    }

    const results = await Promise.all(recipients.map(async r => {
      const sent = await sendCompanyWelcomeEmail({ to: r.email, companyId: r.companyId, subject: TRIAL_EMAIL_SUBJECT });
      return { companyId: r.companyId, companyName: r.config.companyName || '(unnamed)', email: r.email, sent };
    }));

    const sentCount = results.filter(r => r.sent).length;
    res.json({
      success: true,
      sentCount,
      failedCount: results.length - sentCount,
      // Always "no email on file", regardless of any companyIds filter
      // above -- keeps this meaning the same thing it did before selective
      // sending existed, rather than also counting deliberately-excluded
      // recipients as "skipped".
      skippedCount: rows.filter(r => !r.email).length,
      results,
    });
  } catch (err) {
    console.error('Admin send-trial-email error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send trial emails' });
  }
});

// POST /api/admin/companies/send-trial-email-preview — sends the exact same
// email content to a single address of the admin's choosing (not tied to
// any real subscriber), so it can be reviewed as an actual received email
// before ever running the real broadcast. Uses a placeholder company id
// (there's no real one to embed for a preview), so the embed code in the
// preview is obviously not a live one.
router.post('/companies/send-trial-email-preview', async (req, res) => {
  const to = (req.body?.to || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ success: false, error: 'A valid "to" email address is required.' });
  }

  const sent = await sendCompanyWelcomeEmail({ to, companyId: 'PREVIEW-COMPANY-ID', subject: `[Preview] ${TRIAL_EMAIL_SUBJECT}` });
  if (!sent) return res.status(502).json({ success: false, error: 'Send failed -- check Resend is configured (RESEND_API_KEY) on the backend.' });
  res.json({ success: true, to });
});

// ─── Homepage leads ──────────────────────────────────────────────────────────
// The main public calculator on cleanestimator.com's homepage (and any other
// unbranded page -- /cleaning-cost-calculator, /cleaning-cost-estimator, the
// service-specific calculator pages) never sends a companyId to /api/calculate,
// so every lead it captures lands in the same `leads` table as every
// embedded-widget subscriber's leads, just with company_id left null (see
// saveLead in leads.js). There was no view of those rows anywhere -- a
// subscriber sees their own via requireAuth-gated /api/company-leads, but
// nothing surfaced the homepage's own leads to the site owner. These three
// routes are that view, scoped the same way (company_id IS NULL instead of
// company_id = a specific company), gated by the same requireAdminKey as
// everything else in this file.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/admin/homepage-leads
router.get('/homepage-leads', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const includeDeleted = req.query.deleted === 'true';
  const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 2000);

  try {
    let query = sb.from('leads').select('*').is('company_id', null).order('created_at', { ascending: false }).limit(limit);
    if (!includeDeleted) query = query.is('deleted_at', null);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, count: data.length, data: data || [] });
  } catch (err) {
    console.error('Admin homepage-leads list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load leads' });
  }
});

// PATCH /api/admin/homepage-leads/:id — notes and soft-delete/restore, same
// shape as PATCH /api/company-leads/company/:id. The `company_id IS NULL`
// filter stays on the update too, not just the list above, so this can never
// be pointed at a subscriber's own lead by id.
router.patch('/homepage-leads/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(400).json({ success: false, error: 'Invalid lead id' });

  const { notes, deleted_at } = req.body || {};
  const updates = {};
  if (notes !== undefined) updates.notes = notes;
  if (deleted_at !== undefined) updates.deleted_at = deleted_at;

  try {
    const { error } = await sb.from('leads').update(updates).eq('id', id).is('company_id', null);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin update homepage lead error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// DELETE /api/admin/homepage-leads/:id — permanent delete, only ever called
// from the Trash view (mirrors DELETE /api/company-leads/company/:id).
router.delete('/homepage-leads/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(400).json({ success: false, error: 'Invalid lead id' });

  try {
    const { error } = await sb.from('leads').delete().eq('id', id).is('company_id', null);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete homepage lead error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

// ─── Partner management ─────────────────────────────────────────────────────
// AdminPartners.js used to write straight to Supabase from the browser with
// the anon key, gated only by a client-side password check (a REACT_APP_*
// env var, baked into the public JS bundle) -- that's not a real access
// boundary, and the matching RLS policies on partners/partner_locations were
// wide open (anon insert/update/delete) to make it work at all. These routes
// replace that: real auth via requireAdminKey above, real writes via the
// service role key. See supabase/migrations/008_lock_down_rls.sql, which
// must be run to actually close off the old anon write policies -- these
// routes alone don't do that, the database still needs to be told.

// GET /api/admin/partners — every partner + their service-area locations +
// banner KPIs, same three-way fetch AdminPartners.js used to do directly.
router.get('/partners', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: partners, error: pErr } = await sb.from('partners').select('*').order('created_at', { ascending: false });
    if (pErr) throw pErr;
    const { data: locations, error: lErr } = await sb.from('partner_locations').select('*').order('city');
    if (lErr) throw lErr;
    const { data: stats, error: sErr } = await sb.from('partner_banner_stats').select('*');
    if (sErr) throw sErr;

    res.json({ success: true, data: { partners: partners || [], locations: locations || [], stats: stats || [] } });
  } catch (err) {
    console.error('Admin partners list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load partners' });
  }
});

// POST /api/admin/partners — create a partner and its service-area rows in
// one call. Body: { ...partner fields, locations: [{ city, state }] }.
router.post('/partners', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { locations, ...partnerFields } = req.body || {};
  const validLocations = (locations || []).filter(l => l?.city && l?.state);
  if (validLocations.length === 0) {
    return res.status(400).json({ success: false, error: 'Add at least one city/state this partner serves.' });
  }

  try {
    const { data, error: insertErr } = await sb.from('partners').insert(partnerFields).select().single();
    if (insertErr) throw insertErr;

    const { error: locErr } = await sb.from('partner_locations').insert(
      validLocations.map(l => ({ partner_id: data.id, city: l.city, state: l.state }))
    );
    if (locErr) throw locErr;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin create partner error:', err.message);
    // Admin-only tool (x-admin-key gated, not public), so the actual DB
    // error is useful here rather than something to hide -- e.g. a unique
    // constraint violation on a duplicate Stripe checkout session id.
    res.status(500).json({ success: false, error: err.message || 'Failed to create partner' });
  }
});

// PUT /api/admin/partners/:id — update a partner's fields and full-replace
// its service-area locations (same delete-then-insert approach the old
// direct-from-browser version used).
router.put('/partners/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  const { locations, ...partnerFields } = req.body || {};
  const validLocations = (locations || []).filter(l => l?.city && l?.state);
  if (validLocations.length === 0) {
    return res.status(400).json({ success: false, error: 'Add at least one city/state this partner serves.' });
  }

  try {
    const { error: updErr } = await sb.from('partners').update(partnerFields).eq('id', id);
    if (updErr) throw updErr;

    const { error: delErr } = await sb.from('partner_locations').delete().eq('partner_id', id);
    if (delErr) throw delErr;

    const { error: locErr } = await sb.from('partner_locations').insert(
      validLocations.map(l => ({ partner_id: id, city: l.city, state: l.state }))
    );
    if (locErr) throw locErr;

    res.json({ success: true });
  } catch (err) {
    console.error('Admin update partner error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to update partner' });
  }
});

// PATCH /api/admin/partners/:id/toggle — flip active on/off only, without
// requiring the full form payload (mirrors the list view's quick toggle).
router.patch('/partners/:id/toggle', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  const { active } = req.body || {};
  if (typeof active !== 'boolean') {
    return res.status(400).json({ success: false, error: 'active (boolean) is required' });
  }

  try {
    const { error } = await sb.from('partners').update({ active }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin toggle partner error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update partner' });
  }
});

// DELETE /api/admin/partners/:id — partner_locations rows cascade via the
// ON DELETE CASCADE foreign key (see 002_partners.sql), no separate cleanup
// needed here.
router.delete('/partners/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  try {
    const { error } = await sb.from('partners').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete partner error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete partner' });
  }
});

module.exports = router;
