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
