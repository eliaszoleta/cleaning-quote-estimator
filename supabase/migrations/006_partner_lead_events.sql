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
CREATE OR REPLACE VIEW partner_banner_stats
WITH (security_invoker = true)
AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click') AS calls,
  COUNT(*) FILTER (WHERE event_type = 'lead_email') AS leads
FROM partner_banner_events
GROUP BY partner_id;
