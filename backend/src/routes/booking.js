// Public /book-a-call API: list open slots, create a booking (real Google
// Calendar event + Meet link, on the admin's own connected calendar), and
// let a visitor cancel their own booking via the unguessable cancel_token
// in their confirmation email -- same no-login pattern website_requests
// uses for /website-approval/:token.
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { getDaySlots } = require('../services/bookingAvailability');
const { getBusyIntervals, createMeetEvent, cancelEvent, isConfigured } = require('../services/googleCalendar');
const { sendTemplatedEmail } = require('../services/emailTemplates');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

async function getSettings(sb) {
  const { data, error } = await sb.from('booking_settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data;
}

// Busy data for the UTC window a local calendar day can possibly fall in --
// padded a day on each side since the booking timezone's day boundary
// rarely lines up with UTC's.
async function loadBusyData(sb, dayStartUtcMs) {
  const windowStartISO = new Date(dayStartUtcMs - DAY_MS).toISOString();
  const windowEndISO = new Date(dayStartUtcMs + 2 * DAY_MS).toISOString();

  const [bookingsRes, busyIntervals] = await Promise.all([
    sb.from('bookings').select('start_time, end_time').eq('status', 'confirmed').gte('start_time', windowStartISO).lte('start_time', windowEndISO),
    isConfigured() ? getBusyIntervals(windowStartISO, windowEndISO).catch(err => { console.warn('getBusyIntervals failed:', err.message); return []; }) : Promise.resolve([]),
  ]);
  if (bookingsRes.error) throw bookingsRes.error;
  return { existingBookings: bookingsRes.data || [], busyIntervals };
}

function formatDateTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}

function toPublicBooking(row, timeZone) {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    dateTimeText: formatDateTimeInZone(new Date(row.start_time), timeZone),
    meetLink: row.meet_link || null,
    status: row.status,
    cancelToken: row.cancel_token,
  };
}

