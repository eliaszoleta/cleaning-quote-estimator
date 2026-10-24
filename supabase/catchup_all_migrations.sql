-- ============================================================
-- Full schema catch-up / repair script
-- Concatenation of migrations 001-029, run in order, so you can
-- run this ONE script instead of guessing which of the 29 were
-- actually applied to the live database. Every statement here is
-- idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING / DROP+CREATE)
-- so re-running this against an already-up-to-date database is a
-- safe no-op. Generated 2026-10-24.
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────
-- CleanCalc Initial Schema
-- Run in Supabase SQL editor or via supabase CLI

-- ─── cleaning_company_configs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cleaning_company_configs (
  company_id TEXT PRIMARY KEY,
  config     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cleaning_company_configs ENABLE ROW LEVEL SECURITY;

-- Companies can only read/write their own config
DROP POLICY IF EXISTS "company_select_own" ON cleaning_company_configs;
CREATE POLICY "company_select_own" ON cleaning_company_configs
  FOR SELECT USING (auth.uid()::text = company_id);

DROP POLICY IF EXISTS "company_insert_own" ON cleaning_company_configs;
CREATE POLICY "company_insert_own" ON cleaning_company_configs
  FOR INSERT WITH CHECK (auth.uid()::text = company_id);

DROP POLICY IF EXISTS "company_update_own" ON cleaning_company_configs;
CREATE POLICY "company_update_own" ON cleaning_company_configs
  FOR UPDATE USING (auth.uid()::text = company_id);

-- Service role (backend) can do everything
DROP POLICY IF EXISTS "service_role_all" ON cleaning_company_configs;
CREATE POLICY "service_role_all" ON cleaning_company_configs
  FOR ALL USING (auth.role() = 'service_role');

-- Public read for widget config (anon can read any config — branding only, handled in app)
DROP POLICY IF EXISTS "anon_select_all" ON cleaning_company_configs;
CREATE POLICY "anon_select_all" ON cleaning_company_configs
  FOR SELECT USING (auth.role() = 'anon');

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            TEXT REFERENCES cleaning_company_configs(company_id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  service_type          TEXT NOT NULL,
  zip                   TEXT,
  state                 TEXT,
  estimated_price_low   NUMERIC,
  estimated_price_high  NUMERIC,
  timeline              TEXT,
  preferred_contact     TEXT,
  service_details       JSONB DEFAULT '{}',
  custom_answers        JSONB DEFAULT '{}',
  notes                 TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_company_id_idx ON leads(company_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_service_type_idx ON leads(service_type);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anonymous can insert leads (widget submissions)
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Companies can view their own leads
DROP POLICY IF EXISTS "company_select_leads" ON leads;
CREATE POLICY "company_select_leads" ON leads
  FOR SELECT USING (auth.uid()::text = company_id);

-- Companies can update their own leads (notes, soft delete)
DROP POLICY IF EXISTS "company_update_leads" ON leads;
CREATE POLICY "company_update_leads" ON leads
  FOR UPDATE USING (auth.uid()::text = company_id);

-- Service role can do everything
DROP POLICY IF EXISTS "service_role_leads_all" ON leads;
CREATE POLICY "service_role_leads_all" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Helper function: update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Guarded (original 001 had no DROP TRIGGER IF EXISTS) so this catch-up
-- script stays safe to re-run even if 001 already applied cleanly.
DROP TRIGGER IF EXISTS update_cleaning_company_configs_updated_at ON cleaning_company_configs;
CREATE TRIGGER update_cleaning_company_configs_updated_at
  BEFORE UPDATE ON cleaning_company_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────────
-- 002_partners.sql
-- ─────────────────────────────────────────────────────────
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
-- Guarded with DROP VIEW first (not just CREATE OR REPLACE) -- this
-- script replays the view's full history in order, and Postgres refuses
-- "CREATE OR REPLACE VIEW" when it would drop a column that exists on
-- the CURRENT live view (error 42P16). If the live DB is already at a
-- later version of this view (more columns than this step defines),
-- replacing in place fails; dropping first always works.
DROP VIEW IF EXISTS partner_banner_stats;
CREATE VIEW partner_banner_stats AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click')  AS calls
FROM partner_banner_events
GROUP BY partner_id;


-- ─────────────────────────────────────────────────────────
-- 003_client_portal_rls.sql
-- ─────────────────────────────────────────────────────────
-- Security rules for the self-service partner login at /client.
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Run AFTER 002_partners.sql. Idempotent -- safe to re-run.
--
-- Why this is needed: 002_partners.sql only grants access to the "anon"
-- role, which is what /admin/partners uses since it has no real login. A
-- partner signed in at /client via Supabase Auth runs their queries as the
-- "authenticated" role instead, which has no policies at all until this
-- file runs -- so without it, a logged-in partner's dashboard just comes
-- back empty (blocked by RLS), not broken exactly, but not working either.
--
-- These policies grant read-only access, scoped to the partner's own row
-- only, matched by the email they signed up with (must match partners.email
-- exactly -- case-insensitive).

DROP POLICY IF EXISTS "partners can read own row" ON partners;
CREATE POLICY "partners can read own row"
  ON partners FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "partners can read own locations" ON partner_locations;
CREATE POLICY "partners can read own locations"
  ON partner_locations FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "partners can read own banner events" ON partner_banner_events;
CREATE POLICY "partners can read own banner events"
  ON partner_banner_events FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Recreate the stats view with security_invoker so it enforces the
-- querying user's own RLS (the policy just above) instead of running with
-- the view owner's (effectively superuser, RLS-bypassing) permissions --
-- without this, ANY logged-in partner could see every partner's numbers
-- through this view even with the policies above in place.
-- DROP first, same reasoning as the 002 step above (42P16 guard).
DROP VIEW IF EXISTS partner_banner_stats;
CREATE VIEW partner_banner_stats
WITH (security_invoker = true)
AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click') AS calls
FROM partner_banner_events
GROUP BY partner_id;


-- ─────────────────────────────────────────────────────────
-- 004_partner_checkout.sql
-- ─────────────────────────────────────────────────────────
-- Self-serve "buy city placement" checkout: lets a prospect pay via Stripe
-- and get provisioned as an active partner automatically, instead of an
-- admin creating the row by hand in /admin/partners. These columns are
-- written by the backend service role only (backend/src/routes/partnerCheckout.js),
-- never by the browser, so no new RLS policy is required for them.

ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ties a partner row back to the checkout session that created it, and lets
-- provisioning check "did this session already create a partner?" before
-- inserting again -- guards against the webhook and the success-page
-- verify-checkout call both firing for the same payment.
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE;


-- ─────────────────────────────────────────────────────────
-- 005_partner_logo_storage.sql
-- ─────────────────────────────────────────────────────────
-- Storage bucket for logos uploaded during the self-serve "buy city
-- placement" checkout (backend/src/routes/partnerCheckout.js). Public read
-- so uploaded logos can be shown directly via <img src>, same as any
-- externally-hosted logo URL a partner could already paste into the
-- Logo URL field. Writes only ever happen from the backend using the
-- service role key (which bypasses storage RLS entirely), so no INSERT
-- policy is added here -- the browser never gets direct write access.
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────
-- 006_partner_lead_events.sql
-- ─────────────────────────────────────────────────────────
-- Tracks the new "lead forwarded to partner by email" event (see
-- backend/src/services/email.js sendPartnerLeadEmail, called from
-- backend/src/routes/calculate.js) as a new partner_banner_events type,
-- so it shows up in the partner's KPI dashboard (ClientDashboard.js)
-- alongside banner impressions and call-button taps.

ALTER TABLE partner_banner_events DROP CONSTRAINT IF EXISTS partner_banner_events_event_type_check;
ALTER TABLE partner_banner_events ADD CONSTRAINT partner_banner_events_event_type_check
  CHECK (event_type IN ('impression', 'call_click', 'lead_email'));

-- Recreate the stats view (still security_invoker, per 003_client_portal_rls.sql)
-- with a `leads` column alongside impressions/calls.
-- DROP first, same reasoning as the two steps above (42P16 guard) --
-- this is the final/current shape of the view, so after this point in
-- the script it's just CREATE, not CREATE OR REPLACE.
DROP VIEW IF EXISTS partner_banner_stats;
CREATE VIEW partner_banner_stats
WITH (security_invoker = true)
AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click') AS calls,
  COUNT(*) FILTER (WHERE event_type = 'lead_email') AS leads
FROM partner_banner_events
GROUP BY partner_id;


-- ─────────────────────────────────────────────────────────
-- 007_split_partner_emails.sql
-- ─────────────────────────────────────────────────────────
-- Splits the single `email` column on partners into two distinct emails,
-- since it was being used for two unrelated purposes at once: matching a
-- logged-in /client user to their listing, AND as the destination for
-- forwarded leads (backend/src/routes/calculate.js sendPartnerLeadEmail).
-- A partner's dashboard login and their business inbox are very often
-- different addresses (owner's personal email vs. a shared business
-- inbox), so conflating them forced a partner to either share their
-- personal login email publicly as their lead-forwarding address, or vice
-- versa.
--
-- business_email -- where leads get forwarded, shown publicly (results
--   card, floating banner mailto: link, estimate email).
-- personal_email -- matched against auth.jwt() ->> 'email' at /client
--   login. Never shown publicly.

-- Guarded (original 007 ran RENAME COLUMN unconditionally, which errors
-- "column email does not exist" if this already ran once) so this
-- catch-up script stays safe to re-run either way.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'email')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'business_email') THEN
    ALTER TABLE partners RENAME COLUMN email TO business_email;
  END IF;
END $$;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Backfill so existing partners (created before this migration, when
-- there was only one email) don't lose /client access -- their one email
-- becomes both their business and personal email until an admin or the
-- partner themselves updates it.
UPDATE partners SET personal_email = business_email WHERE personal_email IS NULL;

-- Re-point the /client RLS policies (003_client_portal_rls.sql) at
-- personal_email instead of the now-renamed business_email.
DROP POLICY IF EXISTS "partners can read own row" ON partners;
CREATE POLICY "partners can read own row"
  ON partners FOR SELECT
  TO authenticated
  USING (lower(personal_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "partners can read own locations" ON partner_locations;
CREATE POLICY "partners can read own locations"
  ON partner_locations FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE lower(personal_email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "partners can read own banner events" ON partner_banner_events;
CREATE POLICY "partners can read own banner events"
  ON partner_banner_events FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE lower(personal_email) = lower(auth.jwt() ->> 'email')
    )
  );


-- ─────────────────────────────────────────────────────────
-- 008_lock_down_rls.sql
-- ─────────────────────────────────────────────────────────
-- Locks down RLS policies that were wide open to the public anon key.
-- Run this in the Supabase SQL editor (or via `supabase db push`) AFTER
-- deploying the backend/frontend changes that move admin partner writes
-- and public company-config reads off direct anon-key Supabase access --
-- running it before that deploy will break the (already-replaced)
-- AdminPartners.js write path if the old frontend build is still live.
--
-- Background: see backend/src/routes/admin.js's new /partners routes and
-- AdminPartners.js's rewrite to use them instead of writing to Supabase
-- directly from the browser.

-- ─── cleaning_company_configs ──────────────────────────────────────────────
-- "anon_select_all" let anyone with the public anon key SELECT every
-- company's entire config row -- including apiKey (unlocks their leads via
-- /api/leads), Stripe customer/subscription ids, phone, website, everything.
-- Nothing in the app actually needs this: the embedded widget's public
-- branding data is served by the backend (GET /api/company/:id/public)
-- using the service role key, which bypasses RLS entirely and already
-- filters the response down to branding-only fields server-side.
DROP POLICY IF EXISTS "anon_select_all" ON cleaning_company_configs;

-- ─── partners ───────────────────────────────────────────────────────────────
-- SELECT stays open -- genuinely needed by anonymous visitors:
--   - findPartner() in partnerLookup.js (results-page partner matching)
--   - ClientAuthPage.js's pre-signup "does a listing with this email exist"
--     check, which runs before any session exists
-- INSERT/UPDATE/DELETE were `WITH CHECK (true)` / `USING (true)` -- anyone
-- with the anon key could create, edit, or delete any partner's listing
-- with no auth at all. All partner writes now go through
-- backend/src/routes/admin.js (x-admin-key + service role, which bypasses
-- RLS), so these policies aren't needed by the app anymore.
DROP POLICY IF EXISTS "anon_insert_partners" ON partners;
DROP POLICY IF EXISTS "anon_update_partners" ON partners;
DROP POLICY IF EXISTS "anon_delete_partners" ON partners;

-- ─── partner_locations ──────────────────────────────────────────────────────
-- Same story: SELECT stays open (findPartner() needs it), INSERT/DELETE
-- (there was never an anon UPDATE policy on this table) move to the backend.
DROP POLICY IF EXISTS "anon_insert_partner_locations" ON partner_locations;
DROP POLICY IF EXISTS "anon_delete_partner_locations" ON partner_locations;

-- ─── partner_banner_events ──────────────────────────────────────────────────
-- INSERT stays open -- logBannerEvent() in partnerLookup.js is a genuine
-- fire-and-forget beacon from anonymous visitor browsers (banner
-- impressions/call-clicks), no session to attach it to.
-- SELECT was also anon-open but isn't needed by anyone anonymous: the
-- former reader (AdminPartners.js) now goes through the backend/service
-- role, and the other reader (ClientDashboard.js, a partner viewing their
-- own KPIs) is already covered by the "partners can read own banner
-- events" authenticated policy from 007_split_partner_emails.sql, scoped
-- to their own partner_id via a real Supabase Auth session.
DROP POLICY IF EXISTS "anon_select_banner_events" ON partner_banner_events;


-- ─────────────────────────────────────────────────────────
-- 009_lock_down_leads_insert.sql
-- ─────────────────────────────────────────────────────────
-- Locks down the one remaining wide-open anon policy from
-- 001_initial_schema.sql: "anon_insert_leads" on the `leads` table.
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ─── leads ──────────────────────────────────────────────────────────────────
-- "anon_insert_leads" was `WITH CHECK (true)` -- anyone with the public anon
-- key could POST arbitrary rows directly to /rest/v1/leads, with no
-- validation at all (fake names/emails, made-up prices, junk service types),
-- completely bypassing the calculator's own validation in
-- backend/src/routes/calculate.js.
--
-- Nothing in the app actually needs this policy. Every real lead is written
-- by saveLead() in backend/src/routes/leads.js, which uses the Supabase
-- service role key (see SERVICE_KEY() / dbHeaders() in that file) -- service
-- role bypasses RLS entirely, so it was never relying on this policy to
-- begin with. No frontend code ever calls supabase.from('leads').insert(...)
-- with the anon client. Safe to drop.
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;


-- ─────────────────────────────────────────────────────────
-- 010_company_logo_storage.sql
-- ─────────────────────────────────────────────────────────
-- Storage bucket for logos uploaded from the company dashboard's Branding
-- tab (backend/src/routes/company.js, POST /:id/upload-logo). Separate
-- from partner-logos (005_partner_logo_storage.sql) since these are two
-- different kinds of accounts -- keeps a company's widget-branding upload
-- traffic/storage from sharing a bucket meant for the partner-directory
-- checkout flow. Public read so uploaded logos can be shown directly via
-- <img src>, same as any externally-hosted logo URL a company could
-- already paste into the Logo URL field. Writes only ever happen from the
-- backend using the service role key (which bypasses storage RLS
-- entirely), so no INSERT policy is added here -- the browser never gets
-- direct write access.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────
-- 011_website_requests.sql
-- ─────────────────────────────────────────────────────────
-- Persists "Get a Website" applications (previously email-only -- see
-- backend/src/routes/websiteRequest.js's original comment: "there's no
-- dashboard or lead list for these... the email *is* the record") so there's
-- something to review, mark sample-ready, and carry through the approval +
-- billing flow: a $5 one-time setup fee, 2 months free, then $249/month
-- starting month 3 (a Stripe subscription with a 60-day trial).

CREATE TABLE IF NOT EXISTS website_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  name text NOT NULL,
  business text NOT NULL,
  email text NOT NULL,
  phone text,
  services_offered text,
  other_services text,
  business_address text,
  service_areas text,
  has_domain boolean NOT NULL DEFAULT false,
  domain1 text,
  domain2 text,
  domain3 text,
  current_website text,
  facebook_page text,
  message text,

  -- submitted -> sample_ready (admin built it, prospect notified) ->
  -- approved (prospect paid the $5 setup fee) -> active (subscription
  -- created, trial running) -> declined (prospect passed, or admin closed
  -- it out).
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'sample_ready', 'approved', 'active', 'declined')),
  sample_url text,
  admin_notes text,

  -- Random, unguessable token for the public /website-approval/:token page.
  -- This flow has no login system of its own -- the prospect isn't a
  -- logged-in company user -- so the token IS the auth.
  approval_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  stripe_customer_id text,
  stripe_setup_session_id text,
  setup_fee_paid_at timestamptz,
  stripe_subscription_id text,
  subscription_started_at timestamptz
);

