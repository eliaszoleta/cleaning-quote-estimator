const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

const DATA_DIR = path.join(__dirname, '../../data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function loadLeadsFile() {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch { return []; }
}

function saveLeadsFile(leads) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (err) { console.error('saveLeadsFile error:', err.message); }
}

// ─── saveLead (called from calculate route) ───────────────────────────────────
async function saveLead({ companyId, name, email, phone, serviceType, zip, state, estimatedPriceLow, estimatedPriceHigh, timeline, preferredContact, serviceDetails, customAnswers }) {
  const lead = {
    id: uuidv4(),
    company_id: companyId || null,
    name: name?.slice(0, 200) || '',
    email: email?.slice(0, 200) || '',
    phone: phone?.slice(0, 30) || null,
    service_type: serviceType,
    zip: zip || null,
    state: state || null,
    estimated_price_low: estimatedPriceLow || null,
    estimated_price_high: estimatedPriceHigh || null,
    timeline: timeline || null,
    preferred_contact: preferredContact || null,
    service_details: serviceDetails || {},
    custom_answers: customAnswers || {},
    notes: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
  };

  if (SERVICE_KEY() && SUPABASE_URL) {
    try {
      await axios.post(`${SUPABASE_URL}/rest/v1/leads`, lead, { headers: dbHeaders() });
      return lead;
    } catch (err) {
      console.warn('Supabase saveLead failed, using file fallback:', err.message);
    }
  }

  // File fallback
  const leads = loadLeadsFile();
  leads.unshift(lead);
  saveLeadsFile(leads);
  return lead;
}

// ─── API key lookup ───────────────────────────────────────────────────────────
async function findCompanyByApiKey(apiKey) {
  if (SERVICE_KEY() && SUPABASE_URL) {
    try {
      const res = await axios.get(`${SUPABASE_URL}/rest/v1/cleaning_company_configs?select=company_id,config`, { headers: dbHeaders() });
      const row = (res.data || []).find(r => r.config?.apiKey === apiKey);
      return row ? { companyId: row.company_id, config: row.config } : null;
    } catch (err) {
      console.warn('Supabase findCompanyByApiKey failed:', err.message);
    }
  }
  // File fallback
  try {
    const cfgFile = path.join(DATA_DIR, 'company-configs.json');
    if (!fs.existsSync(cfgFile)) return null;
    const data = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    const entry = Object.entries(data).find(([, cfg]) => cfg.apiKey === apiKey);
    return entry ? { companyId: entry[0], config: entry[1] } : null;
  } catch { return null; }
}

// ─── GET /api/leads ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const apiKey =
    req.headers['x-api-key'] ||
    (req.headers.authorization?.startsWith('Bearer sk_') ? req.headers.authorization.slice(7) : null);

  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required. Use X-API-Key header.' });
  }

  try {
    const found = await findCompanyByApiKey(apiKey);
    if (!found) return res.status(401).json({ success: false, error: 'Invalid API key' });

    const { companyId } = found;
    const since = req.query.since;
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);

    if (SERVICE_KEY() && SUPABASE_URL) {
      let url = `${SUPABASE_URL}/rest/v1/leads?select=*&company_id=eq.${encodeURIComponent(companyId)}&deleted_at=is.null&order=created_at.desc&limit=${limit}`;
      if (since) url += `&created_at=gte.${encodeURIComponent(since)}`;
      const leadsRes = await axios.get(url, { headers: dbHeaders() });
      return res.json({ success: true, companyId, count: leadsRes.data.length, data: leadsRes.data || [] });
    }

    // File fallback
    let leads = loadLeadsFile().filter(l => l.company_id === companyId && !l.deleted_at);
    if (since) leads = leads.filter(l => l.created_at >= since);
    leads = leads.slice(0, limit);
    res.json({ success: true, companyId, count: leads.length, data: leads });
  } catch (err) {
    console.error('Leads API error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── Dashboard leads routes (auth-protected, mounted separately) ──────────────
// GET /api/company-leads — get leads for authenticated company
router.get('/company', async (req, res) => {
  // requireAuth already ran
  const companyId = req.user.id;
  const since = req.query.since;
  const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
  const includeDeleted = req.query.deleted === 'true';

  try {
    if (SERVICE_KEY() && SUPABASE_URL) {
      let url = `${SUPABASE_URL}/rest/v1/leads?select=*&company_id=eq.${encodeURIComponent(companyId)}&order=created_at.desc&limit=${limit}`;
      if (!includeDeleted) url += '&deleted_at=is.null';
      if (since) url += `&created_at=gte.${encodeURIComponent(since)}`;
      const res2 = await axios.get(url, { headers: dbHeaders() });
      return res.json({ success: true, data: res2.data || [] });
    }

    let leads = loadLeadsFile().filter(l => l.company_id === companyId);
    if (!includeDeleted) leads = leads.filter(l => !l.deleted_at);
    if (since) leads = leads.filter(l => l.created_at >= since);
    leads = leads.slice(0, limit);
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error('Company leads error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load leads' });
  }
});

// PATCH /api/company-leads/:id — update lead (notes, soft delete, restore)
router.patch('/company/:id', async (req, res) => {
  const companyId = req.user.id;
  const leadId = req.params.id;
  const { notes, deleted_at } = req.body;

  try {
    if (SERVICE_KEY() && SUPABASE_URL) {
      const updates = {};
      if (notes !== undefined) updates.notes = notes;
      if (deleted_at !== undefined) updates.deleted_at = deleted_at;
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}&company_id=eq.${encodeURIComponent(companyId)}`,
        updates,
        { headers: dbHeaders() }
      );
      return res.json({ success: true });
    }

    const leads = loadLeadsFile();
    const idx = leads.findIndex(l => l.id === leadId && l.company_id === companyId);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Lead not found' });
    if (notes !== undefined) leads[idx].notes = notes;
    if (deleted_at !== undefined) leads[idx].deleted_at = deleted_at;
    saveLeadsFile(leads);
    res.json({ success: true });
  } catch (err) {
    console.error('Update lead error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

module.exports = router;
module.exports.saveLead = saveLead;
