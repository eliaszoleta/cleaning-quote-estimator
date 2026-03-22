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

module.exports = { getCompanyConfig, saveCompanyConfig, DEFAULT_COMPANY_CONFIG };
