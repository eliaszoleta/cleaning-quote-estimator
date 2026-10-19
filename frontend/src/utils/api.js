const API_URL = process.env.REACT_APP_API_URL || '';

async function apiFetch(path, options = {}) {
  const url = API_URL ? `${API_URL}${path}` : path;
  const { headers: optHeaders, ...restOptions } = options;
  const res = await fetch(url, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...(optHeaders || {}) },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.responseData = data;
    throw err;
  }
  return data;
}

export async function postCalculate(payload) {
  return apiFetch('/api/calculate', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getCompanyPublic(companyId) {
  return apiFetch(`/api/company/${companyId}/public`);
}

export async function getCompanyConfig(token, companyId) {
  return apiFetch(`/api/company/${companyId}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function putCompanyConfig(token, companyId, config) {
  return apiFetch(`/api/company/${companyId}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(config),
  });
}

export async function patchCompanyServices(token, companyId, services) {
  return apiFetch(`/api/company/${companyId}/services`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ services }),
  });
}

// BrandingTab.js -- separate from uploadPartnerLogo below since this one
// requires the company's own auth token (partner logo upload is a public,
// no-auth endpoint used pre-signup during checkout).
export async function uploadCompanyLogo(token, companyId, { contentType, dataBase64 }) {
  return apiFetch(`/api/company/${companyId}/upload-logo`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ contentType, dataBase64 }),
  });
}

export async function getSubscriptionStatus(token) {
  return apiFetch('/api/subscription/status', { headers: { Authorization: `Bearer ${token}` } });
}

export async function postCheckout(token) {
  return apiFetch('/api/subscription/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

// WebsiteSubscription.js's "Get a Done-For-You Website" application form --
// triggers an internal notification email (see backend's email.js /
// sendWebsiteRequestNotificationEmail) instead of relying on a third-party
// form service whose destination inbox isn't controlled from this codebase.
export async function postWebsiteRequest(payload) {
  return apiFetch('/api/website-request', { method: 'POST', body: JSON.stringify(payload) });
}

export async function postPortal(token) {
  return apiFetch('/api/subscription/portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

// SubscriptionTab.js's optional "before you go" feedback, asked right
// before handing off to postPortal above -- see 021_cancellation_feedback.sql
// for why it's collected up front rather than reactively on actual
// cancellation.
export async function postCompanyFeedback(token, companyId, payload) {
  return apiFetch(`/api/company/${companyId}/feedback`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
  });
}

export async function verifyCheckout(token, sessionId) {
  return apiFetch('/api/subscription/verify-checkout', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ sessionId }),
  });
}

