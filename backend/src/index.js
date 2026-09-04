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
const partnerCheckoutRouter = require('./routes/partnerCheckout');
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

// Rate limiting on the public partner-checkout endpoints (unauthenticated,
// creates real Stripe sessions) — generous enough for a real buyer retrying
// a typo, tight enough to blunt scripted abuse.
app.use('/api/partner-checkout', rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait a moment.' },
}));

// ─── CRITICAL: Stripe webhook MUST be registered before express.json() ────────
app.post('/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionRouter.webhookHandler
);
app.post('/api/partner-checkout/webhook',
  express.raw({ type: 'application/json' }),
  partnerCheckoutRouter.webhookHandler
);

// Logo uploads carry a base64-encoded image, well over the 10kb default
// below — register a larger-limit parser for just this path first (the
// body-parser guard skips re-parsing a body it's already parsed, same
// trick the webhook route above relies on).
app.use('/api/partner-checkout/upload-logo', express.json({ limit: '5mb' }));

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

// Public partner-checkout API — anonymous prospects on /buy-city-placement
// aren't logged-in company users, so this can't sit behind requireAuth.
app.use('/api/partner-checkout', partnerCheckoutRouter);

// ─── Auth-protected routes ────────────────────────────────────────────────────
app.use('/api/company', requireAuth, companyRouter);
app.use('/api/subscription', requireAuth, subscriptionRouter);
app.use('/api/company-leads', requireAuth, leadsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'CleanCalc API', version: '1.0.0' }));

// ─── DB connectivity check ────────────────────────────────────────────────────
app.get('/api/debug/db', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const result = {
    supabase_url_set: !!supabaseUrl,
    service_key_set: !!serviceKey,
    service_key_looks_valid: serviceKey ? serviceKey.startsWith('eyJ') : false,
  };
  if (supabaseUrl && serviceKey) {
    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    // Test read
    try {
      const { data, error } = await sb.from('cleaning_company_configs').select('company_id').limit(3);
      if (error) { result.read = 'error'; result.read_error = error.message; }
      else { result.read = 'ok'; result.row_count = data.length; }
    } catch (e) { result.read = 'exception'; result.read_error = e.message; }
    // Test write (upsert a canary row, then delete it)
    const testId = '__debug_test__';
    try {
      const { error: we } = await sb.from('cleaning_company_configs')
        .upsert({ company_id: testId, config: { test: true }, updated_at: new Date().toISOString() }, { onConflict: 'company_id' });
      if (we) { result.write = 'error'; result.write_error = we.message; }
      else {
        result.write = 'ok';
        await sb.from('cleaning_company_configs').delete().eq('company_id', testId);
        result.cleanup = 'ok';
      }
    } catch (e) { result.write = 'exception'; result.write_error = e.message; }
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
