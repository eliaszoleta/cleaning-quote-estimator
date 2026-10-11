-- Self-hosted Calendly replacement: a public /book-a-call page where
-- prospects (cleaning-business owners interested in the website product or
-- partner program) book a time with the admin, which creates a real Google
-- Calendar event (with an auto-generated Google Meet link) on the admin's
-- own connected calendar. The admin connects their Google account once
-- (google_calendar_connection), sets their weekly availability
-- (booking_settings), and every booking gets a row in `bookings` that the
-- reminder scheduler (see services/bookingReminderScheduler.js) polls to
-- send the 24h/3h/30min-before reminder emails.
--
-- No RLS policies beyond enabling it -- same as website_requests and the
-- email marketing tables: every route touching these goes through the
-- backend's service-role key, never the anon key directly.

-- Single-row table (id always 1) holding the admin's weekly availability.
-- Kept as one editable row rather than a config file so it's changeable
-- from the admin dashboard without a redeploy.
CREATE TABLE IF NOT EXISTS booking_settings (
  id                  int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- { mon: [{start:'09:00', end:'17:00'}], tue: [...], ... } in the
  -- timezone below -- an empty array for a day means unavailable that day.
  weekly_hours        jsonb NOT NULL DEFAULT '{"mon":[{"start":"09:00","end":"17:00"}],"tue":[{"start":"09:00","end":"17:00"}],"wed":[{"start":"09:00","end":"17:00"}],"thu":[{"start":"09:00","end":"17:00"}],"fri":[{"start":"09:00","end":"17:00"}],"sat":[],"sun":[]}',
  slot_duration_mins  int NOT NULL DEFAULT 30,
  buffer_mins         int NOT NULL DEFAULT 0,  -- gap enforced between consecutive bookings
  min_notice_hours    int NOT NULL DEFAULT 4,  -- can't book a slot starting sooner than this from now
  max_days_ahead      int NOT NULL DEFAULT 30, -- furthest out a slot can be booked
  timezone            text NOT NULL DEFAULT 'America/Chicago', -- IANA name; all weekly_hours times are in this zone
  updated_at          timestamptz NOT NULL DEFAULT now()
);
INSERT INTO booking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Single-row table (id always 1) holding the admin's Google OAuth tokens.
-- access_token is short-lived and refreshed automatically (see
-- googleCalendar.js's getValidClient) using refresh_token, which only
-- Google's consent screen with access_type=offline ever issues -- stored
-- here so the connection survives a backend restart.
CREATE TABLE IF NOT EXISTS google_calendar_connection (
  id              int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  google_email    text,
  access_token    text,
  refresh_token   text,
  token_expiry    timestamptz,
  connected_at    timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),

  name                  text NOT NULL,
  email                 text NOT NULL,
  phone                 text,
  company_name          text,
  notes                 text, -- what they'd like to discuss, free text from the booking form

  start_time            timestamptz NOT NULL,
  end_time              timestamptz NOT NULL,

  status                text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'canceled')),
  canceled_at           timestamptz,
  canceled_by           text CHECK (canceled_by IN ('visitor', 'admin')),

  google_event_id       text, -- lets the admin-side cancel route delete the real calendar event, not just this row
  meet_link             text,

  -- Random, unguessable token for the public /cancel-booking?token=...
  -- page -- same no-login-system pattern website_requests uses for its
  -- /website-approval/:token flow.
  cancel_token          text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- Set the moment each reminder actually sends, so the scheduler's
  -- "is this one due" check also doubles as "have I already sent this one"
  -- -- a missed/delayed tick can't double-send once this is non-null.
  reminder_24h_sent_at  timestamptz,
  reminder_3h_sent_at   timestamptz,
  reminder_30m_sent_at  timestamptz
);

CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings(start_time);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_cancel_token_idx ON bookings(cancel_token);

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
