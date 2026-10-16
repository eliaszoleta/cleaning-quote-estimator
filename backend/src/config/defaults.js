// Default cleaning company configuration
// All pricing based on research from HomeAdvisor, Angi, Thumbtack, HomeGuide,
// and BLS wage data for SOC 37-0000 (Building and Grounds Cleaning and Maintenance)
// Updated: 2025
//
// Re-audited Oct 2026 against current market data (live web search) and the
// authoritative BLS Occupational Outlook Handbook figure for SOC 37-2011
// (Janitors & Building Cleaners): national median hourly wage rose from
// $13.98 (May 2020) to $17.27 (May 2024) to $17.71 (May 2025) -- a real,
// government-sourced ~4.85%/year compounding trend, used below wherever a
// table needed a documented inflation/drift correction. Several per-service
// "2026 cost guide" sites turned up in that search are unsourced,
// templated SEO content-farm pages (same handful of domains repeating
// near-identical tables across unrelated topics) and were explicitly
// NOT used as a basis for any number below -- only sources that could be
// cross-checked for internal consistency (e.g. Housecall Pro's published
// figures citing real Angi/HomeAdvisor/Thumbtack listing data, BnBCalc's
// cited 2025/2026 STR host-pricing tables) were given any weight. Tables
// below that already checked out against this pass were left unchanged
// rather than nudged for the sake of nudging.

// ─────────────────────────────────────────────────────────────────────────────
// STATE PRICING MULTIPLIERS
// Based on BLS state-level wage data + COL indices + market competition
// National average = 1.00 (represented by states like OH, IN, MO)
//
// Re-verification attempted Oct 2026: live search surfaced an authoritative,
// government-sourced figure for the NATIONAL baseline -- BLS's own
// Occupational Outlook Handbook for SOC 37-2011 (Janitors & Building
// Cleaners) -- but not a usable primary source for all 51 STATE-level
// figures (search snippets only surfaced a handful of individual states
// clearly, several from third-party aggregators that didn't agree with
// each other). What a search CAN reasonably confirm: the relative ranking
// here (CA/NY/DC/HI/MA/WA/AK as the most expensive markets, MS/AR/WV/KY/AL
// as the least) matches well-established, slow-moving US regional
// cost-of-living geography that is very unlikely to have meaningfully
// shifted in ~2 years -- so the RELATIVE multipliers below are left as-is.
// What the national ANCHOR point needed was a correction -- see
// STATE_LABOR_RATES immediately below, which this table's multipliers were
// originally hand-derived from. A genuine state-by-state re-derivation
// would need the actual BLS OEWS "create customized tables" dataset or API,
// not search snippets -- flagged here as a real limitation of this pass,
// not silently skipped.
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