CREATE INDEX IF NOT EXISTS website_requests_status_idx ON website_requests (status);
CREATE INDEX IF NOT EXISTS website_requests_approval_token_idx ON website_requests (approval_token);

ALTER TABLE website_requests ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies -- every access goes through the backend's
-- service-role-key Supabase client (routes/websiteRequest.js, routes/admin.js),
-- which bypasses RLS entirely. The public approval page reads/writes through
-- a token-gated backend API route, not a direct Supabase client call, so
-- there's no case where this table needs to be reachable with the anon key
-- (see 008_lock_down_rls.sql / 009_lock_down_leads_insert.sql for why that
-- matters here).


-- ─────────────────────────────────────────────────────────
-- 012_website_requests_cancel.sql
-- ─────────────────────────────────────────────────────────
-- Adds a 'canceled' status for website_requests so an admin can cancel an
-- active client's Stripe subscription (see POST
-- /api/admin/website-requests/:id/cancel-subscription in routes/admin.js)
-- without reusing 'declined' -- that means "never became a customer," which
-- reads wrong for someone who was paying and stopped, and would muddy any
-- future reporting that wants to tell the two apart.

ALTER TABLE website_requests DROP CONSTRAINT IF EXISTS website_requests_status_check;
ALTER TABLE website_requests ADD CONSTRAINT website_requests_status_check
  CHECK (status IN ('submitted', 'sample_ready', 'approved', 'active', 'declined', 'canceled'));

