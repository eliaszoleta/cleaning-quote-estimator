const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_KEY()) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY(), { auth: { persistSession: false } });
}

// Gates every route in this file. Deliberately a header the frontend only
// ever forwards from whatever the admin types into the login form at
// runtime, never a REACT_APP_* env var -- those get baked into the public
// JS bundle at build time and are readable by anyone, which would be fine
// for the cosmetic UI gate AdminPartners.js uses (the real protection there
// is Supabase RLS) but not for this endpoint, which uses the Supabase
// service role key server-side to read every subscriber's account and
// signup email. Fails closed if the key isn't set at all.
function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

router.use(requireAdminKey);

// GET /api/admin/companies — every subscriber account (name, signup email,
// trial/subscription status, services enabled, lead count). There's no
// self-serve equivalent of AdminPartners.js for the company/subscriber side
// of the product yet -- this is that.
router.get('/companies', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: configRows, error: cfgErr } = await sb
      .from('cleaning_company_configs')
      .select('company_id, config, updated_at');
    if (cfgErr) throw cfgErr;

    // Auth users aren't in a queryable table -- only the Admin API can list
    // them, and only with the service role key (never from the browser).
    // Paginated defensively even though this account isn't near the
    // 1000/page default yet.
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

    // Lead counts per company -- just the company_id column, counted in JS
    // (the Supabase JS client has no simple GROUP BY/count-by), fine at
    // this scale.
    const { data: leadRows, error: leadErr } = await sb
      .from('leads')
      .select('company_id')
      .is('deleted_at', null);
    if (leadErr) throw leadErr;
    const leadCounts = {};
    for (const row of leadRows || []) {
      if (!row.company_id) continue;
      leadCounts[row.company_id] = (leadCounts[row.company_id] || 0) + 1;
    }

    const companies = (configRows || []).map(row => {
      const config = row.config || {};
      const user = userById.get(row.company_id);
      const sub = computeSubscriptionStatus(config);
      const services = config.services || {};
      const enabledCount = Object.values(services).filter(s => s?.enabled !== false).length;
      return {
        companyId: row.company_id,
        companyName: config.companyName || '(unnamed)',
        email: user?.email || null,
        signedUpAt: user?.created_at || null,
        lastConfigUpdate: row.updated_at || null,
        subscription: sub,
        servicesEnabled: enabledCount,
        servicesTotal: Object.keys(services).length,
        serviceStates: config.serviceStates || [],
        leadCount: leadCounts[row.company_id] || 0,
        apiKeySet: !!config.apiKey,
      };
    });

    companies.sort((a, b) => new Date(b.signedUpAt || 0) - new Date(a.signedUpAt || 0));

    res.json({
      success: true,
      count: companies.length,
      activeCount: companies.filter(c => c.subscription.active).length,
      totalLeads: Object.values(leadCounts).reduce((s, n) => s + n, 0),
      data: companies,
    });
  } catch (err) {
    console.error('Admin companies list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load companies' });
  }
});

module.exports = router;
