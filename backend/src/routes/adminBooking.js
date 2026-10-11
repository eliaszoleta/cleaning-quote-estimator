// Admin side of /book-a-call: weekly-availability settings and the
// bookings list/cancel, gated by the same x-admin-key the rest of the
// admin API uses. Google account connect/callback/status/disconnect live
// in routes/googleCalendarAdmin.js instead, since the OAuth callback can't
// sit behind this router's blanket requireAdminKey (Google's redirect
// carries no custom header).
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { cancelEvent } = require('../services/googleCalendar');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ success: false, error: 'Admin API not configured' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}
router.use(requireAdminKey);

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validWeeklyHours(weeklyHours) {
  if (!weeklyHours || typeof weeklyHours !== 'object') return false;
  return DAY_KEYS.every(day => {
    const ranges = weeklyHours[day];
    if (!Array.isArray(ranges)) return false;
    return ranges.every(r => r && TIME_RE.test(r.start) && TIME_RE.test(r.end) && r.start < r.end);
  });
}

// GET /api/admin/booking/settings
router.get('/settings', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data, error } = await sb.from('booking_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin booking settings GET error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load booking settings' });
  }
});

// PUT /api/admin/booking/settings
router.put('/settings', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  const { weekly_hours, slot_duration_mins, buffer_mins, min_notice_hours, max_days_ahead, timezone } = req.body || {};
  const updates = { updated_at: new Date().toISOString() };

  if (weekly_hours !== undefined) {
    if (!validWeeklyHours(weekly_hours)) {
      return res.status(400).json({ success: false, error: 'weekly_hours must have mon..sun arrays of { start, end } in HH:MM, with start before end.' });
    }
    updates.weekly_hours = weekly_hours;
  }
  if (slot_duration_mins !== undefined) {
    if (!Number.isInteger(slot_duration_mins) || slot_duration_mins < 5 || slot_duration_mins > 480) {
      return res.status(400).json({ success: false, error: 'slot_duration_mins must be an integer between 5 and 480.' });
    }
    updates.slot_duration_mins = slot_duration_mins;
  }
  if (buffer_mins !== undefined) {
    if (!Number.isInteger(buffer_mins) || buffer_mins < 0 || buffer_mins > 240) {
      return res.status(400).json({ success: false, error: 'buffer_mins must be an integer between 0 and 240.' });
    }
    updates.buffer_mins = buffer_mins;
  }
  if (min_notice_hours !== undefined) {
    if (!Number.isInteger(min_notice_hours) || min_notice_hours < 0 || min_notice_hours > 720) {
      return res.status(400).json({ success: false, error: 'min_notice_hours must be an integer between 0 and 720.' });
    }
    updates.min_notice_hours = min_notice_hours;
  }
  if (max_days_ahead !== undefined) {
    if (!Number.isInteger(max_days_ahead) || max_days_ahead < 1 || max_days_ahead > 365) {
      return res.status(400).json({ success: false, error: 'max_days_ahead must be an integer between 1 and 365.' });
    }
    updates.max_days_ahead = max_days_ahead;
  }
  if (timezone !== undefined) {
    if (typeof timezone !== 'string' || !timezone.trim()) {
      return res.status(400).json({ success: false, error: 'timezone must be a non-empty IANA timezone name.' });
    }
    updates.timezone = timezone.trim();
  }

  try {
    const { data, error } = await sb.from('booking_settings').update(updates).eq('id', 1).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin booking settings PUT error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update booking settings' });
  }
});

// GET /api/admin/booking/bookings?status=confirmed — defaults to every
// booking, most recent first; AdminBookings.js filters client-side for the
// small volume this is expected to have.
router.get('/bookings', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    let query = sb.from('bookings').select('*').order('start_time', { ascending: true });
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Admin bookings list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load bookings' });
  }
});

// POST /api/admin/booking/bookings/:id/cancel — same effect as the
// visitor's own POST /api/booking/cancel, just reached from the dashboard
// instead of the visitor's cancel link, and recorded as canceled_by 'admin'.
router.post('/bookings/:id/cancel', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { data: booking, error } = await sb.from('bookings').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!booking) return res.status(404).json({ success: false, error: 'Not found' });
    if (booking.status === 'canceled') return res.json({ success: true, data: { alreadyCanceled: true } });

    if (booking.google_event_id) {
      try { await cancelEvent(booking.google_event_id); } catch (err) { console.warn('cancelEvent failed:', err.message); }
    }

    const { data: updated, error: updErr } = await sb.from('bookings')
      .update({ status: 'canceled', canceled_at: new Date().toISOString(), canceled_by: 'admin' })
      .eq('id', booking.id)
      .select()
      .single();
    if (updErr) throw updErr;

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Admin booking cancel error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

module.exports = router;
