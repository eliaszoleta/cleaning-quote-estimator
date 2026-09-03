-- Local Partner Program schema
-- Run in Supabase SQL editor (or via supabase CLI) if these tables don't
-- already exist in your project -- safe to re-run, every statement is
-- idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Note on RLS: the admin panel (/admin/partners) authenticates with a plain
-- client-side password check, not Supabase Auth, and writes directly from
-- the browser using the anon key. That means these anon policies have to
-- allow full read/write for the admin panel to work at all -- the password
-- screen is a UI speed bump, not a real access boundary. Anyone with the
-- anon key (visible in the deployed JS bundle) could call the Supabase REST
-- API directly and bypass it. Acceptable for now given the low stakes of a
-- wrong/junk partner row, but worth hardening later (real Supabase Auth +
-- role check, or routing writes through the Railway backend with the
-- service role key) before this handles anything more sensitive.

-- ─── partners ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  logo_url      TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_partners" ON partners;
CREATE POLICY "anon_select_partners" ON partners FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_insert_partners" ON partners;
CREATE POLICY "anon_insert_partners" ON partners FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_partners" ON partners;
CREATE POLICY "anon_update_partners" ON partners FOR UPDATE USING (true);

DROP POLICY IF EXISTS "anon_delete_partners" ON partners;
CREATE POLICY "anon_delete_partners" ON partners FOR DELETE USING (true);

-- ─── partner_locations ──────────────────────────────────────────────────────
-- One row per city/state a partner serves -- findPartner() in
-- partnerLookup.js matches a visitor's city+state against these.
CREATE TABLE IF NOT EXISTS partner_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partner_locations_partner_id_idx ON partner_locations(partner_id);
CREATE INDEX IF NOT EXISTS partner_locations_city_state_idx ON partner_locations(city, state);

ALTER TABLE partner_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_partner_locations" ON partner_locations;
CREATE POLICY "anon_select_partner_locations" ON partner_locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_insert_partner_locations" ON partner_locations;
CREATE POLICY "anon_insert_partner_locations" ON partner_locations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_partner_locations" ON partner_locations;
CREATE POLICY "anon_delete_partner_locations" ON partner_locations FOR DELETE USING (true);

-- ─── partner_banner_events ──────────────────────────────────────────────────
-- Fire-and-forget KPI log from logBannerEvent() in partnerLookup.js -- one
-- row per banner impression or call-button click, so each partner's
-- performance can be reported back to them.
CREATE TABLE IF NOT EXISTS partner_banner_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'call_click')),
  page_path  TEXT,
  is_mobile  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partner_banner_events_partner_id_idx ON partner_banner_events(partner_id);

ALTER TABLE partner_banner_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_banner_events" ON partner_banner_events;
CREATE POLICY "anon_insert_banner_events" ON partner_banner_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_banner_events" ON partner_banner_events;
CREATE POLICY "anon_select_banner_events" ON partner_banner_events FOR SELECT USING (true);

-- ─── partner_banner_stats (view) ────────────────────────────────────────────
-- Impressions/calls per partner, read by AdminPartners.js. Views inherit the
-- RLS of their underlying tables (already anon-readable above), so no
-- separate policy is needed here.
CREATE OR REPLACE VIEW partner_banner_stats AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click')  AS calls
FROM partner_banner_events
GROUP BY partner_id;
