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
