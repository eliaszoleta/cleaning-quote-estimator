import { supabase } from '../lib/supabase';

// ── TEMPORARY TEST OVERRIDE ──────────────────────────────────────────────
// Mocks a Minneapolis partner match so NorthStone can check how the banner
// and results-page card look before real data exists in Supabase. Remove
// this block (and the check for it in findPartner below) once they've
// confirmed and/or once the real partner row is added via the admin panel.
const TEST_MOCK_PARTNER = {
  id: 'sample-screenshot-demo',
  business_name: 'Sparkle Clean Co.',
  phone: '(555) 123-4567',
  email: 'hello@sparklecleanco.com',
  address: 'Austin, TX',
  website: 'https://example.com/',
  logo_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgcng9IjI0IiBmaWxsPSIjMjU2M2ViIi8+PHRleHQgeD0iNjAiIHk9Ijc1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TQzwvdGV4dD48L3N2Zz4=',
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
  // TEMPORARY TEST OVERRIDE — showing to EVERY visitor right now so the
  // user can take their own screenshots. Revert once done -- see comment
  // above (this replaces the earlier Minneapolis-only NorthStone test).
  return TEST_MOCK_PARTNER;

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
  // TEMPORARY TEST OVERRIDE — call unconditionally so the mock still shows
  // even if the geolocation fetch itself fails. Revert alongside the rest.
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
