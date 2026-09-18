// Best-effort ZIP-prefix -> state mapping. Used as calculateCleaning's
// fallback state resolution when no state was explicitly provided (should
// be rare now that LocationStep.js requires picking a state -- this only
// matters for a caller that skips that, e.g. a direct API integration),
// and mirrors frontend/src/data/zipStateRanges.js, which does the same
// lookup client-side to validate the location step's optional ZIP field
// against the state the visitor already selected.
//
// Deliberately NOT a network call: this used to hit an external geocoding
// API (Nominatim) here, which silently failed often enough in production
// (rate-limiting, timeouts -- common for requests from cloud-hosted IPs)
// that its own fallback -- defaulting to Texas on any failure -- ended up
// mislabeling real leads from other states, and inflating their quoted
// price along with it (state affects the cost-of-living multiplier). A
// local, synchronous table has no failure mode to fall back from.
//
// Ranges are by the ZIP's first 3 digits, the same granularity USPS
// itself assigns by region -- accurate for the large majority of ZIPs,
// with occasional imprecision right at a range boundary. Good enough for
// "does this ZIP look like it's roughly in this state," not a claim of
// authoritative accuracy.
const ZIP3_RANGES = [
  ['MA', 10, 27], ['RI', 28, 29], ['NH', 30, 38], ['ME', 39, 49], ['VT', 50, 59],
  ['CT', 60, 69], ['NJ', 70, 89], ['NY', 100, 149], ['PA', 150, 196], ['DE', 197, 199],
  ['DC', 200, 205], ['MD', 206, 219], ['VA', 220, 246], ['WV', 247, 268], ['NC', 270, 289],
  ['SC', 290, 299], ['GA', 300, 319], ['FL', 320, 339], ['FL', 341, 342], ['FL', 344, 344],
  ['FL', 346, 347], ['FL', 349, 349], ['GA', 398, 399], ['AL', 350, 369], ['TN', 370, 385],
  ['MS', 386, 397], ['KY', 400, 427], ['OH', 430, 459], ['IN', 460, 479], ['MI', 480, 499],
  ['IA', 500, 528], ['WI', 530, 549], ['MN', 550, 567], ['SD', 570, 577], ['ND', 580, 588],
  ['MT', 590, 599], ['IL', 600, 629], ['MO', 630, 658], ['KS', 660, 679], ['NE', 680, 693],
  ['LA', 700, 714], ['AR', 716, 729], ['OK', 730, 731], ['OK', 734, 749], ['TX', 750, 799],
  ['TX', 885, 885], ['CO', 800, 816], ['WY', 820, 831], ['ID', 832, 838], ['UT', 840, 847],
  ['AZ', 850, 865], ['NM', 870, 884], ['NV', 889, 898], ['CA', 900, 961], ['HI', 967, 968],
  ['OR', 970, 979], ['WA', 980, 994], ['AK', 995, 999],
];

// Returns a state code, or null if the ZIP's prefix isn't recognized (a US
// territory, or simply not a valid ZIP) -- null means "unknown," never
// treated as a mismatch by callers.
function stateForZip(zip) {
  const prefix = parseInt(String(zip || '').slice(0, 3), 10);
  if (!Number.isFinite(prefix)) return null;
  const hit = ZIP3_RANGES.find(([, start, end]) => prefix >= start && prefix <= end);
  return hit ? hit[0] : null;
}

module.exports = { stateForZip };
