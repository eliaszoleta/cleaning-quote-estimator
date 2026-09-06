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
const adminRouter = require('./routes/admin');
const { requireAuth } = require('./middleware/auth');
const { checkTrialReminders } = require('./services/trialScheduler');

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
  // x-admin-key is a custom header (AdminCompanies.js), so the browser
  // sends a CORS preflight before the real request -- without it listed
  // here, the preflight response doesn't allow it and the browser blocks
  // the actual request client-side before it ever reaches admin.js, surfacing
  // only as a generic "Failed to fetch" with nothing useful in the response.
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
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

// Public leads API (API key auth handled inside router)
app.use('/api/leads', leadsRouter);

// Public partner-checkout API — anonymous prospects on /buy-city-placement
// aren't logged-in company users, so this can't sit behind requireAuth.
app.use('/api/partner-checkout', partnerCheckoutRouter);

// ─── Auth-protected routes ────────────────────────────────────────────────────
// requireAuth is applied per-route inside companyRouter, not blanket here --
// GET /:id/public must stay reachable without auth (it's what the embedded
// widget on a visitor's browser calls). A prior version of this file had a
// second, standalone /api/company/:id/public route registered above,
// specifically to dodge a blanket requireAuth here -- since Express matches
// routes in registration order, that older route silently shadowed every
// update made to company.js's own /public handler (serviceCities support,
// Cache-Control) for as long as both existed. Removed the duplicate;
// company.js is now the single source of truth for this path.
app.use('/api/company', companyRouter);
app.use('/api/subscription', requireAuth, subscriptionRouter);
app.use('/api/company-leads', requireAuth, leadsRouter);

// ─── Internal admin routes ───────────────────────────────────────────────────
// Own auth (x-admin-key header, see requireAdminKey in admin.js), not
// requireAuth -- this isn't a subscriber viewing their own account, it's the
// platform owner viewing every subscriber's account, so the usual
// req.user.id === :id ownership check doesn't apply here at all.
app.use('/api/admin', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait a moment.' },
}), adminRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
// Includes the exact commit this process was built from (RAILWAY_GIT_COMMIT_SHA
// is auto-injected by Railway on every deploy) -- a way to check what code is
// ACTUALLY running on a given domain/service without having to interpret
// Railway's dashboard, which can show a deployment as "successful" without
// that necessarily being the one currently serving traffic.
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'CleanCalc API',
  version: '1.0.0',
  commit: process.env.RAILWAY_GIT_COMMIT_SHA || null,
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
}));

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

  // No cron infrastructure in this app (no Railway cron service, no
  // node-cron dependency) -- this is a single always-on Railway service
  // (railway.toml), so a plain setInterval is enough to keep the 30-day
  // trial reminder emails going out on time without adding a new
  // dependency or requiring a separate scheduled service to be configured.
  checkTrialReminders().catch(err => console.error('checkTrialReminders (startup run) failed:', err.message));
  setInterval(() => {
    checkTrialReminders().catch(err => console.error('checkTrialReminders failed:', err.message));
  }, 60 * 60 * 1000);
});

module.exports = app;
