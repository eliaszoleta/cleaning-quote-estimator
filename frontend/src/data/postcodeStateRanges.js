// Client-side mirror of backend/src/data/postcodeStateRanges.js -- used to
// validate LocationStep's optional AU postcode field against the state
// already selected. See the backend file for sourcing notes.
const AU_POSTCODE_STATE_RANGES = [
  { min: 200, max: 299, state: 'ACT' },
  { min: 800, max: 999, state: 'NT' },
  { min: 1000, max: 1999, state: 'NSW' },
  { min: 2000, max: 2599, state: 'NSW' },
  { min: 2600, max: 2618, state: 'ACT' },
  { min: 2619, max: 2899, state: 'NSW' },
  { min: 2900, max: 2920, state: 'ACT' },
  { min: 2921, max: 2999, state: 'NSW' },
  { min: 3000, max: 3999, state: 'VIC' },
  { min: 4000, max: 4999, state: 'QLD' },
  { min: 5000, max: 5999, state: 'SA' },
  { min: 6000, max: 6999, state: 'WA' },
  { min: 7000, max: 7999, state: 'TAS' },
  { min: 8000, max: 8999, state: 'VIC' },
  { min: 9000, max: 9999, state: 'QLD' },
];

export function stateForPostcode(postcode) {
  const digits = String(postcode || '').trim();
  if (!/^\d{3,4}$/.test(digits)) return null;
  const code = parseInt(digits, 10);
  const match = AU_POSTCODE_STATE_RANGES.find(r => code >= r.min && code <= r.max);
  return match ? match.state : null;
}
