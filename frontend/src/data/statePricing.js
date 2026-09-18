// ─── State cleaning cost data ───────────────────────────────────────────────
// Mirrors backend/src/config/defaults.js (STATE_PRICING_MULTIPLIERS,
// STATE_NAMES, STATE_AVERAGE_HOME_CLEANING_COST) so state pages and the
// homepage state table stay consistent with what the calculator itself
// quotes. Update both files together if pricing data changes.

const RANGE_SPREAD = 0.15; // +/- range shown around a state's average house-cleaning price

const STATES = [
  { code: 'AL', name: 'Alabama', slug: 'alabama', multiplier: 0.82, avgCost: 115 },
  { code: 'AK', name: 'Alaska', slug: 'alaska', multiplier: 1.38, avgCost: 195 },
  { code: 'AZ', name: 'Arizona', slug: 'arizona', multiplier: 1.08, avgCost: 155 },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas', multiplier: 0.80, avgCost: 110 },
  { code: 'CA', name: 'California', slug: 'california', multiplier: 1.40, avgCost: 200 },
  { code: 'CO', name: 'Colorado', slug: 'colorado', multiplier: 1.22, avgCost: 175 },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut', multiplier: 1.28, avgCost: 185 },
  { code: 'DE', name: 'Delaware', slug: 'delaware', multiplier: 1.12, avgCost: 160 },
  { code: 'DC', name: 'Washington DC', slug: 'washington-dc', multiplier: 1.45, avgCost: 210 },
  { code: 'FL', name: 'Florida', slug: 'florida', multiplier: 1.05, avgCost: 150 },
  { code: 'GA', name: 'Georgia', slug: 'georgia', multiplier: 0.95, avgCost: 135 },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii', multiplier: 1.50, avgCost: 215 },
  { code: 'ID', name: 'Idaho', slug: 'idaho', multiplier: 0.98, avgCost: 140 },
  { code: 'IL', name: 'Illinois', slug: 'illinois', multiplier: 1.18, avgCost: 170 },
  { code: 'IN', name: 'Indiana', slug: 'indiana', multiplier: 0.92, avgCost: 130 },
  { code: 'IA', name: 'Iowa', slug: 'iowa', multiplier: 0.90, avgCost: 130 },
  { code: 'KS', name: 'Kansas', slug: 'kansas', multiplier: 0.88, avgCost: 125 },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky', multiplier: 0.83, avgCost: 118 },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana', multiplier: 0.85, avgCost: 122 },
  { code: 'ME', name: 'Maine', slug: 'maine', multiplier: 1.05, avgCost: 150 },
  { code: 'MD', name: 'Maryland', slug: 'maryland', multiplier: 1.25, avgCost: 178 },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts', multiplier: 1.35, avgCost: 195 },
  { code: 'MI', name: 'Michigan', slug: 'michigan', multiplier: 0.97, avgCost: 138 },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota', multiplier: 1.15, avgCost: 165 },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi', multiplier: 0.78, avgCost: 108 },
  { code: 'MO', name: 'Missouri', slug: 'missouri', multiplier: 0.90, avgCost: 130 },
  { code: 'MT', name: 'Montana', slug: 'montana', multiplier: 1.00, avgCost: 142 },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska', multiplier: 0.92, avgCost: 132 },
  { code: 'NV', name: 'Nevada', slug: 'nevada', multiplier: 1.10, avgCost: 158 },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire', multiplier: 1.18, avgCost: 168 },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey', multiplier: 1.30, avgCost: 188 },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico', multiplier: 0.88, avgCost: 125 },
  { code: 'NY', name: 'New York', slug: 'new-york', multiplier: 1.42, avgCost: 205 },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina', multiplier: 0.93, avgCost: 133 },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota', multiplier: 0.95, avgCost: 136 },
  { code: 'OH', name: 'Ohio', slug: 'ohio', multiplier: 0.95, avgCost: 136 },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma', multiplier: 0.85, avgCost: 122 },
  { code: 'OR', name: 'Oregon', slug: 'oregon', multiplier: 1.20, avgCost: 172 },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania', multiplier: 1.08, avgCost: 155 },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island', multiplier: 1.20, avgCost: 172 },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina', multiplier: 0.87, avgCost: 124 },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota', multiplier: 0.88, avgCost: 125 },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee', multiplier: 0.87, avgCost: 124 },
  { code: 'TX', name: 'Texas', slug: 'texas', multiplier: 1.05, avgCost: 150 },
  { code: 'UT', name: 'Utah', slug: 'utah', multiplier: 1.05, avgCost: 150 },
  { code: 'VT', name: 'Vermont', slug: 'vermont', multiplier: 1.15, avgCost: 163 },
  { code: 'VA', name: 'Virginia', slug: 'virginia', multiplier: 1.15, avgCost: 165 },
  { code: 'WA', name: 'Washington', slug: 'washington', multiplier: 1.32, avgCost: 190 },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia', multiplier: 0.78, avgCost: 108 },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin', multiplier: 1.00, avgCost: 142 },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming', multiplier: 0.95, avgCost: 135 },
];

function round5(n) {
  return Math.round(n / 5) * 5;
}

// House-cleaning cost range for a state (+/- 15% around its average), for a
// standard clean of a 2,000 sq ft home — matches the figure already shown on
// the homepage ("House Cleaning Cost by State").
function costRange(avgCost) {
  return { low: round5(avgCost * (1 - RANGE_SPREAD)), high: round5(avgCost * (1 + RANGE_SPREAD)) };
}

function marketTier(multiplier) {
  if (multiplier >= 1.15) return 'high';
  if (multiplier <= 0.88) return 'low';
  return 'average';
}

function withComputed(s) {
  return { ...s, ...costRange(s.avgCost), tier: marketTier(s.multiplier) };
}

export function getAllStates() {
  return STATES.map(withComputed).sort((a, b) => a.name.localeCompare(b.name));
}

export function getStateBySlug(slug) {
  const s = STATES.find(st => st.slug === slug);
  return s ? withComputed(s) : null;
}

export function getStateByCode(code) {
  const s = STATES.find(st => st.code === code);
  return s ? withComputed(s) : null;
}

// A representative spread of states for homepage teaser tables — mix of
// high-cost, low-cost, and populous average markets.
export function getFeaturedStates() {
  const slugs = ['california', 'new-york', 'texas', 'florida', 'illinois', 'washington', 'colorado', 'arizona'];
  return slugs.map(getStateBySlug).filter(Boolean);
}

// Applies a state's multiplier to a national low/high price range — the same
// math backend/src/services/cleaningCalculation.js's applyMultiplier uses.
export function adjustForState(low, high, state) {
  return { low: Math.round(low * state.multiplier), high: Math.round(high * state.multiplier) };
}
