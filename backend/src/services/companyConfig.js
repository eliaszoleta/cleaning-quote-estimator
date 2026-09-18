const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

// File fallback for local dev without Supabase
const DATA_FILE = path.join(__dirname, '../../data/company-configs.json');

let _supabase = null;
function getSupabase() {
  if (!_supabase && SUPABASE_URL && SERVICE_KEY()) {
    _supabase = createClient(SUPABASE_URL, SERVICE_KEY(), {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

// File fallback helpers
function fileLoad() {
  try {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))));
  } catch {
    return new Map();
  }
}

function fileSave(map) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(Object.fromEntries(map), null, 2), 'utf8');
}

const fileCache = fileLoad();

async function getCompanyConfig(companyId) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('cleaning_company_configs')
      .select('config')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      console.error('[companyConfig] GET error:', error.message, error.code);
      throw new Error(error.message);
    }
    console.log(`[companyConfig] GET company_id=${companyId} found=${!!data}`);
    return data?.config || null;
  }

  console.log('[companyConfig] GET using file cache (no Supabase)');
  return fileCache.get(companyId) || null;
}

async function saveCompanyConfig(companyId, config) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb
      .from('cleaning_company_configs')
      .upsert(
        { company_id: companyId, config, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      );

    if (error) {
      console.error('[companyConfig] SAVE error:', error.message, error.code);
      throw new Error(error.message);
    }
    console.log(`[companyConfig] SAVE ok company_id=${companyId}`);
    return;
  }

  console.log('[companyConfig] SAVE using file cache (no Supabase)');
  fileCache.set(companyId, config);
  fileSave(fileCache);
}

// Companies hit this from two different routes on dashboard load in
// parallel -- GET /api/company/:id and GET /api/subscription/status -- with
// no ordering guarantee between them. Both need the exact same "create with
// a 30-day trial if this is a brand-new account, backfill trialStartedAt if
// it's missing on an old one" logic, or whichever request loses the race
// reads a config that doesn't exist yet and reports requires_trial_setup
// even though the other request is about to create it a moment later. A
// module-level flag (set synchronously, before the first await below) closes
// the window for two near-simultaneous first calls both deciding to create.
const recentlyCreated = new Set();

async function getOrCreateCompanyConfig(companyId, seed = {}) {
  let config = await getCompanyConfig(companyId);
  if (!config) {
    const created = !recentlyCreated.has(companyId);
    recentlyCreated.add(companyId);
    config = {
      ...DEFAULT_COMPANY_CONFIG,
      companyName: seed.companyName || DEFAULT_COMPANY_CONFIG.companyName,
      phone: seed.phone || DEFAULT_COMPANY_CONFIG.phone,
      website: seed.website || DEFAULT_COMPANY_CONFIG.website,
      subscription: {
        ...DEFAULT_COMPANY_CONFIG.subscription,
        trialStartedAt: new Date().toISOString(),
      },
    };
    await saveCompanyConfig(companyId, config);
    return { config, created };
  }
  if (!config.subscription?.trialStartedAt && !config.subscription?.stripeSubscriptionId) {
    config.subscription = {
      ...DEFAULT_COMPANY_CONFIG.subscription,
      ...(config.subscription || {}),
      trialStartedAt: new Date().toISOString(),
    };
    await saveCompanyConfig(companyId, config);
  }
  return { config, created: false };
}

// Bulk read for the trial-reminder scheduler (services/trialScheduler.js),
// which needs to scan every company's trial state rather than look one up
// by id.
async function listAllCompanyConfigs() {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('cleaning_company_configs').select('company_id, config');
    if (error) {
      console.error('[companyConfig] LIST error:', error.message, error.code);
      throw new Error(error.message);
    }
    return (data || []).map(row => ({ companyId: row.company_id, config: row.config }));
  }

  return Array.from(fileCache.entries()).map(([companyId, config]) => ({ companyId, config }));
}

// ─── Duplicate-account detection ───────────────────────────────────────────
// Called from the signup form (company.js's POST /check-duplicate, before
// supabase.auth.signUp() runs) to stop the same real-world business from
// creating a second account under a different email. Normalizes each field
// before comparing so "ABC Cleaning Co." vs "abc cleaning co" or
// "(555) 123-4567" vs "555-123-4567" still match.
function normalizeName(v) {
  return String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalizePhone(v) {
  return String(v || '').replace(/\D/g, '').slice(-10);
}
function normalizeWebsite(v) {
  return String(v || '').toLowerCase().trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

async function findDuplicateCompany({ companyName, phone, website }) {
  const nName = normalizeName(companyName);
  const nPhone = normalizePhone(phone);
  const nWebsite = normalizeWebsite(website);

  let rows;
  try {
    rows = await listAllCompanyConfigs();
  } catch (err) {
    console.error('[companyConfig] findDuplicateCompany: list failed:', err.message);
    return null;
  }

  for (const { config } of rows) {
    if (!config) continue;
    if (nName && normalizeName(config.companyName) === nName) return { field: 'companyName' };
    if (nPhone && nPhone.length === 10 && normalizePhone(config.phone) === nPhone) return { field: 'phone' };
    if (nWebsite && normalizeWebsite(config.website) === nWebsite) return { field: 'website' };
  }
  return null;
}

module.exports = { getCompanyConfig, saveCompanyConfig, getOrCreateCompanyConfig, listAllCompanyConfigs, findDuplicateCompany, DEFAULT_COMPANY_CONFIG };
