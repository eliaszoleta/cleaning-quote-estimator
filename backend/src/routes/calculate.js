const express = require('express');
const router = express.Router();
const { calculateCleaning } = require('../services/cleaningCalculation');
const { STATE_PRICING_MULTIPLIERS, STATE_AVERAGE_HOME_CLEANING_COST, STATE_NAMES } = require('../config/defaults');
const { getCompanyConfig } = require('../services/companyConfig');
const { saveLead } = require('./leads');
const { sendEstimateEmail } = require('../services/email');

const VALID_SERVICE_TYPES = [
  'home_residential', 'apartment', 'commercial', 'carpet',
  'air_duct', 'dryer_vent', 'tile_grout', 'mold_remediation', 'water_damage',
];

// POST /api/calculate
router.post('/', async (req, res) => {
  const { serviceType, zip, state, serviceDetails, companyId, leadInfo, partnerInfo } = req.body;

  // TEMPORARY DEBUG — remove once the partner-match email issue is found.
  console.log('[EMAIL-DEBUG] request received:', {
    hasLeadInfo: !!leadInfo,
    leadName: leadInfo?.name,
    leadEmail: leadInfo?.email,
    hasPartnerInfo: !!partnerInfo,
    partnerBusinessName: partnerInfo?.business_name,
    bodyBytes: JSON.stringify(req.body || {}).length,
  });

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

    // TEMPORARY DEBUG — remove once the partner-match email issue is found.
    console.log('[EMAIL-DEBUG] gate check:', {
      willSendEmail: !!(leadInfo && leadInfo.name && leadInfo.email),
    });

    // Save lead if lead info provided
    if (leadInfo && leadInfo.name && leadInfo.email) {
      try {
        await saveLead({
          companyId: companyId || null,
          name: leadInfo.name,
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
      console.log('[EMAIL-DEBUG] calling sendEstimateEmail now');
      sendEstimateEmail({
        to: leadInfo.email,
        name: leadInfo.name,
        serviceType,
        result,
        companyConfig,
        partner: partnerInfo || null,
      })
        .then(sent => console.log('[EMAIL-DEBUG] sendEstimateEmail resolved:', sent))
        .catch(err => console.error('[EMAIL-DEBUG] sendEstimateEmail UNHANDLED rejection:', err));
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
