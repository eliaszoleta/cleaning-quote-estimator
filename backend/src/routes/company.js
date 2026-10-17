const express = require('express');
const router = express.Router();
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { getCompanyConfig, saveCompanyConfig, getOrCreateCompanyConfig, findDuplicateCompany } = require('../services/companyConfig');
const { sendCompanyWelcomeEmail, sendAccountDeletionScheduledEmail } = require('../services/email');
const { requireAuth } = require('../middleware/auth');

// Same upload-to-Supabase-Storage pattern as partnerCheckout.js's
// /upload-logo (separate bucket, see 010_company_logo_storage.sql) --
// kept local rather than shared since that route is intentionally a
// standalone, no-auth endpoint for a pre-signup checkout flow, while this
// one requires an authenticated company session.
const LOGO_BUCKET = 'company-logos';
const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_LOGO_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function getStorageSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

// serviceCities used to be a flat array (before cities were scoped per
// state), so any account that set it before this change still has that
// shape sitting in the database. Normalizes on read so both routes below
// -- and every client consuming them -- can always assume the
// { [stateCode]: string[] } map shape, no migration script required: a
// flat array only ever made sense for a single-state account, so it maps
// onto that one state; anything already in the new shape passes through.
function normalizeServiceCities(config) {
  if (Array.isArray(config.serviceCities)) {
    const onlyState = (config.serviceStates || [])[0];
    return onlyState ? { [onlyState]: config.serviceCities } : {};
  }
  return config.serviceCities || {};
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/company/check-duplicate — no auth (runs before signup creates a
// session) -- lets AuthPage.js block signup client-side when the company
// name, phone, or website already belongs to an existing account, instead of
// letting them create a second account for the same business.
router.post('/check-duplicate', async (req, res) => {
  const { companyName, phone, website } = req.body || {};
  try {
    const match = await findDuplicateCompany({ companyName, phone, website });
    res.json({ success: true, duplicate: !!match, field: match?.field || null });
  } catch (err) {
    console.error('POST check-duplicate error:', err.message);
    // Fail open -- a lookup error shouldn't block a legitimate signup.
    res.json({ success: true, duplicate: false, field: null });
  }
});

// POST /api/company/check-email-exists — no auth. Supabase's own
// signInWithPassword deliberately returns the same "Invalid login
// credentials" error whether the email isn't registered or the password is
// wrong (anti-enumeration by design), but AuthPage.js wants to tell those
// two apart ("Account not found" vs "Wrong email or password") after a
// failed login, so it calls this once the sign-in attempt itself has
// already failed. Supabase-js has no admin.getUserByEmail, so this
// paginates listUsers the same way admin.js's listCompaniesWithConfig does.
router.post('/check-email-exists', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.json({ success: true, exists: false });
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.json({ success: true, exists: false });
    const sb = createClient(url, key, { auth: { persistSession: false } });

    let page = 1;
    let found = false;
    // eslint-disable-next-line no-constant-condition
    while (!found) {
      const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      if (data.users.some(u => (u.email || '').toLowerCase() === email)) { found = true; break; }
      if (data.users.length < 1000) break;
      page += 1;
    }
    res.json({ success: true, exists: found });
  } catch (err) {
    console.error('POST check-email-exists error:', err.message);
    // Fail closed to "exists" -- worst case the error message stays generic
    // ("wrong email or password") rather than wrongly claiming an account
    // that actually exists was "not found".
    res.json({ success: true, exists: true });
  }
});

// GET /api/company/:id — get full config (auth required via middleware)
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  try {
    // getOrCreateCompanyConfig also runs from GET /api/subscription/status,
    // since the dashboard calls both endpoints in parallel on load with no
    // ordering guarantee -- sharing this logic (30-day trial on first login,
    // backfill trialStartedAt on old accounts missing it) means whichever
    // request wins the race still gets the right answer, instead of the
    // loser reading "no config yet" and reporting requires_trial_setup.
    const { config, created } = await getOrCreateCompanyConfig(id, {
      companyName: req.user.metadata?.company_name,
      phone: req.user.metadata?.phone,
      website: req.user.metadata?.website,
    });
    console.log(`[GET config] user=${id} created=${created} | ${Object.entries(config.services || {}).map(([k,v]) => `${k}=${v?.enabled}`).join(' ') || 'none'}`);
    if (created) {
      // Fire-and-forget: points them at Calculator Mode and gets their
      // embed code in front of them immediately rather than relying on
      // them to find the Branding tab themselves.
      sendCompanyWelcomeEmail({ to: req.user.email, companyId: id })
        .catch(err => console.error('Company welcome email failed:', err.message));
    }
    res.set('Cache-Control', 'no-store');
    // created: true only on the account's very first GET, when this row
    // didn't exist yet -- lets the dashboard show a first-time welcome
    // pointer to the Help & Docs tab exactly once, without needing its own
    // localStorage/dismissal tracking (every GET after this one for the
    // same account returns false, forever).
    res.json({ success: true, created, data: { ...config, serviceCities: normalizeServiceCities(config) } });
  } catch (err) {
    console.error('GET company config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// PUT /api/company/:id — update config (auth required)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid config object' });
  }

  try {
    const existing = (await getCompanyConfig(id)) || { ...DEFAULT_COMPANY_CONFIG };
    const merged = { ...existing, ...updates };
    // Never allow subscription to be overwritten from client
    merged.subscription = existing.subscription || DEFAULT_COMPANY_CONFIG.subscription;
    const bodyKeys = Object.keys(updates).join(',');
    const svcStatesIn = Object.entries(updates.services || {}).map(([k,v]) => `${k}=${v?.enabled}`).join(' ') || '(none)';
    const svcStatesMerged = Object.entries(merged.services || {}).map(([k,v]) => `${k}=${v?.enabled}`).join(' ');
    console.log(`[PUT config] user=${id} | body_keys: ${bodyKeys}`);
    console.log(`[PUT config] user=${id} | received services: ${svcStatesIn}`);
    console.log(`[PUT config] user=${id} | merged services:   ${svcStatesMerged}`);
    await saveCompanyConfig(id, merged);
    console.log(`[PUT config] user=${id} | saved ok`);
    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('PUT company config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save configuration' });
  }
});