ALTER TABLE website_requests ADD COLUMN IF NOT EXISTS canceled_at timestamptz;


-- ─────────────────────────────────────────────────────────
-- 013_leads_user_type.sql
-- ─────────────────────────────────────────────────────────
-- Lets a visitor tell us whether they're a homeowner or a cleaning
-- business/cleaner at the lead-capture step, so the admin and company lead
-- dashboards can filter one from the other instead of everyone piling into
-- one undifferentiated list.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_type TEXT;
-- Original migration 013 added this constraint unguarded (no DROP ...
-- IF EXISTS first, unlike every later CHECK-constraint migration in this
-- repo) -- patched here to the same guarded pattern so this catch-up
-- script stays safe to re-run even if 013 already applied cleanly.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_user_type_check;
ALTER TABLE leads ADD CONSTRAINT leads_user_type_check
  CHECK (user_type IS NULL OR user_type IN ('homeowner', 'business'));


-- ─────────────────────────────────────────────────────────
-- 014_email_marketing.sql
-- ─────────────────────────────────────────────────────────
-- Email marketing: templates (including the app's existing lifecycle/
-- transactional emails, migrated here from hardcoded strings in email.js so
-- they're editable from the admin dashboard), campaigns (bulk/scheduled
-- sends to leads, companies, or partners), and a send log -- every
-- individual email, whether triggered automatically by the app or sent
-- manually/in bulk from the admin dashboard, gets a row here. That log is
-- what the KPI view (sent/delivered/bounced/opened/etc) is built from.
-- Resend's webhook (see routes/emailMarketing.js) updates existing rows in
-- place as delivery events come in.
--
-- No RLS policies beyond enabling it (same as website_requests) -- nothing
-- here is ever touched by a visitor-facing route or the anon key, only the
-- backend's service-role key.

