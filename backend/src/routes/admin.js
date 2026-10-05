const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { sendCompanyWelcomeEmail, sendWebsiteSampleReadyEmail } = require('../services/email');
const { getCompanyConfig } = require('../services/companyConfig');
const { resolveCityForZip } = require('../services/zipCity');

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
        phone: config.phone || null,
        website: config.website || null,
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

// DELETE /api/admin/companies/:id — permanently delete a company account
// right now: cancels any active Stripe subscription, deletes every lead
// they've captured, their config row, and their Supabase auth user. Unlike
// the self-service DELETE /api/company/account (which only schedules a
// 30-day grace period -- see deletionScheduler.js for what actually runs
// once that elapses), this is immediate and irreversible, for the admin
// panel's own "permanently delete this account" action. Requires
// { confirm: true } in the body, same deliberate-second-step pattern as
// send-trial-email below, since a GET/bookmark/retry must never trigger this.
router.delete('/companies/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  if (req.body?.confirm !== true) {
    return res.status(400).json({ success: false, error: 'Refusing to delete without { confirm: true } in the request body.' });
  }

  const { id } = req.params;

  try {
    // Cancel any active Stripe subscription first -- otherwise deleting the
    // account leaves someone still being billed with no dashboard left to
    // cancel it from.
    const config = await getCompanyConfig(id);
    const subId = config?.subscription?.stripeSubscriptionId;
    if (subId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(subId);
      } catch (err) {
        console.warn(`Admin delete company ${id}: Stripe cancel warning:`, err.message);
      }
    }

    const { error: leadsErr } = await sb.from('leads').delete().eq('company_id', id);
    if (leadsErr) throw leadsErr;

    const { error: cfgErr } = await sb.from('cleaning_company_configs').delete().eq('company_id', id);
    if (cfgErr) throw cfgErr;

    const { error: userErr } = await sb.auth.admin.deleteUser(id);
    if (userErr) throw userErr;

    res.json({ success: true });
  } catch (err) {
    console.error(`Admin delete company ${id} error:`, err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete company' });
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

// The homepage's own calculator never asks for a city -- LocationStep.js
// only asks that question when a company has scoped its embedded widget to
// specific states/cities (see `scoped` there), which the unscoped main
// calculator on cleanestimator.com never is. So a homepage lead only ever
// has zip + state on file, which is what showed up in the admin panel as a
// bare ZIP with no city. Resolved here at read time via resolveCityForZip
// (shared with the partner/company lead-notification emails -- see
// services/zipCity.js) instead of bundling/maintaining a full ~41k-row US
// ZIP database, and without writing the resolved value back to the row (a
// GET shouldn't have side effects, and re-resolving on each server restart
// is cheap enough at this volume).

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

    // Resolve each unique ZIP once (not once per lead -- many leads share
    // a ZIP), then attach the result as a top-level `city` field. Prefers
    // an explicit service_details.city when one exists (a scoped-widget
    // lead that really was asked, vs. a homepage lead being backfilled),
    // so this never overrides real visitor input with a guess.
    const rows = data || [];
    const uniqueZips = [...new Set(rows.map(r => r.zip).filter(Boolean))];
    const cityByZip = new Map();
    await Promise.all(uniqueZips.map(async zip => { cityByZip.set(zip, await resolveCityForZip(zip)); }));
    const enriched = rows.map(row => ({
      ...row,
      city: row.service_details?.city || cityByZip.get(row.zip) || null,
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
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

// ─── Website requests ("Get a Website" applications) ──────────────────────
// Previously email-only (see routes/websiteRequest.js's original comment:
// "the email *is* the record") -- now persisted so there's a real queue to
// review, mark sample-ready, and track through the $5-setup/2-months-free/
// $249-month-3 approval flow at /website-approval/:token.

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// GET /api/admin/website-requests
router.get('/website-requests', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data, error } = await sb.from('website_requests').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    const rows = (data || []).map(row => ({
      ...row,
      approvalUrl: `${FRONTEND_URL}/website-approval/${row.approval_token}`,
    }));
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Admin website-requests list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load website requests' });
  }
});

// POST /api/admin/website-requests — lets an admin add a client directly
// (e.g. one who reached out outside the public apply form) instead of only
// ever reviewing requests that came in through it. Deliberately sends
// neither the internal "new application" notification (the admin already
// knows -- they're the one entering it) nor the applicant's own "we got
// your request" confirmation (see sendWebsiteRequestReceivedEmail in
// routes/websiteRequest.js, which is only ever called from the public
// POST /api/website-request) -- that email promises a sample is coming
// "within a few days," which isn't a promise this route should make on an
// admin's behalf. The row lands as a normal 'submitted' request otherwise,
// so it moves through sample_ready / approved / active exactly like one
// from the public form from here on.
router.post('/website-requests', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { name, business, email, phone, business_address: businessAddress } = req.body || {};
  if (!name || !business || !email) {
    return res.status(400).json({ success: false, error: 'Name, business, and email are required.' });
  }

  try {
    const { data, error } = await sb.from('website_requests').insert({
      name, business, email,
      phone: phone || null,
      business_address: businessAddress || null,
    }).select().single();
    if (error) throw error;

    res.json({ success: true, data: { ...data, approvalUrl: `${FRONTEND_URL}/website-approval/${data.approval_token}` } });
  } catch (err) {
    console.error('Admin create website-request error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create website request' });
  }
});

