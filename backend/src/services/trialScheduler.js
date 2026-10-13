const { listAllCompanyConfigs, getCompanyConfig, saveCompanyConfig } = require('./companyConfig');
const {
  sendTrialEndingSoonEmail, sendTrialEndedEmail,
  sendTrialCheckin1Email, sendTrialCheckin2Email, sendTrialCheckin3Email,
} = require('./email');

const TRIAL_DAYS = 30;

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

// Checks every company's free-trial state and sends whichever of these
// emails is next due, each exactly once (deduped via sent-at flags stored
// on config.subscription): three check-ins at days 7/14/21 filling what was
// previously 27 days of total silence after the day-0 welcome email, then
// a day-28/29 "ending soon" reminder.
//
// Two trial models coexist here:
// - Current accounts: a real Stripe-managed trial (card collected at
//   signup, see subscription.js's POST /checkout). sub.currentPeriodEnd is
//   the trial end date Stripe itself is tracking, so daysLeft/daysElapsed
//   are derived from that instead of a locally-tracked start date -- this
//   used to only check sub.trialStartedAt, which nothing has set since
//   Checkout-based signup shipped, so these five emails silently never
//   fired for any current signup (every attempt here had trialStartedAt
//   unset and stripeSubscriptionId set, which the old `if` skipped
//   entirely). There's no "trial ended" email in this path -- Stripe just
//   charges the card and the subscription flips to "active" on its own;
//   see subscription.js's webhook handler for the event-driven
//   trial_converted confirmation email that replaces it, sent the moment
//   that transition happens rather than polled for here.
// - Legacy accounts: the old no-card trial (trialStartedAt set, never
//   touched Stripe) that predates the Checkout-based signup flow. Kept
//   running exactly as before, days-elapsed-since-trialStartedAt math and
//   all, including the "ended / widget paused" email once it actually
//   does lose access with no card on file to charge.
//
// One email per company per run, in chronological order (ending-soon >
// checkin1 > checkin2 > checkin3) -- this also handles accounts that were
// already mid-trial when the three check-ins shipped: an account with none
// of the checkin flags set yet just receives whichever is earliest-due
// this run, then the next on the following run(s), catching up over a few
// hours instead of never getting them. The `daysLeft > 3` guard on all
// three check-ins keeps that catch-up from firing a "how's week 1 going?"
// email days before the trial actually ends.
//
// No cron infrastructure exists in this app (no Railway cron service, no
// node-cron dependency) -- this runs on a plain setInterval from
// index.js instead, since the backend is a single always-on Railway
// service (see railway.toml), not serverless. Safe to call repeatedly;
// the sent-at flags mean it only ever actually sends once per company
// per email regardless of how often this runs.
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

    const daysElapsed = isLegacyTrial
      ? (Date.now() - new Date(sub.trialStartedAt).getTime()) / (1000 * 60 * 60 * 24)
      : TRIAL_DAYS - Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - Date.now()) / (1000 * 60 * 60 * 24)));
    const daysLeft = isLegacyTrial
      ? Math.ceil(TRIAL_DAYS - daysElapsed)
      : Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - Date.now()) / (1000 * 60 * 60 * 24)));

    // Shared by every branch below: send, then re-fetch fresh (rather than
    // reuse the bulk-listed snapshot) right before saving the sent-at flag,
    // so a concurrent change elsewhere (e.g. they subscribe via Stripe
    // mid-run) doesn't get clobbered by this write.
    const markSent = async (flagKey) => {
      const fresh = (await getCompanyConfig(companyId)) || config;
      await saveCompanyConfig(companyId, {
        ...fresh,
        subscription: { ...fresh.subscription, [flagKey]: new Date().toISOString() },
      });
    };

    try {
      if (isLegacyTrial && daysLeft <= 0 && !sub.trialEndedEmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        if (await sendTrialEndedEmail({ to: email, companyName })) await markSent('trialEndedEmailSentAt');
      } else if (daysLeft >= 1 && daysLeft <= 2 && !sub.trialEndingSoonEmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        if (await sendTrialEndingSoonEmail({ to: email, companyName, daysLeft })) await markSent('trialEndingSoonEmailSentAt');
      } else if (daysLeft > 3 && daysElapsed >= 7 && !sub.trialCheckin1EmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        if (await sendTrialCheckin1Email({ to: email, companyName })) await markSent('trialCheckin1EmailSentAt');
      } else if (daysLeft > 3 && daysElapsed >= 14 && !sub.trialCheckin2EmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        if (await sendTrialCheckin2Email({ to: email, companyName })) await markSent('trialCheckin2EmailSentAt');
      } else if (daysLeft > 3 && daysElapsed >= 21 && !sub.trialCheckin3EmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        if (await sendTrialCheckin3Email({ to: email, companyName })) await markSent('trialCheckin3EmailSentAt');
      }
    } catch (err) {
      console.error(`checkTrialReminders: failed for company ${companyId}:`, err.message);
    }
  }
}

module.exports = { checkTrialReminders };
