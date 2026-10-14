import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Video, RefreshCw, Unlink, ExternalLink, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import {
  getGoogleCalendarAuthUrl, getGoogleCalendarStatus, disconnectGoogleCalendar,
  getAdminBookingSettings, updateAdminBookingSettings,
  getAdminBookings, cancelAdminBooking,
} from '../../utils/api';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { theme, cardStyle, inputStyle, labelStyle, primaryBtnStyle, secondaryBtnStyle, dangerBtnStyle, pill, PageHeader } from './adminTheme';

const DAY_LABELS = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];

// Converts the backend's { mon: [{start,end}], ... } (an array per day, so
// it *could* hold multiple ranges) into one { open, start, end } row per
// day for this editor. Multiple ranges a day isn't a case this one-person
// booking page needs yet -- saving always writes back a single-range (or
// empty) array per day, which the backend's own shape fully supports, this
// UI just never produces more than one.
function toEditableHours(weeklyHours) {
  const out = {};
  for (const [key] of DAY_LABELS) {
    const range = weeklyHours?.[key]?.[0];
    out[key] = range ? { open: true, start: range.start, end: range.end } : { open: false, start: '09:00', end: '17:00' };
  }
  return out;
}

function toApiHours(editable) {
  const out = {};
  for (const [key] of DAY_LABELS) {
    const day = editable[key];
    out[key] = day.open ? [{ start: day.start, end: day.end }] : [];
  }
  return out;
}

