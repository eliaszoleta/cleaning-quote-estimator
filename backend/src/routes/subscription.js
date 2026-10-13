const express = require('express');
const router = express.Router();
const { getCompanyConfig, saveCompanyConfig, getOrCreateCompanyConfig } = require('../services/companyConfig');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { sendCompanyWelcomeEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail } = require('../services/email');
const { DEFAULT_COMPANY_CONFIG } = require('../config/defaults');

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
    const { config, created } = await getOrCreateCompanyConfig(req.user.id);
    if (created) {
      sendCompanyWelcomeEmail({ to: req.user.email, companyId: req.user.id })
        .catch(err => console.error('Company welcome email failed:', err.message));
    }
    res.json({ success: true, data: computeSubscriptionStatus(config, req.user.email) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get subscription status' });
  }
});

// POST /api/subscription/checkout
router.post('/checkout', async (req, res) => {
  const companyId = req.user.id;

  try {
    const stripe = getStripe();
    let config = await getCompanyConfig(companyId);

    // AuthPage.js now sends a brand-new signup straight here, before the
    // dashboard's own getOrCreateCompanyConfig (GET /api/company/:id) ever
    // runs -- so this is often the very first time this company's row gets
    // created. Seed it with the same defaults + signup profile fields that
    // route would, EXCEPT trialStartedAt: deliberately left unset, since
    // this checkout is about to hand the trial off to Stripe itself (see
    // alreadyHadTrial below) rather than starting the old app-managed,
    // no-card clock for an account that's headed straight into Checkout.
    if (!config) {
      config = {
        ...DEFAULT_COMPANY_CONFIG,
        companyName: req.user.metadata?.company_name || DEFAULT_COMPANY_CONFIG.companyName,
        phone: req.user.metadata?.phone || DEFAULT_COMPANY_CONFIG.phone,
        website: req.user.metadata?.website || DEFAULT_COMPANY_CONFIG.website,
      };
      await saveCompanyConfig(companyId, config);
    }
    const existingCustomerId = config.subscription?.stripeCustomerId;

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ success: false, error: 'Stripe pricing not configured' });

    // A real Stripe-side trial (card collected now, first charge in 30
    // days) only for an account that's never had a trial before in any
    // form -- never started the old app-managed one, and never had a
    // subscription. An account reactivating or upgrading after already
    // using its 30 free days converts to a paid subscription immediately,
    // same as before.
    const alreadyHadTrial = !!(config.subscription?.trialStartedAt || config.subscription?.stripeSubscriptionId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId || undefined,
      customer_email: existingCustomerId ? undefined : req.user.email,
      metadata: { companyId },
      ...(alreadyHadTrial ? {} : { subscription_data: { trial_period_days: 30 } }),
      success_url: `${FRONTEND_URL}/company?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/company?tab=subscription`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create checkout session. Please try again.' });
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
      return res.json({ success: true, data: computeSubscriptionStatus(config, req.user.email) });
    }

    const sub = session.subscription;
    const subObj = sub && typeof sub !== 'string' ? sub : null;
    config.subscription = {
      ...(config.subscription || {}),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
      status: subObj?.status || 'active',
      cancelAtPeriodEnd: subObj?.cancel_at_period_end || false,
      currentPeriodEnd: subObj?.current_period_end
        ? new Date(subObj.current_period_end * 1000).toISOString()
        : null,
    };
    await saveCompanyConfig(companyId, config);
    res.json({ success: true, data: computeSubscriptionStatus(config, req.user.email) });
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

// Same pattern as calculate.js/trialScheduler.js's own copy of this --
// Supabase auth user lookup, not stored on the company config itself.
async function getOwnerEmail(companyId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.admin.getUserById(companyId);
    if (error) return null;
    return data?.user?.email || null;
  } catch (err) {
    console.warn('subscription.js: getOwnerEmail failed:', err.message);
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
        const subObj = sub && typeof sub !== 'string' ? sub : null;
        config.subscription = {
          ...(config.subscription || {}),
          stripeCustomerId: fullSession.customer,
          stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
          status: subObj?.status || 'active',
          cancelAtPeriodEnd: subObj?.cancel_at_period_end || false,
          currentPeriodEnd: subObj?.current_period_end
            ? new Date(subObj.current_period_end * 1000).toISOString()
            : (config.subscription?.currentPeriodEnd || null),
        };
        await saveCompanyConfig(companyId, config);
        console.log(`Webhook: activated company ${companyId}`);

        // The dashboard's own "first load ever" welcome-email check
        // (getOrCreateCompanyConfig's `created` flag) never fires for these
        // accounts anymore -- AuthPage.js now sends a brand-new signup
        // straight to POST /checkout, which creates this company's row
        // itself before the dashboard ever loads, so by the time the user
        // lands back here post-Checkout the row already exists and looks
        // like it was never "just created". This webhook is the first point
        // that reliably knows checkout actually succeeded, so send it from
        // here instead. Deduped via welcomeEmailSentAt -- webhook deliveries
        // can repeat.
        if (!config.subscription.welcomeEmailSentAt) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            const sent = await sendCompanyWelcomeEmail({ to: email, companyId });
            if (sent) {
              const fresh = (await getCompanyConfig(companyId)) || config;
              await saveCompanyConfig(companyId, {
                ...fresh,
                subscription: { ...fresh.subscription, welcomeEmailSentAt: new Date().toISOString() },
              });
            }
          }
        }
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

        // Deduped via cancellationEmailSentAt -- webhook deliveries can repeat.
        if (!config.subscription.cancellationEmailSentAt) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            const sent = await sendSubscriptionCanceledEmail({ to: email, companyName: config.companyName || 'there' });
            if (sent) {
              const fresh = (await getCompanyConfig(companyId)) || config;
              await saveCompanyConfig(companyId, {
                ...fresh,
                subscription: { ...fresh.subscription, cancellationEmailSentAt: new Date().toISOString() },
              });
            }
          }
        }
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

        // Deduped by invoice id, not a one-time flag -- Stripe's own retry
        // schedule fires this same webhook multiple times for the SAME
        // invoice (shouldn't re-send each time), but a genuinely new failed
        // invoice next billing cycle has a different id and should.
        if (config.subscription.lastPaymentFailedInvoiceId !== invoice.id) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            const sent = await sendPaymentFailedEmail({ to: email, companyName: config.companyName || 'there' });
            if (sent) {
              const fresh = (await getCompanyConfig(companyId)) || config;
              await saveCompanyConfig(companyId, {
                ...fresh,
                subscription: { ...fresh.subscription, lastPaymentFailedInvoiceId: invoice.id },
              });
            }
          }
        }
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
