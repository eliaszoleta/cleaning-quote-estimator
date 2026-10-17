// Best-effort Canadian postal code (FSA first letter) -> province mapping,
// used only as a soft "does this postal code look like it's in the province
// you picked" sanity check on the location step's optional postal field
// (LocationStep.js) -- never the source of truth for pricing, that's always
// the province the visitor explicitly selected. Mirrors
// backend/src/data/postalProvinceRanges.js, which does the same lookup
// server-side as calculateCleaning's fallback province resolution for
// callers that skip province entirely.
//
// Canada Post assigns the first letter of a postal code's Forward
// Sortation Area to a single province/territory -- a public, fixed
// standard -- except for the letter X, which is split between Nunavut and
// the Northwest Territories in a way the first letter alone can't
// resolve. X intentionally returns null (unknown) rather than guessing one
// territory over the other, same convention zipStateRanges.js uses for an
// unrecognized ZIP prefix.
const POSTAL_PREFIX_TO_PROVINCE = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB',
  G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
};

export function provinceForPostal(postal) {
  const letter = String(postal || '').trim().charAt(0).toUpperCase();
  return POSTAL_PREFIX_TO_PROVINCE[letter] || null;
}
