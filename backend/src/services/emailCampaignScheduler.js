// Picks up email_campaigns with status='scheduled' whose scheduled_at has
// passed, resolves their audience, and sends each recipient's email --
// throttled with a small delay between sends so a large audience can't fire
// hundreds of requests at Resend back-to-back and trip its rate limit.
// Every send goes through emailTemplates.js's sendTemplatedEmail, which
// logs its own email_sends row; this file's only other job is flipping the
// campaign's own status as it moves through scheduled -> sending ->
// completed.
//
// Runs on the same setInterval pattern as trialScheduler.js /
// deletionScheduler.js (see index.js) -- no cron infrastructure in this
// app, just a plain interval on the one always-on Railway service. Ticks
// every 60s (a separate, shorter interval than the hourly trial/deletion
// one) so a "send now" campaign starts promptly instead of waiting up to an
// hour.
const { createClient } = require('@supabase/supabase-js');
const { getTemplateById, sendTemplatedEmail } = require('./emailTemplates');
const { resolveAudience } = require('../routes/emailMarketing');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const SEND_DELAY_MS = 150; // ~6-7 sends/sec, comfortably under Resend's default rate limit

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCampaign(sb, campaign) {
  // Flipping to 'sending' first (before resolving the audience or sending
  // anything) is what keeps two overlapping scheduler ticks from ever
  // double-processing the same campaign -- see the `processing` guard
  // below for the other half of that.
  await sb.from('email_campaigns').update({ status: 'sending', started_at: new Date().toISOString() }).eq('id', campaign.id);

  const template = await getTemplateById(campaign.template_id);
  if (!template) {
    console.warn(`Campaign ${campaign.id}: template ${campaign.template_id} no longer exists, marking completed with 0 sends`);
    await sb.from('email_campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', campaign.id);
    return;
  }

  let recipients = [];
  try {
    recipients = await resolveAudience(sb, campaign.audience || {});
  } catch (err) {
    console.error(`Campaign ${campaign.id}: audience resolution failed:`, err.message);
  }

  for (const r of recipients) {
    try {
      await sendTemplatedEmail({
        template,
        to: r.email,
        toName: r.name,
        vars: r.vars || {},
        campaignId: campaign.id,
        recipientType: r.type,
        recipientRef: r.ref,
      });
    } catch (err) {
      console.error(`Campaign ${campaign.id}: send to ${r.email} failed:`, err.message);
    }
    await sleep(SEND_DELAY_MS);
  }

  await sb.from('email_campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', campaign.id);
}

let processing = false;

async function checkScheduledCampaigns() {
  if (processing) return; // a previous tick's campaign(s) are still sending -- skip this tick rather than risk double-processing
  const sb = getSupabase();
  if (!sb) return;

  processing = true;
  try {
    const { data: due, error } = await sb
      .from('email_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());
    if (error) throw error;

    // Sequential, not Promise.all -- keeps at most one campaign's worth of
    // sends in flight at a time, same throttling intent as SEND_DELAY_MS
    // within a single campaign.
    for (const campaign of due || []) {
      await processCampaign(sb, campaign);
    }
  } catch (err) {
    console.error('checkScheduledCampaigns failed:', err.message);
  } finally {
    processing = false;
  }
}

module.exports = { checkScheduledCampaigns };