CREATE TABLE IF NOT EXISTS email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE, -- set only for the app's built-in lifecycle emails (e.g. 'trial_ending_soon'), looked up by code at send time; NULL for templates created freely in the admin UI for manual/bulk sends
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'marketing' CHECK (category IN ('marketing', 'lifecycle')),
  subject     TEXT NOT NULL,
  html_body   TEXT NOT NULL,
  text_body   TEXT NOT NULL,
  variables   JSONB NOT NULL DEFAULT '[]', -- [{ name, example }] -- documents which {{tokens}} this template supports, shown in the editor and used to build a live preview
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  audience      JSONB NOT NULL DEFAULT '{}', -- { sources: ['leads','companies','partners'], filters: {...} } -- resolved to an actual recipient list at send time, not stored as a frozen list up front
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'canceled')),
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES email_campaigns(id) ON DELETE SET NULL, -- NULL = one-off individual send, not part of a campaign
  template_id     UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_key    TEXT, -- snapshot of the template's key (for automated lifecycle sends) at send time, so this row stays meaningful even if the template is later renamed/deleted
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  recipient_type  TEXT CHECK (recipient_type IN ('lead', 'company', 'partner', 'other')),
  recipient_ref   TEXT, -- the source lead/company/partner id, for traceability back to its row
  subject         TEXT,
  resend_email_id TEXT, -- Resend's id for this send, used to match incoming webhook delivery events back to this row
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped', 'complained')),
  failed_reason   TEXT,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  bounced_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_sends_campaign_id_idx ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_resend_email_id_idx ON email_sends(resend_email_id);
CREATE INDEX IF NOT EXISTS email_sends_created_at_idx ON email_sends(created_at DESC);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns(status);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────
-- 015_booking_calendar.sql
-- ─────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────
-- 016_website_requests_plan_tier.sql
-- ─────────────────────────────────────────────────────────
-- Adds a plan_tier to website_requests so the "Get a Website" offer can be
-- sold at 3 different price points instead of one flat $249/mo:
--   starter ($97/mo)  -- website + quote form with email alerts
--   growth  ($179/mo) -- + AI chatbot with conversation-summary email alerts
--   pro     ($249/mo) -- + business phone number + lead app (all chatbot
--                        conversations, texts and inquiries live there,
--                        reply/call back from it, calls route there)
-- Defaults to 'pro' so every row created before this migration (all of
-- which were sold at the old flat $249/mo) keeps reporting the price they
-- actually agreed to, and so the admin's manual-add path (which doesn't
-- collect a tier) still lands on a sane value.

ALTER TABLE website_requests ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'pro';

ALTER TABLE website_requests DROP CONSTRAINT IF EXISTS website_requests_plan_tier_check;
ALTER TABLE website_requests ADD CONSTRAINT website_requests_plan_tier_check
  CHECK (plan_tier IN ('starter', 'growth', 'pro'));


-- ─────────────────────────────────────────────────────────
-- 017_chatbots.sql
-- ─────────────────────────────────────────────────────────
-- Per-client AI lead-capture chatbot, embedded on each Growth/Pro subscriber's
-- website (see WebsiteSubscription.js's Growth/Pro tier copy). One shared
-- widget bundle + one shared backend serve every client; each row in
-- `chatbots` is a separate client config (business info -> system prompt,
-- where lead alerts go, what "From" name those alerts show), not a
-- separate deployment. The embed snippet just carries that row's id.
--
-- No RLS policies beyond enabling it -- same as website_requests, bookings,
-- and the email marketing tables: every route touching these goes through
-- the backend's service-role key, never the anon key directly.

CREATE TABLE IF NOT EXISTS chatbots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  business_name     text NOT NULL,
  -- Free text describing the client's business, services, hours, service
  -- area, pricing notes, etc. -- folded into the system prompt so the
  -- chatbot can actually answer questions about that specific business
  -- instead of giving generic cleaning-industry answers.
  prompt_info       text NOT NULL DEFAULT '',

  lead_alert_email  text NOT NULL, -- where captured-lead/summary emails go
  -- Resend "From" display name for alerts on this chatbot (e.g. "Sparkle
  -- Clean Leads"). The From *address* always stays on our own verified
  -- sending domain (Resend can't send authenticated mail through a domain
  -- it hasn't verified) -- see sendChatbotLeadAlertEmail in email.js, same
  -- pattern sendEstimateEmail already uses for a company's own brand name.
  -- Falls back to business_name when unset.
  from_name         text,

  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused'))
);

CREATE TABLE IF NOT EXISTS chatbot_leads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id            uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Phone is the identity key for "is this a returning visitor" -- names
  -- collide far too often to key on. Stored as whatever digits the
  -- chatbot's save_contact tool call validated, not reformatted.
  phone                 text NOT NULL,
  name                  text,

  last_summary          text, -- most recent conversation's structured summary (what they need, urgency, details)
  last_conversation_at  timestamptz,

  UNIQUE (chatbot_id, phone)
);
CREATE INDEX IF NOT EXISTS chatbot_leads_chatbot_phone_idx ON chatbot_leads(chatbot_id, phone);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id        uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  lead_id           uuid REFERENCES chatbot_leads(id) ON DELETE SET NULL, -- null until save_contact fires

  -- Random, unguessable token the widget stores in localStorage so a
  -- visitor's browser can resume its own session across page loads --
  -- same no-login-system pattern as website_requests' approval token and
  -- bookings' cancel_token.
  session_token     text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- Full transcript as [{role, content}, ...] -- kept here rather than a
  -- separate messages table since it's always read/written as a whole per
  -- turn, never queried message-by-message.
  messages          jsonb NOT NULL DEFAULT '[]',

  status            text NOT NULL DEFAULT 'gathering_contact'
    CHECK (status IN ('gathering_contact', 'active', 'summarized')),

  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chatbot_conversations_session_token_idx ON chatbot_conversations(session_token);
-- Powers the inactivity sweep (services/chatbotSummaryScheduler.js): find
-- every non-summarized conversation that's gone quiet.
CREATE INDEX IF NOT EXISTS chatbot_conversations_status_activity_idx ON chatbot_conversations(status, last_activity_at);

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────
-- 018_public_estimate_business_limit.sql
-- ─────────────────────────────────────────────────────────
-- Caps how many free estimates a self-identified cleaning business can run
-- per day on the public, unbranded calculator (cleanestimator.com itself --
-- homepage, state/city/service pages, the dedicated /cleaning-cost-calculator
-- page -- anywhere CleaningCalculator renders with no companyId). The whole
-- point of the $25/mo Internal Estimator plan is unlimited calculations for
-- a cleaning business's own quoting; without this, a business could just
-- keep using the free consumer-facing tool instead of ever subscribing.
--
-- Only ever written for an attempt where LeadCaptureStep.js's "I am a..."
-- question was answered "Cleaning business / cleaner" (leadInfo.userType
-- === 'business') -- a homeowner pricing their own one-off job is never
-- tracked here and never limited. Checked by whichever of ip/email/phone
-- matches (see services/publicEstimateLimit.js), not just one, since any of
-- the three alone is trivial to rotate.
--
-- No RLS policies beyond enabling it -- same as every other backend-only
-- table in this app (chatbots, bookings, email marketing): only ever
-- touched via the service-role key from calculate.js, never the anon key.
CREATE TABLE IF NOT EXISTS public_estimate_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  ip          text,
  email       text,
  phone       text
);

