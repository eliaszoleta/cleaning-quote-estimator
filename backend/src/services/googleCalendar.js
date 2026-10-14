// Thin wrapper around googleapis for the self-hosted Calendly replacement
// (/book-a-call). One Google account is connected at a time -- the admin's
// own -- tokens live in the single-row google_calendar_connection table
// (see migration 015), not per-user, since this app has exactly one person
// taking these calls.
//
// access_type:'offline' + prompt:'consent' on the auth URL is what makes
// Google actually issue a refresh_token (it otherwise only does this once,
// ever, per Google account + OAuth client pair -- forcing the consent
// screen again guarantees we get one even on a reconnect). getValidClient
// below hands the OAuth2Client the stored refresh_token and listens for the
// 'tokens' event googleapis fires whenever it silently refreshes the
// access_token mid-call, persisting the new one back to Supabase so the
// connection survives restarts without the admin reconnecting.
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) return null;
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function isConfigured() {
  return !!getOAuthClient();
}

function getAuthUrl() {
  const client = getOAuthClient();
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

// Exchanges the one-time ?code=... Google redirects back with for real
// tokens, fetches the connected account's own email (shown in the admin UI
// so it's obvious *which* Google account is wired up), and stores both.
async function handleOAuthCallback(code) {
  const client = getOAuthClient();
  if (!client) throw new Error('Google OAuth not configured');
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');

  const row = {
    id: 1,
    google_email: userInfo.email,
    access_token: tokens.access_token,
    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  // Only set refresh_token when Google actually sent one -- omitting the key
  // entirely (rather than writing null) means an upsert can't accidentally
  // wipe a previously-stored one on some edge case where Google withholds it.
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;

  const { error } = await sb.from('google_calendar_connection').upsert(row);
  if (error) throw error;
  return userInfo.email;
}

async function disconnect() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('google_calendar_connection').update({
    google_email: null, access_token: null, refresh_token: null, token_expiry: null, connected_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
}

async function getConnectionStatus() {
  const sb = getSupabase();
  if (!sb) return { connected: false };
  const { data } = await sb.from('google_calendar_connection').select('google_email, connected_at, refresh_token').eq('id', 1).maybeSingle();
  return { connected: !!data?.refresh_token, email: data?.google_email || null, connectedAt: data?.connected_at || null };
}

// Returns an authenticated OAuth2Client, or null if nothing is connected
// yet. Every calendar.* call below goes through this rather than caching a
// client module-level, since the stored refresh_token can change (a
// reconnect, or googleapis rotating it) between calls.
async function getValidClient() {
  const client = getOAuthClient();
  if (!client) return null;
  const sb = getSupabase();
  if (!sb) return null;

  const { data: conn } = await sb.from('google_calendar_connection').select('*').eq('id', 1).maybeSingle();
  if (!conn || !conn.refresh_token) return null;

  client.setCredentials({
    access_token: conn.access_token || undefined,
    refresh_token: conn.refresh_token,
    expiry_date: conn.token_expiry ? new Date(conn.token_expiry).getTime() : undefined,
  });

  client.on('tokens', (tokens) => {
    const update = { updated_at: new Date().toISOString() };
    if (tokens.access_token) update.access_token = tokens.access_token;
    if (tokens.refresh_token) update.refresh_token = tokens.refresh_token;
    if (tokens.expiry_date) update.token_expiry = new Date(tokens.expiry_date).toISOString();
    sb.from('google_calendar_connection').update(update).eq('id', 1)
      .then(({ error }) => { if (error) console.warn('persist refreshed Google token failed:', error.message); });
  });

  return client;
}

// [{start, end}] ISO strings -- busy blocks on the connected calendar
// within the window, used by the availability endpoint to filter out slots
// that collide with something already on the admin's real calendar (not
// just other /book-a-call bookings).
async function getBusyIntervals(timeMinISO, timeMaxISO) {
  const client = await getValidClient();
  if (!client) return [];
  const calendar = google.calendar({ version: 'v3', auth: client });
  const res = await calendar.freebusy.query({
    requestBody: { timeMin: timeMinISO, timeMax: timeMaxISO, items: [{ id: 'primary' }] },
  });
  return res.data.calendars?.primary?.busy || [];
}

// Creates the real calendar event with an auto-generated Meet link.
// sendUpdates:'all' makes Google also email the attendee its own native
// calendar invite (so it lands directly in their calendar app if they use
// one) -- on top of, not instead of, our own friendlier confirmation email
// sent separately by the booking route.
async function createMeetEvent({ name, email, companyName, notes, startISO, endISO, timezone }) {
  const client = await getValidClient();
  if (!client) throw new Error('Google Calendar not connected');
  const calendar = google.calendar({ version: 'v3', auth: client });

  const summary = companyName ? `Call with ${name} (${companyName})` : `Call with ${name}`;
  const description = [
    'Booked via cleanestimator.com/book-a-call',
    companyName ? `Company: ${companyName}` : null,
    `Email: ${email}`,
    notes ? `What they'd like to discuss: ${notes}` : null,
  ].filter(Boolean).join('\n');

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO, timeZone: timezone },
      end: { dateTime: endISO, timeZone: timezone },
      attendees: [{ email, displayName: name }],
      conferenceData: {
        createRequest: { requestId: uuidv4(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      reminders: { useDefault: true },
    },
  });

  const meetLink = res.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
    || res.data.hangoutLink
    || null;

  return { eventId: res.data.id, meetLink };
}

async function cancelEvent(eventId) {
  const client = await getValidClient();
  if (!client || !eventId) return;
  const calendar = google.calendar({ version: 'v3', auth: client });
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
  } catch (err) {
    // 404/410 = already gone on Google's side -- not a reason to fail our
    // own cancellation, which has already happened in our DB regardless.
    if (err.code !== 404 && err.code !== 410) throw err;
  }
}

module.exports = {
  isConfigured,
  getAuthUrl,
  handleOAuthCallback,
  disconnect,
  getConnectionStatus,
  getBusyIntervals,
  createMeetEvent,
  cancelEvent,
};
