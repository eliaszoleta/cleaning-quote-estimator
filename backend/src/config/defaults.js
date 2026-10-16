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
  // Owner-provided phone/website, collected once at signup and used to
  // detect duplicate accounts (see companyConfig.js's findDuplicateCompany)
  // -- distinct from ctaPhone/ctaEmail below, which are the contact info
  // shown to visitors on the results page and are optional/edited any time.
  phone: '',
  website: '',
  logo: '',
  primaryColor: '#2563eb',
  accentColor: '#16a34a',
  fontFamily: 'Inter',
  ctaHeadline: 'Get Your Exact Quote Today',
  ctaHeadlineEnabled: true,
  ctaSubtext: 'Our team is ready to provide a free, detailed estimate.',
  ctaPhone: '',
  ctaEmail: '',
  // Where new-lead notifications get sent -- deliberately separate from the
  // Supabase Auth signup email, since that's just a login credential, not
  // necessarily an inbox anyone on the team actually checks for leads.
  leadNotificationEmail: '',
  frameHeight: '700px',
  borderRadius: '12px',
  serviceStates: [],
  // Map of state code -> city names, e.g. { TX: ['Austin','Houston'], OK: ['Tulsa'] }
  // -- keyed by state so a company serving multiple states gets each
  // state's own city list in the widget instead of one pool shared/mixed
  // across every state they operate in.
  serviceCities: {},
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
      // Off by default (see DiscountTab.js) -- no recurring-frequency
      // discount is applied on the estimate unless the company explicitly
      // sets one for weekly/biweekly/monthly.
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    apartment: {
      enabled: true,
      basePricePerSqft: 0.09,
      minimumCharge: 85,
      markup: 1.0,
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    commercial: {
      enabled: true,
      pricePerSqft: 0.08,
      minimumCharge: 200,
      markup: 1.0,
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
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
    upholstery: {
      enabled: true,
      minimumCharge: 90,
      markup: 1.0,
    },
    airbnb: {
      enabled: true,
      minimumCharge: 85,
      markup: 1.0,
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    postConstruction: {
      enabled: true,
      minimumCharge: 200,
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
// post_construction used to live here as a House Cleaning "cleaning type"
// option -- now its own standalone service (see POST_CONSTRUCTION_BASE_MULTIPLIER
// below), using this exact same 2.18-2.35x value so pricing didn't change,
// just where the service lives.
const CLEANING_TYPE_MULTIPLIERS = {
  standard:         { low: 1.0,  high: 1.0  },
  deep:             { low: 1.68, high: 1.85 },
  move_in_out:      { low: 1.88, high: 2.05 },
};

// Extra add-on costs (residential/apartment)
// inside_cabinets and pet_hair are estimated/interpolated (not externally
// sourced like the rest of this table) -- added after an audit found both
// were selectable on HomeStep.js/ApartmentStep.js with no matching key here
// at all, silently charging $0. Positioned relative to the nearest
// comparable sourced line item rather than left unpriced.
const HOME_EXTRAS = {
  inside_oven:      { low: 38, high: 50 },
  inside_fridge:    { low: 30, high: 42 },
  inside_cabinets:  { low: 35, high: 46 }, // comparable scope to inside_oven/inside_fridge
  interior_windows: { low: 52, high: 65 },
  laundry:          { low: 34, high: 44 },
  dishes:           { low: 24, high: 32 },
  garage:           { low: 63, high: 80 },
  basement:         { low: 76, high: 96 },
  balcony_patio:    { low: 43, high: 56 },
  pet_hair:         { low: 30, high: 40 }, // whole-home pass, comparable to inside_fridge tier
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

// Restroom cleaning per restroom, per visit -- ~10-15 min of fixture-level
// work (toilets, sinks, mirrors, floors, restocking) at a loaded labor
// rate in the same ballpark as DAY_PORTER_DAILY_RATE above (~$27-33/hr).
// Charged on the ACTUAL restroom count the customer enters, every visit --
// not a flat one-time add-on above some assumed "typical for this sqft"
// baseline (see calculateCommercial's history: that baseline meant a
// restroom count at or under it never affected the price or showed up in
// the breakdown at all, even though the customer had explicitly entered
// it, and even when it DID apply it was a flat amount that didn't scale
// with how many times a month the building was actually cleaned).
const COMMERCIAL_RESTROOM_PER_VISIT_RATE = { low: 4, high: 7 };

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

// Upholstery cleaning -- priced per piece (not per sq ft/room like carpet),
// since that's how the real market actually quotes furniture cleaning.
// Source: Angi/HomeAdvisor furniture cleaning cost guide (national avg
// ~$173, chairs $10-80, sectionals $100-300), cross-checked against
// Thumbtack-sourced provider rate data for loveseats/sofas.
const UPHOLSTERY_ITEM_PRICES = {
  chair:     { low: 40,  high: 70  }, // armchair or recliner
  loveseat:  { low: 75,  high: 110 },
  sofa:      { low: 120, high: 175 }, // 3-seat sofa -- most common job
  sectional: { low: 175, high: 280 },
  ottoman:   { low: 20,  high: 35  },
};

const UPHOLSTERY_CONDITION_MULTIPLIERS = {
  light:   { low: 1.0,  high: 1.0  },
  moderate:{ low: 1.12, high: 1.18 },
  heavy:   { low: 1.37, high: 1.45 },
  pet:     { low: 1.65, high: 1.82 },
};

// HomeAdvisor: leather cleaning "often costs double" standard upholstery.
const UPHOLSTERY_LEATHER_MULTIPLIER = { low: 1.80, high: 2.00 };

const UPHOLSTERY_ADDONS = {
  fabric_protector: { low: 15, high: 25 }, // per piece
  deodorizer:        { low: 12, high: 20 }, // per piece
};

const UPHOLSTERY_MINIMUM = { low: 90, high: 120 };

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

// underground/periscope are estimated/interpolated (not externally sourced
// like the rest of this table) -- added after an audit found both were
// selectable on DryerVentStep.js with no matching key here at all, silently
// treated as free (same as 'standard'). Positioned relative to the nearest
// comparable sourced tier: underground requires trenching/excavation access
// (harder than roof routing), periscope is specialized tight-space work
// (between roof and underground).
const DRYER_VENT_TYPE_ADDON = {
  standard:   { low: 0,  high: 0  },
  roof:       { low: 30, high: 48 },
  side_wall:  { low: 12, high: 22 },
  floor:      { low: 17, high: 28 },
  underground:{ low: 55, high: 80 },
  periscope:  { low: 40, high: 60 },
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
// Ranges are tightened around each tier's typical job cost (~1.3-1.5x spread, matching
// the other services below) — remaining uncertainty is resolved by the mold-type
// and moisture-source multipliers instead of being baked into one wide tier range.
const MOLD_PRICE_RANGES = {
  small:     { low: 750,  high: 1050  },  // <10 sq ft
  medium:    { low: 1950, high: 2700  },  // 10–100 sq ft
  large:     { low: 4300, high: 5800  },  // 100–300 sq ft
  extensive: { low: 8500, high: 13000 },  // 300+ sq ft — widest tier since "300+" is open-ended
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
  air_testing:         { low: 220, high: 290 },
  clearance_test:      { low: 190, high: 250 },
  hvac_cleaning:       { low: 340, high: 440 },
  drywall_replacement: { low: 3, high: 8 }, // per sq ft
};

// Matches the "+30–50%" shown in the calculator UI for commercial properties.
const MOLD_COMMERCIAL_MULTIPLIER = { low: 1.3, high: 1.5 };

// Water damage restoration pricing
// Source: IICRC S500 standards, restoration industry data
// Extraction + drying scales per affected sq ft (collected from the calculator's area
// slider) instead of a single flat range, so the estimate reflects the actual job size.
// Tightened to a ~1.3x per-sqft spread — matching the other services — since sq ft and
// category already do the job of separating cheap jobs from expensive ones.
const WATER_EXTRACTION_DRYING_PER_SQFT = { low: 2.90, high: 3.90 }; // 3–5 day extraction + drying
const WATER_EXTRACTION_DRYING_MINIMUM = { low: 550, high: 750 };   // small-loss minimum charge

const WATER_STRUCTURAL_DRYING_ADDON = { low: 700, high: 950 };   // walls opened for drying — additional
const WATER_MOLD_PREVENTION_ADDON = { low: 350, high: 460 };     // required once 72h+ has passed
const WATER_CONTENTS_PACKOUT_ADDON = { low: 280, high: 380 };    // furniture/contents pack-out & cleaning

// Full drywall/flooring restoration is its own, separately-quoted project — priced per sq ft
// so it scales with the job instead of quoting every large loss the same flat range.
const WATER_FULL_RESTORATION_PER_SQFT = { low: 9, high: 15 };
const WATER_FULL_RESTORATION_MINIMUM = { low: 2200, high: 3300 };

// Matches the "+30%" (gray) / "+60–100%" (black) shown in the calculator UI, narrowed to
// a tight band around each since category is already a strong, known signal.
const WATER_CATEGORY_MULTIPLIERS = {
  clean:  { low: 1.0,  high: 1.0  },
  gray:   { low: 1.27, high: 1.33 },
  black:  { low: 1.7,  high: 1.9  },
};

// Airbnb / vacation rental turnover cleaning pricing
// Source: average short-term-rental cleaning fees reported by hosts
// (AirDNA, Hospitable, host community pricing surveys). Priced higher
// than a comparable long-term apartment clean (APARTMENT_SIZE_PRICES) --
// a turnover always includes a full top-to-bottom reset (not just
// surface cleaning) on a fixed guest-checkout deadline, which linen
// changing and restocking (below) add to, not replace.
const AIRBNB_SIZE_PRICES = {
  studio_1br: { low: 95,  high: 120 },
  '2br':      { low: 125, high: 155 },
  '3br':      { low: 160, high: 195 },
  '4br_plus': { low: 195, high: 240 },
};

// A guest checking out same-day as the next check-in (vs. the usual
// overnight-or-longer gap between bookings) compresses the whole job
// into a few hours and often means paying a cleaner to be on standby --
// reflected here as a surcharge, not a flat fee, so it scales with job size.
const AIRBNB_SAME_DAY_RUSH_MULTIPLIER = { low: 1.3, high: 1.4 };

const AIRBNB_ADDONS = {
  linens_laundry:      { low: 20, high: 30 }, // wash & change all bed/bath linens
  restocking_supplies: { low: 12, high: 18 }, // toiletries, coffee, paper products
  deep_clean_turnover: { low: 45, high: 65 }, // periodic deeper reset (baseboards, inside microwave, etc.)
};

// Post-construction cleanup pricing
// Base scales off the same HOME_SQFT_BASE_PRICES tiers as a standard
// house clean, at the ~2.2-2.35x multiplier construction/debris cleanup
// actually runs (previously only reachable as a House Cleaning
// "cleaning type" option using this exact multiplier -- same pricing,
// now its own standalone service instead of a buried sub-option).
const POST_CONSTRUCTION_BASE_MULTIPLIER = { low: 2.18, high: 2.35 };

// A touch-up/renovation leaves far less dust and debris behind than a
// full new-build or gut renovation -- "full" scope costs meaningfully
// more on top of the base multiplier above, not a separate base price.
const POST_CONSTRUCTION_TYPE_MULTIPLIERS = {
  light: { low: 1.0,  high: 1.0  },
  full:  { low: 1.15, high: 1.3  },
};

const POST_CONSTRUCTION_ADDONS = {
  window_cleaning:    { low: 60,  high: 90  }, // paint overspray / construction film removal
  debris_haulaway:    { low: 120, high: 200 },
  vent_dust_removal:  { low: 45,  high: 70  }, // HVAC vents/returns full of drywall dust
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
  HOME_EXTRAS,
  CONDITION_MULTIPLIERS,
  APARTMENT_SIZE_PRICES,
  COMMERCIAL_SQFT_RATES,
  COMMERCIAL_SERVICE_LEVELS,
  COMMERCIAL_VISITS_PER_MONTH,
  DAY_PORTER_DAILY_RATE,
  COMMERCIAL_RESTROOM_PER_VISIT_RATE,
  CARPET_PRICE_PER_ROOM,
  CARPET_PRICE_PER_SQFT,
  CARPET_MINIMUM,
  CARPET_CONDITION_MULTIPLIERS,
  CARPET_METHOD_MULTIPLIERS,
  CARPET_ADDONS,
  CARPET_STAIRS_PER_FLIGHT,
  UPHOLSTERY_ITEM_PRICES,
  UPHOLSTERY_CONDITION_MULTIPLIERS,
  UPHOLSTERY_LEATHER_MULTIPLIER,
  UPHOLSTERY_ADDONS,
  UPHOLSTERY_MINIMUM,
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
  AIRBNB_SIZE_PRICES,
  AIRBNB_SAME_DAY_RUSH_MULTIPLIER,
  AIRBNB_ADDONS,
  POST_CONSTRUCTION_BASE_MULTIPLIER,
  POST_CONSTRUCTION_TYPE_MULTIPLIERS,
  POST_CONSTRUCTION_ADDONS,
};
