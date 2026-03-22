const express = require('express');
const router = express.Router();
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, companyName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ success: false, error: 'Auth service not configured. Use Supabase dashboard to sign up.' });
  }

  try {
    const { data } = await axios.post(
      `${SUPABASE_URL}/auth/v1/signup`,
      { email, password, data: { company_name: companyName || '' } },
      { headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: { user: data.user, session: data.session } });
  } catch (err) {
    const msg = err.response?.data?.msg || err.response?.data?.error_description || 'Signup failed';
    res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ success: false, error: 'Auth service not configured' });
  }

  try {
    const { data } = await axios.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: { user: data.user, session: { access_token: data.access_token, refresh_token: data.refresh_token } } });
  } catch (err) {
    const msg = err.response?.data?.error_description || 'Invalid email or password';
    res.status(401).json({ success: false, error: msg });
  }
});

module.exports = router;