-- Each lookup is "how many rows for this exact ip/email/phone value since
-- today started" -- one index per column keeps all three queries index-only
-- scans instead of a sequential scan filtered by created_at.
CREATE INDEX IF NOT EXISTS public_estimate_attempts_ip_created_idx ON public_estimate_attempts(ip, created_at);
CREATE INDEX IF NOT EXISTS public_estimate_attempts_email_created_idx ON public_estimate_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS public_estimate_attempts_phone_created_idx ON public_estimate_attempts(phone, created_at);

ALTER TABLE public_estimate_attempts ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────
-- 019_rewrite_trial_emails_internal_pivot.sql
-- ─────────────────────────────────────────────────────────
-- Rewrites the day-7 trial check-in email to match the internal-first
-- product pivot (see CompanyLanding.js: "unlimited, instant, on-screen
-- estimates" is now the primary pitch, with the embeddable widget as an
-- included but optional bonus -- this template was still written entirely
-- from the old "get the widget on your site" framing), and adds the new
-- payment_failed template.
--
-- UPDATE, not just relying on ensureSeeded() re-running: that function
-- upserts with ignoreDuplicates: true specifically so it never clobbers
-- an admin''s saved edit in the Email Marketing tab -- which also means
-- it will never pick up this content change on its own for a key that
-- already exists in the table.
--
-- The other three trial reminder emails this migration originally also
-- rewrote here (trial_ending_soon, trial_checkin_2, trial_checkin_3) plus
-- the trial_converted template it added were since dropped entirely --
-- see migration 022, which removes those rows rather than updating them.

UPDATE email_templates SET
  name = $body$Trial check-in — day 7$body$,
  subject = $body$Have you run your first estimate yet?$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You're about a week into your free trial — just checking in.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    The fastest way to see the value: open <strong>Calculator Mode</strong> and run a real quote for a job you're pricing this week. It takes about 10 seconds and gives you an accurate, consistent number instead of going off gut feel.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Run an estimate →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Want leads coming from your website too? That's included on the same plan — grab the embed code from the bottom of the Branding tab whenever you're ready.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If anything's confusing or not working the way you expected, just reply to this email or check the Help &amp; Docs tab — happy to help.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

You're about a week into your free trial — just checking in.

The fastest way to see the value: open Calculator Mode and run a real quote for a job you're pricing this week. It takes about 10 seconds and gives you an accurate, consistent number instead of going off gut feel.

https://www.cleanestimator.com/company

Want leads coming from your website too? That's included on the same plan -- grab the embed code from the bottom of the Branding tab whenever you're ready.

If anything's confusing or not working the way you expected, just reply to this email or check the Help & Docs tab — happy to help.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb,
  updated_at = now()
WHERE key = 'trial_checkin_1';

-- New: payment-failed notification. invoice.payment_failed used to only
-- write status=past_due to the DB with zero customer communication -- a
-- declined card silently locked the dashboard (computeSubscriptionStatus
-- treats past_due as inactive immediately) and the owner only found out
-- by logging back in.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'payment_failed',
  $body$Payment failed$body$,
  'lifecycle',
  $body$Your Clean Estimator payment didn't go through$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We tried to charge your card for Clean Estimator and it didn't go through. Your account is <strong>paused</strong> until this is resolved — no estimates can be run until your payment method is updated.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Update payment method →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

We tried to charge your card for Clean Estimator and it didn't go through. Your account is paused until this is resolved -- no estimates can be run until your payment method is updated.

Update your payment method here:
https://www.cleanestimator.com/company?tab=subscription

If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;


