const express = require('express');
const router = express.Router();
const axios = require('axios');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { getCompanyConfig, saveCompanyConfig } = require('../services/companyConfig');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/company/:id — get full config (auth required via middleware)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  try {
    let config = await getCompanyConfig(id);
    const svcStates = config ? Object.entries(config.services || {}).map(([k,v]) => `${k}=${v?.enabled}`).join(' ') : 'none';
    console.log(`[GET config] user=${id} found=${!!config} | ${svcStates}`);
    if (!config) {
      // First login — new account requires Stripe checkout to start 7-day trial (CC required)
      config = {
        ...DEFAULT_COMPANY_CONFIG,
        subscription: {
          ...DEFAULT_COMPANY_CONFIG.subscription,
          trialType: 'stripe',
        },
      };
      await saveCompanyConfig(id, config);
    } else if (!config.subscription?.trialStartedAt && config.subscription?.trialType !== 'stripe') {
      // Legacy backfill: existing accounts missing trialStartedAt (keep 30-day free trial)
      config.subscription = {
        ...DEFAULT_COMPANY_CONFIG.subscription,
        ...(config.subscription || {}),
        trialStartedAt: new Date().toISOString(),
      };
      await saveCompanyConfig(id, config);
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('GET company config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// PUT /api/company/:id — update config (auth required)
router.put('/:id', async (req, res) => {
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
router.patch('/:id/services', async (req, res) => {
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
    res.json({
      success: true,
      data: {
        companyName, logo, primaryColor, accentColor, fontFamily,
        ctaHeadline, ctaSubtext, ctaButtonText, ctaPhone, ctaButtonUrl,
        serviceStates, frameHeight, borderRadius, services,
        paused: !sub.active,
        trialDaysLeft: sub.daysLeft,
      },
    });
  } catch (err) {
    res.json({ success: true, data: DEFAULT_COMPANY_CONFIG });
  }
});

// DELETE /api/company/account — permanently delete account and all associated data
router.delete('/account', async (req, res) => {
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