// PATCH /api/admin/website-requests/:id — sets sample_url / status /
// admin_notes / stripe_subscription_id. Moving status to 'sample_ready'
// (either explicitly, or implicitly by attaching a sample_url to a request
// that's still 'submitted') emails the prospect their approval link -- same
// fire-and-forget philosophy as every other notification email in this
// codebase, so a Resend hiccup doesn't fail the admin's save.
//
// stripe_subscription_id is how an admin links a client's $249/mo trial
// subscription once they've created it by hand in the Stripe Dashboard
// (see routes/websiteRequest.js -- the automated checkout only ever
// collects the $5 setup fee, on purpose; Stripe runs the trial and all
// future billing on its own from the moment that subscription exists, no
// code involved). Verified against Stripe itself before trusting it, since
// a pasted id is exactly the kind of thing a typo or copy-paste mistake
// happens to. Deliberately silent (no email) -- the client already got the
// full "2 months free, billed starting month 3" confirmation the moment
// their $5 fee cleared (see markSetupPaid in routes/websiteRequest.js);
// this step is just internal bookkeeping to attach the subscription Stripe
// is already running on its own.
router.patch('/website-requests/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { id } = req.params;
  const { sample_url, status, admin_notes, stripe_subscription_id } = req.body || {};
  const allowedStatuses = ['submitted', 'sample_ready', 'approved', 'active', 'declined', 'canceled'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const { data: existing, error: fetchErr } = await sb.from('website_requests').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const updates = { updated_at: new Date().toISOString() };
    if (sample_url !== undefined) updates.sample_url = sample_url;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    let subscriptionLinked = false;
    if (stripe_subscription_id && !existing.stripe_subscription_id) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ success: false, error: 'Stripe is not configured' });
      }
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(stripe_subscription_id.trim());
      } catch (err) {
        return res.status(400).json({ success: false, error: 'That subscription ID could not be found in Stripe.' });
      }
      if (existing.stripe_customer_id && subscription.customer !== existing.stripe_customer_id) {
        return res.status(400).json({ success: false, error: "That subscription belongs to a different customer than this request's — double-check the ID." });
      }
      updates.stripe_subscription_id = subscription.id;
      updates.subscription_started_at = new Date().toISOString();
      subscriptionLinked = true;
    }

    // Explicit status always wins; otherwise linking a subscription implies
    // 'active', and (failing that) attaching a sample link to a fresh
    // request implicitly marks it 'sample_ready' -- an admin pasting a URL
    // and clicking Save shouldn't also require a separate status dropdown
    // change to actually notify the prospect.
    if (status !== undefined) {
      updates.status = status;
    } else if (subscriptionLinked) {
      updates.status = 'active';
    } else if (existing.status === 'submitted' && (sample_url || existing.sample_url)) {
      updates.status = 'sample_ready';
    }

    const { data: updated, error: updateErr } = await sb.from('website_requests').update(updates).eq('id', id).select().single();
    if (updateErr) throw updateErr;

    const justBecameSampleReady = existing.status !== 'sample_ready' && updated.status === 'sample_ready';
    if (justBecameSampleReady && updated.sample_url) {
      sendWebsiteSampleReadyEmail({
        to: updated.email,
        name: updated.name,
        business: updated.business,
        sampleUrl: updated.sample_url,
        approvalUrl: `${FRONTEND_URL}/website-approval/${updated.approval_token}`,
      }).catch(err => console.error('sendWebsiteSampleReadyEmail failed:', err.message));
    }

    res.json({ success: true, data: { ...updated, approvalUrl: `${FRONTEND_URL}/website-approval/${updated.approval_token}` } });
  } catch (err) {
    console.error('Admin update website-request error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update website request' });
  }
});