-- ─────────────────────────────────────────────────────────
-- 020_company_estimate_runs.sql
-- ─────────────────────────────────────────────────────────
-- Tracks every successful companyId-scoped /api/calculate call -- both
-- internal Calculator Mode and the embedded widget set companyId, so this
-- is a holistic "this account used Clean Estimator" count, not just widget
-- leads (which only capture visitors who complete the public lead form).
--
-- Why this exists: a company using Clean Estimator purely as an internal
-- pricing tool -- the primary pitch on CompanyLanding.js ("unlimited,
-- instant, on-screen estimates") -- never shows up in the `leads` table at
-- all, since no email is ever captured for an internal run. Without this
-- table, that usage left literally zero trace anywhere in the system, so
-- OverviewTab had no way to show real value to exactly the customers the
-- product is sold to. Read back by leads.js's GET /company/estimate-runs.
CREATE TABLE IF NOT EXISTS company_estimate_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT REFERENCES cleaning_company_configs(company_id) ON DELETE CASCADE,
  service_type  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One composite index -- every real query here filters by company_id and
-- either counts everything or counts since some created_at cutoff (see
-- leads.js's "this month" query), so (company_id, created_at) covers both
-- as an index-only scan instead of a sequential scan filtered by company_id.
CREATE INDEX IF NOT EXISTS company_estimate_runs_company_created_idx ON company_estimate_runs(company_id, created_at);

-- No RLS policies beyond enabling it -- same as every other backend-only
-- table in this app (public_estimate_attempts, chatbots, bookings): only
-- ever touched via the service-role key from calculate.js/leads.js, never
-- the anon key.
ALTER TABLE company_estimate_runs ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────
-- 021_cancellation_feedback.sql
-- ─────────────────────────────────────────────────────────
-- Captures the "before you go" feedback SubscriptionTab.js's Manage Billing
-- button now asks for before handing off to Stripe's hosted Billing Portal.
-- That portal is a black box this app can't inject custom UI into (no
-- stripe.billingPortal.configurations.create() call exists anywhere in this
-- repo, and Stripe doesn't expose a webhook that distinguishes "they opened
-- the portal to update a card" from "they opened it to cancel"), so this is
-- asked up front, before the redirect, rather than captured reactively --
-- the closest this codebase can get to retention-flow feedback without
-- owning the cancellation UI itself. Submitting is optional; skipping
-- proceeds straight to the portal either way.
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  TEXT REFERENCES cleaning_company_configs(company_id) ON DELETE SET NULL,
  reason      TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cancellation_feedback_company_id_idx ON cancellation_feedback(company_id);

-- No RLS policies beyond enabling it -- same as every other backend-only
-- table in this app: only ever touched via the service-role key, never the
-- anon key.
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- New: win-back email sent from customer.subscription.deleted,
-- inviting feedback and a restart link, since no cancellation email
-- existed at all before this.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'subscription_canceled',
  $body$Subscription canceled (win-back)$body$,
  'lifecycle',
  $body$Sorry to see you go — your Clean Estimator subscription has ended$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your Clean Estimator subscription has been canceled, and your account is no longer active — no more estimates can be run until you resubscribe.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If something didn't work for you, we'd genuinely like to know — just reply and tell us what happened.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Restart my subscription →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Thanks for giving it a try.
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

Your Clean Estimator subscription has been canceled, and your account is no longer active -- no more estimates can be run until you resubscribe.

If something didn't work for you, we'd genuinely like to know -- just reply and tell us what happened.

Changed your mind? You can restart anytime, same price, same plan:
https://www.cleanestimator.com/company?tab=subscription

Thanks for giving it a try.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;


-- ─────────────────────────────────────────────────────────
-- 022_drop_extra_trial_emails.sql
-- ─────────────────────────────────────────────────────────
-- Drops the trial-lifecycle emails down to just one touchpoint during the
-- trial itself (the day-7 "have you run your first estimate yet?" check-in,
-- key: trial_checkin_1) plus payment_failed and subscription_canceled,
-- which already exist as separate templates and are untouched by this
-- migration. With a card required up front, the day-14/21 check-ins and
-- the day-28 "ending soon" reminder no longer serve their original purpose
-- (nudging someone to manually subscribe before access cuts off -- Stripe
-- just charges the card automatically now), the legacy "trial ended /
-- widget paused" email only ever applied to the old no-card flow, and the
-- "trial converted to paid" confirmation was judged unnecessary alongside
-- the simplified set. The app code backing these five (trialScheduler.js,
-- the customer.subscription.updated webhook handler, and their
-- send*Email wrappers) has already been removed -- this just cleans up
-- the now-orphaned rows so they don't linger in the Email Marketing tab.
DELETE FROM email_templates
WHERE key IN ('trial_ending_soon', 'trial_checkin_2', 'trial_checkin_3', 'trial_converted', 'trial_ended');


-- ─────────────────────────────────────────────────────────
-- 023_activation_reminder_email.sql
-- ─────────────────────────────────────────────────────────
-- New: "checkout never finished" nudge, sent ~12 hours after signup to any
-- account still sitting at status 'requires_trial_setup' (shows up in the
-- admin Companies list as "Not started") -- see
-- trialScheduler.js's checkActivationReminders. Nothing emailed these
-- accounts before; they just sat there until the owner noticed in the admin
-- panel and followed up manually.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'activation_reminder',
  $body$Activation reminder — checkout never finished$body$,
  'lifecycle',
  $body$You're one step away from your free Clean Estimator trial$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You created a Clean Estimator account, but checkout was never finished — so your 30-day free trial hasn't actually started yet, and your calculator isn't active.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    It only takes a minute: add a card to activate your account, and you won't be charged anything for 30 days.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Finish setting up my trial →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If you ran into an issue or changed your mind, just reply and let me know — happy to help.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

You created a Clean Estimator account, but checkout was never finished -- so your 30-day free trial hasn't actually started yet, and your calculator isn't active.

It only takes a minute: add a card to activate your account, and you won't be charged anything for 30 days.

Finish setting up my trial:
https://www.cleanestimator.com/company

If you ran into an issue or changed your mind, just reply and let me know -- happy to help.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;


-- ─────────────────────────────────────────────────────────
-- 024_welcome_email_status_line.sql
-- ─────────────────────────────────────────────────────────
-- Replaces company_welcome's hardcoded "Your account is live and your
-- 30-day free trial has started" opening line with a {{statusLine}}
-- variable, so the same template stays accurate for both of the two
-- situations that trigger it from subscription.js's checkout.session.completed
-- webhook:
--   - A genuinely new (or no-card-trial-with-remaining-days) Stripe trial
--     -- statusLine defaults to the original "trial has started" wording.
--   - A reactivation (an expired or canceled account completing checkout
--     again), which charges the card immediately with no trial attached --
--     previously this still said "your free trial has started", which was
--     simply false for someone who was just charged $25.
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  name = $body$Company welcome / embed code$body$,
  subject = $body$Your Clean Estimator account is ready — start pricing jobs instantly$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Welcome to Clean Estimator!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    {{statusLine}} Clean Estimator is your internal pricing tool: log in, switch to <strong>Calculator Mode</strong>, and run instant, accurate price estimates for your own quoting — no price range shown to a customer, nothing to manage as a lead, just a fast number you can trust.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Open my calculator →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
    Got a result you want a teammate to see? Click <strong>“Email to Coworker”</strong> on the results screen and it goes straight to their inbox.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Want to capture leads from your website too? The same plan already includes a white-labeled, embeddable calculator widget for your site — here's your embed code:
  </p>

  <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-family:'Menlo','Monaco',monospace;font-size:11.5px;line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-all;margin:0 0 20px;">{{embedCodeHtml}}</pre>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Paste that anywhere in your website's HTML — a <strong>Custom HTML / Embed block</strong> in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If you do use it: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 8px;">
    Want to set your business name, colors, and which services you offer first? All in your <a href="https://www.cleanestimator.com/company?tab=branding" style="color:#2563eb;font-weight:700;">dashboard</a>.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:20px 0 20px;">
    New to Clean Estimator? Open the <a href="https://www.cleanestimator.com/company?tab=help" style="color:#2563eb;font-weight:700;">Help &amp; Docs</a> tab in your dashboard — it walks through how pricing is calculated (with the real data behind it) and answers to the most common questions.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    You can always get this same embed code later from the <strong>Branding</strong> tab.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Welcome to Clean Estimator!

{{statusLine}} Clean Estimator is your internal pricing tool: log in, switch to Calculator Mode, and run instant, accurate price estimates for your own quoting — no price range shown to a customer, nothing to manage as a lead, just a fast number you can trust.

Open my calculator →
https://www.cleanestimator.com/company

Got a result you want a teammate to see? Click "Email to Coworker" on the results screen and it goes straight to their inbox.

Want to capture leads from your website too? The same plan already includes a white-labeled, embeddable calculator widget for your site — here's your embed code:

{{embedCode}}

Paste that anywhere in your website's HTML — a Custom HTML / Embed block in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.

If you do use it: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.

Want to set your business name, colors, and which services you offer first? All in your dashboard:
https://www.cleanestimator.com/company?tab=branding

New to Clean Estimator? Log in to your dashboard and open the Help & Docs tab — it walks through how pricing is calculated (with the real data behind it) and answers to the most common questions:
https://www.cleanestimator.com/company?tab=help

You can always get this same embed code later from the Branding tab.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"embedCode","example":"<iframe ...>...</iframe>"},{"name":"embedCodeHtml","example":"(HTML-escaped embed code, for the &lt;pre&gt; block)"},{"name":"statusLine","example":"Your account is live and your 30-day free trial has started."}]'::jsonb,
  updated_at = now()
