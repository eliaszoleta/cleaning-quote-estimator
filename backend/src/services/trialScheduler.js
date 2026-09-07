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

// Checks every company's free-trial state and sends whichever of these five
// emails is next due, each exactly once (deduped via sent-at flags stored
// on config.subscription): three check-ins at days 7/14/21 filling what was
// previously 27 days of total silence after the day-0 welcome email, then
// the existing day-28/29 "ending soon" reminder, then the day-30 "ended"
// email once the embed widget actually pauses.
//
// One email per company per run, in chronological order (ended > ending-
// soon > checkin1 > checkin2 > checkin3) -- this also handles accounts that
// were already mid-trial when the three check-ins shipped: an account with
// none of the checkin flags set yet just receives whichever is earliest-due
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
    const sub = config?.subscription;
    if (!sub?.trialStartedAt) continue;
    if (sub.stripeSubscriptionId) continue; // already subscribed (or previously was) -- not a bare trial anymore

    const daysElapsed = (Date.now() - new Date(sub.trialStartedAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysLeft = Math.ceil(TRIAL_DAYS - daysElapsed);

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
      const companyName = config.companyName || 'there';

      if (daysLeft <= 0 && !sub.trialEndedEmailSentAt) {
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
