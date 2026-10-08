const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { sendWebsiteRequestNotificationEmail, sendWebsiteRequestReceivedEmail } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SETUP_FEE_CENTS = 500; // $5
const MONTHLY_PRICE_CENTS = 24900; // $249 -- quoted in the $5 receipt's description only; the actual $249/mo trial subscription itself is created manually by an admin in Stripe (see routes/admin.js)

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
// has something to review and mark sample-ready, in addition to the
// internal notification email and a "we got your request" confirmation
// sent to the applicant themselves -- previously the internal email *was*
// the only record, with no way to track a request through to
// approval/billing, and no confirmation ever reached the applicant at all.
// This is the ONLY place sendWebsiteRequestReceivedEmail is called from --
// see POST /api/admin/website-requests for the admin's own manual-add path,
// which deliberately skips both this and the internal notification.
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
  // this field, but never send any email or save a row.
  if (website2) {
    return res.json({ success: true });
  }

  if (!name || !business || !email || !phone || !businessAddress || !serviceAreas) {
    return res.status(400).json({ success: false, error: 'Name, business, email, phone, business address, and service areas are required.' });
  }
  if (!currentWebsite && !facebookPage) {
    return res.status(400).json({ success: false, error: 'Please provide your current website or Facebook page/profile.' });
  }

  let saved = false;
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
      else saved = true;
    } catch (err) {
      console.error('website_requests insert error:', err.message);
    }
  } else {
    console.warn('Website request not saved: Supabase not configured');
  }

  // Only confirm receipt to the applicant once there's actually a row for
  // an admin to act on -- otherwise "no action needed, we're building your
  // sample" would be a promise nothing can follow through on.
  if (saved) {
    sendWebsiteRequestReceivedEmail({ to: email, name, business }).catch(err => console.error('sendWebsiteRequestReceivedEmail failed:', err.message));
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

// Marks the $5 setup fee paid (idempotent -- a retried call, or the webhook
// racing this one, both just re-set the same fields) and returns the
// request row. Deliberately sends no email of its own: the Checkout
// Session's receipt_email (see /checkout below) already makes Stripe send
// its own receipt the moment the charge clears. The "2 months free, billed
// month 3" confirmation is a separate, later email sent once an admin
// actually links the $249/mo subscription (see PATCH
// /api/admin/website-requests/:id) -- sending it here, before that
// subscription exists, would describe a trial that isn't real yet.
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

// POST /api/website-request/by-token/:token/checkout — public, token-gated.
// Creates a mode='payment' Checkout Session that charges the $5 setup fee
// directly on Stripe's own hosted page (shows the line item/price like any
// normal checkout, and handles any 3D Secure challenge inline before ever
// redirecting back here -- no custom confirmation step needed on our side).
// payment_intent_data.setup_future_usage also saves the card to the
// customer, since an admin still needs it to create each client's $249/mo
// trial subscription by hand in the Stripe Dashboard once they've paid (see
// PATCH /api/admin/website-requests/:id's stripe_subscription_id handling)
// -- this route has nothing left to do once the fee is already paid, which
// is a terminal state from the customer's side.
// Never trusts a client-supplied amount -- the price is built from the
// server-side constant above.
router.post('/by-token/:token/checkout', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: request, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });
    if (request.status === 'active') return res.status(400).json({ success: false, error: 'This request is already active.' });
    if (request.status === 'declined' || request.status === 'canceled') {
      return res.status(400).json({ success: false, error: 'This request is closed.' });
    }
    if (request.status === 'submitted') return res.status(400).json({ success: false, error: 'Your sample isn\'t ready to review yet.' });
    if (request.setup_fee_paid_at) return res.status(400).json({ success: false, error: 'Your setup fee is already paid.' });

    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(stripe, sb, request);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: SETUP_FEE_CENTS,
          product_data: {
            name: 'Clean Estimator — Cleaning Website Setup Fee',
            description: `First 2 months free, then $${MONTHLY_PRICE_CENTS / 100}/month starting month 3. Cancel anytime.`,
          },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        receipt_email: request.email,
        description: `Website setup fee — first 2 months free, then $${MONTHLY_PRICE_CENTS / 100}/month starting month 3. Cancel anytime.`,
        setup_future_usage: 'off_session',
        metadata: { type: 'website_request_setup', requestId: request.id },
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

// POST /api/website-request/by-token/:token/verify-setup — called by
// WebsiteApproval.js right after Stripe redirects back from the Checkout
// Session above. The $5 charge (and any 3D Secure challenge) is already
// fully resolved by Stripe's own hosted page by the time this ever runs --
// this just confirms the session actually paid before marking the request
// approved, and points the customer's default payment method at the card
// that was just saved, ready for an admin to use when creating the $249/mo
// subscription later.
router.post('/by-token/:token/verify-setup', async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: request, error } = await sb.from('website_requests').select('*').eq('approval_token', req.params.token).maybeSingle();
    if (error) throw error;
    if (!request) return res.status(404).json({ success: false, error: 'Not found' });

    // Already fully done -- a retried/duplicate call after the first one
    // already finished the whole flow.
    if (request.setup_fee_paid_at) {
      return res.json({ success: true, data: { approved: true } });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    if (session.metadata?.requestId !== request.id) {
      return res.status(403).json({ success: false, error: 'Session does not belong to this request' });
    }
    if (session.payment_status !== 'paid') {
      return res.json({ success: true, data: { ready: false } });
    }

    const paymentMethodId = session.payment_intent?.payment_method;
    if (paymentMethodId) {
      await stripe.customers.update(request.stripe_customer_id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    await markSetupPaid(sb, request);
    res.json({ success: true, data: { approved: true } });
  } catch (err) {
    console.error('website-request verify-setup error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

// ─── Webhook handler (backup path) ─────────────────────────────────────────
// verify-setup above is the primary path -- called synchronously right
// after Stripe redirects the browser back from its hosted Checkout page.
// This only covers the rare case where Stripe's charge succeeded but that
// response never reached the browser (tab closed, network drop): it marks
// the $5 fee paid directly (there's no further step on this end for the
// customer to resume into), but deliberately does NOT try to create the
// subscription itself -- that's a manual Stripe Dashboard step for an admin
// to do anyway, so a webhook-only recovery here is logged loudly for a
// human to double-check instead of guessed at silently.
async function handleWebsiteRequestEvent(event) {
  if (event.type !== 'payment_intent.succeeded') return;
  const paymentIntent = event.data.object;
  if (paymentIntent.metadata?.type !== 'website_request_setup') return;
  const requestId = paymentIntent.metadata?.requestId;
  if (!requestId) return;

  const sb = getSupabase();
  if (!sb) return;

  const { data: request } = await sb.from('website_requests').select('*').eq('id', requestId).maybeSingle();
  if (!request || request.setup_fee_paid_at) return;

  await markSetupPaid(sb, request);
  console.warn(`Website-request webhook: marked setup fee paid for ${requestId} as a backup -- confirm the subscription also got created (MANUAL FOLLOW-UP if stripe_subscription_id is still null on that row).`);
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
