const express = require('express');
const router = express.Router();
const { getCompanyConfig, saveCompanyConfig } = require('../services/companyConfig');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/subscription/status
router.get('/status', async (req, res) => {
  try {
    const config = (await getCompanyConfig(req.user.id)) || {};
    res.json({ success: true, data: computeSubscriptionStatus(config) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get subscription status' });
  }
});

// POST /api/subscription/checkout
router.post('/checkout', async (req, res) => {
  const companyId = req.user.id;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return res.status(500).json({ success: false, error: 'Stripe pricing not configured' });

  try {
    const stripe = getStripe();
    const config = (await getCompanyConfig(companyId)) || {};
    const existingCustomerId = config.subscription?.stripeCustomerId;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId || undefined,
      customer_email: existingCustomerId ? undefined : req.user.email,
      metadata: { companyId },
      success_url: `${FRONTEND_URL}/company?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/company?tab=subscription`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to create checkout session' });
  }
});

// POST /api/subscription/portal
router.post('/portal', async (req, res) => {
  const companyId = req.user.id;
  try {
    const stripe = getStripe();
    const config = (await getCompanyConfig(companyId)) || {};
    const customerId = config.subscription?.stripeCustomerId;
    if (!customerId) return res.status(400).json({ success: false, error: 'No Stripe customer found. Please subscribe first.' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/company?tab=subscription`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to open billing portal' });
  }
});

// POST /api/subscription/verify-checkout — primary activation path
router.post('/verify-checkout', async (req, res) => {
  const companyId = req.user.id;
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });

    if (session.metadata?.companyId !== companyId) {
      return res.status(403).json({ success: false, error: 'Session does not belong to this account' });
    }

    const config = (await getCompanyConfig(companyId)) || {};

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.json({ success: true, data: computeSubscriptionStatus(config) });
    }

    const sub = session.subscription;
    config.subscription = {
      ...(config.subscription || {}),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: sub && typeof sub !== 'string' && sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
    };
    await saveCompanyConfig(companyId, config);
    res.json({ success: true, data: computeSubscriptionStatus(config) });
  } catch (err) {
    console.error('verify-checkout error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to verify checkout session' });
  }
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────

async function findCompanyByCustomer(customerId) {
  const axios = require('axios');
  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_KEY || !SUPABASE_URL) return null;
  try {
    const res = await axios.get(
      `${SUPABASE_URL}/rest/v1/cleaning_company_configs?select=company_id,config`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const row = (res.data || []).find(r => r.config?.subscription?.stripeCustomerId === customerId);
    return row?.company_id || null;
  } catch (err) {
    console.error('findCompanyByCustomer error:', err.message);
    return null;
  }
}

async function handleStripeEvent(event) {
  const stripe = getStripe();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') break;
      const companyId = session.metadata?.companyId;
      if (!companyId) { console.error('Webhook: missing companyId in metadata'); break; }
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['subscription'] });
        const config = (await getCompanyConfig(companyId)) || {};
        const sub = fullSession.subscription;
        config.subscription = {
          ...(config.subscription || {}),
          stripeCustomerId: fullSession.customer,
          stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: sub && typeof sub !== 'string' && sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : (config.subscription?.currentPeriodEnd || null),
        };
        await saveCompanyConfig(companyId, config);
        console.log(`Webhook: activated company ${companyId}`);
      } catch (err) {
        console.error(`Webhook checkout.session.completed failed for company ${companyId}:`, err.message);
        throw err;
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      try {
        const companyId = await findCompanyByCustomer(sub.customer);
        if (!companyId) break;
        const config = (await getCompanyConfig(companyId)) || {};
        config.subscription = {
          ...(config.subscription || {}),
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : (config.subscription?.currentPeriodEnd || null),
          stripeSubscriptionId: sub.id,
        };
        await saveCompanyConfig(companyId, config);
        console.log(`Webhook: subscription updated to "${sub.status}" (cancelAtPeriodEnd: ${sub.cancel_at_period_end}) for company ${companyId}`);
      } catch (err) {
        console.error(`Webhook customer.subscription.updated failed:`, err.message);
        throw err;
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      try {
        const companyId = await findCompanyByCustomer(sub.customer);
        if (!companyId) break;
        const config = (await getCompanyConfig(companyId)) || {};
        config.subscription = { ...(config.subscription || {}), status: 'canceled', stripeSubscriptionId: sub.id };
        await saveCompanyConfig(companyId, config);
        console.log(`Webhook: canceled subscription for company ${companyId}`);
      } catch (err) {
        console.error(`Webhook customer.subscription.deleted failed:`, err.message);
        throw err;
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (!invoice.subscription) break;
      try {
        const companyId = await findCompanyByCustomer(invoice.customer);
        if (!companyId) break;
        const config = (await getCompanyConfig(companyId)) || {};
        config.subscription = { ...(config.subscription || {}), status: 'past_due' };
        await saveCompanyConfig(companyId, config);
        console.log(`Webhook: marked past_due for company ${companyId}`);
      } catch (err) {
        console.error(`Webhook invoice.payment_failed failed:`, err.message);
        throw err;
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
}

async function webhookHandler(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (secret) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err.message);
    res.status(500).send(`Webhook handler failed: ${err.message}`);
  }
}

module.exports = router;
module.exports.computeSubscriptionStatus = computeSubscriptionStatus;
module.exports.webhookHandler = webhookHandler;