export async function postPartnerCheckout(payload) {
  return apiFetch('/api/partner-checkout/checkout', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getTakenCities() {
  return apiFetch('/api/partner-checkout/taken-cities');
}

export async function uploadPartnerLogo({ contentType, dataBase64 }) {
  return apiFetch('/api/partner-checkout/upload-logo', {
    method: 'POST', body: JSON.stringify({ contentType, dataBase64 }),
  });
}

export async function verifyPartnerCheckout(sessionId) {
  return apiFetch('/api/partner-checkout/verify-checkout', { method: 'POST', body: JSON.stringify({ sessionId }) });
}

// ClientDashboard.js -- a logged-in partner editing their own listing's
// business details. token is the partner's own Supabase Auth session
// token (requireAuth on the backend resolves their own partner row from it,
// same as the company dashboard's token-based routes).
export async function updateClientPartner(token, payload) {
  return apiFetch('/api/client/partner', {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
  });
}

// includeDeleted also fetches archived (Trash) leads alongside active ones,
// so LeadsTab.js can split them into two views from one request instead of
// fetching twice.
export async function getCompanyLeads(token, includeDeleted = false) {
  return apiFetch(`/api/company-leads/company${includeDeleted ? '?deleted=true' : ''}`, { headers: { Authorization: `Bearer ${token}` } });
}

// Total + this-month count of this company's successful /api/calculate runs
// (internal Calculator Mode and the embedded widget combined) -- see
// leads.js's GET /company/estimate-runs for why this exists alongside the
// leads count.
export async function getCompanyEstimateRuns(token) {
  return apiFetch('/api/company-leads/company/estimate-runs', { headers: { Authorization: `Bearer ${token}` } });
}

// "Run an Estimate" tab's "Share via email" action -- re-computes the
// estimate server-side from the same inputs and emails it to `to`. No lead
// is saved and no company-notification email fires.
export async function postEstimateShare(token, payload) {
  return apiFetch('/api/estimate-share', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
  });
}

export async function patchLead(token, leadId, updates) {
  return apiFetch(`/api/company-leads/company/${leadId}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(updates),
  });
}

// Permanent delete -- only ever called from the Trash view, on a lead
// that's already been archived (soft-deleted) first.
export async function deleteLeadForever(token, leadId) {
  return apiFetch(`/api/company-leads/company/${leadId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
}

// adminKey is whatever the admin typed into AdminCompanies.js's login form,
// forwarded as-is -- never a REACT_APP_* env var, since those are baked
// into the public JS bundle at build time and this key guards an endpoint
// backed by the Supabase service role key.
export async function getAdminCompanies(adminKey) {
  return apiFetch('/api/admin/companies', { headers: { 'x-admin-key': adminKey } });
}

export async function getTrialEmailPreview(adminKey) {
  return apiFetch('/api/admin/companies/trial-email-preview', { headers: { 'x-admin-key': adminKey } });
}

// Permanent, immediate delete -- cancels their Stripe subscription, deletes
// their leads/config/login. Unlike a company's own self-service DELETE
// /api/company/account (a 30-day grace period), there's no undo here.
export async function deleteAdminCompanyForever(adminKey, companyId) {
  return apiFetch(`/api/admin/companies/${companyId}`, {
    method: 'DELETE', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ confirm: true }),
  });
}

export async function sendTrialEmails(adminKey, companyIds) {
  return apiFetch('/api/admin/companies/send-trial-email', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ confirm: true, companyIds }),
  });
}

// The subscription.js GET /status + company.js GET /:id race (see
// subscription.js's own comment) could clobber a brand-new signup's
// companyName/phone/website with blanks before the fix shipped. These two
// find and recover the accounts it already happened to -- the real values
// are still sitting in that account's Supabase Auth signup metadata.
export async function getIncompleteProfilePreview(adminKey) {
  return apiFetch('/api/admin/companies/incomplete-profile-preview', { headers: { 'x-admin-key': adminKey } });
}

export async function backfillCompanyProfiles(adminKey, companyIds) {
  return apiFetch('/api/admin/companies/backfill-company-profiles', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ confirm: true, companyIds }),
  });
}

export async function sendTrialEmailPreview(adminKey, to) {
  return apiFetch('/api/admin/companies/send-trial-email-preview', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ to }),
  });
}

// AdminPartners.js -- same adminKey convention as above. Replaces writing
// straight to Supabase from the browser with the anon key.
export async function getAdminPartners(adminKey) {
  return apiFetch('/api/admin/partners', { headers: { 'x-admin-key': adminKey } });
}

