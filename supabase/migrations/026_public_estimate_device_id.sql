-- Adds a second identifier to the public daily-estimate limit alongside IP
-- (see migration 025 and calculate.js's PUBLIC_DAILY_LIMIT): a random id
-- the frontend persists in localStorage (deviceId.js), sent with every
-- public /api/calculate call. IP alone resets the moment a visitor switches
-- VPN servers -- this id doesn't, since VPN/proxy rotation never touches
-- localStorage, closing the laziest version of that bypass (clearing site
-- data or using a different browser still works around it, same as any
-- client-side identifier always can).
ALTER TABLE public_estimate_attempts ADD COLUMN IF NOT EXISTS device_id text;

-- Mirrors the existing ip/email/phone indexes -- "how many rows for this
-- exact device_id since today started" as an index-only scan.
CREATE INDEX IF NOT EXISTS public_estimate_attempts_device_id_created_idx ON public_estimate_attempts(device_id, created_at);

-- Replaces the migration-025 function to also check/record device_id,
-- blocking if EITHER identifier is already at the limit -- strictly more
-- restrictive than before (an attempt that was already blocked on ip alone
-- stays blocked; one that passes now must clear both checks), never less.
--
-- Drops the old 2-arg signature first -- CREATE OR REPLACE only replaces a
-- function with the SAME argument signature; a 3rd parameter (even with a
-- DEFAULT) makes this a distinct overload, so without the DROP both
-- versions would exist side by side. Confirmed against a real Postgres
-- instance: a 2-arg call in that state throws "function ... is not
-- unique" (Postgres won't guess between an exact 2-arg match and a 3-arg
-- version callable via its default) -- this app's own calculate.js always
-- calls with all 3 named parameters so it would never hit that ambiguity
-- in practice, but leaving a stale, ambiguous overload in the schema is a
-- landmine for any future/raw caller, not something to rely on "probably
-- fine" for.
DROP FUNCTION IF EXISTS record_public_estimate_attempt(text, int);

CREATE OR REPLACE FUNCTION record_public_estimate_attempt(p_ip text, p_limit int, p_device_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_ip_count int;
  v_device_count int;
BEGIN
  IF p_ip IS NULL AND p_device_id IS NULL THEN
    RETURN true; -- no identifier to check -- never block, same as the old JS-side fail-open
  END IF;

  -- Always lock ip first, then device_id -- the same fixed order on every
  -- call (never ip-then-device in one call and device-then-ip in another)
  -- is what actually prevents a deadlock between two concurrent calls that
  -- both touch the same two keys. Namespaced (not just hashtext(p_ip)) so
  -- an ip string and a device_id string can never collide onto the same
  -- lock key by coincidence.
  IF p_ip IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public_estimate_ip:' || p_ip));
  END IF;
  IF p_device_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public_estimate_device:' || p_device_id));
  END IF;

  IF p_ip IS NOT NULL THEN
    SELECT count(*) INTO v_ip_count
    FROM public_estimate_attempts
    WHERE ip = p_ip AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

    IF v_ip_count >= p_limit THEN
      RETURN false;
    END IF;
  END IF;

  IF p_device_id IS NOT NULL THEN
    SELECT count(*) INTO v_device_count
    FROM public_estimate_attempts
    WHERE device_id = p_device_id AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

    IF v_device_count >= p_limit THEN
      RETURN false;
    END IF;
  END IF;

  INSERT INTO public_estimate_attempts (ip, device_id) VALUES (p_ip, p_device_id);
  RETURN true;
END;
$$;
