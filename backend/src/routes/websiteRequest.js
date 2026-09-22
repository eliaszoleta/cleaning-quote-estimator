const express = require('express');
const router = express.Router();
const { sendWebsiteRequestNotificationEmail } = require('../services/email');

// POST /api/website-request — the "Get a Done-For-You Website" application
// form (WebsiteSubscription.js). Public, unauthenticated (same as
// /api/calculate) since it's submitted by a prospect, not a logged-in
// company. The only job here is to make sure the internal notification
// email actually goes out; there's no dashboard or lead list for these
// (unlike calculator leads), so the email *is* the record. A failed
// notification is logged server-side but still returns success to the
// applicant -- same fire-and-forget philosophy as every other
// lead-notification email in this codebase, so a Resend hiccup never
// shows the applicant an error for something that isn't their fault.
router.post('/', async (req, res) => {
  const {
    name, business, email, phone,
    servicesOffered, otherServices,
    businessAddress, serviceAreas,
    hasDomain, domain1, domain2, domain3,
    currentWebsite, facebookPage, message,
    website2, // honeypot -- real visitors never see or fill this field
  } = req.body || {};

  // Bot filled the honeypot: pretend success so it doesn't learn to skip
  // this field, but never send the notification email.
  if (website2) {
    return res.json({ success: true });
  }

  if (!name || !business || !email) {
    return res.status(400).json({ success: false, error: 'Name, business, and email are required.' });
  }

  try {
    const sent = await sendWebsiteRequestNotificationEmail({
      name, business, email, phone,
      servicesOffered, otherServices,
      businessAddress, serviceAreas,
      hasDomain, domain1, domain2, domain3,
      currentWebsite, facebookPage, message,
    });
    if (!sent) console.warn('Website request notification email did not send for:', email);
    res.json({ success: true });
  } catch (err) {
    console.error('Website request error:', err.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
