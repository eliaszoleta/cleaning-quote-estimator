// Lets a logged-in company owner (or their staff, once they're sharing the
// login) email one freshly-computed estimate result to a coworker -- the
// "Run an Estimate" dashboard tab's "Share via email" button. Deliberately
// separate from POST /api/calculate's lead-capture block: that path saves a
// lead, notifies the company, and forwards to a referral partner -- none of
// which apply here, since there's no outside prospect involved, just one
// person on the team handing a number to another.
//
// Re-runs calculateCleaning() server-side from the raw inputs instead of
// trusting a client-supplied result object, so the emailed numbers are
// always the real, authoritative calculation -- not whatever the browser
// happened to have in state.
const express = require('express');
const router = express.Router();
const { calculateCleaning } = require('../services/cleaningCalculation');
const { getCompanyConfig } = require('../services/companyConfig');
const { sendEstimateEmail } = require('../services/email');

const VALID_SERVICE_TYPES = [
  'home_residential', 'apartment', 'commercial', 'carpet', 'upholstery',
  'air_duct', 'dryer_vent', 'tile_grout', 'mold_remediation', 'water_damage',
  'airbnb', 'post_construction',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/estimate-share
router.post('/', async (req, res) => {
  const companyId = req.user.id;
  const { to, clientName, serviceType, zip, state, serviceDetails } = req.body || {};
  const trimmedClientName = (clientName || '').trim().slice(0, 100) || null;

  if (!to || !EMAIL_RE.test(to)) return res.status(400).json({ success: false, error: 'A valid email address is required' });
  if (!trimmedClientName) return res.status(400).json({ success: false, error: "The client's name is required" });
  if (!serviceType || !VALID_SERVICE_TYPES.includes(serviceType)) return res.status(400).json({ success: false, error: 'Invalid or missing serviceType' });
  if (!zip && !state) return res.status(400).json({ success: false, error: 'zip or state is required' });

  try {
    const companyConfig = (await getCompanyConfig(companyId)) || {};
    const result = await calculateCleaning(
      { serviceType, zip: zip || null, state: state || null, serviceDetails: serviceDetails || {} },
      companyConfig
    );

    const sent = await sendEstimateEmail({
      to,
      name: null,
      clientName: trimmedClientName,
      serviceType,
      result,
      companyConfig,
      partner: null,
      replyTo: companyConfig.leadNotificationEmail || undefined,
      // Always a real, authenticated subscriber here (companyId is
      // req.user.id above) -- single-midpoint style, same as their own
      // embedded widget.
      companyId,
    });

    if (!sent) return res.status(502).json({ success: false, error: 'Failed to send the email. Please try again in a moment.' });
    res.json({ success: true });
  } catch (err) {
    console.error('estimate-share error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to share this estimate' });
  }
});

module.exports = router;
