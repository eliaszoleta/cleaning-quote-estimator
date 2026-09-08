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
      // Fire-and-forget: gets their embed code in front of them immediately
      // rather than relying on them to find the Embed Widget tab themselves.
      sendCompanyWelcomeEmail({ to: req.user.email, companyId: id })
        .catch(err => console.error('Company welcome email failed:', err.message));
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: { ...config, serviceCities: normalizeServiceCities(config) } });
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
    console.error('Company logo upload error:', err.message);
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

// GET /api/company/:id/public — branding only, no auth (for widget)
router.get('/:id/public', async (req, res) => {
  try {
    const config = (await getCompanyConfig(req.params.id)) || DEFAULT_COMPANY_CONFIG;
    const sub = computeSubscriptionStatus(config);
    // Deletion was requested -- pause the widget for the whole grace period
    // even if the subscription itself is still active, since the owner
    // asked for the account to go away.
    const deletionPending = !!config.pendingDeletion;
    const {
      companyName, logo, primaryColor, accentColor, fontFamily,
      ctaHeadline, ctaSubtext, ctaPhone, ctaEmail,
      serviceStates, frameHeight, borderRadius, services,
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
        ctaHeadline, ctaSubtext, ctaPhone, ctaEmail,
        serviceStates, serviceCities: normalizeServiceCities(config), frameHeight, borderRadius, services,
        paused: !sub.active || deletionPending,
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