// GET /api/booking/availability?date=YYYY-MM-DD
router.get('/availability', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { date } = req.query;
  if (!DATE_RE.test(date || '')) {
    return res.status(400).json({ success: false, error: 'A valid date (YYYY-MM-DD) is required.' });
  }

  try {
    const settings = await getSettings(sb);
    if (!settings) return res.status(503).json({ success: false, error: 'Booking is not set up yet.' });

    const now = new Date();
    const maxAheadMs = (settings.max_days_ahead || 30) * DAY_MS;
    const requestedDayMs = new Date(`${date}T00:00:00.000Z`).getTime();
    const todayMs = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`).getTime();
    if (requestedDayMs < todayMs || requestedDayMs > todayMs + maxAheadMs) {
      return res.json({ success: true, data: { date, timezone: settings.timezone, slotDurationMins: settings.slot_duration_mins, slots: [] } });
    }

    const { existingBookings, busyIntervals } = await loadBusyData(sb, requestedDayMs);
    const slots = getDaySlots({ dateStr: date, settings, busyIntervals, existingBookings, now });

    res.json({ success: true, data: { date, timezone: settings.timezone, slotDurationMins: settings.slot_duration_mins, slots } });
  } catch (err) {
    console.error('Booking availability error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load availability' });
  }
});

// POST /api/booking/create
router.post('/create', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { name, email, phone, companyName, notes, startISO, endISO, website2 } = req.body || {};

  // Honeypot -- real visitors never see or fill this field (same pattern as
  // routes/websiteRequest.js). Pretend success, create nothing.
  if (website2) return res.json({ success: true, data: null });

  if (!name || !email || !startISO || !endISO) {
    return res.status(400).json({ success: false, error: 'Name, email, and a time slot are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email.' });
  }

  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ success: false, error: 'Invalid time slot.' });
  }

  try {
    const settings = await getSettings(sb);
    if (!settings) return res.status(503).json({ success: false, error: 'Booking is not set up yet.' });

    const minNoticeMs = (settings.min_notice_hours || 0) * 60 * 60 * 1000;
    if (start.getTime() < Date.now() + minNoticeMs) {
      return res.status(400).json({ success: false, error: 'That time is no longer available. Please pick another.' });
    }

    // Re-check the slot is still actually free -- the list the visitor
    // picked from on page load can go stale (another booking landed, or a
    // real Google Calendar event appeared, before they submitted).
    const dateStr = start.toISOString().slice(0, 10);
    const { existingBookings, busyIntervals } = await loadBusyData(sb, new Date(`${dateStr}T00:00:00.000Z`).getTime());
    const freshSlots = getDaySlots({ dateStr, settings, busyIntervals, existingBookings, now: new Date() });
    const stillOpen = freshSlots.some(s => s.startISO === start.toISOString() && s.endISO === end.toISOString());
    if (!stillOpen) {
      return res.status(409).json({ success: false, error: 'That time was just booked. Please pick another.' });
    }

    let googleEventId = null;
    let meetLink = null;
    if (isConfigured()) {
      try {
        const created = await createMeetEvent({
          name: name.trim(), email: email.trim(), companyName: companyName?.trim() || null, notes: notes?.trim() || null,
          startISO: start.toISOString(), endISO: end.toISOString(), timezone: settings.timezone,
        });
        googleEventId = created.eventId;
        meetLink = created.meetLink;
      } catch (err) {
        console.error('createMeetEvent failed:', err.message);
        return res.status(502).json({ success: false, error: 'Could not create the calendar event. Please try again in a moment.' });
      }
    }

    const { data: booking, error: insertErr } = await sb.from('bookings').insert({
      name: name.trim(), email: email.trim(), phone: phone?.trim() || null,
      company_name: companyName?.trim() || null, notes: notes?.trim() || null,
      start_time: start.toISOString(), end_time: end.toISOString(),
      google_event_id: googleEventId, meet_link: meetLink,
    }).select().single();
    if (insertErr) throw insertErr;

    sendTemplatedEmail({
      template: 'booking_confirmation',
      to: booking.email,
      toName: booking.name,
      vars: {
        name: booking.name,
        dateTimeText: formatDateTimeInZone(start, settings.timezone),
        meetLink: booking.meet_link || '',
        cancelUrl: `${FRONTEND_URL}/cancel-booking?token=${booking.cancel_token}`,
      },
    }).catch(err => console.error('sendTemplatedEmail (booking_confirmation) failed:', err.message));

    res.json({ success: true, data: toPublicBooking(booking, settings.timezone) });
  } catch (err) {
    console.error('Booking create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// GET /api/booking/by-token/:token -- backs the public cancel page, which
// shows the booking's details before the visitor confirms canceling it.
router.get('/by-token/:token', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const [settings, { data, error }] = await Promise.all([
      getSettings(sb),
      sb.from('bookings').select('*').eq('cancel_token', req.params.token).maybeSingle(),
    ]);
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: toPublicBooking(data, settings?.timezone || 'America/Chicago') });
  } catch (err) {
    console.error('Booking by-token error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load booking' });
  }
});

// POST /api/booking/cancel — body: { token }
router.post('/cancel', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const token = (req.body?.token || '').trim();
  if (!token) return res.status(400).json({ success: false, error: 'token is required' });

  try {
    const { data: booking, error } = await sb.from('bookings').select('*').eq('cancel_token', token).maybeSingle();
    if (error) throw error;
    if (!booking) return res.status(404).json({ success: false, error: 'Not found' });
    if (booking.status === 'canceled') return res.json({ success: true, data: { alreadyCanceled: true } });

    if (booking.google_event_id) {
      try { await cancelEvent(booking.google_event_id); } catch (err) { console.warn('cancelEvent failed:', err.message); }
    }

    const { error: updErr } = await sb.from('bookings')
      .update({ status: 'canceled', canceled_at: new Date().toISOString(), canceled_by: 'visitor' })
      .eq('id', booking.id);
    if (updErr) throw updErr;

    res.json({ success: true, data: { alreadyCanceled: false } });
  } catch (err) {
    console.error('Booking cancel error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

module.exports = router;
