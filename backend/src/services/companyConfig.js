const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

// File fallback for local dev without Supabase
const DATA_FILE = path.join(__dirname, '../../data/company-configs.json');

function dbHeaders() {
  const key = SERVICE_KEY();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function dbGet(companyId) {
  const res = await axios.get(
    `${SUPABASE_URL}/rest/v1/cleaning_company_configs?company_id=eq.${encodeURIComponent(companyId)}&select=config&limit=1`,
    { headers: dbHeaders() }
  );
  return res.data?.[0]?.config || null;
}

async function dbUpsert(companyId, config) {
  await axios.post(
    `${SUPABASE_URL}/rest/v1/cleaning_company_configs`,
    { company_id: companyId, config, updated_at: new Date().toISOString() },
    { headers: { ...dbHeaders(), Prefer: 'resolution=merge-duplicates' } }
  );
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
  if (SERVICE_KEY()) {
    return (await dbGet(companyId)) || null;
  }
  return fileCache.get(companyId) || null;
}

async function saveCompanyConfig(companyId, config) {
  if (SERVICE_KEY()) {
    await dbUpsert(companyId, config);
  } else {
    fileCache.set(companyId, config);
    fileSave(fileCache);
  }
}

module.exports = { getCompanyConfig, saveCompanyConfig, DEFAULT_COMPANY_CONFIG };