// POST /api/admin/website-requests/:id/cancel-subscription — cancels the
// client's Stripe subscription immediately (not at period end -- by the
// time anyone's asking to cancel they're either still in the free trial
// with nothing paid for this period, or past it and "cancel anytime" on
// the pricing page doesn't promise a prorated runout) and marks the
// request 'canceled'. Requires { confirm: true }, same deliberate-
// second-step pattern as DELETE /companies/:id above, since a GET/
// bookmark/retry must never trigger this.
router.post('/website-requests/:id/cancel-subscription', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  if (req.body?.confirm !== true) {
    return res.status(400).json({ success: false, error: 'Refusing to cancel without { confirm: true } in the request body.' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ success: false, error: 'Stripe is not configured' });
  }

  const { id } = req.params;

  try {
    const { data: request, error: fetchErr } = await sb.from('website_requests').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });
    if (request.status === 'canceled') return res.status(400).json({ success: false, error: 'Already canceled.' });
    if (!request.stripe_subscription_id) {
      return res.status(400).json({ success: false, error: 'This request has no active subscription to cancel.' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    try {
      await stripe.subscriptions.cancel(request.stripe_subscription_id);
    } catch (err) {
      // Already canceled on Stripe's own side (e.g. a previous attempt's
      // Stripe call succeeded but the DB update below it failed) -- treat
      // as success rather than blocking the admin from marking it canceled
      // here too.
      if (err.code !== 'resource_missing') throw err;
    }

    const { data: updated, error: updateErr } = await sb
      .from('website_requests')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    res.json({ success: true, data: { ...updated, approvalUrl: `${FRONTEND_URL}/website-approval/${updated.approval_token}` } });
  } catch (err) {
    console.error('Admin cancel website-request subscription error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

// DELETE /api/admin/website-requests/:id — permanently deletes a website
// request. Cancels any still-active Stripe subscription first (same reason
// as DELETE /companies/:id above -- otherwise someone keeps getting billed
// with no record left anywhere to trace it back to or cancel it from).
// Requires { confirm: true }, same deliberate-second-step pattern as every
// other destructive action in this file, since a GET/bookmark/retry must
// never trigger this. Immediate and irreversible -- there's no grace
// period or undo, unlike a client's own self-service account deletion.
router.delete('/website-requests/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  if (req.body?.confirm !== true) {
    return res.status(400).json({ success: false, error: 'Refusing to delete without { confirm: true } in the request body.' });
  }

  const { id } = req.params;

  try {
    const { data: request, error: fetchErr } = await sb.from('website_requests').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });

    if (request.stripe_subscription_id && request.status !== 'canceled' && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(request.stripe_subscription_id);
      } catch (err) {
        // Already canceled on Stripe's own side is fine; anything else is a
        // real failure, but still shouldn't block deleting the local record
        // -- log it loudly instead so it can be double-checked by hand.
        if (err.code !== 'resource_missing') console.warn(`Admin delete website-request ${id}: Stripe cancel warning:`, err.message);
      }
    }

    const { error: deleteErr } = await sb.from('website_requests').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    res.json({ success: true });
  } catch (err) {
    console.error(`Admin delete website-request ${id} error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to delete website request' });
  }
});

module.exports = router;
