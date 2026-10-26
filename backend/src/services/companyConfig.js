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

// Atomic partial update: merges ONLY the given top-level keys into the
// stored config, at the database row level, via migration 027's
// merge_company_config function -- see that migration's comment for why
// this exists (a full getCompanyConfig + mutate-in-memory + saveCompanyConfig
// cycle can lose an unrelated concurrent writer's change to a DIFFERENT top-
// level key). Returns the full post-merge config, so callers that need the
// result (e.g. to compute a response or to read a field they just merged
// alongside others already on it) don't need a separate re-read.
//
// File-fallback mode has no real concurrency to protect against (single
// local dev process), so a plain read-merge-write is fine there.
async function patchCompanyConfig(companyId, patch) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('merge_company_config', {
      p_company_id: companyId,
      p_patch: patch,
    });
    if (error) {
      console.error('[companyConfig] PATCH error:', error.message, error.code);
      throw new Error(error.message);
    }
    console.log(`[companyConfig] PATCH ok company_id=${companyId} keys=${Object.keys(patch).join(',')}`);
    return data;
  }

  console.log('[companyConfig] PATCH using file cache (no Supabase)');
  const merged = { ...(fileCache.get(companyId) || {}), ...patch };
  fileCache.set(companyId, merged);
  fileSave(fileCache);
  return merged;
}

// Companion to patchCompanyConfig for the one case a merge can't express:
// deleting a top-level key entirely (e.g. clearing pendingDeletion), via
// migration 027's remove_company_config_keys. Same atomicity guarantee as
// patchCompanyConfig -- see that migration's comment.
async function removeCompanyConfigKeys(companyId, keys) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('remove_company_config_keys', {
      p_company_id: companyId,
      p_keys: keys,
    });
    if (error) {
      console.error('[companyConfig] REMOVE_KEYS error:', error.message, error.code);
      throw new Error(error.message);
    }
    console.log(`[companyConfig] REMOVE_KEYS ok company_id=${companyId} keys=${keys.join(',')}`);
    return data;
  }

  console.log('[companyConfig] REMOVE_KEYS using file cache (no Supabase)');
  const existing = fileCache.get(companyId);
  if (!existing) return null;
  const rest = { ...existing };
  for (const k of keys) delete rest[k];
  fileCache.set(companyId, rest);
  fileSave(fileCache);
  return rest;
}

// Companies hit this from two different routes on dashboard load in
// parallel -- GET /api/company/:id and GET /api/subscription/status -- with
// no ordering guarantee between them. Both need the exact same "create a
// default row if this is a brand-new account" logic, or whichever request
// loses the race reads a config that doesn't exist yet and reports
// requires_trial_setup even though the other request is about to create it
// a moment later. A module-level flag (set synchronously, before the first
// await below) closes the window for two near-simultaneous first calls both
// deciding to create.
//
// Deliberately does NOT start a free trial here (trialStartedAt stays
// unset either way) -- that used to happen automatically on first dashboard
// load, which meant simply never completing Stripe Checkout (closing the
// tab, declining, even just re-visiting an old signup-confirmation link)
// quietly granted a full no-card 30-day trial anyway, defeating the entire
// point of requiring a card up front. The only way trialStartedAt (or a
// real Stripe subscription) ever gets set now is POST /checkout's own
// seeding logic followed by an actual completed Stripe Checkout -- see
// subscription.js. An account that hasn't done that stays
// requires_trial_setup indefinitely, which CompanyDashboard.js gates on.
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
      // Pre-fills the Branding tab's "Results Page Call-to-Action" fields
      // with the same phone/email the owner already typed in at signup --
      // a real starting value instead of a blank field they'd otherwise
      // have to notice and fill in themselves before it ever reaches a
      // visitor. Only happens here, in the brand-new-account branch, so an
      // existing company's own edited ctaPhone/ctaEmail (including a
      // deliberate blank) is never overwritten later.
      ctaPhone: seed.phone || DEFAULT_COMPANY_CONFIG.ctaPhone,
      ctaEmail: seed.email || DEFAULT_COMPANY_CONFIG.ctaEmail,
    };
    await saveCompanyConfig(companyId, config);
    return { config, created };
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

// Same as listAllCompanyConfigs, but joined with each account's Supabase
// Auth signup email/created_at (same pagination pattern as admin.js's own
// listCompaniesWithConfig) -- the activation-reminder check (trialScheduler.js's
// checkActivationReminders) needs to know WHEN an account signed up, not just
// its current config, since "never finished checkout" has no timestamp of
// its own anywhere in the config -- the company row gets created the moment
// POST /checkout starts, same instant as the Auth user itself.
async function listAllCompanyConfigsWithOwnerInfo() {
  const sb = getSupabase();
  if (!sb) return listAllCompanyConfigs().then(rows => rows.map(r => ({ ...r, email: null, signedUpAt: null })));

  const { data: configRows, error: cfgErr } = await sb
    .from('cleaning_company_configs')
    .select('company_id, config');
  if (cfgErr) {
    console.error('[companyConfig] LIST (with owner info) error:', cfgErr.message, cfgErr.code);
    throw new Error(cfgErr.message);
  }

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
    email: userById.get(row.company_id)?.email || null,
    signedUpAt: userById.get(row.company_id)?.created_at || null,
  }));
}

// ─── Duplicate-account detection ───────────────────────────────────────────
// Called from the signup form (company.js's POST /check-duplicate, before
// supabase.auth.signUp() runs) to stop the same real-world business from
// creating a second account under a different email. Normalizes each field
// before comparing so "ABC Cleaning Co." vs "abc cleaning co" or
// "(555) 123-4567" vs "555-123-4567" still match.
//
// website is deliberately NOT checked here (removed Oct 2026, a real
// support case): the signup field is labeled "Website or Facebook page" and
// explicitly invites a business with no site of its own to type something
// informal instead -- unlike a company name or a phone number, that's not a
// reliable "this is the same real business" signal. A support audit found
// two genuinely different companies had both typed the bare "facebook.com"
// (no specific page, just the lazy/generic answer), and the second one's
// real signup was being blocked as a "duplicate account" of the first. A
// company name collision or a shared phone number is still a strong signal
// worth blocking on; a shared generic placeholder website is not.
function normalizeName(v) {
  return String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalizePhone(v) {
  return String(v || '').replace(/\D/g, '').slice(-10);
}

async function findDuplicateCompany({ companyName, phone }) {
  const nName = normalizeName(companyName);
  const nPhone = normalizePhone(phone);

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
  }
  return null;
}

module.exports = { getCompanyConfig, saveCompanyConfig, patchCompanyConfig, removeCompanyConfigKeys, getOrCreateCompanyConfig, listAllCompanyConfigs, listAllCompanyConfigsWithOwnerInfo, findDuplicateCompany, DEFAULT_COMPANY_CONFIG };
