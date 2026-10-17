// symbol defaults to '$' so every existing call site (every one of them,
// pre-Canada-pilot) renders byte-identical to before this parameter
// existed. A CA company's result carries currencySymbol: 'C$' (see
// calculateCleaning's return in cleaningCalculation.js) -- callers that
// have that value in scope pass it through explicitly.
export function formatPrice(n, symbol = '$') {
  if (n == null) return '—';
  return symbol + Math.round(n).toLocaleString();
}

// Commercial cleaning is the one service quoted as a recurring monthly
// total (see calculateCommercial's unit: 'per_month' in
// backend/src/services/cleaningCalculation.js) rather than a flat one-time
// price -- every lead-list view that shows a bare price range needs this
// same "/mo" suffix on a commercial lead, or it reads as a one-time quote
// several times smaller than the home-cleaning lead next to it.
export function formatPriceRange(low, high, serviceType, symbol = '$') {
  if (low == null || high == null) return '—';
  const suffix = serviceType === 'commercial' ? '/mo' : '';
  return `${formatPrice(low, symbol)} – ${formatPrice(high, symbol)}${suffix}`;
}

// Mirrors backend/src/config/defaults.js's COUNTRIES map -- a lead record
// has no currencySymbol of its own (the leads table was never given that
// column; a company only ever operates in one country, set once in
// Settings, same reasoning calculateCleaning's own country derivation
// comment gives), so any dashboard view showing a PAST lead's price derives
// the symbol from the viewing company's own country setting instead.
// Views showing a FRESH estimate (ResultsScreen.js) already get
// currencySymbol directly off that estimate's own result and don't need
// this -- only use this for data without that field attached.
const COUNTRY_CURRENCY_SYMBOLS = { US: '$', CA: 'C$', GB: '£', AU: 'A$' };
export function currencySymbolForCountry(country) {
  return COUNTRY_CURRENCY_SYMBOLS[country] || '$';
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// UK pilot (Oct 2026) -- real UK trade terminology, not just a translation:
// every UK pricing source found during that research said "flat," never
// "apartment"; "mould removal," never "mold remediation"; and "after
// builders clean" is the UK trade's own recognized service name, more
// specific than the generic "post-construction." The other 9 services'
// English-language labels already read naturally in the UK as-is.
const UK_SERVICE_LABEL_OVERRIDES = {
  apartment: 'Flat Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};

// Australia pilot (Nov 2026) -- "unit" is the classic Australian term for
// apartment (vs. the UK's "flat"); mould spelling and "after builders
// clean" are shared with the UK (both confirmed as real AU trade terms
// too, e.g. Clean Group Sydney's own "After Builders Cleaning" pricing
// page), so those two reuse the same override text.
const AU_SERVICE_LABEL_OVERRIDES = {
  apartment: 'Unit Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};

const COUNTRY_SERVICE_LABEL_OVERRIDES = { GB: UK_SERVICE_LABEL_OVERRIDES, AU: AU_SERVICE_LABEL_OVERRIDES };

// country defaults undefined so every existing call site (every one of
// them, pre-UK-pilot) renders byte-identical to before this parameter
// existed -- only a recognized non-US country triggers an override.
export function serviceTypeLabel(type, country) {
  const map = {
    home_residential: 'House Cleaning',
    apartment: 'Apartment Cleaning',
    commercial: 'Commercial Cleaning',
    carpet: 'Carpet Cleaning',
    upholstery: 'Upholstery Cleaning',
    air_duct: 'Air Duct Cleaning',
    dryer_vent: 'Dryer Vent Cleaning',
    tile_grout: 'Tile & Grout',
    mold_remediation: 'Mold Remediation',
    water_damage: 'Water Damage',
    airbnb: 'Airbnb/Vacation Rental Cleaning',
    post_construction: 'Post-Construction Cleaning',
  };
  const overrides = COUNTRY_SERVICE_LABEL_OVERRIDES[country];
  if (overrides && overrides[type]) return overrides[type];
  return map[type] || type;
}

export function urgencyColor(level) {
  if (level === 'critical') return '#dc2626';
  if (level === 'high') return '#d97706';
  return '#2563eb';
}

export function frequencyLabel(f) {
  const map = { one_time: 'One-time', weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' };
  return map[f] || f;
}
