const express = require('express');
const router = express.Router();
const axios = require('axios');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { getCompanyConfig, saveCompanyConfig, getOrCreateCompanyConfig } = require('../services/companyConfig');
const { sendCompanyWelcomeEmail } = require('../services/email');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
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
    const { config, created } = await getOrCreateCompanyConfig(id);
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
    const {
      companyName, logo, primaryColor, accentColor, fontFamily,
      ctaHeadline, ctaSubtext, ctaButtonText, ctaPhone, ctaButtonUrl,
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
        ctaHeadline, ctaSubtext, ctaButtonText, ctaPhone, ctaButtonUrl,
        serviceStates, serviceCities: normalizeServiceCities(config), frameHeight, borderRadius, services,
        paused: !sub.active,
        trialDaysLeft: sub.daysLeft,
      },
    });
  } catch (err) {
    res.json({ success: true, data: DEFAULT_COMPANY_CONFIG });
  }
});

// DELETE /api/company/account — permanently delete account and all associated data
router.delete('/account', requireAuth, async (req, res) => {
  const companyId = req.user.id;
  try {
    if (SERVICE_KEY()) {
      // Delete leads (non-fatal)
      await axios.delete(
        `${SUPABASE_URL}/rest/v1/leads?company_id=eq.${encodeURIComponent(companyId)}`,
        { headers: dbHeaders() }
      ).catch(e => console.warn('Delete leads warning:', e.message));

      // Delete company config
      await axios.delete(
        `${SUPABASE_URL}/rest/v1/cleaning_company_configs?company_id=eq.${encodeURIComponent(companyId)}`,
        { headers: dbHeaders() }
      ).catch(e => console.warn('Delete config warning:', e.message));

      // Delete Supabase auth user (must come last)
      await axios.delete(
        `${SUPABASE_URL}/auth/v1/admin/users/${companyId}`,
        { headers: { apikey: SERVICE_KEY(), Authorization: `Bearer ${SERVICE_KEY()}` } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete account. Please try again.' });
  }
});

module.exports = router;
