// Display labels for every enum/tier value a calculator step sends to the
// backend, kept in sync with the exact button/option text shown in each
// step component (frontend/src/components/calculator/steps/*.js) -- so a
// value echoed back in the price breakdown or "Key Factors" summary always
// matches what the user actually picked, instead of the raw snake_case key
// (e.g. "needs_attention", "1500_2000", "one_time") leaking straight into
// the UI with only CSS capitalize() applied (which doesn't touch
// underscores at all).

// Fallback for any id that isn't in a specific map below -- still never
// shows a raw underscore, just loses the step's exact wording/nuance.
function humanize(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function labelFor(map, id) {
  return map[id] || humanize(id);
}

// HomeStep.js + ApartmentStep.js
const SQFT_TIER_LABELS = {
  under_1000: 'Under 1,000 sq ft',
  '1000_1500': '1,000 – 1,500 sq ft',
  '1500_2000': '1,500 – 2,000 sq ft',
  '2000_2500': '2,000 – 2,500 sq ft',
  '2500_3000': '2,500 – 3,000 sq ft',
  over_3000: 'Over 3,000 sq ft',
};

const CLEANING_TYPE_LABELS = {
  standard: 'Standard Clean',
  deep: 'Deep Clean',
  move_in_out: 'Move-In / Move-Out',
};

const FREQUENCY_LABELS = {
  one_time: 'One-Time',
  daily: 'Daily (5x/wk)',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
};

const HOME_CONDITION_LABELS = {
  good: 'Good',
  fair: 'Fair',
  needs_attention: 'Neglected',
};

const APARTMENT_SIZE_LABELS = {
  studio: 'Studio',
  '1br': '1 Bedroom',
  '2br': '2 Bedrooms',
  '3br': '3 Bedrooms',
  '4br_plus': '4+ Bedrooms',
};

const COMMERCIAL_BUILDING_TYPE_LABELS = {
  office: 'Office / Professional',
  retail: 'Retail / Showroom',
  medical: 'Medical / Dental',
  restaurant: 'Restaurant / Kitchen',
  warehouse: 'Warehouse / Industrial',
  school: 'School / Daycare',
  gym: 'Gym / Fitness',
  church: 'Church / Event Space',
};

const COMMERCIAL_SERVICE_LEVEL_LABELS = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

// CarpetStep.js condition, reused as-is by UpholsteryStep.js
const SOILING_CONDITION_LABELS = {
  light: 'Light soiling',
  moderate: 'Moderate soiling',
  heavy: 'Heavily soiled',
  pet: 'Pet stains/odors',
};

const CARPET_METHOD_LABELS = {
  steam: 'Steam (Hot Water Extraction)',
  dry: 'Dry Cleaning',
  encapsulation: 'Encapsulation',
};

const UPHOLSTERY_FABRIC_LABELS = {
  fabric: 'Fabric',
  leather: 'Leather',
};

const AIR_DUCT_VENT_COUNT_LABELS = {
  under_10: '< 10 vents',
  '10_20': '10–20 vents',
  '20_30': '20–30 vents',
  '30_plus': '30+ vents',
};

const DRYER_VENT_LENGTH_LABELS = {
  short: 'Short (< 10 ft)',
  medium: 'Medium (10–25 ft)',
  long: 'Long (25–50 ft)',
  very_long: 'Very Long (50+ ft)',
};

const DRYER_VENT_TYPE_LABELS = {
  standard: 'Standard (through wall)',
  roof: 'Through roof',
  underground: 'Underground',
  periscope: 'Periscope / tight space',
};

const TILE_TYPE_LABELS = {
  ceramic: 'Ceramic',
  porcelain: 'Porcelain',
  natural_stone: 'Natural Stone',
};

const TILE_CONDITION_LABELS = {
  light: 'Lightly soiled',
  moderate: 'Moderately dirty',
  heavy: 'Heavy buildup',
  damaged: 'Years of neglect',
};

const MOLD_TYPE_LABELS = {
  not_sure: 'Not Sure',
  black_mold: 'Black Mold (Stachybotrys)',
  white_mold: 'White Mold',
  green_mold: 'Green / Common Mold',
};

const WATER_CATEGORY_LABELS = {
  clean: 'Category 1: Clean Water',
  gray: 'Category 2: Gray Water',
  black: 'Category 3: Black Water',
};

const WATER_CAUSE_LABELS = {
  pipe_burst: 'Burst / Broken Pipe',
  appliance_leak: 'Appliance Leak',
  toilet_overflow: 'Toilet Overflow',
  roof_leak: 'Roof Leak',
  flooding: 'Natural Flooding',
  sewage: 'Sewage Backup',
};

const WATER_DAMAGE_CLASS_LABELS = {
  wet_carpets: 'Wet carpets / floors only',
  wet_walls: 'Walls / drywall soaked',
  structural: 'Structural damage / subfloor',
};

const WATER_WHEN_HAPPENED_LABELS = {
  today: 'Today / Ongoing',
  '24_48h': '24–48 hours ago',
  days_3_7: '3–7 days ago',
  week_plus: 'Over a week ago',
};

// AirbnbStep.js
const AIRBNB_SIZE_LABELS = {
  studio_1br: 'Studio / 1 Bedroom',
  '2br': '2 Bedrooms',
  '3br': '3 Bedrooms',
  '4br_plus': '4+ Bedrooms',
};

const AIRBNB_TURNAROUND_LABELS = {
  standard: 'Standard Turnover',
  same_day_rush: 'Same-Day Rush',
};

// PostConstructionStep.js
const POST_CONSTRUCTION_TYPE_LABELS = {
  light: 'Light Renovation / Touch-Up',
  moderate: 'Moderate Renovation',
  full: 'New Construction / Major Renovation',
};

module.exports = {
  humanize,
  labelFor,
  SQFT_TIER_LABELS,
  CLEANING_TYPE_LABELS,
  FREQUENCY_LABELS,
  HOME_CONDITION_LABELS,
  APARTMENT_SIZE_LABELS,
  COMMERCIAL_BUILDING_TYPE_LABELS,
  COMMERCIAL_SERVICE_LEVEL_LABELS,
  SOILING_CONDITION_LABELS,
  CARPET_METHOD_LABELS,
  UPHOLSTERY_FABRIC_LABELS,
  AIR_DUCT_VENT_COUNT_LABELS,
  DRYER_VENT_LENGTH_LABELS,
  DRYER_VENT_TYPE_LABELS,
  TILE_TYPE_LABELS,
  TILE_CONDITION_LABELS,
  MOLD_TYPE_LABELS,
  WATER_CATEGORY_LABELS,
  WATER_CAUSE_LABELS,
  AIRBNB_SIZE_LABELS,
  AIRBNB_TURNAROUND_LABELS,
  POST_CONSTRUCTION_TYPE_LABELS,
  WATER_DAMAGE_CLASS_LABELS,
  WATER_WHEN_HAPPENED_LABELS,
};
