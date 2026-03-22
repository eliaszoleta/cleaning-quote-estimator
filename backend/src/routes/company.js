const express = require('express');
const router = express.Router();
const axios = require('axios');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');
const { computeSubscriptionStatus } = require('./subscription');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function getCompanyConfig(companyId) {
  if (!SERVICE_KEY() || !SUPABASE_URL) {
    return loadFromFile(companyId);
  }
  try {
    const res = await axios.get(
      `${SUPABASE_URL}/rest/v1/cleaning_company_configs?company_id=eq.${encodeURIComponent(companyId)}&select=config&limit=1`,
      { headers: dbHeaders() }
    );
    if (res.data && res.data.length > 0) return res.data[0].config || {};
    return null;
  } catch (err) {
    console.warn('Supabase getCompanyConfig failed, using file fallback:', err.message);
    return loadFromFile(companyId);
  }
}

async function saveCompanyConfig(companyId, config) {
  if (!SERVICE_KEY() || !SUPABASE_URL) {
    return saveToFile(companyId, config);
  }
  try {
    await axios.post(
      `${SUPABASE_URL}/rest/v1/cleaning_company_configs`,
      { company_id: companyId, config, updated_at: new Date().toISOString() },
      { headers: { ...dbHeaders(), Prefer: 'resolution=merge-duplicates' } }
    );
  } catch (err) {
    console.warn('Supabase saveCompanyConfig failed, using file fallback:', err.message);
    return saveToFile(companyId, config);
  }
}

// File-based fallback for local dev without Supabase
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../../data');

function loadFromFile(companyId) {
  try {
    const filePath = path.join(DATA_DIR, 'company-configs.json');
    if (!fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data[companyId] || null;
  } catch { return null; }
}

function saveToFile(companyId, config) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, 'company-configs.json');
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
    data[companyId] = config;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) { console.error('saveToFile error:', err.message); }
}

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
module.exports.getCompanyConfig = getCompanyConfig;
module.exports.saveCompanyConfig = saveCompanyConfig;
