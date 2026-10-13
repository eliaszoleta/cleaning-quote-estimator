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
