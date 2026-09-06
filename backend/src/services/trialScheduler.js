const { listAllCompanyConfigs, getCompanyConfig, saveCompanyConfig } = require('./companyConfig');
const { sendTrialEndingSoonEmail, sendTrialEndedEmail } = require('./email');

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

// Checks every company's free-trial state and sends the two reminder
// emails this needs, each exactly once (deduped via sent-at flags stored
// on config.subscription) -- 2 days before the 30-day trial ends, and
// again the day it actually ends and the embed widget pauses.
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

    try {
      if (daysLeft >= 1 && daysLeft <= 2 && !sub.trialEndingSoonEmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        const sent = await sendTrialEndingSoonEmail({ to: email, companyName: config.companyName || 'there', daysLeft });
        if (sent) {
          // Re-fetch right before saving rather than reusing the bulk-listed
          // snapshot, so a concurrent change (e.g. they subscribe via Stripe
          // mid-run) doesn't get clobbered by this write.
          const fresh = (await getCompanyConfig(companyId)) || config;
          await saveCompanyConfig(companyId, {
            ...fresh,
            subscription: { ...fresh.subscription, trialEndingSoonEmailSentAt: new Date().toISOString() },
          });
        }
      } else if (daysLeft <= 0 && !sub.trialEndedEmailSentAt) {
        const email = await getOwnerEmail(companyId);
        if (!email) continue;
        const sent = await sendTrialEndedEmail({ to: email, companyName: config.companyName || 'there' });
        if (sent) {
          const fresh = (await getCompanyConfig(companyId)) || config;
          await saveCompanyConfig(companyId, {
            ...fresh,
            subscription: { ...fresh.subscription, trialEndedEmailSentAt: new Date().toISOString() },
          });
        }
      }
    } catch (err) {
      console.error(`checkTrialReminders: failed for company ${companyId}:`, err.message);
    }
  }
}

module.exports = { checkTrialReminders };
