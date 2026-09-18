// First-party replacement for the client-side ipapi.co call used for
// partner matching (see frontend/src/utils/partnerLookup.js). Reads the
// geolocation headers Vercel's edge network attaches to requests it
// invokes a Function for -- confirmed these headers are NOT present when
// a request only passes through a plain rewrite-to-external-URL (tested:
// they came back null when this was routed through the Railway backend
// instead), so this has to be an actual Vercel Function, not a proxy hop.
//
// ipapi.co is exactly the kind of domain ad/tracker blockers (Brave
// Shields, VPN "threat protection" features, uBlock, etc.) block outright,
// which was silently breaking location detection -- and therefore partner
// matching -- for a real, non-trivial share of visitors. A same-origin
// call like this one doesn't hit that problem.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const rawCity = req.headers['x-vercel-ip-city'];
  const city = rawCity ? decodeURIComponent(rawCity) : null;
  // Vercel gives the region as its short code (e.g. "MN"), not the full
  // state name -- findPartner() in partnerLookup.js already matches
  // against both forms, so this is handled on that end.
  const state = req.headers['x-vercel-ip-country-region'] || null;
  const country = req.headers['x-vercel-ip-country'] || null;

  res.status(200).json({ city, state, country });
};
