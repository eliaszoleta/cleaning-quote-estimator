const express = require('express');
const router = express.Router();
const { getCompanyConfig, saveCompanyConfig, patchCompanyConfig, getOrCreateCompanyConfig } = require('../services/companyConfig');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { sendCompanyWelcomeEmail, sendSubscriptionReactivatedEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail } = require('../services/email');
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
    // Seed matches company.js's GET /:id exactly (companyName/phone/website
    // from the signup metadata, email from the Auth user itself) -- these
    // two routes both hit
    // getOrCreateCompanyConfig on a brand-new account's very first dashboard
    // load, in parallel, with no ordering guarantee (see the comment on
    // getOrCreateCompanyConfig itself). Each one still does its own
    // build-and-save even when it loses the "who creates it" race, so
    // whichever upsert lands second overwrites the first -- this used to
    // leave a real typed-in company name clobbered by a blank one whenever
    // this route's unseeded write landed after company.js's seeded write.
    // Passing the identical seed here makes the two racing writes produce
    // the same content regardless of order, closing that window.
    const { config } = await getOrCreateCompanyConfig(req.user.id, {
      companyName: req.user.metadata?.company_name,
      phone: req.user.metadata?.phone,
      website: req.user.metadata?.website,
      email: req.user.email,
    });
    // Deliberately does NOT send the welcome email here -- see the matching
    // comment in company.js's GET /:id. This route's own `created` flag
    // only means "the row didn't exist before this call", not "Stripe
    // Checkout was completed"; the webhook's checkout.session.completed
    // handler below is the only place that fires this email now.
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
    const existingSubscriptionId = config.subscription?.stripeSubscriptionId;

    // Guard against creating a SECOND real Stripe subscription for an
    // account that already has one genuinely in force. Real incident (Oct
    // 2026, coinciding with a Railway infra outage that made our own
    // endpoints flaky): a visitor's first Checkout completed fine and
    // created a real 'trialing' subscription, but something -- a slow/
    // failed response, a reload, a second click, all more likely during
    // exactly that kind of outage -- sent them through Checkout a SECOND
    // time. The three-case trial logic below correctly withheld a second
    // trial (stripeSubscriptionId was already set), but nothing stopped a
    // second Checkout Session -- and therefore a second real Stripe
    // Subscription object -- from being created at all. That second one's
    // immediate, no-trial charge failed and landed as 'incomplete', and its
    // own failed invoice stamped the WHOLE account 'past_due' even though
    // the real (first) subscription was still healthy -- see the matching
    // subscriptionId-mismatch guard in the webhook handlers below for that
    // half of the fix. Deliberately asks Stripe directly rather than
    // trusting config.subscription.status: that cached value is exactly
    // what this incident corrupted, so it's not a trustworthy source of
    // truth for a decision this consequential.
    if (existingSubscriptionId) {
      try {
        const existingSub = await stripe.subscriptions.retrieve(existingSubscriptionId);
        if (existingSub.status === 'trialing' || existingSub.status === 'active') {
          return res.status(409).json({ success: false, error: 'You already have an active subscription. Refresh the page, and contact support if this seems wrong.' });
        }
      } catch (err) {
        // Subscription on file was deleted/inaccessible -- fall through and
        // let a new Checkout Session proceed, same as if none had ever
        // been set.
        console.warn(`Checkout: couldn't verify existing subscription ${existingSubscriptionId} for company ${companyId}:`, err.message);
      }
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ success: false, error: 'Stripe pricing not configured' });

    // Three cases for how much (if any) Stripe trial this Checkout session
    // should carry:
    // 1. Already has/had a real Stripe subscription -- resubscribing after
    //    cancellation or clearing a past-due card. No new trial; charge
    //    immediately, same as before.
    // 2. Legacy no-card trial (trialStartedAt set, never touched Stripe) --
    //    adding a card now shouldn't forfeit whatever real free days are
    //    still left, nor grant extra ones beyond that. If those days have
    //    already run out, this collapses to the same "charge immediately"
    //    behavior as case 1 -- UNLESS winbackTrialEligible was explicitly
    //    set (see below), which grants a genuine fresh 30 days instead.
    // 3. Brand new account, no trial ever started -- the full 30-day trial.
    let trialPeriodDays = null;
    if (!config.subscription?.stripeSubscriptionId) {
      if (config.subscription?.trialStartedAt) {
        const daysElapsed = (Date.now() - new Date(config.subscription.trialStartedAt).getTime()) / (1000 * 60 * 60 * 24);
        const daysLeft = Math.ceil(30 - daysElapsed);
        if (daysLeft > 0) trialPeriodDays = daysLeft;
        // winbackTrialEligible: set only by the admin's explicit "grant a
        // fresh trial" action on the Email Marketing tab (see
        // emailMarketing.js's POST /companies/grant-legacy-winback-trial),
        // scoped to a specific win-back campaign -- never set automatically.
        // Exists because this account's real legacy trial is fully spent
        // (daysLeft <= 0 above), but the win-back email promises "a new
        // 30-day trial," which must actually be true when they click
        // through, not just marketing copy. Doesn't reset itself after use;
        // once this account has a stripeSubscriptionId the outer `if` above
        // stops this whole block from running again, so there's no way to
        // re-use it for a second free trial by canceling and resubscribing.
        else if (config.subscription?.winbackTrialEligible) trialPeriodDays = 30;
      } else {
        trialPeriodDays = 30;
      }
    }

    // Stripe Checkout's own bordered "Due today" price-breakdown box (the
    // one a coupon/promotion with a scheduled price change gets) isn't
    // something the Checkout Session API can turn on for a plain trial --
    // that layout is Stripe's own, triggered by a multi-phase discount, not
    // a configurable option. custom_text.submit.message is the one thing we
    // DO control: it renders directly above the pay button on Stripe's
    // hosted page, and is the clearest way available to spell out "$0.00
    // due today" next to the button someone's about to click, rather than
    // leaving it implied by the trial-days copy above the form.
    const trialEndDateLabel = trialPeriodDays
      ? new Date(Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId || undefined,
      customer_email: existingCustomerId ? undefined : req.user.email,
      metadata: { companyId },
      ...(trialPeriodDays ? {
        subscription_data: { trial_period_days: trialPeriodDays },
        custom_text: {
          submit: { message: `**$0.00 due today.** Your ${trialPeriodDays}-day free trial starts now -- you won't be charged until ${trialEndDateLabel}.` },
        },
      } : {}),
      success_url: `${FRONTEND_URL}/company?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/company?tab=settings&section=subscription`,
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
      return_url: `${FRONTEND_URL}/company?tab=settings&section=subscription`,
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
    const updatedConfig = await patchCompanyConfig(companyId, {
      subscription: {
        ...(config.subscription || {}),
        stripeCustomerId: session.customer,
        stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
        status: subObj?.status || 'active',
        cancelAtPeriodEnd: subObj?.cancel_at_period_end || false,
        currentPeriodEnd: subObj?.current_period_end
          ? new Date(subObj.current_period_end * 1000).toISOString()
          : null,
      },
    });
    res.json({ success: true, data: computeSubscriptionStatus(updatedConfig, req.user.email) });
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

// True when a webhook event is about a DIFFERENT Stripe subscription than
// the one this company's config currently considers its real, current
// subscription -- a stray/duplicate/abandoned subscription object (see
// POST /checkout's own comment on the Oct 2026 incident this guards
// against) whose own lifecycle events -- a failed invoice, Stripe
// auto-expiring an unpaid 'incomplete' subscription after ~23 hours, etc.
// -- must never be allowed to overwrite the status of a company's real,
// currently-active subscription just because it happens to share the same
// customer. An unset stripeSubscriptionId on file means "no current
// subscription yet" and lets any event through unguarded, same as before
// this check existed -- it only ever suppresses a MISMATCH against an
// already-known-good id, never a first-time one.
function isStaleSubscriptionEvent(config, subscriptionId) {
  const current = config.subscription?.stripeSubscriptionId;
  return !!current && !!subscriptionId && current !== subscriptionId;
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
        // Captured before the overwrite below -- this is what tells a true
        // win-back reactivation (was 'canceled', now completing checkout
        // again) apart from a brand-new signup for the welcome-email logic
        // further down.
        const wasCanceled = config.subscription?.status === 'canceled';
        const updatedConfig = await patchCompanyConfig(companyId, {
          subscription: {
            ...(config.subscription || {}),
            stripeCustomerId: fullSession.customer,
            stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
            status: subObj?.status || 'active',
            cancelAtPeriodEnd: subObj?.cancel_at_period_end || false,
            currentPeriodEnd: subObj?.current_period_end
              ? new Date(subObj.current_period_end * 1000).toISOString()
              : (config.subscription?.currentPeriodEnd || null),
          },
        });
        console.log(`Webhook: activated company ${companyId}`);

        // The dashboard's own "first load ever" welcome-email check
        // (getOrCreateCompanyConfig's `created` flag) never fires for these
        // accounts anymore -- AuthPage.js now sends a brand-new signup
        // straight to POST /checkout, which creates this company's row
        // itself before the dashboard ever loads, so by the time the user
        // lands back here post-Checkout the row already exists and looks
        // like it was never "just created". This webhook is the first point
        // that reliably knows checkout actually succeeded, so send it from
        // here instead. Deduped via welcomeEmailSentAt for a first-ever
        // signup -- but that flag is already set forever once a company's
        // very first checkout succeeds, which used to silently swallow any
        // confirmation on a LATER win-back reactivation (cancel, then
        // resubscribe months later): welcomeEmailSentAt being "already set"
        // isn't actually "already told them about THIS checkout". wasCanceled
        // (captured above, before this event overwrote subscription.status)
        // bypasses that dedup specifically for a true reactivation, since
        // each cancel-then-resubscribe cycle is its own event worth a
        // confirmation, same reasoning as payment_failed's per-invoice dedup.
        if (!updatedConfig.subscription.welcomeEmailSentAt || wasCanceled) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            // A true win-back (previously canceled, now resubscribing) gets
            // its own short, separate email (sendSubscriptionReactivatedEmail
            // -- see email.js) instead of the full first-day onboarding
            // content in company_welcome: a returning customer already knows
            // what Calculator Mode is and already has their embed code, so
            // re-explaining both every time they resubscribe is noise, not
            // help. Brand-new trial and immediate-active brand-new-account
            // cases still go through company_welcome as before.
            const sent = wasCanceled
              ? await sendSubscriptionReactivatedEmail({ to: email, companyName: updatedConfig.companyName })
              : await sendCompanyWelcomeEmail({
                  to: email,
                  companyId,
                  statusLine: subObj?.status === 'trialing' ? undefined : "Your account is now active and ready to use.",
                });
            if (sent) {
              await patchCompanyConfig(companyId, {
                subscription: { ...updatedConfig.subscription, welcomeEmailSentAt: new Date().toISOString() },
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
        if (isStaleSubscriptionEvent(config, sub.id)) {
          console.log(`Webhook: ignoring customer.subscription.updated for ${sub.id} -- company ${companyId}'s current subscription is ${config.subscription.stripeSubscriptionId}`);
          break;
        }
        await patchCompanyConfig(companyId, {
          subscription: {
            ...(config.subscription || {}),
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : (config.subscription?.currentPeriodEnd || null),
            stripeSubscriptionId: sub.id,
          },
        });
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
        if (isStaleSubscriptionEvent(config, sub.id)) {
          // E.g. Stripe auto-expiring a stray, never-paid 'incomplete'
          // subscription (the duplicate-checkout failure mode above) --
          // must NOT cancel this company's real, current subscription or
          // send them a "your subscription has been canceled" email for a
          // subscription they never actually had running.
          console.log(`Webhook: ignoring customer.subscription.deleted for ${sub.id} -- company ${companyId}'s current subscription is ${config.subscription.stripeSubscriptionId}`);
          break;
        }
        const updatedConfig = await patchCompanyConfig(companyId, {
          subscription: { ...(config.subscription || {}), status: 'canceled', stripeSubscriptionId: sub.id },
        });
        console.log(`Webhook: canceled subscription for company ${companyId}`);

        // Deduped via cancellationEmailSentAt -- webhook deliveries can repeat.
        if (!updatedConfig.subscription.cancellationEmailSentAt) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            const sent = await sendSubscriptionCanceledEmail({ to: email, companyName: updatedConfig.companyName || 'there' });
            if (sent) {
              await patchCompanyConfig(companyId, {
                subscription: { ...updatedConfig.subscription, cancellationEmailSentAt: new Date().toISOString() },
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
        if (isStaleSubscriptionEvent(config, invoice.subscription)) {
          // This is the exact failure mode from the Oct 2026 incident: a
          // stray duplicate subscription's own no-trial charge fails, and
          // without this check its invoice.payment_failed would stamp
          // 'past_due' onto the WHOLE company even though their real
          // subscription (a different id) was never actually unpaid.
          console.log(`Webhook: ignoring invoice.payment_failed for subscription ${invoice.subscription} -- company ${companyId}'s current subscription is ${config.subscription.stripeSubscriptionId}`);
          break;
        }
        const updatedConfig = await patchCompanyConfig(companyId, {
          subscription: { ...(config.subscription || {}), status: 'past_due' },
        });
        console.log(`Webhook: marked past_due for company ${companyId}`);

        // Deduped by invoice id, not a one-time flag -- Stripe's own retry
        // schedule fires this same webhook multiple times for the SAME
        // invoice (shouldn't re-send each time), but a genuinely new failed
        // invoice next billing cycle has a different id and should.
        if (updatedConfig.subscription.lastPaymentFailedInvoiceId !== invoice.id) {
          const email = await getOwnerEmail(companyId);
          if (email) {
            const sent = await sendPaymentFailedEmail({ to: email, companyName: updatedConfig.companyName || 'there' });
            if (sent) {
              await patchCompanyConfig(companyId, {
                subscription: { ...updatedConfig.subscription, lastPaymentFailedInvoiceId: invoice.id },
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
