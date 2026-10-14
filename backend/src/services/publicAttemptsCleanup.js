const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// public_estimate_attempts (calculate.js's publicDailyLimitReached/
// recordPublicEstimateAttempt) gets one row inserted per public, non-company
// calculator run, site-wide, and nothing ever deleted from it -- the table
// only ever grows. The daily-limit check only ever looks back to the start
// of the current day, so nothing older than ~2 days is read by anything;
// without this sweep the table just accumulates forever, making every
// single public estimate's limit check (a COUNT filtered by ip + today)
// scan a steadily larger table, which is exactly the kind of pattern that
// drains a small compute instance's Disk IO budget over time. Same hourly
// setInterval tick as trialScheduler.js/deletionScheduler.js in index.js.
async function cleanupPublicEstimateAttempts() {
  const supabase = getSupabase();
  if (!supabase) return; // no Supabase configured (local file-fallback dev)

  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const { error } = await supabase.from('public_estimate_attempts').delete().lt('created_at', cutoff);
    if (error) console.warn('cleanupPublicEstimateAttempts failed:', error.message);
  } catch (err) {
    console.warn('cleanupPublicEstimateAttempts failed:', err.message);
  }
}

module.exports = { cleanupPublicEstimateAttempts };
