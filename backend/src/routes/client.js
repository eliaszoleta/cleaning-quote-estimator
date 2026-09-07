const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_KEY()) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY(), { auth: { persistSession: false } });
}

// Every route here is a partner editing their own listing -- real Supabase
// Auth required, never the admin-key pattern (that's for the site owner
// managing every partner, this is a partner managing just their own).
router.use(requireAuth);

// Resolves the authenticated user's own partner row by personal_email --
// same match ClientDashboard.js's own read and the "partners can read own
// row" RLS policy (007_split_partner_emails.sql) already use. Writes below
// go through the service role key (which bypasses RLS entirely), so this
// ownership check is what actually keeps a partner from touching any row
// but their own.
async function getOwnPartner(sb, email) {
  const { data } = await sb.from('partners').select('*').ilike('personal_email', email).limit(1).maybeSingle();
  return data;
}

// PUT /api/client/partner -- a partner updating their own listing's
// business details. Deliberately scoped to just those fields:
//   - personal_email is excluded: it's their /client login identity (the
//     column this very lookup matches against), so changing it here would
//     desync it from their actual Supabase Auth email and lock them out.
//   - active is excluded: billing/admin-controlled (site owner via
//     /admin/partners), not something a partner should be able to flip
//     themselves.
//   - service-area cities are excluded: tied to per-city billing and
//     exclusivity, handled by the Buy City Placement checkout flow, not a
//     quick self-edit.
router.put('/partner', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const partner = await getOwnPartner(sb, req.user.email);
    if (!partner) return res.status(404).json({ success: false, error: 'No partner listing found for this account' });

    const { business_name, address, phone, business_email, website, logo_url } = req.body || {};
    if (!business_name || !business_name.trim()) return res.status(400).json({ success: false, error: 'Business name is required' });
    if (!business_email || !business_email.trim()) return res.status(400).json({ success: false, error: 'Business email is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ success: false, error: 'Phone is required' });

    const { data, error } = await sb
      .from('partners')
      .update({
        business_name: business_name.trim(),
        address: (address || '').trim(),
        phone: phone.trim(),
        business_email: business_email.trim(),
        website: (website || '').trim(),
        logo_url: (logo_url || '').trim(),
      })
      .eq('id', partner.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Client partner update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save changes. Please try again.' });
  }
});

module.exports = router;
