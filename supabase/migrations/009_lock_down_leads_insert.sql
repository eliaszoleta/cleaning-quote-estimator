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
