// Australia Post postcode-range -> state/territory mapping. Mirrors
// zipStateRanges.js's role for US ZIPs, postalProvinceRanges.js's for
// Canadian postal codes, and postcodeRegionRanges.js's for UK postcodes:
// calculateCleaning's fallback region resolution when no region was
// explicitly provided, and the same lookup
// frontend/src/data/postcodeStateRanges.js does client-side to validate
// LocationStep's optional postcode field against the state already
// selected.
//
// Ranges are Australia Post's own prescribed state/territory bands (the
// first 1-2 digits), confirmed via Wikipedia's "Postcodes in Australia"
// article (Nov 2026), which itself cites Australia Post's published
// ranges. Unlike the US ZIP/UK postcode tables, these ranges are a clean,
// official, near-exhaustive partition -- Australia Post does note that a
// handful of postcodes near state borders are serviced by a post office
// across the border and so don't match the resident's actual state (a few
// ACT/NSW and VIC/NSW localities), the same kind of accepted edge-case
// imprecision already carried by the other countries' tables. Good enough
// as a soft fallback; the visitor always picks their own state directly.
const AU_POSTCODE_STATE_RANGES = [
  { min: 200, max: 299, state: 'ACT' },   // large-volume/PO Box ACT
  { min: 800, max: 999, state: 'NT' },    // incl. 0900-0999 large-volume/PO Box
  { min: 1000, max: 1999, state: 'NSW' }, // large-volume/PO Box NSW (Sydney)
  { min: 2000, max: 2599, state: 'NSW' },
  { min: 2600, max: 2618, state: 'ACT' },
  { min: 2619, max: 2899, state: 'NSW' },
  { min: 2900, max: 2920, state: 'ACT' },
  { min: 2921, max: 2999, state: 'NSW' },
  { min: 3000, max: 3999, state: 'VIC' },
  { min: 4000, max: 4999, state: 'QLD' },
  { min: 5000, max: 5999, state: 'SA' },  // incl. 5800-5999 large-volume/PO Box
  { min: 6000, max: 6999, state: 'WA' },  // incl. 6800-6999 large-volume/PO Box; 6798/6799 Christmas/Cocos Islands
  { min: 7000, max: 7999, state: 'TAS' }, // incl. 7800-7999 large-volume/PO Box
  { min: 8000, max: 8999, state: 'VIC' }, // large-volume/PO Box VIC (Melbourne)
  { min: 9000, max: 9999, state: 'QLD' }, // large-volume/PO Box QLD (Brisbane)
];

// Returns a state/territory key, or null if the postcode doesn't parse as
// a plausible 4-digit AU postcode -- null means "unknown," never treated
// as a mismatch by callers.
function stateForPostcode(postcode) {
  const digits = String(postcode || '').trim();
  if (!/^\d{3,4}$/.test(digits)) return null;
  const code = parseInt(digits, 10);
  const match = AU_POSTCODE_STATE_RANGES.find(r => code >= r.min && code <= r.max);
  return match ? match.state : null;
}

module.exports = { stateForPostcode };