// POST /api/company/:id/feedback — auth required. "Before you go" feedback
// SubscriptionTab.js asks for right before handing off to Stripe's hosted
// Billing Portal (see 021_cancellation_feedback.sql for why this is asked
// up front rather than captured reactively on actual cancellation -- this
// app has no way to tell from the portal itself whether they ended up
// canceling or just updated a card). Both fields are optional; an empty
// submission is simply not saved.
router.post('/:id/feedback', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  const { reason, note } = req.body || {};
  if (!reason && !note) return res.json({ success: true, skipped: true });

  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.json({ success: true, skipped: true }); // no DB configured (local dev)
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from('cancellation_feedback').insert({
      company_id: id,
      reason: reason || null,
      note: note || null,
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST company feedback error:', err.message);
    // Fail open -- a feedback-save failure should never block the portal redirect.
    res.json({ success: true, skipped: true });
  }
});

// POST /api/company/:id/upload-logo — auth required. Takes a small image as
// base64 JSON (not multipart -- avoids adding a multer dependency for what's
// a rare, small upload, same reasoning as partnerCheckout.js's own
// /upload-logo) and stores it in Supabase Storage via the service role key,
// so the browser never gets direct storage write access. Returns a public
// URL that slots straight into the same `logo` config field a pasted URL
// would have filled -- BrandingTab.js still has to call PUT /:id afterward
// to actually save it, same as any other field change.
router.post('/:id/upload-logo', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  const { contentType, dataBase64 } = req.body || {};
  const ext = ALLOWED_LOGO_TYPES[contentType];
  if (!ext) return res.status(400).json({ success: false, error: 'Logo must be a PNG, JPEG, or WebP image' });
  if (!dataBase64) return res.status(400).json({ success: false, error: 'No file data received' });

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, 'base64');
  } catch {
    return res.status(400).json({ success: false, error: 'Could not read that file' });
  }
  if (buffer.length === 0) return res.status(400).json({ success: false, error: 'That file appears to be empty' });
  if (buffer.length > MAX_LOGO_BYTES) return res.status(400).json({ success: false, error: 'Logo must be under 3MB' });

  try {
    const { v4: uuidv4 } = require('uuid');
    const path = `${id}/${uuidv4()}.${ext}`;
    const supabase = getStorageSupabase();
    const { error: uploadErr } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (uploadErr) throw uploadErr;

    const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
    res.json({ success: true, data: { url: data.publicUrl } });
  } catch (err) {
    // Logged in full (not just err.message) since Supabase Storage errors
    // -- e.g. "Bucket not found" when 010_company_logo_storage.sql hasn't
    // actually been run against this project yet -- carry the useful part
    // in fields .message alone drops.
    console.error('Company logo upload error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    res.status(500).json({ success: false, error: 'Failed to upload logo. You can paste an image URL instead.' });
  }
});

// PATCH /api/company/:id/services — save ONLY services (deep merge, dedicated endpoint)
router.patch('/:id/services', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  const { services } = req.body;
  if (!services || typeof services !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid services object' });
  }

  try {
    const existing = (await getCompanyConfig(id)) || { ...DEFAULT_COMPANY_CONFIG };
    // Deep merge: existing services + incoming changes (preserves unmentioned services)
    const mergedServices = { ...(existing.services || {}), ...services };
    const updated = { ...existing, services: mergedServices };
    updated.subscription = existing.subscription || DEFAULT_COMPANY_CONFIG.subscription;
    const svcLog = Object.entries(mergedServices).map(([k,v]) => `${k}=${v?.enabled}`).join(' ');
    console.log(`[PATCH services] user=${id} | ${svcLog}`);
    await saveCompanyConfig(id, updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('PATCH services error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save services' });
  }
});

