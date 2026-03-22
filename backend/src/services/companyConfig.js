const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_DIR = path.join(__dirname, '../../data');

function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

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
    saveToFile(companyId, config);
  }
}

module.exports = { getCompanyConfig, saveCompanyConfig, DEFAULT_COMPANY_CONFIG };
