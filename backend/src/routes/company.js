const express = require('express');
const router = express.Router();
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { getCompanyConfig, saveCompanyConfig } = require('../services/companyConfig');

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/company/:id — get full config (auth required via middleware)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ success: false, error: 'Forbidden' });

  try {
    let config = await getCompanyConfig(id);
    if (!config) {
      // First login — create default config with trial start
      config = {
        ...DEFAULT_COMPANY_CONFIG,
        subscription: {
          ...DEFAULT_COMPANY_CONFIG.subscription,
          trialStartedAt: new Date().toISOString(),
        },
      };
      await saveCompanyConfig(id, config);
    } else if (!config.subscription?.trialStartedAt) {
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
    console.log('[PUT company] updates.services keys:', updates.services ? Object.keys(updates.services) : 'none');
    console.log('[PUT company] merged.services.homeResidential:', JSON.stringify(merged.services?.homeResidential));
    await saveCompanyConfig(id, merged);
    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('PUT company config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save configuration' });
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

module.exports = router;
