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
  deep:             { low: 1.6,  high: 1.9  },
  move_in_out:      { low: 1.8,  high: 2.1  },
  post_construction:{ low: 2.1,  high: 2.4  },
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
  inside_oven:      { low: 35, high: 50 },
  inside_fridge:    { low: 28, high: 42 },
  interior_windows: { low: 48, high: 68 },
  laundry:          { low: 32, high: 45 },
  dishes:           { low: 22, high: 33 },
  garage:           { low: 58, high: 82 },
  basement:         { low: 70, high: 100 },
  balcony_patio:    { low: 40, high: 58 },
};

// Home condition multipliers
const CONDITION_MULTIPLIERS = {
  good:  { low: 1.0,  high: 1.0  },
  fair:  { low: 1.10, high: 1.15 },
  needs_attention: { low: 1.20, high: 1.30 },
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
const CARPET_PRICE_PER_ROOM = { low: 38, high: 55 };
const CARPET_PRICE_PER_SQFT = { low: 0.25, high: 0.35 };
const CARPET_MINIMUM = { low: 90, high: 110 };

const CARPET_CONDITION_MULTIPLIERS = {
  light:   { low: 1.0,  high: 1.0  },
  moderate:{ low: 1.1,  high: 1.2  },
  heavy:   { low: 1.35, high: 1.45 },
  pet:     { low: 1.6,  high: 1.85 },
};

const CARPET_METHOD_MULTIPLIERS = {
  steam:          { low: 1.0, high: 1.0 },
  dry:            { low: 1.1, high: 1.15 },
  encapsulation:  { low: 1.0, high: 1.1 },
};

const CARPET_ADDONS = {
  pet_odor:         { low: 40, high: 80 },
  stain_protector:  { low: 30, high: 60 },
  deodorizer:       { low: 20, high: 40 },
  area_rug:         { low: 50, high: 150 }, // per rug
};

const CARPET_STAIRS_PER_FLIGHT = { low: 45, high: 75 }; // 13-15 steps × $3-$5/step

// Air duct cleaning
const AIR_DUCT_BASE = { low: 300, high: 500 }; // up to ~12 vents residential
const AIR_DUCT_PER_VENT = { low: 15, high: 25 };
const AIR_DUCT_PER_SYSTEM = { low: 50, high: 100 };
const AIR_DUCT_COMMERCIAL_PER_SQFT = { low: 0.15, high: 0.35 };

const AIR_DUCT_ADDONS = {
  dryer_vent_combo: { low: 60, high: 100 },
  sanitization:     { low: 100, high: 200 },
  hepa_filtration:  { low: 75, high: 150 },
  uv_light:         { low: 200, high: 400 },
  coil_cleaning:    { low: 80, high: 160 },
};

// Dryer vent cleaning
const DRYER_VENT_BASE = { low: 80, high: 170 };

const DRYER_VENT_LENGTH_ADDON = {
  short:      { low: 0, high: 0 },
  medium:     { low: 20, high: 40 },
  long:       { low: 40, high: 80 },
  very_long:  { low: 75, high: 130 },
};

const DRYER_VENT_TYPE_ADDON = {
  standard:   { low: 0, high: 0 },
  roof:       { low: 25, high: 50 },
  side_wall:  { low: 10, high: 25 },
  floor:      { low: 15, high: 30 },
};

const DRYER_VENT_CLOG_ADDON = { low: 30, high: 60 };
const DRYER_VENT_COMMERCIAL_RATE = { low: 60, high: 120 }; // per machine

// Tile & Grout cleaning
const TILE_PRICE_PER_SQFT = {
  ceramic:    { low: 0.75, high: 1.50 },
  porcelain:  { low: 0.85, high: 1.65 },
  natural_stone: { low: 1.25, high: 2.50 },
  saltillo:   { low: 1.00, high: 2.00 },
};

const TILE_CONDITION_MULTIPLIERS = {
  light:   { low: 1.0, high: 1.0 },
  moderate:{ low: 1.1, high: 1.2 },
  heavy:   { low: 1.3, high: 1.5 },
  damaged: { low: 1.4, high: 1.6 },
};

const TILE_SERVICE_ADDONS = {
  grout_sealing:     { perSqft: { low: 0.50, high: 1.00 } },
  grout_recoloring:  { perSqft: { low: 1.50, high: 3.00 } },
  caulk_replacement: { perLinFt: { low: 3, high: 8 } },
  tile_repair:       { perSqft: { low: 5, high: 15 } },
};

const TILE_MINIMUM = { low: 150, high: 200 };

// Mold remediation price ranges by affected area
// Source: EPA mold remediation guidelines, NORMI certified remediators
const MOLD_PRICE_RANGES = {
  small:     { low: 500,  high: 1500  },  // <10 sq ft
  medium:    { low: 1500, high: 3500  },  // 10–100 sq ft
  large:     { low: 3500, high: 7000  },  // 100–300 sq ft
  extensive: { low: 7000, high: 25000 },  // 300+ sq ft
};

const MOLD_ADDONS = {
  air_testing:         { low: 150, high: 350 },
  clearance_test:      { low: 200, high: 400 },
  hvac_cleaning:       { low: 300, high: 600 },
  drywall_replacement: { low: 3, high: 8 }, // per sq ft
};

const MOLD_COMMERCIAL_MULTIPLIER = { low: 2.0, high: 3.0 };

// Water damage restoration price ranges
// Source: IICRC S500 standards, restoration industry data
const WATER_DAMAGE_RANGES = {
  extraction_only:     { low: 300,  high: 2500  },
  extraction_drying:   { low: 1200, high: 4000  },
  structural_drying:   { low: 500,  high: 2000  }, // additional
  mold_prevention:     { low: 300,  high: 800   },
  full_restoration:    { low: 2000, high: 25000 },
};

const WATER_CATEGORY_MULTIPLIERS = {
  clean:  { low: 1.0, high: 1.0 },
  gray:   { low: 1.3, high: 1.5 },
  black:  { low: 2.0, high: 3.0 },
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
  MOLD_ADDONS,
  MOLD_COMMERCIAL_MULTIPLIER,
  WATER_DAMAGE_RANGES,
  WATER_CATEGORY_MULTIPLIERS,
};
