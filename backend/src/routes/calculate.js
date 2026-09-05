const express = require('express');
const router = express.Router();
const { calculateCleaning } = require('../services/cleaningCalculation');
const { STATE_PRICING_MULTIPLIERS, STATE_AVERAGE_HOME_CLEANING_COST, STATE_NAMES } = require('../config/defaults');
const { getCompanyConfig } = require('../services/companyConfig');
const { saveLead } = require('./leads');
const { sendEstimateEmail, sendPartnerLeadEmail } = require('../services/email');

const VALID_SERVICE_TYPES = [
  'home_residential', 'apartment', 'commercial', 'carpet',
  'air_duct', 'dryer_vent', 'tile_grout', 'mold_remediation', 'water_damage',
];

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// req.body.partnerInfo is whatever the browser's own (client-side, anon-key)
// partner match produced -- never trust its .email for anything that sends
// mail, or anyone could POST directly to this endpoint with a fabricated
// partnerInfo.email and get us to send an arbitrary "new lead" email to any
// address, using our domain's sending reputation. This re-looks-up the
// partner by id against our own database and only ever sends to the
// business_email on file there (not personal_email, which is only for
// /client login and never used for lead forwarding), only if that partner
// is still active.
async function getVerifiedPartnerEmail(partnerId) {
  if (!partnerId) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('partners')
      .select('business_email, active')
      .eq('id', partnerId)
      .eq('active', true)
      .maybeSingle();
    return data?.business_email || null;
  } catch (err) {
    console.warn('getVerifiedPartnerEmail failed:', err.message);
    return null;
  }
}

// Same table logBannerEvent() in partnerLookup.js writes impression/call_click
// rows to (from the browser, anon key) -- this is the backend's equivalent
// for the one event type that only ever happens server-side.
async function logLeadEmailEvent(partnerId) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('partner_banner_events').insert({ partner_id: partnerId, event_type: 'lead_email' });
  } catch (err) {
    console.warn('logLeadEmailEvent failed:', err.message);
  }
}

// POST /api/calculate
router.post('/', async (req, res) => {
  const { serviceType, zip, state, serviceDetails, companyId, leadInfo, partnerInfo } = req.body;

  // Validate
  if (!serviceType || !VALID_SERVICE_TYPES.includes(serviceType)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing serviceType' });
  }
  if (!zip && !state) {
    return res.status(400).json({ success: false, error: 'zip or state is required' });
  }

  try {
    // Load company config if companyId provided
    let companyConfig = {};
    if (companyId) {
      try { companyConfig = (await getCompanyConfig(companyId)) || {}; } catch {}
    }

    const result = await calculateCleaning(
      { serviceType, zip: zip || null, state: state || null, serviceDetails: serviceDetails || {} },
      companyConfig
    );

    // Save lead / send the estimate email based on email alone -- the
    // lead-capture form marks name as optional (no `required` attribute,
    // labeled "(optional)"), so gating on both silently dropped this whole
    // block whenever a visitor left name blank. sendEstimateEmail's own
    // buildHtml already falls back to "there" when name is missing.
    if (leadInfo && leadInfo.email) {
      try {
        await saveLead({
          companyId: companyId || null,
          name: leadInfo.name || null,
          email: leadInfo.email,
          phone: leadInfo.phone || null,
          serviceType,
          zip: zip || null,
          state: result.state,
          estimatedPriceLow: result.totalLow,
          estimatedPriceHigh: result.totalHigh,
          timeline: leadInfo.timeline || null,
          preferredContact: leadInfo.preferredContact || null,
          serviceDetails: serviceDetails || {},
          customAnswers: leadInfo.customAnswers || {},
        });
      } catch (leadErr) {
        console.warn('Lead save failed (non-critical):', leadErr.message);
      }

      // Fire-and-forget: sendEstimateEmail never throws, so this never
      // blocks or breaks the response on email delivery. Passes the full
      // result (breakdown, key factors, recurring pricing) and the
      // already-resolved partner match so the email mirrors exactly what
      // the results page showed, not just the top-line price range.
      sendEstimateEmail({
        to: leadInfo.email,
        name: leadInfo.name,
        serviceType,
        result,
        companyConfig,
        partner: partnerInfo || null,
      }).catch(err => console.error('Estimate email failed:', err.message));

      // Forward the same lead to the matched partner, if any -- the
      // lead-capture form already tells visitors "we'll connect you with
      // local cleaning professionals," so this makes that a proactive
      // handoff instead of just a passive listing they might not click.
      if (partnerInfo && partnerInfo.id) {
        const partnerIdForLead = partnerInfo.id;
        getVerifiedPartnerEmail(partnerIdForLead)
          .then(async partnerEmail => {
            if (!partnerEmail) return;
            const sent = await sendPartnerLeadEmail({
              partnerEmail,
              leadName: leadInfo.name,
              leadEmail: leadInfo.email,
              leadPhone: leadInfo.phone,
              serviceType,
              priceLow: result.totalLow,
              priceHigh: result.totalHigh,
              zip: zip || null,
              timeline: leadInfo.timeline || null,
            });
            // Logged as a partner_banner_events row (same table/pattern as
            // banner impressions and call-button taps) so it shows up
            // alongside those in the partner's KPI dashboard. Only counted
            // on an actual successful send, not just an attempt.
            if (sent) await logLeadEmailEvent(partnerIdForLead);
          })
          .catch(err => console.error('Partner lead email failed:', err.message));
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculation error:', err.message, err.stack);
    res.status(500).json({ success: false, error: 'Calculation failed. Please try again.' });
  }
});

// GET /api/calculate/state-data
router.get('/state-data', (req, res) => {
  const data = Object.entries(STATE_PRICING_MULTIPLIERS).map(([abbr, mult]) => ({
    abbr,
    name: STATE_NAMES[abbr] || abbr,
    multiplier: mult,
    averageHomeCost: STATE_AVERAGE_HOME_CLEANING_COST[abbr] || null,
  }));
  res.json({ success: true, data });
});

module.exports = router;
