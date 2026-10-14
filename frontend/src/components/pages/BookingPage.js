import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, Clock, Loader2, CheckCircle2, Video, ArrowLeft } from 'lucide-react';
import { getBookingAvailability, createBooking } from '../../utils/api';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';

const DAYS_AHEAD_SHOWN = 21; // the picker shows a scrollable window of calendar days; booking_settings.max_days_ahead (enforced server-side too) is usually well inside this

function localDateStr(date) {
  // YYYY-MM-DD in the VISITOR's own local calendar date -- the server maps
  // this onto the admin's booking timezone per-day, so this only has to be
  // "which calendar day did the visitor click," not a timezone conversion.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// /book-a-call -- a self-hosted Calendly replacement for sales/demo calls
// with prospects (cleaning-business owners interested in the website
// product or the partner program). Three steps: pick a day + open slot
// (from GET /api/booking/availability, which already excludes anything
// busy on the admin's real connected Google Calendar, not just other
// bookings made here), fill in contact info, then a confirmation screen --
// the real confirmation with the Google Meet link and reminder schedule
// goes out by email (services/bookingReminderScheduler.js sends the
// 24h/3h/30min-before follow-ups), so this screen doesn't need to repeat
// every detail, just confirm it worked.
export default function BookingPage() {
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAYS_AHEAD_SHOWN; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => localDateStr(days[0]));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [step, setStep] = useState('pick'); // 'pick' | 'form' | 'confirmed'
  const [form, setForm] = useState({ name: '', email: '', phone: '', companyName: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [booking, setBooking] = useState(null);

  const loadSlots = useCallback(async (dateStr) => {
    setLoadingSlots(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const res = await getBookingAvailability(dateStr);
      setSlots(res.data.slots || []);
    } catch (err) {
      setSlotsError(err.message || 'Could not load available times.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  const nameValid = form.name.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = !submitting && nameValid && emailValid && selectedSlot;

  const handleContinue = () => {
    if (!selectedSlot) return;
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createBooking({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        notes: form.notes.trim() || undefined,
        startISO: selectedSlot.startISO,
        endISO: selectedSlot.endISO,
      });
      setBooking(res.data);
      setStep('confirmed');
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
      if (err.responseData?.error?.includes('just booked')) {
        loadSlots(selectedDate); // the slot was taken out from under them -- refresh so they see what's actually still open
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shellStyle = { minHeight: '70vh', padding: 'clamp(24px, 5vw, 48px) 20px', background: COLORS.surfaceMuted, display: 'flex', justifyContent: 'center' };
  const cardStyle = { maxWidth: 560, width: '100%', background: COLORS.surface, borderRadius: RADIUS.xl, boxShadow: SHADOWS.md, padding: 'clamp(24px, 5vw, 36px)' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };
  const inputStyle = { width: '100%', padding: '11px 13px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 14, outline: 'none', color: COLORS.ink, background: 'white', boxSizing: 'border-box' };

  return (
    <>
      <Helmet>
        <title>Book a Call | Clean Estimator</title>
        <meta name="description" content="Book a free call to talk about getting a cleaning-business website or joining the Clean Estimator partner program." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div style={shellStyle}>
        <div style={cardStyle}>
          {step !== 'confirmed' && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 6, letterSpacing: '-0.3px' }}>Book a call</h1>
              <p style={{ fontSize: 14, color: COLORS.body, marginBottom: 24, lineHeight: 1.6 }}>
                Pick a time that works for you — we'll send a video call link by email, no app or account needed.
              </p>
            </>
          )}

          {step === 'pick' && (
            <>
              <label style={labelStyle}><CalendarDays size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Choose a day</label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 18, WebkitOverflowScrolling: 'touch' }}>
                {days.map(d => {
                  const dateStr = localDateStr(d);
                  const active = dateStr === selectedDate;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        flexShrink: 0, minWidth: 58, padding: '10px 6px', borderRadius: RADIUS.sm, cursor: 'pointer',
                        border: `1.5px solid ${active ? COLORS.primary : COLORS.border}`,
                        background: active ? COLORS.primary : 'white',
                        color: active ? 'white' : COLORS.ink,
                        textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>{d.toLocaleDateString([], { weekday: 'short' })}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>

              <label style={labelStyle}><Clock size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Choose a time</label>
              {loadingSlots ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: COLORS.muted }}><Loader2 size={20} className="spin" /></div>
              ) : slotsError ? (
                <div style={{ color: COLORS.danger, fontSize: 13.5, padding: '10px 0' }}>{slotsError}</div>
              ) : slots.length === 0 ? (
                <div style={{ color: COLORS.body, fontSize: 13.5, padding: '14px 0' }}>No open times that day — try another date.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 22 }}>
                  {slots.map(slot => {
                    const active = selectedSlot?.startISO === slot.startISO;
                    return (
                      <button
                        key={slot.startISO}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 6px', borderRadius: RADIUS.sm, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                          border: `1.5px solid ${active ? COLORS.primary : COLORS.border}`,
                          background: active ? COLORS.primary : 'white',
                          color: active ? 'white' : COLORS.ink,
                          transition: 'all 0.15s',
                        }}
                      >
                        {formatSlotTime(slot.startISO)}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!selectedSlot}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: RADIUS.sm, border: 'none', cursor: selectedSlot ? 'pointer' : 'not-allowed',
                  fontSize: 14.5, fontWeight: 700, color: 'white', background: selectedSlot ? COLORS.primary : '#cbd5e1',
                }}
              >
                Continue →
              </button>
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => setStep('pick')} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'none', color: COLORS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                <ArrowLeft size={14} /> Change time
              </button>

              <div style={{ background: COLORS.primaryMuted, border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: RADIUS.sm, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, color: COLORS.primaryDark, marginBottom: 20 }}>
                {new Date(selectedSlot.startISO).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} at {formatSlotTime(selectedSlot.startISO)}
              </div>

              {submitError && (
                <div style={{ background: COLORS.dangerMuted, border: `1px solid ${COLORS.dangerBorder}`, color: COLORS.danger, borderRadius: RADIUS.sm, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{submitError}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email <span style={{ color: COLORS.muted, fontWeight: 400 }}>(we'll send the call link here)</span></label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span></label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Business name <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Sparkle Clean Co" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>What would you like to discuss? <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span></label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="A cleaning-business website, the partner program, etc." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22,
                  padding: '13px 0', borderRadius: RADIUS.sm, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontSize: 14.5, fontWeight: 700, color: 'white', background: canSubmit ? COLORS.primary : '#cbd5e1',
                }}
              >
                {submitting ? <><Loader2 size={15} className="spin" /> Booking…</> : 'Confirm booking →'}
              </button>
            </form>
          )}

          {step === 'confirmed' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: COLORS.successMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <CheckCircle2 size={28} color={COLORS.success} />
              </div>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>You're booked!</h1>
              <p style={{ fontSize: 14.5, color: COLORS.body, lineHeight: 1.6, marginBottom: 6 }}>
                {booking?.dateTimeText}
              </p>
              <p style={{ fontSize: 13.5, color: COLORS.muted, lineHeight: 1.6, marginBottom: 22 }}>
                We've sent the details and a video call link to <strong>{form.email}</strong> — just click it when it's time, no download or account needed. We'll also remind you by email the day before, a few hours before, and 30 minutes before.
              </p>
              {booking?.meetLink && (
                <a
                  href={booking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.success, color: 'white', padding: '12px 24px', borderRadius: RADIUS.sm, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
                >
                  <Video size={15} /> View call link
                </a>
              )}
            </div>
          )}
        </div>
        <style>{`.spin { animation: book-spin 0.9s linear infinite; } @keyframes book-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
