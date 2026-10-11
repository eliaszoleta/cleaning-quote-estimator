import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarX2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getBookingByToken, cancelBooking } from '../../utils/api';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';

// /cancel-booking?token=... -- the link every booking confirmation/reminder
// email includes. No login of its own: the random cancel_token in the URL
// is the auth (same pattern as WebsiteApproval.js's approval_token).
export default function CancelBookingPage({ token }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState(null);
  const [canceled, setCanceled] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getBookingByToken(token);
      setBooking(res.data);
      if (res.data.status === 'canceled') setCanceled(true);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    setCanceling(true);
    setError(null);
    try {
      await cancelBooking(token);
      setCanceled(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  const shellStyle = { minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: COLORS.surfaceMuted };
  const cardStyle = { maxWidth: 440, width: '100%', background: COLORS.surface, borderRadius: RADIUS.xl, boxShadow: SHADOWS.md, padding: 'clamp(28px, 6vw, 40px)', textAlign: 'center' };

  if (loading) {
    return (
      <div style={shellStyle}><div style={{ color: COLORS.body }}><Loader2 size={24} className="cb-spin" /><style>{`.cb-spin { animation: cb-spin 0.9s linear infinite; } @keyframes cb-spin { to { transform: rotate(360deg); } }`}</style></div></div>
    );
  }

  if (notFound) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <XCircle size={40} color={COLORS.muted} style={{ marginBottom: 14 }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>Booking not found</h1>
          <p style={{ fontSize: 14, color: COLORS.body, lineHeight: 1.6, margin: 0 }}>This link isn't valid. If you think that's a mistake, reply to your confirmation email and we'll help.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cancel Booking | Clean Estimator</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={shellStyle}>
        <div style={cardStyle}>
          {canceled ? (
            <>
              <CheckCircle2 size={40} color={COLORS.success} style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>Booking canceled</h1>
              <p style={{ fontSize: 14, color: COLORS.body, lineHeight: 1.6, margin: 0 }}>
                Your call for {booking.dateTimeText} has been canceled. Want to pick a new time? <a href="/book-a-call" style={{ color: COLORS.primary, fontWeight: 600 }}>Book again</a>.
              </p>
            </>
          ) : (
            <>
              <CalendarX2 size={36} color={COLORS.warning} style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>Cancel your call?</h1>
              <p style={{ fontSize: 14, color: COLORS.body, lineHeight: 1.6, marginBottom: 22 }}>
                {booking.name}, your call is scheduled for<br /><strong>{booking.dateTimeText}</strong>
              </p>
              {error && <div style={{ background: COLORS.dangerMuted, border: `1px solid ${COLORS.dangerBorder}`, color: COLORS.danger, borderRadius: RADIUS.sm, padding: '10px 14px', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</div>}
              <button
                onClick={handleCancel}
                disabled={canceling}
                style={{ width: '100%', padding: '13px 0', borderRadius: RADIUS.sm, border: 'none', cursor: canceling ? 'default' : 'pointer', fontSize: 14.5, fontWeight: 700, color: 'white', background: COLORS.danger, opacity: canceling ? 0.7 : 1 }}
              >
                {canceling ? 'Canceling…' : 'Yes, cancel this call'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
