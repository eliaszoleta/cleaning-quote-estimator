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