function formatBookingTime(iso) {
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// The admin side of /book-a-call -- connect the Google account that owns
// the real calendar bookings land on, set weekly availability, and see/
// cancel upcoming calls. adminKey comes from the shared login in
// AdminDashboard.js, same as every other tab.
export default function AdminBookings({ adminKey }) {
  const [googleStatus, setGoogleStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [googleBanner, setGoogleBanner] = useState(null);

  const [settings, setSettings] = useState(null);
  const [hours, setHours] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const loadGoogleStatus = useCallback(async (key) => {
    try {
      const res = await getGoogleCalendarStatus(key);
      setGoogleStatus(res.data);
    } catch (err) {
      console.error('Error loading Google Calendar status:', err.message);
    }
  }, []);

  const loadSettings = useCallback(async (key) => {
    try {
      const res = await getAdminBookingSettings(key);
      setSettings(res.data);
      setHours(toEditableHours(res.data.weekly_hours));
    } catch (err) {
      console.error('Error loading booking settings:', err.message);
    }
  }, []);

  const loadBookings = useCallback(async (key) => {
    setLoadingBookings(true);
    try {
      const res = await getAdminBookings(key);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Error loading bookings:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    loadGoogleStatus(adminKey);
    loadSettings(adminKey);
    loadBookings(adminKey);
  }, [adminKey, loadGoogleStatus, loadSettings, loadBookings]);

  // Picks up ?google_connected=1 / ?google_error=... left by the backend's
  // redirect after the OAuth consent screen (see
  // routes/googleCalendarAdmin.js's /callback), shows a one-time banner,
  // then scrubs the query string so a refresh doesn't re-show it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('google_connected');
    const error = params.get('google_error');
    if (!connected && !error) return;
    setGoogleBanner(connected ? { type: 'success', text: 'Google Calendar connected!' } : { type: 'error', text: `Couldn't connect Google Calendar (${error}). Please try again.` });
    window.history.replaceState({}, '', window.location.pathname);
    if (connected) loadGoogleStatus(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await getGoogleCalendarAuthUrl(adminKey);
      window.location.href = res.url;
    } catch (err) {
      setGoogleBanner({ type: 'error', text: err.message || 'Failed to start Google connection.' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm({ title: 'Disconnect Google Calendar?', message: "New bookings won't be able to create calendar events or Meet links until you reconnect.", confirmLabel: 'Disconnect', danger: true });
    if (!ok) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar(adminKey);
      await loadGoogleStatus(adminKey);
    } catch (err) {
      setGoogleBanner({ type: 'error', text: err.message || 'Failed to disconnect.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const updateDay = (key, patch) => setHours(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);
    try {
      const res = await updateAdminBookingSettings(adminKey, {
        weekly_hours: toApiHours(hours),
        slot_duration_mins: settings.slot_duration_mins,
        buffer_mins: settings.buffer_mins,
        min_notice_hours: settings.min_notice_hours,
        max_days_ahead: settings.max_days_ahead,
        timezone: settings.timezone,
      });
      setSettings(res.data);
      setHours(toEditableHours(res.data.weekly_hours));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      setSettingsError(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const ok = await confirm({ title: 'Cancel this booking?', message: `${booking.name}'s call on ${formatBookingTime(booking.start_time)} will be canceled and removed from Google Calendar.`, confirmLabel: 'Cancel booking', danger: true });
    if (!ok) return;
    setCancelingId(booking.id);
    try {
      await cancelAdminBooking(adminKey, booking.id);
      await loadBookings(adminKey);
    } catch (err) {
      console.error('Error canceling booking:', err.message);
    } finally {
      setCancelingId(null);
    }
  };

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date());
  const past = bookings.filter(b => b.status !== 'confirmed' || new Date(b.start_time) <= new Date());

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: theme.contentBg }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <PageHeader
          icon={CalendarClock}
          title="Bookings"
          subtitle="Your self-hosted Calendly replacement — book-a-call page, Google Calendar connection, and weekly availability."
        />

        {googleBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: theme.radiusSm, marginBottom: 18, fontSize: 13, fontWeight: 600,
            background: googleBanner.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: googleBanner.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${googleBanner.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {googleBanner.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {googleBanner.text}
          </div>
        )}

        {/* Google Calendar connection */}
        <div style={{ ...cardStyle, padding: 22, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>Google Calendar</div>
              {googleStatus?.connected ? (
                <div style={{ fontSize: 13, color: theme.textSecondary }}>
                  Connected as <strong>{googleStatus.email}</strong>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: theme.textMuted }}>Not connected — bookings can't create Meet links until you connect an account.</div>
              )}
            </div>
            {googleStatus?.connected ? (
              <button onClick={handleDisconnect} disabled={disconnecting} style={dangerBtnStyle}>
                <Unlink size={13} /> {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            ) : (
              <button onClick={handleConnect} disabled={connecting} style={primaryBtnStyle}>
                {connecting ? 'Redirecting…' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>

        {/* Weekly availability */}
        {hours && settings && (
          <form onSubmit={handleSaveSettings} style={{ ...cardStyle, padding: 22, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.textPrimary, marginBottom: 14 }}>Weekly availability</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {DAY_LABELS.map(([key, label]) => {
                const day = hours[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, width: 90, fontSize: 13, fontWeight: 700, color: theme.textPrimary, cursor: 'pointer' }}>
                      <input type="checkbox" checked={day.open} onChange={e => updateDay(key, { open: e.target.checked })} />
                      {label}
                    </label>
                    {day.open ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="time" value={day.start} onChange={e => updateDay(key, { start: e.target.value })} style={{ ...inputStyle, width: 120 }} />
                        <span style={{ color: theme.textMuted, fontSize: 12 }}>to</span>
                        <input type="time" value={day.end} onChange={e => updateDay(key, { end: e.target.value })} style={{ ...inputStyle, width: 120 }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 12.5, color: theme.textMuted }}>Closed</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Slot length (min)</label>
                <input type="number" min={5} max={480} value={settings.slot_duration_mins} onChange={e => setSettings(s => ({ ...s, slot_duration_mins: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Buffer between calls (min)</label>
                <input type="number" min={0} max={240} value={settings.buffer_mins} onChange={e => setSettings(s => ({ ...s, buffer_mins: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Min notice (hours)</label>
                <input type="number" min={0} max={720} value={settings.min_notice_hours} onChange={e => setSettings(s => ({ ...s, min_notice_hours: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bookable up to (days ahead)</label>
                <input type="number" min={1} max={365} value={settings.max_days_ahead} onChange={e => setSettings(s => ({ ...s, max_days_ahead: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Timezone (IANA name)</label>
                <input type="text" value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} placeholder="America/Chicago" style={inputStyle} />
              </div>
            </div>

            {settingsError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12 }}>{settingsError}</div>}

            <button type="submit" disabled={savingSettings} style={primaryBtnStyle}>
              {savingSettings ? 'Saving…' : settingsSaved ? 'Saved ✓' : 'Save availability'}
            </button>
          </form>
        )}

        {/* Bookings list */}
        <div style={{ ...cardStyle, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.textPrimary }}>Upcoming calls ({upcoming.length})</div>
            <button onClick={() => loadBookings(adminKey)} style={secondaryBtnStyle}><RefreshCw size={13} /> Refresh</button>
          </div>

          {loadingBookings ? (
            <div style={{ padding: 30, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>Loading…</div>
          ) : upcoming.length === 0 ? (
            <div style={{ padding: 20, color: theme.textMuted, fontSize: 13 }}>No upcoming calls booked.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: theme.radiusSm, border: `1px solid ${theme.borderSoft}`, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.textPrimary }}>{b.name}{b.company_name ? ` — ${b.company_name}` : ''}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{formatBookingTime(b.start_time)} · {b.email}{b.phone ? ` · ${b.phone}` : ''}</div>
                    {b.notes && <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>{b.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {b.meet_link && (
                      <a href={b.meet_link} target="_blank" rel="noopener noreferrer" style={{ ...secondaryBtnStyle, textDecoration: 'none' }}>
                        <Video size={13} /> Join <ExternalLink size={11} />
                      </a>
                    )}
                    <button onClick={() => handleCancelBooking(b)} disabled={cancelingId === b.id} style={dangerBtnStyle}>
                      <Trash2 size={13} /> {cancelingId === b.id ? '…' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details style={{ marginTop: 18 }}>
              <summary style={{ fontSize: 12.5, fontWeight: 700, color: theme.textMuted, cursor: 'pointer' }}>Past / canceled ({past.length})</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {past.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', fontSize: 12.5, color: theme.textMuted }}>
                    <span>{b.name} — {formatBookingTime(b.start_time)}</span>
                    <span style={pill(b.status === 'canceled' ? '#dc2626' : '#64748b', b.status === 'canceled' ? '#fef2f2' : '#f1f5f9')}>{b.status}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {confirmDialog}
      </div>
    </div>
  );
}
