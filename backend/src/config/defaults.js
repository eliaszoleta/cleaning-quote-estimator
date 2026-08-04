// Default cleaning company configuration
// All pricing based on research from HomeAdvisor, Angi, Thumbtack, HomeGuide,
// and BLS wage data for SOC 37-0000 (Building and Grounds Cleaning and Maintenance)
// Updated: 2025

// ─────────────────────────────────────────────────────────────────────────────
// STATE PRICING MULTIPLIERS
// Based on BLS state-level wage data + COL indices + market competition
// National average = 1.00 (represented by states like OH, IN, MO)
// ─────────────────────────────────────────────────────────────────────────────
const STATE_PRICING_MULTIPLIERS = {
  AL: 0.82, AK: 1.38, AZ: 1.08, AR: 0.80, CA: 1.40, CO: 1.22, CT: 1.28,
  DE: 1.12, DC: 1.45, FL: 1.05, GA: 0.95, HI: 1.50, ID: 0.98, IL: 1.18,
  IN: 0.92, IA: 0.90, KS: 0.88, KY: 0.83, LA: 0.85, ME: 1.05, MD: 1.25,
  MA: 1.35, MI: 0.97, MN: 1.15, MS: 0.78, MO: 0.90, MT: 1.00, NE: 0.92,
  NV: 1.10, NH: 1.18, NJ: 1.30, NM: 0.88, NY: 1.42, NC: 0.93, ND: 0.95,
  OH: 0.95, OK: 0.85, OR: 1.20, PA: 1.08, RI: 1.20, SC: 0.87, SD: 0.88,
  TN: 0.87, TX: 1.05, UT: 1.05, VT: 1.15, VA: 1.15, WA: 1.32, WV: 0.78,
  WI: 1.00, WY: 0.95,
};

// BLS average hourly wages for cleaning workers by state (SOC 37-0000, 2024 data)
const STATE_LABOR_RATES = {
  AL: 12.80, AK: 18.50, AZ: 15.20, AR: 12.50, CA: 19.80, CO: 17.40, CT: 18.20,
  DE: 15.80, DC: 20.50, FL: 14.90, GA: 13.80, HI: 19.20, ID: 13.90, IL: 16.50,
  IN: 13.40, IA: 13.20, KS: 12.90, KY: 12.60, LA: 12.80, ME: 14.80, MD: 17.20,
  MA: 18.80, MI: 14.20, MN: 16.40, MS: 11.80, MO: 13.20, MT: 14.20, NE: 13.50,
  NV: 15.60, NH: 16.80, NJ: 18.20, NM: 13.20, NY: 20.10, NC: 13.60, ND: 13.80,
  OH: 13.80, OK: 12.60, OR: 17.20, PA: 15.40, RI: 16.80, SC: 12.90, SD: 13.20,
  TN: 12.80, TX: 14.80, UT: 14.80, VT: 16.40, VA: 16.20, WA: 18.90, WV: 11.90,
  WI: 14.40, WY: 13.80,
};

