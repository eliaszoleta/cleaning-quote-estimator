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

ALTER TABLE partners RENAME COLUMN email TO business_email;
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
