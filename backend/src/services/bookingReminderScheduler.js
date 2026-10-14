// Polls confirmed future bookings and sends the 24h/3h/30min-before
// reminder emails as each threshold comes due, using the three
// reminder_*_sent_at columns on `bookings` (migration 015) as both the
// "is this one due yet" filter (IS NULL) and the guard against ever
// double-sending one. Same setInterval-on-the-one-Railway-service pattern
// as emailCampaignScheduler.js -- ticks every 60s (see index.js) since the
// 30-minute reminder needs a check well under 30 minutes to land on time.
const { createClient } = require('@supabase/supabase-js');
const { sendTemplatedEmail } = require('./emailTemplates');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const THRESHOLDS = [
  { ms: 24 * 60 * 60 * 1000, column: 'reminder_24h_sent_at', template: 'booking_reminder_24h' },
  { ms: 3 * 60 * 60 * 1000, column: 'reminder_3h_sent_at', template: 'booking_reminder_3h' },
  { ms: 30 * 60 * 1000, column: 'reminder_30m_sent_at', template: 'booking_reminder_30m' },
];

function formatDateTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}

async function getTimezone(sb) {
  const { data } = await sb.from('booking_settings').select('timezone').eq('id', 1).maybeSingle();
  return data?.timezone || 'America/Chicago';
}

let checking = false;

async function checkDueReminders() {
  if (checking) return; // a previous tick is still sending -- skip rather than risk overlapping sends
  const sb = getSupabase();
  if (!sb) return;

  checking = true;
  try {
    const timezone = await getTimezone(sb);
    const now = new Date();

    for (const { ms, column, template } of THRESHOLDS) {
      const cutoffISO = new Date(now.getTime() + ms).toISOString();
      const { data: due, error } = await sb
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .is(column, null)
        .gt('start_time', now.toISOString())
        .lte('start_time', cutoffISO);

      if (error) {
        console.error(`checkDueReminders (${template}) query failed:`, error.message);
        continue;
      }

      for (const booking of due || []) {
        try {
          const result = await sendTemplatedEmail({
            template,
            to: booking.email,
            toName: booking.name,
            vars: {
              name: booking.name,
              dateTimeText: formatDateTimeInZone(new Date(booking.start_time), timezone),
              meetLink: booking.meet_link || '',
              cancelUrl: `${FRONTEND_URL}/cancel-booking?token=${booking.cancel_token}`,
            },
            recipientType: 'booking',
            recipientRef: booking.id,
          });
          // Only mark it sent once Resend actually confirmed the send --
          // sendTemplatedEmail swallows its own failures (returns
          // { sent: false } rather than throwing), so leaving the column
          // null on a failed send lets the next tick retry it instead of
          // silently losing the reminder.
          if (result.sent) {
            await sb.from('bookings').update({ [column]: new Date().toISOString() }).eq('id', booking.id);
          } else {
            console.warn(`checkDueReminders: ${template} not sent for booking ${booking.id}, will retry next tick`);
          }
        } catch (err) {
          console.error(`checkDueReminders: ${template} for booking ${booking.id} failed:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('checkDueReminders failed:', err.message);
  } finally {
    checking = false;
  }
}

module.exports = { checkDueReminders };
