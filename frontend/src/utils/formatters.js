export function formatPrice(n) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString();
}

// Commercial cleaning is the one service quoted as a recurring monthly
// total (see calculateCommercial's unit: 'per_month' in
// backend/src/services/cleaningCalculation.js) rather than a flat one-time
// price -- every lead-list view that shows a bare price range needs this
// same "/mo" suffix on a commercial lead, or it reads as a one-time quote
// several times smaller than the home-cleaning lead next to it.
export function formatPriceRange(low, high, serviceType) {
  if (low == null || high == null) return '—';
  const suffix = serviceType === 'commercial' ? '/mo' : '';
  return `${formatPrice(low)} – ${formatPrice(high)}${suffix}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function serviceTypeLabel(type) {
  const map = {
    home_residential: 'House Cleaning',
    apartment: 'Apartment Cleaning',
    commercial: 'Commercial Cleaning',
    carpet: 'Carpet Cleaning',
    air_duct: 'Air Duct Cleaning',
    dryer_vent: 'Dryer Vent Cleaning',
    tile_grout: 'Tile & Grout',
    mold_remediation: 'Mold Remediation',
    water_damage: 'Water Damage',
  };
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
