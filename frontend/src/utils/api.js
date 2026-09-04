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

export async function getCompanyLeads(token) {
  return apiFetch('/api/company-leads/company', { headers: { Authorization: `Bearer ${token}` } });
}

export async function patchLead(token, leadId, updates) {
  return apiFetch(`/api/company-leads/company/${leadId}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(updates),
  });
}
