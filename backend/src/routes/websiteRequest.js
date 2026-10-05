const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const {
  sendWebsiteRequestNotificationEmail,
  sendWebsiteSubscriptionConfirmedEmail,
} = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SETUP_FEE_CENTS = 500; // $5
const MONTHLY_PRICE_CENTS = 24900; // $249
const TRIAL_DAYS = 60; // ~2 months free before the first $249 charge

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// POST /api/website-request — the "Get a Done-For-You Website" application
// form (WebsiteSubscription.js). Public, unauthenticated (same as
// /api/calculate) since it's submitted by a prospect, not a logged-in
// company. Persists a row (status: 'submitted') so AdminWebsiteRequests.js
// has something to review and mark sample-ready, in addition to the existing
// internal notification email -- previously the email *was* the only record,
// with no way to track a request through to approval/billing.
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
  // this field, but never send the notification email or save a row.
  if (website2) {
    return res.json({ success: true });
  }

  if (!name || !business || !email) {
    return res.status(400).json({ success: false, error: 'Name, business, and email are required.' });
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('website_requests').insert({
        name, business, email,
        phone: phone || null,
        services_offered: servicesOffered || null,
        other_services: otherServices || null,
        business_address: businessAddress || null,
        service_areas: serviceAreas || null,
        has_domain: !!hasDomain,
        domain1: domain1 || null,
        domain2: domain2 || null,
        domain3: domain3 || null,
        current_website: currentWebsite || null,
        facebook_page: facebookPage || null,
        message: message || null,
      });
      if (error) console.error('website_requests insert failed:', error.message);
    } catch (err) {
      console.error('website_requests insert error:', err.message);
    }
  } else {
    console.warn('Website request not saved: Supabase not configured');
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

// Fields safe to hand to the public approval page -- never the internal
// Stripe customer/session ids or admin_notes.
function toPublicRequest(row) {
  return {
    id: row.id,
    name: row.name,
    business: row.business,
    email: row.email,
    status: row.status,
    sampleUrl: row.sample_url || null,
    createdAt: row.created_at,
    setupFeePaidAt: row.setup_fee_paid_at || null,
    subscriptionStartedAt: row.subscription_started_at || null,
  };
}

// GET /api/website-request/by-token/:token — public, token-gated (this flow
// has no login of its own; the random approval_token IS the auth). Backs
// WebsiteApproval.js.
router.get('/by-token/:token', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: toPublicRequest(data) });
  } catch (err) {
    console.error('website-request by-token error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load request' });
  }
});

// Creates a Stripe Customer for this request the first time it's needed,
// reusing the stored id on every later call (checkout retries, the resume
// path below) instead of creating a duplicate Customer per attempt.
async function getOrCreateCustomer(stripe, sb, request) {
  if (request.stripe_customer_id) return request.stripe_customer_id;
  const customer = await stripe.customers.create({ email: request.email, name: request.business });
  await sb.from('website_requests').update({ stripe_customer_id: customer.id }).eq('id', request.id);
  return customer.id;
}

// Builds the mode='subscription' Checkout Session for the $249/mo price,
// trial_period_days deferring the first real charge ~2 months out. Kept as
// its own function since both /checkout (resume path, setup fee already
// paid) and /verify-setup (fresh approval) need to create this exact
// session.
async function createSubscriptionCheckoutSession(stripe, token, customerId, requestId) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Clean Estimator — Cleaning Website Subscription' },
        unit_amount: MONTHLY_PRICE_CENTS,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    subscription_data: {
      // Stripe bills nothing until this many days have passed -- the "2
      // months free" promised on the pricing page. Day-based (not tied to
      // calendar months) since Checkout Sessions don't support an exact
      // "2 calendar months from now" trial_end here without computing and
      // passing a Unix timestamp instead; 60 days is the same approximation
      // a lot of "N months free" SaaS trials use.
      trial_period_days: TRIAL_DAYS,
      metadata: { type: 'website_request_subscription', requestId },
    },
    success_url: `${FRONTEND_URL}/website-approval/${token}?step=subscribed&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/website-approval/${token}?step=setup_paid`,
    metadata: { type: 'website_request_subscription', requestId },
  });
}

// POST /api/website-request/by-token/:token/checkout — public, token-gated.
// Starts (or resumes) the approval payment flow:
//   - sample_ready, nothing paid yet -> creates the $5 one-time setup-fee
//     Checkout Session.
//   - setup fee already paid but no subscription yet (e.g. the browser
//     closed between the two Stripe redirects) -> skips straight to
//     creating the subscription Checkout Session, so there's one resume
//     path instead of the prospect being stuck.
// Never trusts a client-supplied amount -- both prices are built here from
// the server-side constants above.
router.post('/by-token/:token/checkout', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: request, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });
    if (request.status === 'active') return res.status(400).json({ success: false, error: 'This request is already active.' });
    if (request.status === 'declined') return res.status(400).json({ success: false, error: 'This request was declined.' });
    if (request.status === 'submitted') return res.status(400).json({ success: false, error: 'Your sample isn\'t ready to review yet.' });

    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(stripe, sb, request);

    if (request.setup_fee_paid_at && !request.stripe_subscription_id) {
      const subSession = await createSubscriptionCheckoutSession(stripe, req.params.token, customerId, request.id);
      return res.json({ success: true, url: subSession.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Clean Estimator — Cleaning Website Setup Fee' },
          unit_amount: SETUP_FEE_CENTS,
        },
        quantity: 1,
      }],
      // receipt_email forces Stripe to send its receipt for this specific
      // charge regardless of the account-wide "successful payments" email
      // toggle. description lands directly on that receipt (confirmed via
      // Stripe's own receipts docs -- payment_intent.description is what
      // renders there, separate from the Checkout-page-only product_data
      // description above) -- spelling out the free trial and when the
      // real billing starts so there's no "what's this $5 for" confusion
      // and no surprise when $249 lands in month 3.
      payment_intent_data: {
        receipt_email: request.email,
        description: `Website setup fee — first 2 months free, then $${MONTHLY_PRICE_CENTS / 100}/month starting month 3. Cancel anytime.`,
      },
      success_url: `${FRONTEND_URL}/website-approval/${req.params.token}?step=setup&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/website-approval/${req.params.token}`,
      metadata: { type: 'website_request_setup', requestId: request.id },
    });

    await sb.from('website_requests').update({ stripe_setup_session_id: session.id }).eq('id', request.id);
    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('website-request checkout error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to start checkout. Please try again.' });
  }
});