WHERE key = 'company_welcome';


-- ─────────────────────────────────────────────────────────
-- 025_atomic_public_estimate_limit.sql
-- ─────────────────────────────────────────────────────────
-- The public daily free-estimate limit (calculate.js's PUBLIC_DAILY_LIMIT)
-- was enforced with two separate round trips from Node -- a SELECT count
-- to check the limit, then (after the calculation itself ran) a plain
-- INSERT to record the attempt, both unsynchronized with each other. Two
-- or more requests from the same visitor arriving close together (a
-- normal "click New Estimate again" pace, no special timing needed) could
-- each run their SELECT before any of the INSERTs had landed, so each saw
-- the same under-the-limit count and all passed -- in practice letting a
-- visitor run 3+ "free" estimates against a limit of 2.
--
-- Replaces that with one atomic function: pg_advisory_xact_lock keyed by
-- a hash of the IP serializes every call for that same IP (concurrent
-- calls for *different* IPs never block each other), so the count-check
-- and the insert that follows can't be interleaved by a second call for
-- the same visitor. Called once per request (supabase.rpc(...)) in place
-- of the old separate publicDailyLimitReached + recordPublicEstimateAttempt
-- calls.
CREATE OR REPLACE FUNCTION record_public_estimate_attempt(p_ip text, p_limit int)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  IF p_ip IS NULL THEN
    RETURN true; -- no identifier to check -- never block, same as the old JS-side fail-open
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_ip));

  SELECT count(*) INTO v_count
  FROM public_estimate_attempts
  WHERE ip = p_ip AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public_estimate_attempts (ip) VALUES (p_ip);
  RETURN true;
END;
$$;


-- ─────────────────────────────────────────────────────────
-- 026_public_estimate_device_id.sql
-- ─────────────────────────────────────────────────────────
-- Adds a second identifier to the public daily-estimate limit alongside IP
-- (see migration 025 and calculate.js's PUBLIC_DAILY_LIMIT): a random id
-- the frontend persists in localStorage (deviceId.js), sent with every
-- public /api/calculate call. IP alone resets the moment a visitor switches
-- VPN servers -- this id doesn't, since VPN/proxy rotation never touches
-- localStorage, closing the laziest version of that bypass (clearing site
-- data or using a different browser still works around it, same as any
-- client-side identifier always can).
ALTER TABLE public_estimate_attempts ADD COLUMN IF NOT EXISTS device_id text;

-- Mirrors the existing ip/email/phone indexes -- "how many rows for this
-- exact device_id since today started" as an index-only scan.
CREATE INDEX IF NOT EXISTS public_estimate_attempts_device_id_created_idx ON public_estimate_attempts(device_id, created_at);

-- Replaces the migration-025 function to also check/record device_id,
-- blocking if EITHER identifier is already at the limit -- strictly more
-- restrictive than before (an attempt that was already blocked on ip alone
-- stays blocked; one that passes now must clear both checks), never less.
--
-- Drops the old 2-arg signature first -- CREATE OR REPLACE only replaces a
-- function with the SAME argument signature; a 3rd parameter (even with a
-- DEFAULT) makes this a distinct overload, so without the DROP both
-- versions would exist side by side. Confirmed against a real Postgres
-- instance: a 2-arg call in that state throws "function ... is not
-- unique" (Postgres won't guess between an exact 2-arg match and a 3-arg
-- version callable via its default) -- this app's own calculate.js always
-- calls with all 3 named parameters so it would never hit that ambiguity
-- in practice, but leaving a stale, ambiguous overload in the schema is a
-- landmine for any future/raw caller, not something to rely on "probably
-- fine" for.
DROP FUNCTION IF EXISTS record_public_estimate_attempt(text, int);

