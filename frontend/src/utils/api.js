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

export async function getSubscriptionStatus(token) {
  return apiFetch('/api/subscription/status', { headers: { Authorization: `Bearer ${token}` } });
}

export async function postCheckout(token) {
  return apiFetch('/api/subscription/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export async function postPortal(token) {
  return apiFetch('/api/subscription/portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
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

export async function sendTrialEmails(adminKey, companyIds) {
  return apiFetch('/api/admin/companies/send-trial-email', {
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
