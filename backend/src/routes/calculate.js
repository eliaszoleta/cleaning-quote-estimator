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