CREATE OR REPLACE FUNCTION record_public_estimate_attempt(p_ip text, p_limit int, p_device_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_ip_count int;
  v_device_count int;
BEGIN
  IF p_ip IS NULL AND p_device_id IS NULL THEN
    RETURN true; -- no identifier to check -- never block, same as the old JS-side fail-open
  END IF;

  -- Always lock ip first, then device_id -- the same fixed order on every
  -- call (never ip-then-device in one call and device-then-ip in another)
  -- is what actually prevents a deadlock between two concurrent calls that
  -- both touch the same two keys. Namespaced (not just hashtext(p_ip)) so
  -- an ip string and a device_id string can never collide onto the same
  -- lock key by coincidence.
  IF p_ip IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public_estimate_ip:' || p_ip));
  END IF;
  IF p_device_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public_estimate_device:' || p_device_id));
  END IF;

  IF p_ip IS NOT NULL THEN
    SELECT count(*) INTO v_ip_count
    FROM public_estimate_attempts
    WHERE ip = p_ip AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

    IF v_ip_count >= p_limit THEN
      RETURN false;
    END IF;
  END IF;

  IF p_device_id IS NOT NULL THEN
    SELECT count(*) INTO v_device_count
    FROM public_estimate_attempts
    WHERE device_id = p_device_id AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

    IF v_device_count >= p_limit THEN
      RETURN false;
    END IF;
  END IF;

  INSERT INTO public_estimate_attempts (ip, device_id) VALUES (p_ip, p_device_id);
  RETURN true;
END;
$$;


-- ─────────────────────────────────────────────────────────
-- 027_atomic_company_config_merge.sql
-- ─────────────────────────────────────────────────────────
-- companyConfig.js's saveCompanyConfig always overwrites the ENTIRE config
-- JSONB blob -- every writer (Stripe webhook handlers, the trial-reminder
-- scheduler, dashboard PUT/PATCH routes) reads the whole config, mutates
-- the one top-level key it actually cares about, then writes the whole
-- thing back. Two of those read-mutate-write cycles landing close together
-- for the same company -- e.g. a Stripe webhook updating `subscription`
-- while the owner is mid-save on a Settings tab, or the hourly trial
-- scheduler landing at the same moment -- silently lose whichever one
-- wrote second's intended change: that write already read the OTHER key's
-- new value out of the DB a moment earlier, but its own in-memory copy of
-- the key IT cares about is now stale, and writing the whole blob back
-- carries that stale copy right over the top of the real update. Not
-- something the Oct 2026 duplicate-subscription incident caused -- a
-- separate, pre-existing gap, surfaced while auditing the post-incident
-- fix.
--
-- This function merges ONLY the given top-level keys, atomically, at the
-- database row level. Postgres serializes concurrent UPDATEs to the same
-- row, so two callers patching DIFFERENT top-level keys can never clobber
-- each other regardless of ordering -- each commits only the key(s) it
-- actually touched. Two callers patching the SAME key concurrently is
-- still last-write-wins, which is correct, ordinary behavior for a genuine
-- concurrent edit to one field, not something this is meant to change.
--
-- INSERT ... ON CONFLICT DO UPDATE in one statement also closes the
-- separate "does this company's row exist yet" question atomically --
-- no caller needs to check first.
CREATE OR REPLACE FUNCTION merge_company_config(p_company_id text, p_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_config jsonb;
BEGIN
  INSERT INTO cleaning_company_configs (company_id, config, updated_at)
  VALUES (p_company_id, p_patch, now())
  ON CONFLICT (company_id) DO UPDATE
    SET config = cleaning_company_configs.config || EXCLUDED.config,
        updated_at = now()
  RETURNING config INTO v_config;

  RETURN v_config;
END;
$$;

-- Companion to the merge function above, for the one case a `||` merge
-- can't express: deleting a top-level key entirely (e.g. clearing
-- pendingDeletion when an owner cancels a scheduled account deletion)
-- rather than overwriting it. Same atomicity guarantee -- the removal
-- happens at the DB row level, so it can't race with a concurrent
-- unrelated-key patch the way a read-then-write-whole-blob delete would.
-- No-op (and no row created) for a company with no row yet, since there's
-- nothing to remove a key from.
CREATE OR REPLACE FUNCTION remove_company_config_keys(p_company_id text, p_keys text[])
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_config jsonb;
BEGIN
  UPDATE cleaning_company_configs
  SET config = config - p_keys,
      updated_at = now()
  WHERE company_id = p_company_id
  RETURNING config INTO v_config;

  RETURN v_config;
END;
$$;


-- ─────────────────────────────────────────────────────────
-- 028_activation_reminder_no_rush_copy.sql
-- ─────────────────────────────────────────────────────────
-- Replaces activation_reminder's "activation was never finished, so your
-- 30-day trial hasn't started" framing with a softer "didn't quite finish,
-- no rush" version, and drops the {{signupDateSuffix}} reference from the
-- body copy (still computed/passed on every send -- see email.js's
-- sendActivationReminderEmail -- just no longer used in this wording).
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Looks like you started setting up a Clean Estimator account but didn't quite finish — no rush, just didn't want you to miss out on the free trial.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Once it's set up, you get unlimited, instant, accurate price estimates for every job you quote — plus a free embeddable calculator widget for your own website if you want leads coming in from there too.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Pick up right where you left off whenever you're ready, it only takes a minute.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Finish setting up my account →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day trial doesn't start until you do, so nothing's running out in the meantime.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If you ran into an issue or just changed your mind, just reply and let me know — happy to help.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

Looks like you started setting up a Clean Estimator account but didn't quite finish — no rush, just didn't want you to miss out on the free trial.

Once it's set up, you get unlimited, instant, accurate price estimates for every job you quote — plus a free embeddable calculator widget for your own website if you want leads coming in from there too.

Pick up right where you left off whenever you're ready, it only takes a minute.

Finish setting up my account:
https://www.cleanestimator.com/company

Your 30-day trial doesn't start until you do, so nothing's running out in the meantime.

If you ran into an issue or just changed your mind, just reply and let me know — happy to help.

Clean Estimator - cleanestimator.com$body$,
  updated_at = now()
WHERE key = 'activation_reminder';


-- ─────────────────────────────────────────────────────────
-- 029_website_sample_ready_tier_price.sql
-- ─────────────────────────────────────────────────────────
-- Replaces website_sample_ready's hardcoded "a flat $249/month" with
-- {{monthlyPriceText}} -- this template predates the 3-tier pricing system
-- (Starter/Growth/Pro) and was never updated when it shipped, so every
-- prospect was quoted the Pro price in this email regardless of which plan
-- they actually applied for. routes/admin.js now looks up the real price
-- for the request's plan_tier before sending.
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  text_body = $body$Hi {{name}},

Your free cleaning website for {{business}} is ready to review.

Take a look: {{sampleUrl}}

Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat {{monthlyPriceText}}/month, cancel anytime.

Review & approve: {{approvalUrl}}

No obligation — if it's not for you, just ignore this and nothing happens.

Clean Estimator - cleanestimator.com$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{name}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your free cleaning website for <strong>{{business}}</strong> is ready to review.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{sampleUrl}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View your website →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat {{monthlyPriceText}}/month, cancel anytime.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{approvalUrl}}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Review &amp; approve →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    No obligation — if it's not for you, just ignore this and nothing happens.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  variables = '[{"name":"name","example":"Jane"},{"name":"business","example":"Sparkle Clean Co"},{"name":"sampleUrl","example":"https://sample.cleanestimator.com/sparkle-clean-co"},{"name":"approvalUrl","example":"https://www.cleanestimator.com/website-approval/abc123"},{"name":"monthlyPriceText","example":"$180"}]'::jsonb,
  updated_at = now()
WHERE key = 'website_sample_ready';



-- ============================================================
-- Verification -- run this (already included above) and check the
-- output. Every row should show ok = true. If anything shows false,
-- something above failed silently and needs a closer look.
-- ============================================================
SELECT
  (SELECT to_regclass('public.website_requests') IS NOT NULL) AS website_requests_table_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_requests' AND column_name = 'plan_tier') AS website_requests_plan_tier_ok,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'business_email') AS partners_business_email_ok,
  (SELECT to_regclass('public.email_templates') IS NOT NULL) AS email_templates_table_exists,
  (SELECT count(*) FROM email_templates WHERE key = 'website_sample_ready' AND html_body LIKE '%{{monthlyPriceText}}%') AS website_sample_ready_tier_price_ok,
  (SELECT count(*) FROM email_templates WHERE key = 'activation_reminder') AS activation_reminder_exists,
  (SELECT to_regclass('public.bookings') IS NOT NULL) AS bookings_table_exists,
  (SELECT to_regclass('public.chatbots') IS NOT NULL) AS chatbots_table_exists,
  (SELECT to_regprocedure('merge_company_config(text, jsonb)') IS NOT NULL) AS merge_company_config_fn_ok,
  (SELECT to_regprocedure('record_public_estimate_attempt(text, int, text)') IS NOT NULL) AS public_estimate_fn_ok;
