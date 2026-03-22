require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const calculateRouter = require('./routes/calculate');
const companyRouter = require('./routes/company');
const authRouter = require('./routes/auth');
const subscriptionRouter = require('./routes/subscription');
const leadsRouter = require('./routes/leads');
const { requireAuth } = require('./middleware/auth');
const { computeSubscriptionStatus } = require('./services/subscriptionStatus');
const { DEFAULT_COMPANY_CONFIG } = require('./config/defaults');
const { getCompanyConfig } = require('./services/companyConfig');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Public CORS — calculator widget is embedded on customer sites
const publicCors = cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'] });
app.use('/api/calculate', publicCors);
app.use('/api/company/:id/public', publicCors);
app.use('/api/leads', publicCors);

// Dashboard CORS — restricted to known origins
const dashboardOrigins = [
  'http://localhost:3000',
  'https://cleanestimator.com',
  'https://www.cleanestimator.com',
  /\.vercel\.app$/,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: dashboardOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting on calculate endpoint
app.use('/api/calculate', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait a moment.' },
}));

// ─── CRITICAL: Stripe webhook MUST be registered before express.json() ────────
app.post('/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionRouter.webhookHandler
);

// Body parsing — after webhook
app.use(express.json({ limit: '10kb' }));

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Public routes ────────────────────────────────────────────────────────────
app.use('/api/calculate', calculateRouter);

// Public company config (for widget) — no auth
app.get('/api/company/:id/public', async (req, res) => {
  try {
    const config = (await getCompanyConfig(req.params.id)) || DEFAULT_COMPANY_CONFIG;
    const sub = computeSubscriptionStatus(config);
    const { companyName, logo, primaryColor, accentColor, fontFamily,
      ctaHeadline, ctaSubtext, ctaButtonText, ctaPhone, ctaButtonUrl,
      serviceStates, frameHeight, borderRadius, services } = config;
    res.json({
      success: true,
      data: {
        companyName, logo, primaryColor, accentColor, fontFamily,
        ctaHeadline, ctaSubtext, ctaButtonText, ctaPhone, ctaButtonUrl,
        serviceStates, frameHeight, borderRadius, services,
        paused: !sub.active,
        trialDaysLeft: sub.daysLeft,
      },
    });
  } catch {
    res.json({ success: true, data: { ...DEFAULT_COMPANY_CONFIG, paused: false } });
  }
});

// Public leads API (API key auth handled inside router)
app.use('/api/leads', leadsRouter);

// ─── Auth-protected routes ────────────────────────────────────────────────────
app.use('/api/company', requireAuth, companyRouter);
app.use('/api/subscription', requireAuth, subscriptionRouter);
app.use('/api/company-leads', requireAuth, leadsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'CleanCalc API', version: '1.0.0' }));

// ─── DB connectivity check ────────────────────────────────────────────────────
app.get('/api/debug/db', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const result = {
    supabase_url_set: !!supabaseUrl,
    service_key_set: !!serviceKey,
    service_key_looks_valid: serviceKey ? serviceKey.startsWith('eyJ') && serviceKey !== '<your service_role key>' : false,
  };
  if (result.service_key_looks_valid) {
    try {
      const axios = require('axios');
      const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
      const r = await axios.get(`${supabaseUrl}/rest/v1/cleaning_company_configs?select=company_id&limit=1`, { headers, timeout: 5000 });
      result.supabase_read = 'ok';
      result.row_count = r.data.length;
    } catch (err) {
      result.supabase_read = 'failed';
      result.supabase_error = err.response?.data || err.message;
    }
  }
  res.json(result);
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CleanCalc API running on port ${PORT}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? 'configured' : 'not configured (file fallback active)'}`);
  console.log(`Stripe: ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'}`);
});

module.exports = app;
