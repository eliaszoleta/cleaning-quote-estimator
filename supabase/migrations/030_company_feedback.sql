-- General in-app feedback, submitted via the "Send Feedback" button in the
-- Clean Estimator dashboard header (the spot that used to hold a "Schedule
-- a Walkthrough" calendar link). Free text, available any time, not tied
-- to any other action -- distinct from cancellation_feedback (021), which
-- is scoped to the "before you go" step right before the Stripe Billing
-- Portal redirect and asks a fixed set of cancellation reasons.
--
-- Stores the submitter's contact details alongside the message (not just
-- company_id) so an admin reading this later doesn't have to cross-
-- reference another table to know who to reply to or what business they
-- run -- those are snapshotted at submission time, since a company's own
-- name/email could change after the fact.
CREATE TABLE IF NOT EXISTS company_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),

  company_id  text REFERENCES cleaning_company_configs(company_id) ON DELETE SET NULL,
  business    text,
  email       text,
  message     text NOT NULL
);

CREATE INDEX IF NOT EXISTS company_feedback_created_at_idx ON company_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS company_feedback_company_id_idx ON company_feedback(company_id);

-- No RLS policies beyond enabling it -- same as every other backend-only
-- table in this app (website_requests, cancellation_feedback, bookings):
-- only ever touched via the service-role key, never the anon key.
ALTER TABLE company_feedback ENABLE ROW LEVEL SECURITY;