// Elias's own demo/testing account (blueboyacc05@gmail.com) -- this route
// has no req.user (it's the public, unauthenticated widget endpoint), so
// there's no email to check the way computeSubscriptionStatus does
// elsewhere; the company id from the URL is the one piece of identity
// already on hand here with no extra Supabase lookup needed. Used to
// always test against the real, live embedded widget while working on
// this app, so it should never show the "Calculator Paused" state the way
// a real subscriber's expired/deleted account would.
const ALWAYS_ACTIVE_COMPANY_ID = '4ecae3b0-dfef-4c02-9498-02fc4994d45b';

// GET /api/company/:id/public — branding only, no auth (for widget)
router.get('/:id/public', async (req, res) => {
  try {
    const config = (await getCompanyConfig(req.params.id)) || DEFAULT_COMPANY_CONFIG;
    const sub = computeSubscriptionStatus(config);
    // Deletion was requested -- pause the widget for the whole grace period
    // even if the subscription itself is still active, since the owner
    // asked for the account to go away. Never true for the demo account
    // above, same reasoning as the paused override below.
    const deletionPending = !!config.pendingDeletion && req.params.id !== ALWAYS_ACTIVE_COMPANY_ID;
    const {
      companyName, logo, primaryColor, accentColor, fontFamily,
      ctaHeadline, ctaHeadlineEnabled, ctaSubtext, ctaPhone, ctaEmail,
      serviceStates, frameHeight, borderRadius, services, country,
    } = config;
    // Same no-store as the authed GET /:id -- a subscriber who just changed
    // their Service Area/branding and reloaded their own widget to check it
    // should never see a stale cached response, from the browser or any
    // intermediary.
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        companyName, logo, primaryColor, accentColor, fontFamily,
        ctaHeadline, ctaHeadlineEnabled, ctaSubtext, ctaPhone, ctaEmail,
        serviceStates, serviceCities: normalizeServiceCities(config), frameHeight, borderRadius, services,
        // Missing entirely before -- this is the actual field every real
        // third-party embed (EmbedWrapper.js, via getCompanyPublic) bootstraps
        // its companyConfig from. CleaningCalculator falls back to 'US'
        // whenever country is undefined, so a CA/GB/AU company's own LIVE
        // widget -- on their real website, shown to real visitors -- was
        // rendering the US LocationStep (US states, not provinces/regions) no
        // matter what they'd set their account to. The /api/calculate route
        // itself was never affected (it reads the full row server-side via
        // getCompanyConfig, not this trimmed response), but a visitor picking
        // from a US state list when the company serves Canada/UK/Australia
        // means whatever they picked couldn't resolve to a real province/
        // region server-side either, silently falling back to no regional
        // adjustment on their actual quoted price.
        country,
        paused: req.params.id === ALWAYS_ACTIVE_COMPANY_ID ? false : (!sub.active || deletionPending),
        trialDaysLeft: sub.daysLeft,
      },
    });
  } catch (err) {
    res.json({ success: true, data: DEFAULT_COMPANY_CONFIG });
  }
});

// DELETE /api/company/account — schedule account deletion for 30 days out
// instead of deleting immediately, so a change of mind doesn't require
// support intervention. The Supabase Auth user is left untouched here (only
// checkPendingDeletions, once the grace period elapses, ever removes it),
// so login keeps working the entire time and the account can be recovered
// via POST /account/cancel-deletion below.
router.delete('/account', requireAuth, async (req, res) => {
  const companyId = req.user.id;
  try {
    const config = (await getCompanyConfig(companyId)) || { ...DEFAULT_COMPANY_CONFIG };
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updated = { ...config, pendingDeletion: { requestedAt: new Date().toISOString(), scheduledFor } };
    await saveCompanyConfig(companyId, updated);

    sendAccountDeletionScheduledEmail({ to: req.user.email, companyName: config.companyName || 'there', scheduledFor })
      .catch(err => console.error('sendAccountDeletionScheduledEmail failed:', err.message));

    res.json({ success: true, scheduledFor });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to schedule account deletion. Please try again.' });
  }
});

// POST /api/company/account/cancel-deletion — clears a pending deletion,
// e.g. the owner changed their mind and logged back in within the 30-day
// grace period started by DELETE /account above.
router.post('/account/cancel-deletion', requireAuth, async (req, res) => {
  const companyId = req.user.id;
  try {
    const config = await getCompanyConfig(companyId);
    if (config?.pendingDeletion) {
      const { pendingDeletion, ...rest } = config;
      await saveCompanyConfig(companyId, rest);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel account deletion error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel deletion. Please try again.' });
  }
});

module.exports = router;
