import { supabase } from '../lib/supabase';

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

export async function findPartner(city, state) {
  if (!supabase || !city || !state) return null;
  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('active', true)
    .ilike('city', city)
    .ilike('state', state)
    .limit(1);
  return data?.[0] || null;
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
