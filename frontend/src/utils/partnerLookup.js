import { supabase } from '../lib/supabase';

// ── TEMPORARY TEST OVERRIDE ──────────────────────────────────────────────
// Mocks a Minneapolis partner match so NorthStone can check how the banner
// and results-page card look before real data exists in Supabase. Remove
// this block (and the check for it in findPartner below) once they've
// confirmed and/or once the real partner row is added via the admin panel.
const TEST_MOCK_PARTNER = {
  id: 'test-northstone-mn',
  business_name: 'NorthStone',
  phone: '(612) 314-9044',
  email: 'info@northstonemn.com',
  address: 'Minneapolis & St. Paul, MN',
  website: 'https://northstonemn.com/',
  logo_url: 'https://northstonemn.com/logo.png',
  active: true,
};

// Shared by ResultsScreen (inline partner card) and FloatingPartnerBanner
// (sitewide corner banner) so both use the same match logic and, for the
// banner, the same cached result -- avoids hitting ipapi.co and Supabase
// again on every page load in this multi-page (non-SPA-routed) site.
const CACHE_KEY = 'cleanestimator_partner_match';

export async function getUserLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return { city: data.city, state: data.region };
  } catch {
    return null;
  }
}

// A partner can serve multiple cities (one partner_locations row per city),
// so the match is: any active partner with a service-area row matching the
// visitor's city/state. partners!inner lets the .eq('partners.active', ...)
// filter apply to the joined table (a plain left join would ignore it).
export async function findPartner(city, state) {
  // TEMPORARY TEST OVERRIDE — showing to EVERY visitor right now so it can
  // be checked without a VPN. Narrow back to Minneapolis-only (or remove
  // entirely) once confirmed — see comment above. Real lookup logic is
  // preserved below, just skipped for now.
  if (true) return TEST_MOCK_PARTNER; // eslint-disable-line no-constant-condition

  if (!supabase || !city || !state) return null;
  const { data } = await supabase
    .from('partner_locations')
    .select('*, partners!inner(*)')
    .eq('partners.active', true)
    .ilike('city', city)
    .ilike('state', state)
    .limit(1);
  return data?.[0]?.partners || null;
}

// Resolves the visitor's matched partner (or null), reusing a sessionStorage
// cache so repeated page loads in the same browsing session don't re-run
// the geolocation + Supabase lookup every time.
export async function getCachedPartnerMatch() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached) || null;
  } catch { /* sessionStorage unavailable — fall through and fetch live */ }

  const loc = await getUserLocation();
  // TEMPORARY TEST OVERRIDE — call findPartner unconditionally (not just
  // when loc resolves) so the mock still shows even if the geolocation
  // fetch itself fails (ad blocker, rate limit, etc). Revert alongside the
  // rest of the override in findPartner above.
  const partner = await findPartner(loc?.city, loc?.state);

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(partner)); } catch { /* ignore quota/private-mode errors */ }

  return partner;
}

// KPI tracking for the floating partner banner: one row per time it's shown
// (event_type 'impression') and per time the call button is tapped
// ('call_click'), so impressions/calls/click-through-rate can be reported to
// each paying partner. Fire-and-forget -- never blocks or breaks the UI if
// it fails (e.g. offline, ad blocker on the Supabase request).
export function logBannerEvent(partnerId, eventType) {
  if (!supabase || !partnerId) return;
  supabase.from('partner_banner_events').insert({
    partner_id: partnerId,
    event_type: eventType,
    page_path: window.location.pathname,
    is_mobile: window.innerWidth <= 768,
  }).then(() => {}, () => {});
}
