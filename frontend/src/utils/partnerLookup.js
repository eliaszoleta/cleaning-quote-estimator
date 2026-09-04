import { supabase } from '../lib/supabase';
import { getAllStates } from '../data/statePricing';

// Shared by ResultsScreen (inline partner card) and FloatingPartnerBanner
// (sitewide corner banner) so both use the same match logic and, for the
// banner, the same cached result -- avoids hitting ipapi.co and Supabase
// again on every page load in this multi-page (non-SPA-routed) site.
const CACHE_KEY = 'cleanestimator_partner_match';

// The admin form's state field is free text with no validation ("full name,
// e.g. Nevada"), and ipapi.co returns full state names. A mismatch like "MN"
// vs "Minnesota" -- an abbreviation typed into that field, a stray space,
// different casing -- silently breaks matching entirely, with no error
// shown anywhere, since the underlying query is an exact match. This maps
// either form to both, so a visitor matches a partner regardless of which
// form ended up stored.
const STATE_CODE_TO_NAME = new Map(getAllStates().map(s => [s.code.toUpperCase(), s.name]));
const STATE_NAME_TO_CODE = new Map(getAllStates().map(s => [s.name.toUpperCase(), s.code]));

// Returns { name, code } for a state given either its full name or 2-letter
// code (case/whitespace-insensitive) -- code is null if unrecognized.
function resolveState(input) {
  const trimmed = (input || '').trim();
  const upper = trimmed.toUpperCase();
  if (STATE_CODE_TO_NAME.has(upper)) return { name: STATE_CODE_TO_NAME.get(upper), code: upper };
  if (STATE_NAME_TO_CODE.has(upper)) return { name: trimmed, code: STATE_NAME_TO_CODE.get(upper) };
  return { name: trimmed, code: null };
}

// Exported so /admin/partners can normalize a typed state (e.g. "MN") to
// its canonical full name ("Minnesota") at save time -- self-correcting
// regardless of which form gets typed into that free-text field.
export function normalizeStateName(input) {
  return resolveState(input).name;
}

// Tries the first-party /api/geo endpoint first (a Vercel Function, see
// api/geo.js) since it's a same-origin request that ad/tracker blockers
// can't single out the way they do a third-party IP-lookup domain. Has to
// be an actual Vercel Function, not routed through the Railway proxy --
// confirmed Vercel's x-vercel-ip-* geolocation headers aren't present on
// requests that only pass through a rewrite-to-external-URL. Falls back
// to ipapi.co directly if unavailable (e.g. local dev).
export async function getUserLocation() {
  try {
    const res = await fetch('/api/geo');
    if (res.ok) {
      const data = await res.json();
      if (data.city && data.state) return { city: data.city, state: data.state };
    }
  } catch { /* fall through to ipapi.co */ }

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
  if (!supabase || !city || !state) return null;

  const { name, code } = resolveState(state);
  const stateFilter = code ? `state.ilike.${name},state.ilike.${code}` : `state.ilike.${name}`;

  const { data } = await supabase
    .from('partner_locations')
    .select('*, partners!inner(*)')
    .eq('partners.active', true)
    .ilike('city', city)
    .or(stateFilter)
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
  const partner = loc ? await findPartner(loc.city, loc.state) : null;

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