// Marks the $5 setup fee paid (idempotent -- a retried call, or the webhook
// racing this one, both just re-set the same fields) and returns the
// request row.
async function markSetupPaid(sb, request) {
  if (request.setup_fee_paid_at) return request;
  const { data, error } = await sb
    .from('website_requests')
    .update({ status: 'approved', setup_fee_paid_at: new Date().toISOString() })
    .eq('id', request.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// POST /api/website-request/by-token/:token/verify-setup — called by
// WebsiteApproval.js right after Stripe redirects back from the $5 setup-fee
// Checkout Session. Confirms payment, marks it paid, then immediately
// creates and returns the subscription Checkout Session so the browser can
// continue straight into the trial signup.
router.post('/by-token/:token/verify-setup', async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: request, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.requestId !== request.id) {
      return res.status(403).json({ success: false, error: 'Session does not belong to this request' });
    }
    if (session.payment_status !== 'paid') {
      return res.json({ success: true, data: { paid: false } });
    }

    const updated = await markSetupPaid(sb, request);

    if (updated.stripe_subscription_id) {
      // Already subscribed (a retried call after the full flow already
      // completed) -- nothing left to redirect to.
      return res.json({ success: true, data: { paid: true, subscribed: true } });
    }

    const customerId = await getOrCreateCustomer(stripe, sb, updated);
    const subSession = await createSubscriptionCheckoutSession(stripe, req.params.token, customerId, updated.id);
    res.json({ success: true, data: { paid: true, subscribed: false }, url: subSession.url });
  } catch (err) {
    console.error('website-request verify-setup error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

// Marks the subscription active (idempotent) and fires the confirmation
// email -- shared by verify-subscription (primary path) and the webhook
// (backup, in case the browser closed before that call completed).
async function activateSubscription(sb, request, session) {
  if (request.stripe_subscription_id) return request;

  const sub = session.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  const { data, error } = await sb
    .from('website_requests')
    .update({
      status: 'active',
      stripe_subscription_id: subscriptionId,
      subscription_started_at: new Date().toISOString(),
    })
    .eq('id', request.id)
    .select()
    .single();
  if (error) throw error;

  sendWebsiteSubscriptionConfirmedEmail({
    to: data.email,
    name: data.name,
    business: data.business,
    trialDays: TRIAL_DAYS,
    monthlyPrice: MONTHLY_PRICE_CENTS / 100,
  }).catch(err => console.error('sendWebsiteSubscriptionConfirmedEmail failed:', err.message));

  return data;
}

// POST /api/website-request/by-token/:token/verify-subscription — called by
// WebsiteApproval.js after Stripe redirects back from the subscription
// Checkout Session. Confirms the session completed, activates the request.
router.post('/by-token/:token/verify-subscription', async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: request, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.metadata?.requestId !== request.id) {
      return res.status(403).json({ success: false, error: 'Session does not belong to this request' });
    }
    if (session.status !== 'complete') {
      return res.json({ success: true, data: { active: false } });
    }

    const updated = await activateSubscription(sb, request, session);
    res.json({ success: true, data: { active: true, business: updated.business } });
  } catch (err) {
    console.error('website-request verify-subscription error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to verify subscription' });
  }
});

// ─── Webhook handler (backup path) ─────────────────────────────────────────
// Mirrors partnerCheckout.js's pattern: the verify-* routes above are the
// primary activation path (called right after Stripe redirects the browser
// back), this is only a safety net for the rare case where the tab closes
// before that call completes.

async function handleWebsiteRequestEvent(event) {
  if (event.type !== 'checkout.session.completed') return;
  const session = event.data.object;
  const type = session.metadata?.type;
  const requestId = session.metadata?.requestId;
  if (!requestId || (type !== 'website_request_setup' && type !== 'website_request_subscription')) return;

  const sb = getSupabase();
  if (!sb) return;

  const { data: request } = await sb.from('website_requests').select('*').eq('id', requestId).maybeSingle();
  if (!request) return;

  if (type === 'website_request_setup' && session.payment_status === 'paid') {
    await markSetupPaid(sb, request);
  } else if (type === 'website_request_subscription' && session.status === 'complete') {
    const stripe = getStripe();
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['subscription'] });
    await activateSubscription(sb, request, fullSession);
  }
}

async function webhookHandler(req, res) {
  const secret = process.env.STRIPE_WEBSITE_REQUEST_WEBHOOK_SECRET;
  let event;
  try {
    if (secret) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Website-request webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    await handleWebsiteRequestEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error(`Website-request webhook handler error for ${event.type}:`, err.message);
    res.status(500).send(`Webhook handler failed: ${err.message}`);
  }
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
