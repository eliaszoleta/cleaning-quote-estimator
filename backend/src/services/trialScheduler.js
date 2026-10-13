const { listAllCompanyConfigs, listAllCompanyConfigsWithOwnerInfo, getCompanyConfig, saveCompanyConfig } = require('./companyConfig');
const { sendTrialCheckin1Email, sendActivationReminderEmail } = require('./email');
const { computeSubscriptionStatus } = require('./subscriptionStatus');

const TRIAL_DAYS = 30;
const ACTIVATION_REMINDER_DELAY_HOURS = 12;

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getOwnerEmail(companyId) {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(companyId);
    if (error) return null;
    return data?.user?.email || null;
  } catch (err) {
    console.warn('trialScheduler: getOwnerEmail failed:', err.message);
    return null;
  }
}

// Checks every company's free-trial state and sends the single day-7
// check-in exactly once per company (deduped via trialCheckin1EmailSentAt
// on config.subscription). The day-14/21 check-ins, the day-28 "ending
// soon" reminder, the legacy "trial ended / widget paused" email, and the
// "trial converted to paid" confirmation were all dropped -- with a card
// required up front, "subscribe before it ends" nagging doesn't apply
// anymore; payment_failed and subscription_canceled (subscription.js's
// webhook handlers) cover the cases that actually need a reply.
//
// Two trial models coexist here:
// - Current accounts: a real Stripe-managed trial (card collected at
//   signup, see subscription.js's POST /checkout). sub.currentPeriodEnd is
//   the trial end date Stripe itself is tracking, so daysElapsed is derived
//   from that instead of a locally-tracked start date.
// - Legacy accounts: the old no-card trial (trialStartedAt set, never
//   touched Stripe) that predates the Checkout-based signup flow. Same
//   day-7 check-in, just measured from trialStartedAt instead.
//
// No cron infrastructure exists in this app (no Railway cron service, no
// node-cron dependency) -- this runs on a plain setInterval from
// index.js instead, since the backend is a single always-on Railway
// service (see railway.toml), not serverless. Safe to call repeatedly;
// the sent-at flag means it only ever actually sends once per company.
async function checkTrialReminders() {
  let rows;
  try {
    rows = await listAllCompanyConfigs();
  } catch (err) {
    console.error('checkTrialReminders: failed to list company configs:', err.message);
    return;
  }

  for (const { companyId, config } of rows) {
    const sub = config?.subscription || {};
    const companyName = config.companyName || 'there';

    const isLegacyTrial = !!sub.trialStartedAt && !sub.stripeSubscriptionId;
    const isStripeTrial = !!sub.stripeSubscriptionId && sub.status === 'trialing' && !!sub.currentPeriodEnd;
    if (!isLegacyTrial && !isStripeTrial) continue;
    if (sub.trialCheckin1EmailSentAt) continue;

    const daysElapsed = isLegacyTrial
      ? (Date.now() - new Date(sub.trialStartedAt).getTime()) / (1000 * 60 * 60 * 24)
      : TRIAL_DAYS - Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - Date.now()) / (1000 * 60 * 60 * 24)));
    // Upper bound keeps a long-stale legacy trial (already past its 30
    // days, no card to charge, quietly never converted) from getting a
    // "how's week 1 going?" email months late.
    if (daysElapsed < 7 || daysElapsed > TRIAL_DAYS) continue;

    try {
      const email = await getOwnerEmail(companyId);
      if (!email) continue;
      if (await sendTrialCheckin1Email({ to: email, companyName })) {
        const fresh = (await getCompanyConfig(companyId)) || config;
        await saveCompanyConfig(companyId, {
          ...fresh,
          subscription: { ...fresh.subscription, trialCheckin1EmailSentAt: new Date().toISOString() },
        });
      }
    } catch (err) {
      console.error(`checkTrialReminders: failed for company ${companyId}:`, err.message);
    }
  }
}

// Checks every company still sitting at status 'requires_trial_setup' --
// signed up, but never finished Stripe Checkout, so no trial ever actually
// started (shows up in the admin Companies list as "Not started"). Sends
// one nudge email ~12 hours after signup if they're still in that state,
// deduped via activationReminderEmailSentAt on config.subscription so it
// only ever goes out once per company, same pattern as checkTrialReminders
// above. Needs each account's signup timestamp (nothing in config itself
// records when an incomplete signup happened), hence the separate
// owner-info-joined list rather than listAllCompanyConfigs.
async function checkActivationReminders() {
  let rows;
  try {
    rows = await listAllCompanyConfigsWithOwnerInfo();
  } catch (err) {
    console.error('checkActivationReminders: failed to list company configs:', err.message);
    return;
  }

  const cutoff = Date.now() - ACTIVATION_REMINDER_DELAY_HOURS * 60 * 60 * 1000;

  for (const { companyId, config, email, signedUpAt } of rows) {
    const sub = config?.subscription || {};
    if (sub.activationReminderEmailSentAt) continue;
    if (!email || !signedUpAt) continue;
    if (computeSubscriptionStatus(config, email).status !== 'requires_trial_setup') continue;
    if (new Date(signedUpAt).getTime() > cutoff) continue;

    try {
      const companyName = config.companyName || 'there';
      if (await sendActivationReminderEmail({ to: email, companyName })) {
        const fresh = (await getCompanyConfig(companyId)) || config;
        await saveCompanyConfig(companyId, {
          ...fresh,
          subscription: { ...fresh.subscription, activationReminderEmailSentAt: new Date().toISOString() },
        });
      }
    } catch (err) {
      console.error(`checkActivationReminders: failed for company ${companyId}:`, err.message);
    }
  }
}

module.exports = { checkTrialReminders, checkActivationReminders };
