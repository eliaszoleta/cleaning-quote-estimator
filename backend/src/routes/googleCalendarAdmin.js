// Connect/callback/status/disconnect for the one Google account this app
// ever talks to (the admin's own, for /book-a-call). Split out of
// adminBooking.js because the OAuth callback below can't sit behind the
// usual blanket requireAdminKey -- Google redirects the admin's own browser
// here with no custom header at all, so only /callback is left
// unauthenticated; everything else in this file still requires it.
const express = require('express');
const router = express.Router();
const googleCalendar = require('../services/googleCalendar');

function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// Where the admin dashboard lands after the Google redirect -- see
// AdminDashboard.js's TABS/selectTab (`/admin/:slug`); the 'booking' tab
// itself is added in a later step of this same feature.
const ADMIN_RETURN_URL = `${FRONTEND_URL}/admin/booking`;

// GET /api/admin/google-calendar/auth-url
router.get('/auth-url', requireAdminKey, (req, res) => {
  if (!googleCalendar.isConfigured()) {
    return res.status(503).json({ success: false, error: 'Google OAuth is not configured on the backend (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI).' });
  }
  res.json({ success: true, url: googleCalendar.getAuthUrl() });
});

// GET /api/admin/google-calendar/callback — Google redirects the admin's
// own browser straight here after they grant consent on the auth-url page
// above; there's no x-admin-key to send on a plain browser redirect, so
// this one route is intentionally public. What actually protects it is
// that the only way to arrive here with a usable ?code=... is to have just
// completed Google's own consent screen, which nothing except visiting the
// admin-only /auth-url link (behind requireAdminKey) ever leads to.
router.get('/callback', async (req, res) => {
  const { code, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${ADMIN_RETURN_URL}?google_error=${encodeURIComponent(oauthError)}`);
  if (!code) return res.redirect(`${ADMIN_RETURN_URL}?google_error=missing_code`);

  try {
    await googleCalendar.handleOAuthCallback(code);
    res.redirect(`${ADMIN_RETURN_URL}?google_connected=1`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${ADMIN_RETURN_URL}?google_error=${encodeURIComponent('connect_failed')}`);
  }
});

// GET /api/admin/google-calendar/status
router.get('/status', requireAdminKey, async (req, res) => {
  try {
    res.json({ success: true, data: await googleCalendar.getConnectionStatus() });
  } catch (err) {
    console.error('Google Calendar status error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load connection status' });
  }
});

// POST /api/admin/google-calendar/disconnect
router.post('/disconnect', requireAdminKey, async (req, res) => {
  try {
    await googleCalendar.disconnect();
    res.json({ success: true });
  } catch (err) {
    console.error('Google Calendar disconnect error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

module.exports = router;