// BLS average hourly wages for cleaning workers by state (SOC 37-0000, 2024 data).
// Reference/documentation only -- not read by any calculate* function; this
// table exists to show the basis STATE_PRICING_MULTIPLIERS above was
// hand-derived from.
// Re-scaled Oct 2026: this table's own implied national average (~$15.20,
// the simple mean across all 51 entries) was running meaningfully below the
// real, authoritative BLS national MEDIAN for the exact year it claims --
// $17.27/hr for May 2024, rising to $17.71/hr for May 2025 (BLS
// Occupational Outlook Handbook, SOC 37-2011). Every entry below was scaled
// up proportionally (×1.165) to align with the current $17.71 figure,
// preserving each state's relative position -- not re-researched
// individually (see the state-multiplier comment above for why that would
// need the real BLS OEWS dataset, not search snippets).
const STATE_LABOR_RATES = {
  AL: 14.91, AK: 21.55, AZ: 17.71, AR: 14.56, CA: 23.07, CO: 20.27, CT: 21.21,
  DE: 18.41, DC: 23.89, FL: 17.36, GA: 16.08, HI: 22.37, ID: 16.20, IL: 19.22,
  IN: 15.61, IA: 15.38, KS: 15.03, KY: 14.68, LA: 14.91, ME: 17.24, MD: 20.04,
  MA: 21.90, MI: 16.55, MN: 19.11, MS: 13.75, MO: 15.38, MT: 16.55, NE: 15.73,
  NV: 18.18, NH: 19.57, NJ: 21.21, NM: 15.38, NY: 23.42, NC: 15.85, ND: 16.08,
  OH: 16.08, OK: 14.68, OR: 20.04, PA: 17.94, RI: 19.57, SC: 15.03, SD: 15.38,
  TN: 14.91, TX: 17.24, UT: 17.24, VT: 19.11, VA: 18.88, WA: 22.02, WV: 13.86,
  WI: 16.78, WY: 16.08,
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
  // Per-service overrides a company can actually set (Services tab): enabled,
  // minimumCharge, markup, and frequencyDiscounts (where recurring service
  // applies) -- every calculate* function in cleaningCalculation.js only
  // ever reads those four keys off companyConfig.services.<key>. The real
  // per-unit prices (HOME_SQFT_BASE_PRICES, CARPET_PRICE_PER_ROOM,
  // TILE_PRICE_PER_SQFT, etc.) live in the module-level pricing tables
  // below instead, not here -- this previously also carried a
  // basePricePerSqft/pricePerSqft/pricePerRoom/pricePerVent/basePrice field
  // per service that looked like a per-company price override but was
  // never read anywhere, a vestige of an older flat-rate pricing model.
  services: {
    homeResidential: {
      enabled: true,
      minimumCharge: 100,
      markup: 1.0,
      // Off by default (see DiscountTab.js) -- no recurring-frequency
      // discount is applied on the estimate unless the company explicitly
      // sets one for weekly/biweekly/monthly.
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    apartment: {
      enabled: true,
      minimumCharge: 85,
      markup: 1.0,
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    commercial: {
      enabled: true,
      minimumCharge: 200,
      markup: 1.0,
      frequencyDiscounts: { weekly: 0, biweekly: 0, monthly: 0 },
    },
    carpet: {
      enabled: true,
      minimumCharge: 90,
      markup: 1.0,
    },
    airDuct: {
      enabled: true,
      minimumCharge: 300,
      markup: 1.0,
    },
    dryerVent: {
      enabled: true,
      minimumCharge: 80,
      markup: 1.0,
    },
    tileGrout: {
      enabled: true,
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
// Cross-checked Oct 2026: Angi's own cited March-2026 customer data puts a
// standard residential visit at $118-$238, typically ~$176 -- the 1500-2000
// sq ft tier below (the most common home size, see typicalTierIndex in
// frontend/src/data/services.js) midpoints at $178. Left unchanged.
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

// Apartment size base prices (slightly lower than residential).
// Previously had no independent source at all -- just "slightly lower than
// residential," never checked against real apartment-cleaning market data.
// Source: cross-referenced Oct 2026 against several current apartment-
// cleaning cost guides (national one-time-clean averages clustering around
// $120-$180 for a 1-2BR, $170-$260 for 2BR) -- nudged up ~5% from the prior
// figures to track closer to those averages instead of only HOME_SQFT_BASE_PRICES
// minus a guessed margin.
const APARTMENT_SIZE_PRICES = {
  studio:     { low: 89,  high: 113 },
  '1br':      { low: 112, high: 140 },
  '2br':      { low: 147, high: 184 },
  '3br':      { low: 184, high: 226 },
  '4br_plus': { low: 221, high: 271 },
};

// Commercial cleaning prices per sq ft per visit
// Source: ISSA (International Sanitary Supply Association), BuildingOperationsManagement
// Cross-checked Oct 2026: current per-visit commercial janitorial guides
// cluster around $0.07-$0.20/sq ft standard recurring service, with medical
// running meaningfully higher ($0.20-$0.60/sq ft) -- every tier below
// already falls inside its matching real-world band. Left unchanged.
const COMMERCIAL_SQFT_RATES = {
  office:    { low: 0.088, high: 0.107 },
  retail:    { low: 0.09,  high: 0.11  },
  medical:   { low: 0.15,  high: 0.185 },
  restaurant:{ low: 0.12,  high: 0.148 },
  warehouse: { low: 0.052, high: 0.065 },
  school:    { low: 0.095, high: 0.118 },
  gym:       { low: 0.104, high: 0.128 },
  // CommercialStep.js has offered "Church / Event Space" as a building
  // type since this table was first written, with no matching key here --
  // every church/event-space quote was silently priced at the office
  // rate. Positioned between retail and school: a large, mostly-open
  // worship hall brings the per-sqft rate down (like a warehouse), but
  // fellowship-hall kitchens, nurseries, and heavier restroom use than a
  // typical office push it back up -- net, in the same ballpark as a
  // school (classrooms + cafeteria + gym, the closest comparable
  // multi-purpose public building already in this table).
  church:    { low: 0.085, high: 0.115 },
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
// Previously had no cited source at all. Source: cross-referenced Oct 2026
// against Housecall Pro's published per-room pricing data ($25-$75/room,
// drawn from real Angi/HomeAdvisor/Thumbtack listings) -- the prior figures
// sat in the lower-middle of that real range, nudged up modestly to track
// closer to its center.
const CARPET_PRICE_PER_ROOM = { low: 48, high: 62 };
const CARPET_PRICE_PER_SQFT = { low: 0.30, high: 0.38 };

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
// Cross-checked Oct 2026: chair ($40-90) and loveseat ($70-120) both still
// land inside this table's existing figures. Sofa did not -- four
// independent current guides all put a 3-seat sofa's average noticeably
// above this table's prior $175 high end (commonly $180-240 average,
// $120-250+ range), so sofa (and sectional, scaled proportionally with it)
// were nudged up; chair/loveseat/ottoman were left as-is since they already
// checked out.
const UPHOLSTERY_ITEM_PRICES = {
  chair:     { low: 40,  high: 70  }, // armchair or recliner
  loveseat:  { low: 75,  high: 110 },
  sofa:      { low: 130, high: 195 }, // 3-seat sofa -- most common job
  sectional: { low: 195, high: 310 },
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

// Air duct cleaning
// Cross-checked Oct 2026: HomeAdvisor's own current figure averages $388
// (range $271-$508); Thumbtack reports most homeowners paying ~$374. Both
// sit right inside this base tier. Left unchanged.
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
// Previously had no cited source at all. Source: cross-referenced Oct 2026
// against several current guides for a standard, short/ground-level wall
// vent (this table's base tier, before the length/type addons below) --
// multiple independent sources put that job at $128-$270 (avg ~$188),
// $85-$250 (median $149), and specifically $130-$150 for "straightforward
// wall vent." The prior figures sat below all of these -- bumped up to
// track the more specific, directly-comparable "standard wall vent" figure
// rather than the broader averages (which likely already blend in
// length/complexity surcharges this table prices separately below).
const DRYER_VENT_BASE = { low: 118, high: 155 };

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
// Previously had no cited source at all. Source: cross-referenced Oct 2026
// against several current guides, most consistently landing around
// $0.75-$3/sq ft for standard cleaning (HomeWyse's pure-labor figure runs
// $0.79-$0.99/sq ft). The ceramic tier below (the cheapest, most common
// material) already sits right around that labor-only figure, so left
// unchanged.
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

// Mold remediation price ranges by affected area
// Source: EPA mold remediation guidelines, NORMI certified remediators
// Ranges are tightened around each tier's typical job cost (~1.3-1.5x spread, matching
// the other services below) — remaining uncertainty is resolved by the mold-type
// and moisture-source multipliers instead of being baked into one wide tier range.
// Cross-checked Oct 2026: current guides quote $2-$15/sq ft depending on
// project scale, but every source buckets "small/medium/large" by different
// sq-ft ranges than this table does, making a direct per-tier comparison
// unreliable. The size-anchored figures that ARE comparable check out --
// e.g. a ~450 sq ft mid-size job at $3,000-$6,000 brackets this table's
// "large" (100-300 sq ft) tier of $4,300-$5,800. Left unchanged.
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
// Cross-checked Oct 2026: current restoration-industry guides put Category 1
// (clean water) at $3-$4/sq ft -- this base rate already matches. Left unchanged
// (see WATER_CATEGORY_MULTIPLIERS below for the gray/black-water correction).
const WATER_EXTRACTION_DRYING_PER_SQFT = { low: 2.90, high: 3.90 }; // 3–5 day extraction + drying
const WATER_EXTRACTION_DRYING_MINIMUM = { low: 550, high: 750 };   // small-loss minimum charge

const WATER_STRUCTURAL_DRYING_ADDON = { low: 700, high: 950 };   // walls opened for drying — additional
const WATER_MOLD_PREVENTION_ADDON = { low: 350, high: 460 };     // required once 72h+ has passed
const WATER_CONTENTS_PACKOUT_ADDON = { low: 280, high: 380 };    // furniture/contents pack-out & cleaning

// Full drywall/flooring restoration is its own, separately-quoted project — priced per sq ft
// so it scales with the job instead of quoting every large loss the same flat range.
const WATER_FULL_RESTORATION_PER_SQFT = { low: 9, high: 15 };
const WATER_FULL_RESTORATION_MINIMUM = { low: 2200, high: 3300 };

// Cross-checked Oct 2026 against current restoration-industry per-sq-ft
// guides: gray water runs $4-$6.50/sq ft and black water runs $7-$7.50+/sq
// ft, against this table's clean-water base of $2.90-$3.90/sq ft. The prior
// multipliers (gray +27-33%, black +70-90%) implied an effective gray rate
// of only $3.68-$5.19/sq ft and black rate of $4.93-$7.41/sq ft -- both
// running low, especially black water's floor. Raised so the effective
// per-sq-ft rate for each category lines up with the real range instead of
// just its low end.
const WATER_CATEGORY_MULTIPLIERS = {
  clean:  { low: 1.0,  high: 1.0  },
  gray:   { low: 1.35, high: 1.5  },
  black:  { low: 1.85, high: 2.1  },
};

// Airbnb / vacation rental turnover cleaning pricing
// Source: average short-term-rental cleaning fees reported by hosts
// (AirDNA, Hospitable, host community pricing surveys). Priced higher
// than a comparable long-term apartment clean (APARTMENT_SIZE_PRICES) --
// a turnover always includes a full top-to-bottom reset (not just
// surface cleaning) on a fixed guest-checkout deadline, which linen
// changing and restocking (below) add to, not replace.
// Cross-checked Oct 2026 against two independent current host-pricing
// tables (BnBCalc's cited 2026 median-fee data, Hostfully) -- both put
// studio/1BR and 2BR meaningfully lower than the prior figures here
// (studio/1BR ~$65-$95, 2BR ~$95-$145), while 3BR and 4BR+ already matched
// well. Lowered the two smaller tiers to track the real host-reported
// median; left 3BR/4BR+ unchanged.
const AIRBNB_SIZE_PRICES = {
  studio_1br: { low: 80,  high: 110 },
  '2br':      { low: 105, high: 145 },
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
// This multiplier itself was never independently sourced -- just carried
// over unchanged from the old House Cleaning sub-option. Cross-checked
// Oct 2026: HomeAdvisor's current residential total-project figure (as
// cited by a cost guide) runs $274-$708, most homeowners paying ~$477.
// At this multiplier, the most common 1500-2000 sq ft tier computes to
// $344-$465 -- landing almost exactly on that real "most pay ~$477"
// figure. Left unchanged.
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
// Previously hand-set with no cited source, and never actually consistent
// with what the calculator itself quotes for a "typical" home -- e.g. this
// table said CA's average was $200, but the default/typical selections
// (1500-2000 sq ft, 3 bed, 2 bath -- see HomeStep.js's own defaults) run
// through calculateHomeResidential for CA actually price at $312-$368
// (midpoint $340), a ~40% gap between what the SEO state pages promised
// and what the live calculator delivered. Found during the Oct 2026
// pricing audit. Regenerated directly from the same inputs the calculator
// actually defaults to -- HOME_SQFT_BASE_PRICES' 1500-2000 tier + the
// 3-bedroom/2-bathroom addons (midpoint $243 at the national baseline) x
// STATE_PRICING_MULTIPLIERS -- verified against a live calculateCleaning()
// call (OH and CA both matched exactly) so this table can't silently drift
// out of sync with real quotes again.
const STATE_AVERAGE_HOME_CLEANING_COST = {
  AL: 199, AK: 335, AZ: 262, AR: 194, CA: 340, CO: 296, CT: 311,
  DE: 272, DC: 352, FL: 255, GA: 231, HI: 365, ID: 238, IL: 287,
  IN: 224, IA: 219, KS: 214, KY: 202, LA: 207, ME: 255, MD: 304,
  MA: 328, MI: 236, MN: 279, MS: 190, MO: 219, MT: 243, NE: 224,
  NV: 267, NH: 287, NJ: 316, NM: 214, NY: 345, NC: 226, ND: 231,
  OH: 231, OK: 207, OR: 292, PA: 262, RI: 292, SC: 211, SD: 214,
  TN: 211, TX: 255, UT: 255, VT: 279, VA: 279, WA: 321, WV: 190,
  WI: 243, WY: 231,
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
  CARPET_CONDITION_MULTIPLIERS,
  CARPET_METHOD_MULTIPLIERS,
  CARPET_ADDONS,
  CARPET_STAIRS_PER_FLIGHT,
  UPHOLSTERY_ITEM_PRICES,
  UPHOLSTERY_CONDITION_MULTIPLIERS,
  UPHOLSTERY_LEATHER_MULTIPLIER,
  UPHOLSTERY_ADDONS,
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
