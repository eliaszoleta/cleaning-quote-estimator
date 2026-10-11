// Pure slot-generation logic for /book-a-call, kept separate from the route
// handlers so the timezone math (the fiddly part) can be reasoned about on
// its own. No date library in this backend yet, so timezone conversion uses
// the standard double-format-with-Intl trick below rather than adding one
// just for this.
const DAY_KEY_BY_SHORT = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };

// How far UTC is from `timeZone` at the instant `date` falls on, in ms, such
// that (wall-clock time `timeZone` shows for `date`, read as if it were UTC)
// = date.getTime() + offset. Computed from the actual instant (not a fixed
// zone offset) so this is correct across a DST transition.
function getTimezoneOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUTC - date.getTime();
}

// Converts a wall-clock y/m/d hh:mm *in* `timeZone` into the real UTC Date
// it represents. Two-step: guess the instant by treating the wall time as
// UTC, then correct by that guess's own offset (accurate as long as the
// offset doesn't change within the guess-to-real gap, true except inside a
// DST transition itself, an acceptable edge case for a slot picker).
function zonedTimeToUtc(y, m, d, hh, mm, timeZone) {
  const candidateUTC = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offsetMs = getTimezoneOffsetMs(new Date(candidateUTC), timeZone);
  return new Date(candidateUTC - offsetMs);
}

function weekdayKeyInZone(dateStr, timeZone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Noon, not midnight -- keeps this well clear of any DST-transition edge
  // case right at a day boundary.
  const noonUtc = zonedTimeToUtc(y, m, d, 12, 0, timeZone);
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(noonUtc);
  return DAY_KEY_BY_SHORT[short];
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Returns [{ startISO, endISO }] for one calendar day in the booking
// settings' own timezone, with anything busy (other confirmed bookings,
// padded by buffer_mins; real Google Calendar events) and anything too soon
// (min_notice_hours from `now`) already filtered out.
function getDaySlots({ dateStr, settings, busyIntervals = [], existingBookings = [], now = new Date() }) {
  const timeZone = settings.timezone || 'America/Chicago';
  const dayKey = weekdayKeyInZone(dateStr, timeZone);
  const ranges = (settings.weekly_hours && settings.weekly_hours[dayKey]) || [];
  if (ranges.length === 0) return [];

  const [y, m, d] = dateStr.split('-').map(Number);
  const slotMs = (settings.slot_duration_mins || 30) * 60 * 1000;
  const bufferMs = (settings.buffer_mins || 0) * 60 * 1000;
  const minNoticeMs = (settings.min_notice_hours || 0) * 60 * 60 * 1000;
  const earliestAllowed = now.getTime() + minNoticeMs;

  const busy = [
    ...busyIntervals.map(b => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() })),
    ...existingBookings.map(b => ({ start: new Date(b.start_time).getTime() - bufferMs, end: new Date(b.end_time).getTime() + bufferMs })),
  ];

  const slots = [];
  for (const range of ranges) {
    const [startH, startMin] = (range.start || '00:00').split(':').map(Number);
    const [endH, endMin] = (range.end || '00:00').split(':').map(Number);
    const rangeStart = zonedTimeToUtc(y, m, d, startH, startMin, timeZone).getTime();
    const rangeEnd = zonedTimeToUtc(y, m, d, endH, endMin, timeZone).getTime();

    for (let slotStart = rangeStart; slotStart + slotMs <= rangeEnd; slotStart += slotMs) {
      const slotEnd = slotStart + slotMs;
      if (slotStart < earliestAllowed) continue;
      if (busy.some(b => rangesOverlap(slotStart, slotEnd, b.start, b.end))) continue;
      slots.push({ startISO: new Date(slotStart).toISOString(), endISO: new Date(slotEnd).toISOString() });
    }
  }
  return slots;
}

module.exports = { getDaySlots, zonedTimeToUtc, weekdayKeyInZone };
