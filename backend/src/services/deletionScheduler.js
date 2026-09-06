const axios = require('axios');
const { listAllCompanyConfigs } = require('./companyConfig');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
function dbHeaders() {
  const key = SERVICE_KEY();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

// Sweeps every company for a pendingDeletion marker (set by company.js's
// DELETE /account, which schedules a 30-day grace period instead of deleting
// immediately) and hard-deletes any whose grace period has elapsed -- same
// setInterval pattern as trialScheduler.js, run from the same hourly tick in
// index.js. An hour of slop on a 30-day window is fine.
async function checkPendingDeletions() {
  if (!SERVICE_KEY()) return; // no Supabase configured (local file-fallback dev) -- nothing to sweep

  let rows;
  try {
    rows = await listAllCompanyConfigs();
  } catch (err) {
    console.error('checkPendingDeletions: failed to list company configs:', err.message);
    return;
  }

  const now = Date.now();
  for (const { companyId, config } of rows) {
    const pending = config?.pendingDeletion;
    if (!pending?.scheduledFor) continue;
    if (new Date(pending.scheduledFor).getTime() > now) continue;

    try {
      await axios.delete(
        `${SUPABASE_URL}/rest/v1/leads?company_id=eq.${encodeURIComponent(companyId)}`,
        { headers: dbHeaders() }
      ).catch(e => console.warn(`checkPendingDeletions: delete leads warning for ${companyId}:`, e.message));

      await axios.delete(
        `${SUPABASE_URL}/rest/v1/cleaning_company_configs?company_id=eq.${encodeURIComponent(companyId)}`,
        { headers: dbHeaders() }
      ).catch(e => console.warn(`checkPendingDeletions: delete config warning for ${companyId}:`, e.message));

      await axios.delete(
        `${SUPABASE_URL}/auth/v1/admin/users/${companyId}`,
        { headers: { apikey: SERVICE_KEY(), Authorization: `Bearer ${SERVICE_KEY()}` } }
      );

      console.log(`checkPendingDeletions: permanently deleted company ${companyId} (grace period elapsed)`);
    } catch (err) {
      console.error(`checkPendingDeletions: failed to delete company ${companyId}:`, err.message);
    }
  }
}

module.exports = { checkPendingDeletions };
