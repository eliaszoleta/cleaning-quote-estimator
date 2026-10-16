-- The public daily free-estimate limit (calculate.js's PUBLIC_DAILY_LIMIT)
-- was enforced with two separate round trips from Node -- a SELECT count
-- to check the limit, then (after the calculation itself ran) a plain
-- INSERT to record the attempt, both unsynchronized with each other. Two
-- or more requests from the same visitor arriving close together (a
-- normal "click New Estimate again" pace, no special timing needed) could
-- each run their SELECT before any of the INSERTs had landed, so each saw
-- the same under-the-limit count and all passed -- in practice letting a
-- visitor run 3+ "free" estimates against a limit of 2.
--
-- Replaces that with one atomic function: pg_advisory_xact_lock keyed by
-- a hash of the IP serializes every call for that same IP (concurrent
-- calls for *different* IPs never block each other), so the count-check
-- and the insert that follows can't be interleaved by a second call for
-- the same visitor. Called once per request (supabase.rpc(...)) in place
-- of the old separate publicDailyLimitReached + recordPublicEstimateAttempt
-- calls.
CREATE OR REPLACE FUNCTION record_public_estimate_attempt(p_ip text, p_limit int)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  IF p_ip IS NULL THEN
    RETURN true; -- no identifier to check -- never block, same as the old JS-side fail-open
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_ip));

  SELECT count(*) INTO v_count
  FROM public_estimate_attempts
  WHERE ip = p_ip AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public_estimate_attempts (ip) VALUES (p_ip);
  RETURN true;
END;
$$;
