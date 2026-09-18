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
CREATE OR REPLACE VIEW partner_banner_stats
WITH (security_invoker = true)
AS
SELECT
  partner_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'call_click') AS calls
FROM partner_banner_events
GROUP BY partner_id;
