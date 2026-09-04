// First-party replacement for the client-side ipapi.co call used for
// partner matching (see frontend/src/utils/partnerLookup.js). Reads the
// geolocation headers Vercel's edge network already attaches to every
// request, instead of the browser fetching a third-party IP-lookup API --
// ipapi.co is exactly the kind of domain ad/tracker blockers (Brave
// Shields, VPN "threat protection" features, uBlock, etc.) silently block,
// which was causing location detection -- and therefore partner matching --
// to fail with no error for a real, non-trivial share of visitors. A
// same-origin call like this one doesn't hit that problem.
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
