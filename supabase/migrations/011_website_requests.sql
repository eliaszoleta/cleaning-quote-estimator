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