export async function createAdminPartner(adminKey, payload) {
  return apiFetch('/api/admin/partners', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function updateAdminPartner(adminKey, id, payload) {
  return apiFetch(`/api/admin/partners/${id}`, {
    method: 'PUT', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function toggleAdminPartner(adminKey, id, active) {
  return apiFetch(`/api/admin/partners/${id}/toggle`, {
    method: 'PATCH', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ active }),
  });
}

export async function deleteAdminPartner(adminKey, id) {
  return apiFetch(`/api/admin/partners/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
}

// AdminHomepageLeads.js -- leads captured by the main public calculator
// (no companyId, so company_id is null on the row), same adminKey convention
// as the rest of the admin API. Paginated (offset/limit, defaults to the
// backend's own 20/0) so opening the page doesn't have to wait on fetching
// + ZIP-resolving every lead ever captured -- see the matching comment on
// GET /api/admin/homepage-leads.
export async function getAdminHomepageLeads(adminKey, { includeDeleted = false, offset = 0, limit } = {}) {
  const params = new URLSearchParams();
  if (includeDeleted) params.set('deleted', 'true');
  params.set('offset', String(offset));
  if (limit) params.set('limit', String(limit));
  return apiFetch(`/api/admin/homepage-leads?${params.toString()}`, { headers: { 'x-admin-key': adminKey } });
}

export async function patchAdminHomepageLead(adminKey, id, updates) {
  return apiFetch(`/api/admin/homepage-leads/${id}`, {
    method: 'PATCH', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(updates),
  });
}

export async function deleteAdminHomepageLeadForever(adminKey, id) {
  return apiFetch(`/api/admin/homepage-leads/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
}

// AdminWebsiteRequests.js -- "Get a Website" applications, same adminKey
// convention as the rest of the admin API.
export async function getAdminWebsiteRequests(adminKey) {
  return apiFetch('/api/admin/website-requests', { headers: { 'x-admin-key': adminKey } });
}

// Manual add (e.g. a client who reached out outside the public apply form)
// -- deliberately skips both the internal "new application" notification
// and the applicant's own "we got your request" confirmation email, since
// neither fits an admin entering someone directly.
export async function createAdminWebsiteRequest(adminKey, payload) {
  return apiFetch('/api/admin/website-requests', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function patchAdminWebsiteRequest(adminKey, id, updates) {
  return apiFetch(`/api/admin/website-requests/${id}`, {
    method: 'PATCH', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(updates),
  });
}

export async function cancelAdminWebsiteSubscription(adminKey, id) {
  return apiFetch(`/api/admin/website-requests/${id}/cancel-subscription`, {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ confirm: true }),
  });
}

// Permanent, immediate delete -- cancels their Stripe subscription (if any)
// and removes the request row. No undo, same as deleteAdminCompanyForever.
export async function deleteAdminWebsiteRequestForever(adminKey, id) {
  return apiFetch(`/api/admin/website-requests/${id}`, {
    method: 'DELETE', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ confirm: true }),
  });
}

// WebsiteApproval.js -- public, token-gated (no adminKey/login; the random
// token in the URL is the auth). Backs the prospect-facing approve-and-pay
// flow for a "Get a Website" application.
export async function getWebsiteRequestByToken(token) {
  return apiFetch(`/api/website-request/by-token/${token}`);
}

export async function postWebsiteRequestCheckout(token) {
  return apiFetch(`/api/website-request/by-token/${token}/checkout`, { method: 'POST' });
}

export async function postWebsiteRequestVerifySetup(token, sessionId) {
  return apiFetch(`/api/website-request/by-token/${token}/verify-setup`, {
    method: 'POST', body: JSON.stringify({ sessionId }),
  });
}

// AdminEmailMarketing.js -- templates, audience preview, individual sends,
// and campaigns. Same adminKey convention as the rest of the admin API.
export async function getAdminEmailTemplates(adminKey) {
  return apiFetch('/api/admin/email-marketing/templates', { headers: { 'x-admin-key': adminKey } });
}

export async function createAdminEmailTemplate(adminKey, payload) {
  return apiFetch('/api/admin/email-marketing/templates', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function updateAdminEmailTemplate(adminKey, id, payload) {
  return apiFetch(`/api/admin/email-marketing/templates/${id}`, {
    method: 'PATCH', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function deleteAdminEmailTemplate(adminKey, id) {
  return apiFetch(`/api/admin/email-marketing/templates/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
}

// Overwrites a lifecycle template's content with the current hardcoded copy
// from the backend's emailTemplateDefaults.js -- the one-click fix for when
// that file is edited for an already-seeded template (ensureSeeded only
// ever inserts a lifecycle row once, so a later code change to an existing
// template otherwise never reaches the DB row that actually sends).
export async function resyncAdminEmailTemplateDefault(adminKey, id) {
  return apiFetch(`/api/admin/email-marketing/templates/${id}/resync-default`, {
    method: 'POST', headers: { 'x-admin-key': adminKey },
  });
}

export async function previewAdminEmailAudience(adminKey, audience) {
  return apiFetch('/api/admin/email-marketing/audience/preview', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ audience }),
  });
}

// Grants subscription.winbackTrialEligible=true to every company in the
// "legacy no-card signups" segment that doesn't already have it -- what
// actually makes the legacy_winback_fresh_trial template's "new 30-day
// trial" promise true at checkout (see subscription.js). Sending that
// campaign alone does not grant anything; call this once first.
export async function grantLegacyWinbackTrial(adminKey) {
  return apiFetch('/api/admin/email-marketing/companies/grant-legacy-winback-trial', {
    method: 'POST', headers: { 'x-admin-key': adminKey },
  });
}

export async function sendAdminIndividualEmail(adminKey, payload) {
  return apiFetch('/api/admin/email-marketing/send-individual', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function getAdminEmailCampaigns(adminKey) {
  return apiFetch('/api/admin/email-marketing/campaigns', { headers: { 'x-admin-key': adminKey } });
}

export async function getAdminEmailCampaign(adminKey, id) {
  return apiFetch(`/api/admin/email-marketing/campaigns/${id}`, { headers: { 'x-admin-key': adminKey } });
}

export async function createAdminEmailCampaign(adminKey, payload) {
  return apiFetch('/api/admin/email-marketing/campaigns', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function cancelAdminEmailCampaign(adminKey, id) {
  return apiFetch(`/api/admin/email-marketing/campaigns/${id}/cancel`, {
    method: 'POST', headers: { 'x-admin-key': adminKey },
  });
}

// BookingPage.js -- the self-hosted Calendly replacement at /book-a-call.
// Public, unauthenticated (a prospect picking a time, same as /api/calculate).
export async function getBookingAvailability(date) {
  return apiFetch(`/api/booking/availability?date=${encodeURIComponent(date)}`);
}

export async function createBooking(payload) {
  return apiFetch('/api/booking/create', { method: 'POST', body: JSON.stringify(payload) });
}

// CancelBookingPage.js -- /cancel-booking?token=..., same no-login,
// token-is-the-auth pattern as getWebsiteRequestByToken above.
export async function getBookingByToken(token) {
  return apiFetch(`/api/booking/by-token/${token}`);
}

export async function cancelBooking(token) {
  return apiFetch('/api/booking/cancel', { method: 'POST', body: JSON.stringify({ token }) });
}

// AdminBookings.js -- weekly-availability settings, bookings list, and the
// Google Calendar connect/status/disconnect, same adminKey convention as
// the rest of the admin API.
export async function getAdminBookingSettings(adminKey) {
  return apiFetch('/api/admin/booking/settings', { headers: { 'x-admin-key': adminKey } });
}

export async function updateAdminBookingSettings(adminKey, payload) {
  return apiFetch('/api/admin/booking/settings', {
    method: 'PUT', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function getAdminBookings(adminKey) {
  return apiFetch('/api/admin/booking/bookings', { headers: { 'x-admin-key': adminKey } });
}

export async function cancelAdminBooking(adminKey, id) {
  return apiFetch(`/api/admin/booking/bookings/${id}/cancel`, {
    method: 'POST', headers: { 'x-admin-key': adminKey },
  });
}

export async function getGoogleCalendarAuthUrl(adminKey) {
  return apiFetch('/api/admin/google-calendar/auth-url', { headers: { 'x-admin-key': adminKey } });
}

export async function getGoogleCalendarStatus(adminKey) {
  return apiFetch('/api/admin/google-calendar/status', { headers: { 'x-admin-key': adminKey } });
}

export async function disconnectGoogleCalendar(adminKey) {
  return apiFetch('/api/admin/google-calendar/disconnect', { method: 'POST', headers: { 'x-admin-key': adminKey } });
}

// AdminChatbots.js -- CRUD for the Growth/Pro-tier chatbots (business
// info/prompt, lead alert email, From name) plus each one's captured
// leads, same adminKey convention as the rest of the admin API.
export async function getAdminChatbots(adminKey) {
  return apiFetch('/api/admin/chatbots', { headers: { 'x-admin-key': adminKey } });
}

export async function createAdminChatbot(adminKey, payload) {
  return apiFetch('/api/admin/chatbots', {
    method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function updateAdminChatbot(adminKey, id, payload) {
  return apiFetch(`/api/admin/chatbots/${id}`, {
    method: 'PATCH', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(payload),
  });
}

export async function deleteAdminChatbot(adminKey, id) {
  return apiFetch(`/api/admin/chatbots/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
}

export async function getAdminChatbotLeads(adminKey, id) {
  return apiFetch(`/api/admin/chatbots/${id}/leads`, { headers: { 'x-admin-key': adminKey } });
}
