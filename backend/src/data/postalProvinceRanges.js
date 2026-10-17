// Best-effort Canadian postal code (FSA first letter) -> province mapping.
// Mirrors zipStateRanges.js's role for US ZIPs: calculateCleaning's fallback
// province resolution when no province was explicitly provided, and the
// same lookup frontend/src/data/postalProvinceRanges.js does client-side to
// validate LocationStep's optional postal-code field against the province
// already selected.
//
// Canada Post assigns the first letter of a postal code's Forward Sortation
// Area to a single province/territory -- a public, fixed standard (unlike
// US ZIP3 ranges, no numeric range table is needed here), except for the
// letter X, which Canada Post splits between Nunavut and the Northwest
// Territories by the FSA's later characters in a way that isn't reliably
// inferable from the first letter alone. X intentionally resolves to null
// (unknown) rather than guessing one territory over the other -- same
// "null means unknown, never treated as mismatch" convention ZIP3_RANGES
// already uses for unrecognized prefixes.
const POSTAL_PREFIX_TO_PROVINCE = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB',
  G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
  // X: ambiguous (NU or NT) -- deliberately omitted, see comment above.
};

// Returns a province code, or null if the postal code's first letter isn't
// recognized (not a valid Canadian postal code, or the ambiguous 'X').
function provinceForPostal(postal) {
  const letter = String(postal || '').trim().charAt(0).toUpperCase();
  return POSTAL_PREFIX_TO_PROVINCE[letter] || null;
}

module.exports = { provinceForPostal };