// Market maturity: competitive markets have more providers → more price pressure
const STATE_MARKET_MATURITY = {
  AL: 'average', AK: 'thin', AZ: 'competitive', AR: 'average', CA: 'competitive',
  CO: 'competitive', CT: 'competitive', DE: 'average', DC: 'competitive', FL: 'competitive',
  GA: 'competitive', HI: 'average', ID: 'average', IL: 'competitive', IN: 'average',
  IA: 'average', KS: 'average', KY: 'average', LA: 'average', ME: 'average',
  MD: 'competitive', MA: 'competitive', MI: 'competitive', MN: 'competitive', MS: 'thin',
  MO: 'average', MT: 'thin', NE: 'average', NV: 'competitive', NH: 'average',
  NJ: 'competitive', NM: 'average', NY: 'competitive', NC: 'competitive', ND: 'thin',
  OH: 'competitive', OK: 'average', OR: 'competitive', PA: 'competitive', RI: 'average',
  SC: 'average', SD: 'thin', TN: 'competitive', TX: 'competitive', UT: 'competitive',
  VT: 'thin', VA: 'competitive', WA: 'competitive', WV: 'thin', WI: 'competitive',
  WY: 'thin',
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CLEANING COMPANY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COMPANY_CONFIG = {
  companyName: '',
  logo: '',
  primaryColor: '#2563eb',
  accentColor: '#16a34a',
  fontFamily: 'Inter',
  ctaHeadline: 'Get Your Exact Quote Today',
  ctaSubtext: 'Our team is ready to provide a free, detailed estimate.',
  ctaButtonText: 'Schedule Free Estimate',
  ctaPhone: '',
  ctaButtonUrl: '',
  frameHeight: '700px',
  borderRadius: '12px',
  serviceStates: [],
  customSteps: [],
  subscription: {
    status: 'trialing',
    trialStartedAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  },
  apiKey: null,
  services: {
    homeResidential: {
      enabled: true,
      basePricePerSqft: 0.10,
      minimumCharge: 100,
      markup: 1.0,
      recurringDiscount: 0.15,
    },
    apartment: {
      enabled: true,
      basePricePerSqft: 0.09,
      minimumCharge: 85,
      markup: 1.0,
      recurringDiscount: 0.15,
    },
    commercial: {
      enabled: true,
      pricePerSqft: 0.08,
      minimumCharge: 200,
      markup: 1.0,
    },
    carpet: {
      enabled: true,
      pricePerRoom: 45,
      pricePerSqft: 0.30,
      minimumCharge: 90,
      markup: 1.0,
    },
    airDuct: {
      enabled: true,
      basePrice: 380,
      pricePerVent: 20,
      minimumCharge: 300,
      markup: 1.0,
    },
    dryerVent: {
      enabled: true,
      basePrice: 120,
      minimumCharge: 80,
      markup: 1.0,
    },
    tileGrout: {
      enabled: true,
      pricePerSqft: 1.50,
      minimumCharge: 175,
      markup: 1.0,
    },
    moldRemediation: {
      enabled: true,
      markup: 1.0,
    },
    waterDamage: {
      enabled: true,
      markup: 1.0,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE PRICING DATA
// ─────────────────────────────────────────────────────────────────────────────

// Home / Residential Cleaning base prices by sq footage tier
// Source: HomeAdvisor 2024, Angi 2024
const HOME_SQFT_BASE_PRICES = {
  'under_1000': { low: 90,  high: 115 },
  '1000_1500':  { low: 122, high: 152 },
  '1500_2000':  { low: 158, high: 198 },
  '2000_2500':  { low: 195, high: 245 },
  '2500_3000':  { low: 228, high: 282 },
  'over_3000':  { low: 272, high: 338 },
};

// Bedroom/bathroom modifier (additional cost per room beyond base)
const BEDROOM_ADDON = { 1: 0, 2: 15, 3: 30, 4: 50, '5+': 75 };
const BATHROOM_ADDON = { 1: 0, '1.5': 20, 2: 35, '2.5': 50, 3: 65, '3+': 90 };

// Cleaning type multipliers
const CLEANING_TYPE_MULTIPLIERS = {
  standard:         { low: 1.0,  high: 1.0  },
  deep:             { low: 1.68, high: 1.85 },
  move_in_out:      { low: 1.88, high: 2.05 },
  post_construction:{ low: 2.18, high: 2.35 },
};

// Frequency discounts
const FREQUENCY_DISCOUNTS = {
  one_time:  0,
  weekly:    0.20,
  biweekly:  0.15,
  monthly:   0.10,
};

// Extra add-on costs (residential/apartment)
const HOME_EXTRAS = {
  inside_oven:      { low: 38, high: 50 },
  inside_fridge:    { low: 30, high: 42 },
  interior_windows: { low: 52, high: 65 },
  laundry:          { low: 34, high: 44 },
  dishes:           { low: 24, high: 32 },
  garage:           { low: 63, high: 80 },
  basement:         { low: 76, high: 96 },
  balcony_patio:    { low: 43, high: 56 },
};

// Home condition multipliers
const CONDITION_MULTIPLIERS = {
  good:  { low: 1.0,  high: 1.0  },
  fair:  { low: 1.10, high: 1.14 },
  needs_attention: { low: 1.22, high: 1.28 },
};

// Apartment size base prices (slightly lower than residential)
const APARTMENT_SIZE_PRICES = {
  studio:     { low: 85,  high: 108 },
  '1br':      { low: 107, high: 133 },
  '2br':      { low: 140, high: 175 },
  '3br':      { low: 175, high: 215 },
  '4br_plus': { low: 210, high: 258 },
};

// Commercial cleaning prices per sq ft per visit
// Source: ISSA (International Sanitary Supply Association), BuildingOperationsManagement
const COMMERCIAL_SQFT_RATES = {
  office:    { low: 0.088, high: 0.107 },
  retail:    { low: 0.09,  high: 0.11  },
  medical:   { low: 0.15,  high: 0.185 },
  restaurant:{ low: 0.12,  high: 0.148 },
  warehouse: { low: 0.052, high: 0.065 },
  school:    { low: 0.095, high: 0.118 },
  gym:       { low: 0.104, high: 0.128 },
};

// Service level multipliers for commercial
const COMMERCIAL_SERVICE_LEVELS = {
  basic:    { low: 1.0,  high: 1.0  },
  standard: { low: 1.2,  high: 1.25 },
  premium:  { low: 1.55, high: 1.68 },
};

// Commercial frequency (visits per month)
const COMMERCIAL_VISITS_PER_MONTH = {
  daily:    20,
  three_per_week: 13,
  weekly:   4,
  biweekly: 2,
  monthly:  1,
};

// Day porter monthly rate (loaded labor including benefits/overhead)
const DAY_PORTER_DAILY_RATE = { low: 218, high: 265 };

// Carpet cleaning prices
const CARPET_PRICE_PER_ROOM = { low: 44, high: 55 };
const CARPET_PRICE_PER_SQFT = { low: 0.28, high: 0.35 };
const CARPET_MINIMUM = { low: 90, high: 110 };

const CARPET_CONDITION_MULTIPLIERS = {
  light:   { low: 1.0,  high: 1.0  },
  moderate:{ low: 1.12, high: 1.18 },
  heavy:   { low: 1.37, high: 1.45 },
  pet:     { low: 1.65, high: 1.82 },
};

const CARPET_METHOD_MULTIPLIERS = {
  steam:          { low: 1.0,  high: 1.0  },
  dry:            { low: 1.10, high: 1.13 },
  encapsulation:  { low: 1.02, high: 1.08 },
};

const CARPET_ADDONS = {
  pet_odor:         { low: 48, high: 75 },
  stain_protector:  { low: 35, high: 55 },
  deodorizer:       { low: 22, high: 35 },
  area_rug:         { low: 58, high: 120 }, // per rug
};

const CARPET_STAIRS_PER_FLIGHT = { low: 52, high: 68 }; // 13-15 steps × $3.50-$4.50/step

// Air duct cleaning
const AIR_DUCT_BASE = { low: 330, high: 420 }; // up to ~12 vents residential
const AIR_DUCT_PER_VENT = { low: 18, high: 23 };
const AIR_DUCT_PER_SYSTEM = { low: 65, high: 85 };
const AIR_DUCT_COMMERCIAL_PER_SQFT = { low: 0.20, high: 0.27 };

const AIR_DUCT_ADDONS = {
  dryer_vent_combo: { low: 65, high: 90 },
  sanitization:     { low: 118, high: 168 },
  hepa_filtration:  { low: 88, high: 130 },
  uv_light:         { low: 245, high: 335 },
  coil_cleaning:    { low: 92, high: 130 },
};

// Dryer vent cleaning
const DRYER_VENT_BASE = { low: 105, high: 138 };

const DRYER_VENT_LENGTH_ADDON = {
  short:      { low: 0,  high: 0   },
  medium:     { low: 22, high: 38  },
  long:       { low: 48, high: 70  },
  very_long:  { low: 85, high: 115 },
};

const DRYER_VENT_TYPE_ADDON = {
  standard:   { low: 0,  high: 0  },
  roof:       { low: 30, high: 48 },
  side_wall:  { low: 12, high: 22 },
  floor:      { low: 17, high: 28 },
};

const DRYER_VENT_CLOG_ADDON = { low: 35, high: 55 };
const DRYER_VENT_COMMERCIAL_RATE = { low: 72, high: 100 }; // per machine

// Tile & Grout cleaning
const TILE_PRICE_PER_SQFT = {
  ceramic:    { low: 0.92, high: 1.22 },
  porcelain:  { low: 1.05, high: 1.40 },
  natural_stone: { low: 1.55, high: 2.05 },
  saltillo:   { low: 1.25, high: 1.65 },
};

const TILE_CONDITION_MULTIPLIERS = {
  light:   { low: 1.0,  high: 1.0  },
  moderate:{ low: 1.12, high: 1.18 },
  heavy:   { low: 1.32, high: 1.42 },
  damaged: { low: 1.42, high: 1.55 },
};

const TILE_SERVICE_ADDONS = {
  grout_sealing:     { perSqft: { low: 0.55, high: 0.88 } },
  grout_recoloring:  { perSqft: { low: 1.65, high: 2.55 } },
  caulk_replacement: { perLinFt: { low: 3.5, high: 7 } },
  tile_repair:       { perSqft: { low: 6, high: 13 } },
};

const TILE_MINIMUM = { low: 150, high: 200 };

// Mold remediation price ranges by affected area
// Source: EPA mold remediation guidelines, NORMI certified remediators
// Ranges are tightened around each tier's typical job cost (~1.5-1.9x spread, in line
// with the other services below) — remaining uncertainty is resolved by the mold-type
// and moisture-source multipliers instead of being baked into one wide tier range.
const MOLD_PRICE_RANGES = {
  small:     { low: 700,  high: 1150  },  // <10 sq ft
  medium:    { low: 1800, high: 2900  },  // 10–100 sq ft
  large:     { low: 4000, high: 6200  },  // 100–300 sq ft
  extensive: { low: 8000, high: 15000 },  // 300+ sq ft
};

// Known mold type narrows (and shifts) the estimate instead of leaving the full tier
// width — "not sure" keeps the tier's full uncertainty since containment/PPE needs are
// unknown until inspection.
const MOLD_TYPE_MULTIPLIERS = {
  not_sure:   { low: 1.0,  high: 1.0  },
  green_mold: { low: 0.85, high: 0.92 },  // common surface mold, cheapest to treat
  white_mold: { low: 0.90, high: 0.97 },
  black_mold: { low: 1.05, high: 1.18 },  // Stachybotrys — more containment/PPE/disposal
};

// Whether the moisture source is fixed affects re-treatment risk, not the base job size.
const MOLD_SOURCE_FIXED_MULTIPLIERS = {
  yes:        { low: 1.0, high: 1.0  },
  not_fixed:  { low: 1.0, high: 1.15 },
  not_sure:   { low: 1.0, high: 1.08 },
};

const MOLD_ADDONS = {
  air_testing:         { low: 200, high: 320 },
  clearance_test:      { low: 180, high: 280 },
  hvac_cleaning:       { low: 320, high: 480 },
  drywall_replacement: { low: 3, high: 8 }, // per sq ft
};

// Matches the "+30–50%" shown in the calculator UI for commercial properties.
const MOLD_COMMERCIAL_MULTIPLIER = { low: 1.3, high: 1.5 };

// Water damage restoration pricing
// Source: IICRC S500 standards, restoration industry data
// Extraction + drying scales per affected sq ft (collected from the calculator's area
// slider) instead of a single flat range, so the estimate reflects the actual job size.
const WATER_EXTRACTION_DRYING_PER_SQFT = { low: 2.60, high: 4.20 }; // 3–5 day extraction + drying
const WATER_EXTRACTION_DRYING_MINIMUM = { low: 500, high: 850 };   // small-loss minimum charge

const WATER_STRUCTURAL_DRYING_ADDON = { low: 600, high: 1100 };  // walls opened for drying — additional
const WATER_MOLD_PREVENTION_ADDON = { low: 320, high: 520 };     // required once 72h+ has passed
const WATER_CONTENTS_PACKOUT_ADDON = { low: 250, high: 450 };    // furniture/contents pack-out & cleaning

// Full drywall/flooring restoration is its own, separately-quoted project — priced per sq ft
// so it scales with the job instead of quoting every large loss the same $2k–$25k range.
const WATER_FULL_RESTORATION_PER_SQFT = { low: 8, high: 18 };
const WATER_FULL_RESTORATION_MINIMUM = { low: 2000, high: 3600 };

// Matches the "+30%" (gray) / "+60–100%" (black) shown in the calculator UI.
const WATER_CATEGORY_MULTIPLIERS = {
  clean:  { low: 1.0,  high: 1.0  },
  gray:   { low: 1.25, high: 1.35 },
  black:  { low: 1.6,  high: 2.0  },
};

// State name lookup
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington DC',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Average home cleaning costs by state (for SEO content tables)
const STATE_AVERAGE_HOME_CLEANING_COST = {
  AL: 115, AK: 195, AZ: 155, AR: 110, CA: 200, CO: 175, CT: 185,
  DE: 160, DC: 210, FL: 150, GA: 135, HI: 215, ID: 140, IL: 170,
  IN: 130, IA: 130, KS: 125, KY: 118, LA: 122, ME: 150, MD: 178,
  MA: 195, MI: 138, MN: 165, MS: 108, MO: 130, MT: 142, NE: 132,
  NV: 158, NH: 168, NJ: 188, NM: 125, NY: 205, NC: 133, ND: 136,
  OH: 136, OK: 122, OR: 172, PA: 155, RI: 172, SC: 124, SD: 125,
  TN: 124, TX: 150, UT: 150, VT: 163, VA: 165, WA: 190, WV: 108,
  WI: 142, WY: 135,
};

module.exports = {
  STATE_PRICING_MULTIPLIERS,
  STATE_LABOR_RATES,
  STATE_MARKET_MATURITY,
  STATE_NAMES,
  STATE_AVERAGE_HOME_CLEANING_COST,
  DEFAULT_COMPANY_CONFIG,
  HOME_SQFT_BASE_PRICES,
  BEDROOM_ADDON,
  BATHROOM_ADDON,
  CLEANING_TYPE_MULTIPLIERS,
  FREQUENCY_DISCOUNTS,
  HOME_EXTRAS,
  CONDITION_MULTIPLIERS,
  APARTMENT_SIZE_PRICES,
  COMMERCIAL_SQFT_RATES,
  COMMERCIAL_SERVICE_LEVELS,
  COMMERCIAL_VISITS_PER_MONTH,
  DAY_PORTER_DAILY_RATE,
  CARPET_PRICE_PER_ROOM,
  CARPET_PRICE_PER_SQFT,
  CARPET_MINIMUM,
  CARPET_CONDITION_MULTIPLIERS,
  CARPET_METHOD_MULTIPLIERS,
  CARPET_ADDONS,
  CARPET_STAIRS_PER_FLIGHT,
  AIR_DUCT_BASE,
  AIR_DUCT_PER_VENT,
  AIR_DUCT_PER_SYSTEM,
  AIR_DUCT_COMMERCIAL_PER_SQFT,
  AIR_DUCT_ADDONS,
  DRYER_VENT_BASE,
  DRYER_VENT_LENGTH_ADDON,
  DRYER_VENT_TYPE_ADDON,
  DRYER_VENT_CLOG_ADDON,
  DRYER_VENT_COMMERCIAL_RATE,
  TILE_PRICE_PER_SQFT,
  TILE_CONDITION_MULTIPLIERS,
  TILE_SERVICE_ADDONS,
  TILE_MINIMUM,
  MOLD_PRICE_RANGES,
  MOLD_TYPE_MULTIPLIERS,
  MOLD_SOURCE_FIXED_MULTIPLIERS,
  MOLD_ADDONS,
  MOLD_COMMERCIAL_MULTIPLIER,
  WATER_EXTRACTION_DRYING_PER_SQFT,
  WATER_EXTRACTION_DRYING_MINIMUM,
  WATER_STRUCTURAL_DRYING_ADDON,
  WATER_MOLD_PREVENTION_ADDON,
  WATER_CONTENTS_PACKOUT_ADDON,
  WATER_FULL_RESTORATION_PER_SQFT,
  WATER_FULL_RESTORATION_MINIMUM,
  WATER_CATEGORY_MULTIPLIERS,
};
