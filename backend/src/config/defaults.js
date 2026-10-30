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
  // shown to visitors on the results page and are optional/edited any
  // time. getOrCreateCompanyConfig pre-fills ctaPhone/ctaEmail from this
  // same signup phone + the Auth account's own email on a brand-new
  // account (a real starting value instead of a blank field), but they
  // stay independently editable from that point on -- unlike phone/website
  // above, which aren't user-editable at all after signup.
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
  // Which country this company operates in -- set once in Settings
  // (ServicesTab.js), not asked of the visitor on every calculator run
  // (one business serves one market). Defaults 'US' so every account that
  // existed before the Canada pilot keeps behaving exactly as it already
  // did -- getRegionMultiplier/getRegionName in cleaningCalculation.js
  // both treat a missing country as 'US'. serviceStates/serviceCities
  // below hold state codes for a 'US' company or province codes for a
  // 'CA' one -- same fields, interpretation depends on this flag.
  country: 'US',
  serviceStates: [],
  // Map of state/province code -> city names, e.g. { TX: ['Austin','Houston'], OK: ['Tulsa'] }
  // -- keyed by region so a company serving multiple states/provinces gets
  // each region's own city list in the widget instead of one pool
  // shared/mixed across every region they operate in.
  serviceCities: {},
  // Per-country memory of the two fields above, each keyed by country code
  // -- serviceStatesByCountry: { US: [...], CA: [...] }, serviceCitiesByCountry:
  // { US: {...}, CA: {...} } (same per-region shape as serviceCities itself).
  // Only ever written by CompanyDashboard.js's country switcher
  // (handleCountryChange), which stashes serviceStates/serviceCities here
  // under the country being switched away from, then restores whatever was
  // previously stashed for the country being switched to (or starts empty
  // the first time that country's selected) -- so switching country no
  // longer wipes out the service area set up for whichever country isn't
  // currently active.
  serviceStatesByCountry: {},
  serviceCitiesByCountry: {},
  // Same stash-and-restore pattern, for each service's custom minimum-
  // charge override instead of service area -- { US: { homeResidential:
  // { minimumCharge: 100 }, commercial: { minimumCharge: 200, minimumChargeOneTime: 500 } }, GB: {...} }.
  // Unlike markup (a multiplier) or enabled, minimumCharge/
  // minimumChargeOneTime are raw currency amounts that
  // cleaningCalculation.js uses exactly as stored with no conversion, so
  // without this they'd silently carry over as the wrong currency's
  // number on a country switch instead of clearing (see
  // CompanyDashboard.js's handleCountryChange for the full reasoning).
  serviceMinimumChargesByCountry: {},
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
  // 'laundry' kept as a legacy flat line -- HomeStep.js no longer offers it
  // as of Oct 2026 (replaced by LAUNDRY_PER_BED_RATE below, which scales
  // with how many beds actually need laundry instead of charging the same
  // flat amount whether it's 1 bed or 5). Still priced here, not removed,
  // so a stored lead from before the change (e.g. re-priced live by the
  // "Email to Coworker" feature, which re-runs calculateCleaning() from the
  // original saved inputs) doesn't silently drop to $0 for an extra the
  // customer actually selected and was quoted for.
  laundry:          { low: 34, high: 44 },
  dishes:           { low: 24, high: 32 },
  garage:           { low: 63, high: 80 },
  basement:         { low: 76, high: 96 },
  balcony_patio:    { low: 43, high: 56 },
  pet_hair:         { low: 30, high: 40 }, // whole-home pass, comparable to inside_fridge tier
};

// Per-bed laundry (wash, dry, remake) -- replaces the old flat HOME_EXTRAS
// 'laundry' line above, which charged the same amount whether a customer
// needed 1 bed's linens done or 5 (a real request: "laundry for 4 beds" on
// a 5-bedroom home, only some of which need it).
// Originally estimated at $14-18/bed (back-calculated to roughly match the
// old flat $34-44 line at 2-3 beds, not independently sourced) -- re-
// researched Nov 2026 against real per-bed bed-linen add-on pricing
// (Jobber $10-40, HomeGuide ~$10, Molly Maid $5-10, Pro Housekeepers
// $20-35 for full strip-and-make, FieldCamp $4-10 for a quick swap).
// Sources cluster around $10-20/bed for a full wash/dry/remake, not just a
// linen swap, so set directly to that cluster rather than the earlier
// back-calculated figure.
const LAUNDRY_PER_BED_RATE = { low: 12, high: 20 };

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

// Commercial cleaning prices per sq ft -- MONTHLY total, at weekly
// frequency (the calculator's own default, and the frequency ISSA's own
// published office benchmark and most other sourced guides anchor to).
// RELABELED 2026-10-26 -- this table was previously commented "per sq ft
// per visit" and calculateCommercialRecurring multiplied it by
// visitsPerMonth (4 for weekly, 20 for daily) on top of that, as if it
// really were a per-visit rate. It never was: re-checking the same
// sources this table cites (ISSA's general-office figure is $0.09-$0.17
// per sq ft, matching COMMERCIAL_SQFT_RATES.office almost exactly) shows
// they're already quoting a monthly contract rate, not a single cleaning.
// Re-multiplying a monthly rate by visit count overcounted every
// commercial quote roughly in proportion to how often it's cleaned -- a
// 23,000 sq ft daily (5x/week) medical contract came out to
// $87,620-$112,880/month, a visitor called this out as obviously wrong in
// a Facebook cleaning-business group (2026-10-26), and they were right:
// a facility that size, cleaned daily, realistically runs roughly
// $9,000-$20,000/month (scaled from a 2026 guide's $2,000-$4,500/month
// example for a 5,000 sq ft daily-cleaned medical facility). See
// COMMERCIAL_FREQUENCY_MULTIPLIER below for how frequency is now
// accounted for instead -- a real, but much smaller, effect than a flat
// ×visitsPerMonth implied.
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
// twice_weekly added Oct 2026 -- the jump from "Weekly" straight to "Daily"
// left one of the most common commercial cadences (2x/week -- a step up
// from weekly for spaces like gyms with heavier daily wear) completely
// unselectable. three_per_week already existed here but, until the same
// date, had no matching option in CommercialStep.js's FREQUENCIES array --
// a real key with no way to ever reach it from the UI.
//
// daily FIXED 2026-10-30 (was 20) -- every entry here is "X times/week"
// (see CommercialStep.js's 'Daily (5x/wk)' label), so they should all
// convert to a monthly count the same way: real weeks/month (52/12 = 4.33),
// not a flat 4. three_per_week (13) and twice_weekly (9) already did this
// correctly (3*4.33=13.0, 2*4.33=8.67->9); daily used 5*4=20 instead of
// 5*4.33=21.7->22, undercounting it by about 2 visits/month -- an internal
// inconsistency flagged by a user comparing ChatGPT's review of a Jackson,
// TN estimate against this codebase. Only matters where visitsPerMonth is
// a real multiplier (COMMERCIAL_RESTROOM_PER_VISIT_RATE and the display-
// only per-visit breakdown of the sqft rate) -- the sqft monthly total
// itself is driven by the separately-sourced COMMERCIAL_FREQUENCY_
// MULTIPLIER table, not this one, so it's unaffected.
const COMMERCIAL_VISITS_PER_MONTH = {
  daily:    22,
  three_per_week: 13,
  twice_weekly: 9,
  weekly:   4,
  biweekly: 2,
  monthly:  1,
};

// How much the monthly sq-ft/building-rate cost (COMMERCIAL_SQFT_RATES,
// now a monthly total at weekly frequency -- see its own comment) scales
// for a different frequency. NOT the same ratio as COMMERCIAL_VISITS_PER_
// MONTH -- a daily contract has 5x the visits of a weekly one, but costs
// nowhere near 5x as much per month, because each visit is lighter (less
// buildup since it was just cleaned); a biweekly/monthly visit costs more
// per visit (more buildup) than a flat 1/2 or 1/4 split of weekly would
// suggest. Restrooms (COMMERCIAL_RESTROOM_PER_VISIT_RATE) are NOT scaled
// by this table -- that rate is a genuine per-visit labor-time estimate,
// unlike this one, so it still scales directly with COMMERCIAL_VISITS_PER_
// MONTH instead.
// weekly/three_per_week/daily cross-checked 2026-10-26 against a 2026
// frequency-tiered commercial cleaning rate chart showing roughly
// $0.08-$0.12/sq ft/month at weekly, $0.10-$0.18 at 3x/week, $0.15-$0.30
// at daily (5x/week) -- a ~2.2x daily:weekly ratio on the monthly total,
// not the 5x ratio of visit counts. twice_weekly/biweekly/monthly are
// estimated/interpolated between those three anchor points, not
// independently sourced -- no chart found breaking out those specific
// cadences on their own.
const COMMERCIAL_FREQUENCY_MULTIPLIER = {
  daily:          { low: 2.0,  high: 2.4  },
  three_per_week: { low: 1.3,  high: 1.45 },
  twice_weekly:   { low: 1.15, high: 1.25 }, // estimated -- interpolated between weekly and three_per_week
  weekly:         { low: 1.0,  high: 1.0  }, // baseline -- COMMERCIAL_SQFT_RATES itself IS the weekly monthly rate
  biweekly:       { low: 0.6,  high: 0.7  }, // estimated -- not independently sourced
  monthly:        { low: 0.4,  high: 0.5  }, // estimated -- not independently sourced
};

// Day porter DAILY rate (loaded labor including benefits/overhead) -- the
// name and the formula that uses it (DAY_PORTER_DAILY_RATE × 22 workdays,
// see calculateCommercialRecurring) both already treat this correctly as a
// per-day figure; this comment used to say "monthly rate" instead, the
// exact same mislabeling that caused the 2026-10-26 COMMERCIAL_SQFT_RATES
// bug elsewhere in this file -- caught here during that same audit before
// it did any damage, since the code never actually matched the old
// comment. Fixed so a future edit doesn't "correct" the formula to match
// a wrong comment.
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

// One-time commercial deep clean / restoration pricing -- a separate model
// from the recurring janitorial-contract pricing above. Added Oct 2026
// after a real request (a vacant restaurant, evicted tenant, years
// unmaintained, grease-caked equipment, needing a one-off multi-day
// restoration clean) had no way to be quoted accurately -- forcing it
// through "Monthly" priced it as a single routine janitorial visit to an
// occupied space, wildly underquoting the actual labor. Multiplies the SAME
// COMMERCIAL_SQFT_RATES used for recurring service rather than a separate rate
// table, so building-type differences (a restaurant still costs more per sq ft
// than an office) still apply to a one-time job.
// Originally cross-checked (Oct 2026) against "a one-time deep clean runs
// roughly 1.5-2x a recurring per-visit rate" -- worth flagging that
// COMMERCIAL_SQFT_RATES is now documented as a MONTHLY rate, not a
// per-visit one (see its own comment, fixed 2026-10-26), so that specific
// framing no longer matches what this multiplier is actually applied to.
// Re-verified 2026-10-26 anyway, independent of that framing: a severe-tier
// (1+ years vacant, heavily neglected) job computes to roughly $0.38-$0.61/
// sq ft here, which lands at or above the upper end of a broader 2026
// commercial-deep-clean/post-construction-cleanup research pass
// ($0.15-$0.60+/sq ft, "expect the upper end... for a neglected, long-vacant
// building") -- appropriately high for restoration-level work, so the
// OUTPUT still checks out even though the original sourcing comment's
// wording doesn't anymore. Left as-is; not treated as a bug.
const COMMERCIAL_ONE_TIME_CONDITION_MULTIPLIERS = {
  light:    { low: 1.5, high: 1.8 }, // occupied space, just needs a thorough one-time deep clean
  moderate: { low: 2.0, high: 2.5 }, // vacant under ~1 year, visible buildup but no severe neglect
  severe:   { low: 2.5, high: 3.3 }, // vacant 1+ years / heavily neglected -- grease, buildup, pest signs
};

// Restrooms on a one-time job are priced per restroom, scaled by the SAME
// condition multiplier as the sq-ft portion above (not per visit -- a
// restroom that's sat unused and uncleaned for a long stretch needs a full
// descale/degrease/disinfect pass in one visit, not the routine per-visit
// touch-up COMMERCIAL_RESTROOM_PER_VISIT_RATE represents).
// Originally estimated at a flat $25-40 (interpolated from the per-visit
// rate, not sourced) -- re-researched Nov 2026 and found that was too low:
// routine restroom cleaning runs $20-60/restroom (CleanQuote, other
// guides), but every tier of this job is already a deep clean by
// definition, and a real DEEP clean runs far above routine -- LatestCost's
// 2026 guide gives $100 (low) / $200 (mid) / $400 (high) per restroom, and
// Housecall Pro notes one-time/specialty restroom jobs price "toward the
// higher end or above" routine rates. This base, run through the same
// condition multiplier as the sq-ft line, lands light-tier restrooms near
// Housecall's one-time/specialty guidance (~$53-81) and moderate/severe
// tiers inside LatestCost's deep-clean range without reaching its $400
// ceiling, which reads as an outlier/biohazard-level figure beyond this
// service's normal scope.
const COMMERCIAL_ONE_TIME_RESTROOM_BASE_RATE = { low: 35, high: 45 };

// The $200/mo recurring floor above exists to cover showing up for a small
// monthly contract -- it's not a sane floor for a multi-day, multi-person
// restoration crew job, so one-time jobs get their own, higher minimum.
const COMMERCIAL_ONE_TIME_MINIMUM_CHARGE = 400;

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

// Re-audited Nov 2026 after a user flagged an unusually wide low-high spread
// on a real tile & grout lead and asked whether that was a calculation bug.
// It wasn't (the formula checked out exactly) -- but the exercise surfaced
// that grout_sealing and caulk_replacement had never been independently
// sourced at all, while grout_recoloring and tile_repair had.
//
// grout_sealing: previously $0.55-$0.88/sq ft with no citation -- below
// every source checked. First-pass fix re-anchored directly to Homewyse's
// full $1.35-$2.46/sq ft national-average figure, but that was wrong in a
// different way: an 82% spread that wide isn't actionable for a business
// owner trying to actually quote a job from it, and it was also double
// counting -- Homewyse's national figure already bakes in the same
// geographic variance this calculator separately applies via stateMultiplier,
// and (once condition-scaling was added, see below) the same condition
// variance condMult separately applies too. Stacking the full raw national
// spread on top of both of those re-counts uncertainty the formula already
// accounts for elsewhere. Settled on $1.65-$2.15/sq ft instead -- centered
// on Homewyse's own ~$1.90 midpoint, tightened to a ~30% band matching the
// typical-case convention every other per-sq-ft rate in this file already
// follows (COMMERCIAL_SQFT_RATES.office: 22% spread; TILE_PRICE_PER_SQFT
// ceramic: 33%), not the full breadth of "anything charged for this
// anywhere in the US." calculateTileGrout in cleaningCalculation.js scales
// this rate by the same TILE_CONDITION_MULTIPLIERS the base cleaning
// already uses (previously flat regardless of condition) -- sealing
// neglected grout genuinely needs more prep than sealing already-clean
// grout, and the condition is already collected from the customer, so this
// uses data already on hand rather than adding a new question.
//
// caulk_replacement: previously $3.50-$7/linear ft with no citation --
// above HomeAdvisor's and Angi's professional per-linear-foot rate
// ($1.25-$4), the two sources that research pass flagged as the most
// dependable (in contrast to several conflicting, lower-quality guides).
// Re-anchored to that range, floor nudged up slightly from their $1.25
// since a bare reseal-only minimum undersells the fuller scope this
// slider's up-to-100-linear-ft range implies.
//
// grout_recoloring ($1.65-$2.55) and tile_repair ($6-$13) were re-checked
// in the same pass and left unchanged: grout_recoloring already sits
// comfortably inside the one solid citation found (pigmented-sealant
// recoloring, $1.50-$4.00/sq ft), and tile_repair isn't reachable from the
// UI at all (TileGroutStep.js has no control that ever sends it as a
// selected service) -- not urgent to re-source pricing nobody can trigger.
const TILE_SERVICE_ADDONS = {
  grout_sealing:     { perSqft: { low: 1.65, high: 2.15 } },
  grout_recoloring:  { perSqft: { low: 1.65, high: 2.55 } },
  caulk_replacement: { perLinFt: { low: 1.5,  high: 4.0  } },
  tile_repair:       { perSqft: { low: 6, high: 13 } },
};

// Mold remediation pricing, by actual affected square footage.
// Source: EPA mold remediation guidelines, NORMI certified remediators.
// Re-audited Oct 2026 after a user flagged a real, excessive estimate
// spread: the old table ($750-$1,050 / $1,950-$2,700 / $4,300-$5,800 /
// $8,500-$13,000+) bucketed jobs into just 4 flat-price tiers, and the
// "Medium" tier alone covered 10-100 sq ft -- a 10x size range charged the
// identical flat price regardless of whether the real job was 12 sq ft or
// 95 sq ft. Replaced with MOLD_SQFT_PRICE_CURVE below: the same 4 dollar
// figures, now anchored to a specific representative sq-ft point each
// (rather than a tier label) and interpolated continuously in between, so
// the sq-ft slider in the calculator actually changes the price instead of
// the job just falling into one of 4 giant buckets. The dollar figures
// themselves are unchanged from the prior, already-audited table -- this
// only changes HOW they're looked up, not what they say -- except
// "extensive" (previously anchored nowhere, since "300+ sq ft" is
// open-ended): anchored here at 700 sq ft, which lands its implied
// per-sq-ft rate (~$15/sq ft) right at the top of the $2-$15/sq ft range
// current guides cite for large-scale jobs -- a reasonable, but not
// independently re-sourced, choice of "typical" job size for that tier.
const MOLD_SQFT_PRICE_CURVE = [
  { sqft: 5,   low: 750,   high: 1050  },  // was "Small", <10 sq ft
  { sqft: 50,  low: 1950,  high: 2700  },  // was "Medium", 10–100 sq ft
  { sqft: 200, low: 4300,  high: 5800  },  // was "Large", 100–300 sq ft
  { sqft: 700, low: 8500,  high: 13000 },  // was "Extensive", 300+ sq ft
];

// Interpolates (or, beyond the first/last anchor, extrapolates) a
// low/high price for any actual sq-ft value, log-log-linear between the
// nearest two anchor points in MOLD_SQFT_PRICE_CURVE above -- i.e. it
// assumes the $/sq ft rate declines at a constant proportional rate
// between anchors (consistent with real remediation economics: fixed
// setup/PPE/disposal costs dominate a tiny job, and are amortized away on
// a larger one), rather than jumping discontinuously at old tier
// boundaries. Returns the exact originally-audited dollar figures at each
// of the 4 anchor points themselves (sqft=5/50/200/700), so this is a
// strictly more granular read of the same underlying data, not new data.
function interpolateMoldPriceRange(sqft) {
  const pts = MOLD_SQFT_PRICE_CURVE;
  const s = Math.max(1, sqft);
  const lnS = Math.log(s);
  let i = 0;
  while (i < pts.length - 2 && s > pts[i + 1].sqft) i++;
  const p0 = pts[i], p1 = pts[i + 1];
  const t = (lnS - Math.log(p0.sqft)) / (Math.log(p1.sqft) - Math.log(p0.sqft));
  const lerp = (a, b) => a + (b - a) * t;
  return {
    low: Math.round(Math.exp(lerp(Math.log(p0.low), Math.log(p1.low)))),
    high: Math.round(Math.exp(lerp(Math.log(p0.high), Math.log(p1.high)))),
  };
}

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
// Added Oct 2026: a "moderate" middle tier, since only having light/full
// meant a multi-room kitchen-and-bath remodel (clearly more cleanup than a
// single-room touch-up, clearly less than a whole-home gut) had to be
// rounded into whichever endpoint it was closer to, understating or
// overstating the job. Like POST_CONSTRUCTION_BASE_MULTIPLIER above,
// "full" was never independently sourced -- this interpolates between the
// two existing endpoints rather than introducing a new, separately-cited
// data point, so treat it as a reasonable midpoint estimate, not a
// researched figure in its own right.
const POST_CONSTRUCTION_TYPE_MULTIPLIERS = {
  light:    { low: 1.0,  high: 1.0  },
  moderate: { low: 1.08, high: 1.18 },
  full:     { low: 1.15, high: 1.3  },
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

// ─────────────────────────────────────────────────────────────────────────────
// CANADA -- pilot country #2 (added Oct 2026). Same wage-ratio-to-multiplier
// method as the US table above, so a Canadian company's quotes carry the
// same kind of regional cost signal a US company's do, just anchored to
// Canada's own labour data instead of converting US figures through an
// exchange rate (FX swings would otherwise silently drift every quote).
//
// CANADA_PROVINCE_LABOR_RATES: median hourly wage for NOC 65310 (Light Duty
// Cleaners), Government of Canada Job Bank wage reports, updated Nov 19
// 2025 -- the Canadian counterpart to BLS OEWS used for the US table above,
// same "government wage survey by region" methodology. National median
// $19.74/hr (low $15.50, high $25.00). NT (Northwest Territories) had no
// published figure in this pass -- ESTIMATED by interpolating between its
// two northern-territory neighbors (YT/NU below), not independently
// sourced; flagged here rather than presented as researched, per the
// "research real pricing, flag what can't be sourced" rule.
const CANADA_PROVINCE_LABOR_RATES = {
  AB: 18.20, BC: 20.00, MB: 17.00, NB: 17.50, NL: 19.00, NS: 17.05,
  NT: 23.82, NU: 23.00, ON: 19.00, PE: 18.00, QC: 20.47, SK: 18.00, YT: 24.64,
};
const CANADA_LABOR_RATE_NATIONAL_MEDIAN = 19.74;

// CANADA_PROVINCE_PRICING_MULTIPLIERS: each province's labor rate relative
// to Canada's OWN national median only (no cross-country anchor baked in
// here anymore -- see CANADA_SERVICE_FACTORS below for why that moved).
// This is the within-Canada regional variance signal, the direct Canadian
// counterpart to STATE_PRICING_MULTIPLIERS above. Relative COL/competition
// judgment (the kind layered into the US table beyond pure wage ratio) was
// NOT added here for the pilot -- these are wage-ratio-only, a narrower but
// fully-sourced starting point; revisit if Canadian COL data becomes
// available.
const CANADA_PROVINCE_PRICING_MULTIPLIERS = {
  AB: 0.92, BC: 1.01, MB: 0.86, NB: 0.89, NL: 0.96, NS: 0.86,
  NT: 1.21, NU: 1.17, ON: 0.96, PE: 0.91, QC: 1.04, SK: 0.91, YT: 1.25,
};

// CANADA_SERVICE_FACTORS -- per-service CAD-vs-USD cost factor, applied on
// top of the province-relative multiplier above. This replaces an earlier
// version of this file that used ONE blanket cross-country factor (Canada's
// national median wage ÷ the US's, 19.74/17.71 = 1.1146) for all 12
// services -- a reasonable starting assumption, but an assumption, not a
// researched one. Per-service web research (Oct 2026: HomeStars, Hellamaid,
// Thumbtack, RenoQuotes, Central Alberta DKI restoration, Job Bank Canada)
// found that for several services the real Canadian CAD market rate sits
// much closer to the raw US baseline dollar figure than that 1.11 wage
// ratio alone would predict -- retail cleaning prices don't move 1:1 with a
// wage index, and CAD/USD purchasing-power differences partly offset
// Canada's nominally higher median cleaning wage. Where research gave a
// clear, comparable anchor, the factor below reflects it; where Canadian
// data was absent, self-contradictory, or a single vendor's one-city
// marketing page (not trustworthy as a national figure), the service is
// left OUT of this table on purpose and falls back to
// CANADA_GENERAL_SERVICE_FACTOR -- an explicit "not independently sourced"
// flag per the standing research rule, not a silent guess:
//
//   home_residential: US baseline (1500-2000 sqft, 3bed/2bath, standard,
//     national-avg state) = $223-263, mid $243. HomeStars Canada cites a
//     national average home cleaning of $230 (range $160-$320), mid $240 --
//     a near-exact match to the raw USD figure. Factor: 1.00.
//   commercial: US baseline (2,000 sqft office, weekly recurring) =
//     $876-1,128/mo. HomeStars Canada's $0.10-0.25/sqft recurring rate
//     (treated as per-visit, consistent with its own separate $2,000-5,000+
//     /mo large-office figures) implies ~$866-2,165/mo at weekly frequency
//     -- the US baseline falls inside that band. Factor: 1.00.
//   air_duct: US baseline (11-20 vents, 1 system, residential) = $420-535,
//     mid $478. HomeStars Canada's national average duct cleaning is $500
//     ($375-650) -- a close match. Factor: 1.00.
//   dryer_vent: US baseline (standard, under 15ft) = $140-193, mid $167.
//     HomeStars Canada states $150-200 CAD directly for a standalone visit,
//     mid $175 -- a close match. Factor: 1.00.
//   water_damage: US baseline (500 sqft, clean water, wet carpets) =
//     $1,450-1,950, implying ~$3.40/sqft. Central Alberta DKI, a real
//     Canadian restoration contractor, cites a $3-7.50/sqft industry
//     average -- the US baseline lands right at the low end of that actual
//     Canadian range. Factor: 1.00.
//
// Left on the general fallback (CANADA_GENERAL_SERVICE_FACTOR), each for a
// specific reason found during this research pass, not by default:
//   apartment: Canada figures ranged from matching the general fallback to
//     ~1.4x above it depending on source (Toronto vendor pages vs a
//     Canada-wide one-time-clean figure) -- too inconsistent to pick a
//     single tightened value over the wage-based estimate.
//   carpet, upholstery, tile_grout: search results explicitly flagged as
//     thin or not Canada-specific (tile/grout: "Canadian coverage is thin";
//     upholstery: "no reliable, current Canadian price list"; carpet: only
//     a single small-bedroom figure, no larger-room data).
//   mold_remediation: HomeStars' direct $10-30/sqft figure and RenoQuotes'
//     job-size-tier figures ($2,500-5,500 for a 10-100 sqft job) implied
//     noticeably different numbers depending on which was used -- both are
//     contractor/marketing sources, not government data, so neither was
//     trusted enough to override the wage-based estimate.
//   airbnb: the only Canada-specific figures found were a single Toronto
//     vendor's marketing page (Hellamaid), ~2.3x the general fallback --
//     plausible for Toronto specifically (one of Canada's highest-cost
//     cities, already partly captured by ON's own province multiplier
//     above) but not trustworthy as a Canada-wide factor from one city's
//     one vendor.
//   post_construction: per-sqft Canadian figures ($0.15-0.30/sqft "final
//     clean") actually landed close to what the general fallback already
//     predicts, so the fallback was left as-is rather than replaced with a
//     number that says the same thing less precisely.
const CANADA_SERVICE_FACTORS = {
  home_residential: 1.00,
  commercial: 1.00,
  air_duct: 1.00,
  dryer_vent: 1.00,
  water_damage: 1.00,
};
const CANADA_GENERAL_SERVICE_FACTOR = 1.1146;

const CANADA_PROVINCE_NAMES = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

// A computed per-province GST/HST/PST breakdown was tried here and then
// deliberately pulled back out (Oct 2026): it modeled how a final Canadian
// INVOICE breaks out tax (subtotal -> tax -> total, well-confirmed
// practice), but research turned up no evidence that's how an online
// ballpark ESTIMATE calculator -- what this tool actually is -- typically
// presents tax; the real-world cost-guide pages checked just show a bare
// price range. It also meant computing a provincial-tax rate (BC/MB/SK/QC)
// whose applicability to cleaning services specifically was never
// confirmed. ResultsScreen.js and the estimate email instead show a plain
// "+ applicable taxes" note for a CA company, with no computed rate or
// amount -- lighter, and doesn't assert a number that isn't fully sourced.

// ─────────────────────────────────────────────────────────────────────────────
// UNITED KINGDOM -- pilot country #3 (added Oct 2026). Same two-part method
// as Canada: a region-relative multiplier (within-UK variance) x a
// per-service country factor (GBP-vs-USD cost factor), rather than one
// blanket number applied to all 12 services.
//
// UK_REGION_MULTIPLIERS: the 12 ITL1 regions (the standard UK statistical
// regions: England's 9 regions + Scotland + Wales + Northern Ireland),
// relative to the UK's own average, from ONS's "Regional gross disposable
// household income (GDHI) per head, 2024" bulletin (published Sept 2025) --
// a broader regional economic indicator than a single-occupation wage
// figure, used here because, unlike the US (BLS) and Canada (Job Bank),
// this research pass could not find an authoritative ONS wage breakdown
// specifically for the cleaning occupation (SOC 9223) by region. Directly
// confirmed from that ONS bulletin: UK average £25,965/head (index 100),
// London £36,487 (140), North East £20,562 (79), Wales £21,469 (83),
// Northern Ireland £22,258 (86), South West £25,924 (100). The remaining 6
// English regions (South East, East of England, East/West Midlands,
// Yorkshire and the Humber, North West) and Scotland were NOT individually
// confirmed in this pass -- their values below are ESTIMATED from
// well-established, slow-moving UK regional economic geography (South East
// as the second-highest region after London via the commuter-belt effect,
// the others clustered near or modestly below the UK average), the same
// kind of relative-ranking judgment call the US table's own documentation
// already makes for the states a search pass can't individually confirm.
const UK_REGION_MULTIPLIERS = {
  LONDON: 1.40,          // sourced (ONS GDHI 2024)
  SOUTH_EAST: 1.10,       // estimated
  EAST_OF_ENGLAND: 1.02,  // estimated
  SOUTH_WEST: 1.00,       // sourced (ONS GDHI 2024)
  NORTH_WEST: 0.94,       // estimated
  WEST_MIDLANDS: 0.91,    // estimated
  EAST_MIDLANDS: 0.91,    // estimated
  SCOTLAND: 0.97,         // estimated
  YORKSHIRE: 0.89,        // estimated
  WALES: 0.83,            // sourced (ONS GDHI 2024)
  NORTHERN_IRELAND: 0.86, // sourced (ONS GDHI 2024)
  NORTH_EAST: 0.79,       // sourced (ONS GDHI 2024)
};

const UK_REGION_NAMES = {
  LONDON: 'London', SOUTH_EAST: 'South East England', EAST_OF_ENGLAND: 'East of England',
  SOUTH_WEST: 'South West England', NORTH_WEST: 'North West England', WEST_MIDLANDS: 'West Midlands',
  EAST_MIDLANDS: 'East Midlands', SCOTLAND: 'Scotland', YORKSHIRE: 'Yorkshire and the Humber',
  WALES: 'Wales', NORTHERN_IRELAND: 'Northern Ireland', NORTH_EAST: 'North East England',
};

// UK_SERVICE_FACTORS -- per-service GBP-vs-USD cost factor, same role as
// CANADA_SERVICE_FACTORS above. UK_GENERAL_SERVICE_FACTOR (0.70) comes from
// comparing a UK cleaner's typical nominal hourly wage (~£12.34, derived
// from ONS ASHE 2025 provisional full-time median gross pay for SOC 9223
// "cleaners and domestics," £24,130/year, at a standard ~1,955-hour work
// year -- close to the UK's own April-2025 National Living Wage of £12.21,
// consistent with cleaning being a near-minimum-wage occupation there)
// against the US's BLS figure ($17.71/hr): 12.34 / 17.71 = 0.697, rounded
// 0.70. Like Canada's factor, this compares NOMINAL figures in each
// country's own currency, not an FX conversion -- it's a genuinely
// counterintuitive result worth flagging: GBP is worth MORE than USD by
// exchange rate, but UK cleaning wages run lower than US ones in nominal
// terms, so the raw USD figure gets scaled DOWN, not up, to estimate a
// GBP price.
//
// Per-service web research (Oct 2026: Bark, Fantastic Services, MyBuilder,
// MyJobQuote, Airtasker UK) compared each service's US baseline dollar
// figure against real UK sources and found a consistent pattern: physical,
// labour-hours-driven cleaning jobs (carpet, upholstery, air duct, tile/
// grout, mould remediation, Airbnb turnover) price noticeably BELOW what
// the 0.70 wage ratio alone predicts, while whole-property/contract-type
// jobs (house cleaning, commercial, water damage, post-construction) landed
// close to 0.70 and were left on the fallback rather than replaced with a
// number saying the same thing less precisely:
//   carpet: UK (Bark, 2,800+ quotes) ~£30 for a small room vs US baseline
//     $90 for a comparable room -> 0.33, used 0.50 (a less aggressive cut,
//     since a single data point shouldn't fully override the wage-based
//     floor).
//   upholstery: UK 3-seat sofa ~£50-90 (several consistent sources) vs US
//     baseline $146-230 -> ~0.37-0.39, used 0.40.
//   air_duct: UK whole-job average £150-250 (MyBuilder, Airtasker) vs US
//     baseline $420-535 -> ~0.31-0.52 (wide spread between the two UK
//     sources), used 0.45; also genuinely a smaller market in the UK, where
//     ducted forced-air HVAC is far less common than in US homes.
//   tile_grout: UK £3-6/m² (Fantastic Services) vs US baseline ~$1.24/sqft
//     -> ~0.34, used 0.35.
//   mold_remediation: UK single-room mould job £500-1,000 (MyJobQuote,
//     Fantastic Services) vs US baseline $2,325 for a comparable room ->
//     ~0.32, used 0.35.
//   airbnb: UK turnover £40-60 for a 1-bed (Airtasker UK, UK-wide not
//     London-only) vs US baseline $97.50 -> ~0.41, used 0.40.
//   apartment: the one service that came out ABOVE the general fallback,
//     not below -- UK end-of-tenancy cleaning (the closest real UK
//     equivalent to "apartment cleaning") runs £120-300 across several
//     consistent sources vs US baseline $126-165.50, a ~1.27-1.36 ratio.
//     Plausible: end-of-tenancy cleans are a distinct, higher-stakes UK
//     service tied to deposit disputes and letting-agent requirements, not
//     a routine recurring clean. Used 1.20.
// Left on the fallback: home_residential (UK deep-clean rate implies ~0.74,
// close enough to 0.70 not to need its own number), dryer_vent (no
// UK-specific pricing found at all -- UK tumble dryers are predominantly
// vent-less condenser/heat-pump types, a much smaller market than in the
// US), water_damage (UK stage-cost estimate implies ~0.75, close to 0.70),
// post_construction (UK after-builders rate implies ~0.69, essentially
// exactly 0.70).
//
// commercial and air_duct re-researched Nov 2026 (both were previously
// flagged as too contradictory to source -- commercial sat on the 0.70
// fallback, air_duct used a straight 2-source split):
//   commercial: UK firms almost universally quote per CLEANER-HOUR, not
//     per sqft (unlike the US table, which is sqft-based) -- a wider,
//     fresher search surfaced 4 independent 2026 UK guides agreeing in a
//     tight band: LWR Group £15-25/hr contract, MyJobQuote "most quotes
//     £18-25/hr", ACS Office Cleaning £20-30/hr UK average (mid ~£20-25
//     across all three). Checked against a real, itemized UK quote (LWR's
//     120 sqm/5-evenings-a-week/1.5hr-per-visit example, ~£550-700/mo):
//     that total backs out almost exactly to ~£20/hr x the stated hours,
//     confirming the hourly figures are the real anchor, not a marketing
//     exaggeration. US-side comparable: Jobber (2025 Thumbtack/HomeAdvisor
//     data) $20-80/hr, Housecall Pro $30-75/hr for standard recurring
//     office cleaning -- consensus core range $30-75/hr, mid ~$52.50.
//     £22 (UK mid) / $52.50 (US mid) = 0.42. A separate UK "£0.15-0.30 per
//     sq ft" figure was found and deliberately NOT used -- it's very
//     likely a sqm figure mislabeled as sqft by the source site (UK trade
//     content is metric-native, and the number backed out of the real LWR
//     quote above, ~£0.02-0.025/sqft, is roughly 10x smaller, exactly the
//     sqm-to-sqft conversion factor). Used 0.40, rounded slightly below
//     the computed 0.42 since the per-hour data, while consistent, is
//     still guide-level rather than a direct contractor quote.
//   air_duct: additional 2026 UK sources now triangulate the prior
//     estimate rather than just repeating it -- MyBuilder (avg £250),
//     Airtasker UK duct-cleaning page (median £150), a second Airtasker UK
//     cost page (range £50-250, implied mid ~£150) -- 2 of 3 cluster near
//     £150 against US baseline mid $478 (0.31), with MyBuilder's £250
//     average as the outlier (0.52). Weighted toward the larger, more
//     consistent cluster: (0.31 x 2 + 0.52 x 1) / 3 = 0.38, rounded to
//     0.40 -- a modest revision down from the previous 0.45, which was a
//     straight unweighted split of only 2 disagreeing sources.
const UK_SERVICE_FACTORS = {
  carpet: 0.50,
  upholstery: 0.40,
  air_duct: 0.40,
  tile_grout: 0.35,
  mold_remediation: 0.35,
  airbnb: 0.40,
  apartment: 1.20,
  commercial: 0.40,
};
const UK_GENERAL_SERVICE_FACTOR = 0.70;

// Per-country currency display. US stays on a bare "$" (unchanged, so every
// existing US quote renders byte-identical to before this feature existed);
// Canada uses "C$", the UK uses "£", and Australia uses "A$" (not a bare
// "$" -- AU and US/CA quotes could otherwise sit side by side in a shared
// admin view and be mistaken for the same currency) so a quote is never
// confused for USD right next to it.
//
// No VAT note is shown for UK quotes, unlike the Canada GST/HST note --
// UK VAT registration is threshold-based (£90,000 taxable turnover,
// confirmed current via HMRC-aligned sources, Oct 2026) and voluntary below
// it, so a flat "+ VAT" disclaimer would be wrong for the many small
// cleaning businesses (this product's actual customer base) who aren't
// VAT-registered at all -- unlike Canada's GST, which applies far more
// broadly regardless of business size.
//
// Australia DOES get a plain tax note, like Canada -- the ATO's GST
// registration threshold is $75,000 AUD annual turnover (Oct 2026), lower
// in proportion to typical small-business revenue than the UK's £90,000
// (and GST itself is a flat, nationwide 10% with no state-by-state variant,
// unlike Canada's GST/HST/PST patchwork), so most ongoing cleaning
// businesses -- this product's real customer base -- cross it and must
// register. ResultsScreen.js and the estimate email show a plain "+
// applicable taxes (GST)" note for an AU company, same lightweight
// treatment as Canada, no computed rate.

// AUSTRALIA -- pilot country #4 (added Nov 2026). Same two-part method as
// Canada/UK: a region-relative multiplier (within-AU variance) x a
// per-service country factor (AUD-vs-USD cost factor), rather than one
// blanket number applied to all 12 services.
//
// AU_REGION_MULTIPLIERS: the 8 states/territories, relative to the
// national average. WA, ACT and TAS are sourced from a secondary digest of
// ABS Average Weekly Earnings 2025 H2 data (WA $2,304/wk, ACT $2,285/wk,
// TAS $1,890/wk, vs the ABS-confirmed May 2026 national full-time average
// of $2,083.70/wk) -- this pass could not pull the full state table
// directly from the ABS 6302.0 release itself, so these three are flagged
// as a secondary source, not a primary ABS citation like UK's ONS figures.
// NSW, VIC, QLD, SA are ESTIMATED from well-known, slow-moving regional
// patterns (Sydney/Melbourne cost-of-living and professional pay running
// above the national average per a 2026 Robert Half salary guide; Adelaide
// explicitly below it in the same guide; Queensland recently had the
// fastest wage GROWTH but not necessarily the highest LEVEL). NT is a
// deliberate middle-of-the-road judgment call, not a confident estimate --
// it shows conflicting signals (high nominal wages from remote-area
// loadings, but the LOWEST disposable income of any state/territory per
// Finder's Nov 2024 analysis, i.e. a high cost-of-living eating into that
// wage premium) and splitting the difference at the national average felt
// more honest than picking a direction on weak information.
const AU_REGION_MULTIPLIERS = {
  WA: 1.11,   // sourced (secondary ABS digest, 2025 H2)
  ACT: 1.10,  // sourced (secondary ABS digest, 2025 H2)
  NSW: 1.05,  // estimated
  VIC: 1.04,  // estimated
  NT: 1.00,   // judgment call -- see comment above
  QLD: 0.97,  // estimated
  SA: 0.90,   // estimated
  TAS: 0.91,  // sourced (secondary ABS digest, 2025 H2)
};

const AU_REGION_NAMES = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia',
  SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory',
};

// AU_SERVICE_FACTORS -- per-service AUD-vs-USD cost factor, same role as
// CANADA_SERVICE_FACTORS/UK_SERVICE_FACTORS above.
// AU_GENERAL_SERVICE_FACTOR (1.53) comes from comparing nominal nationwide
// cleaner wages: Australia's Cleaning Services Award (MA000022) Level 1
// full-time minimum, $27.08/hr effective 1 July 2026 (cross-checked against
// a separate guide's $28.35/hr "average Australian house cleaner" figure --
// close enough to the award rate to confirm cleaning runs near the award
// floor there, the same pattern already seen in the US/UK wage figures)
// against the US BLS figure ($17.71/hr): 27.08 / 17.71 = 1.529, rounded
// 1.53. Unlike the UK (where cleaning wages run nominally lower than the
// US, scaling GBP prices DOWN), Australia's award-driven wage floor is
// nominally well above the US figure despite AUD/USD being roughly at
// parity by exchange rate, so AUD prices scale UP from the raw USD figure
// -- the opposite direction from the UK, for the same reason Canada's
// factor is also slightly above 1.0, just a larger effect here.
//
// Per-service research (Nov 2026: Airtasker, MyBuilder-style AU guides,
// Clean Group, Rakidzich, Yellow Pages, HomeStars Sydney, FairWorkMate)
// found the same pattern already seen in Canada/UK: commoditized,
// marketplace-driven jobs price well BELOW what the wage ratio alone
// predicts, while a couple of services land close to 1:1 nominal parity
// with the US rather than scaled up:
//   carpet: AU steam-clean per-room average $35 national (range $25-50),
//     corroborated by 3 independent city breakdowns (Sydney avg $40,
//     Melbourne avg $37, Adelaide avg $32) vs US baseline CARPET_PRICE_PER_ROOM
//     mid $55 -> 0.64-0.66, used 0.65.
//   upholstery: AU 3-seat sofa $90-180 (Clean Group Sydney, mid $135) and
//     $92-230 (an independent AU cost guide, "most around $150") vs US
//     baseline UPHOLSTERY_ITEM_PRICES.sofa mid $162.50 -> ~0.83-0.92, used
//     0.85.
//   air_duct: single source (HomeStars Sydney, whole-home $300-500, mid
//     $400) vs US baseline mid $478 -> 0.84, used 0.80 (rounded down
//     slightly for the single-source caveat, consistent with how a
//     single-source UK figure was treated before it got a second source).
//   dryer_vent: same single HomeStars Sydney page gives $100-175, mid
//     $137.50, vs US baseline DRYER_VENT_BASE mid $136.50 -> 1.01, used
//     1.00. Flagged single-source, but notably a near-exact match.
//   airbnb: Rakidzich (an AU short-term-rental operator, 2026), the one AU
//     source with the SAME size brackets as this table (studio_1br/2br/
//     3br/4br_plus) -- studio_1br $70-100, 2br $100-150, 3br $150-220,
//     4-5br $220-300 -- vs the matching US tiers, giving per-tier ratios of
//     0.89/1.00/1.04/1.20 (avg 1.03). Used 1.00: a same-bracket comparison
//     this clean is the strongest single piece of AU evidence gathered,
//     and it says AU airbnb turnover pricing is close to 1:1 nominal parity
//     with the US, not scaled by the general wage ratio.
//   apartment: Yellow Pages' "unit or studio, REGULAR clean" 2-bed figure
//     ($80-150, mid $115) vs US baseline APARTMENT_SIZE_PRICES['2br'] mid
//     $165.50 -> 0.69, used 0.70. Deliberately NOT used: AU "bond clean"
//     (end-of-lease) 2-bed figures, which run far higher ($250-575 across
//     4 city/national guides, mid ~$370-400, implying a 2.2-2.4x ratio) --
//     same situation as the UK's apartment factor, a bond/end-of-lease
//     clean is a distinct, higher-stakes job tied to a rental deposit, not
//     the routine recurring clean this service actually represents.
//   commercial: single source (Clean Group, AU commercial hourly $30-60/hr,
//     mid $45) vs the same US consensus used for the UK commercial
//     re-research (Jobber/Housecall Pro $30-75/hr, mid $52.50) -> 0.86,
//     used 0.85. Flagged single-source -- weaker evidence than the UK
//     commercial re-research's 4 corroborating sources. A separate AU
//     "$2-4 per sqm per clean" figure was found and deliberately NOT used,
//     for the same reason a UK per-sqft figure was discarded: it implies a
//     per-sqft rate roughly 3x the US baseline, the opposite direction from
//     every other signal, and is very likely either a one-off/initial-clean
//     rate (not a recurring contract rate) or a sqm/sqft mislabel.
// Left on the fallback (1.53), explicitly flagged rather than guessed:
//   home_residential: no dedicated AU figure needed -- the general factor
//     IS essentially the home-cleaning benchmark by construction, same as
//     Canada/UK.
//   tile_grout: AU per-sqm figures ranged $3-11/sqm depending on source and
//     job-based figures ranged $139-747 for what should be a comparable
//     job -- too wide and self-contradictory to responsibly pick a number.
//   mold_remediation: RESOLVED (Nov 2026, second pass at the user's request
//     after the gap below was first flagged). The original Airtasker
//     "$300/room" figure that implied a 7-10x gap against the US baseline
//     turned out to be the wrong anchor -- a basic wipe-down/spot-treat
//     price, not a comparable job. A deeper pass found Oneflare's own cost
//     guide lists a SEPARATE, much higher "Rooms (including kitchen and
//     bathroom) $500-4,000 per room" figure, alongside inspection ($100-350)
//     and air testing ($250-300) as their own line items -- i.e. a proper
//     job with containment/treatment priced apart from diagnosis, the same
//     shape of job the US mold_remediation service models, not a quick
//     clean. Mid $2,250 vs. the US medium-room (10-100 sqft) baseline mid
//     $2,325 -> 0.97, used 0.95. Caveats, stated plainly rather than
//     smoothed over: (1) Oneflare and Airtasker's AU cost-guide pages
//     appear to be co-branded/shared content (a page literally titled
//     "Co-branding Airtasker Oneflare" turned up), so this and the original
//     $300/room figure may not be two fully independent sources, just two
//     different segments of the same content family -- weaker corroboration
//     than, say, UK commercial's 4 independent guides. (2) Checking against
//     Oneflare's "whole house $1,000-6,000" figure vs. the US extensive-tier
//     (300+ sqft) mid $10,750 gives a much lower ratio (~0.33), suggesting
//     AU pricing may not scale with severity as steeply as the US curve --
//     but this service only has ONE factor applied across every severity
//     tier (same structural limitation every other service in this table
//     has), so the room-level ratio was used as the representative number
//     rather than trying to split the difference with the whole-house one.
//     The $45-90/sqm figure found earlier was deliberately NOT used, for
//     the same reason the UK/AU commercial per-sqm figures weren't: it's
//     very likely a smaller-scope (spot-treatment) rate, not a per-room
//     remediation rate, given how far it diverges from both of Oneflare's
//     own room-level and whole-house figures on the same page.
//   water_damage: only one AU figure found (a single Melbourne
//     contractor's own carpet-restoration estimate, not an independent
//     industry average like Canada's DKI citation), and it didn't state a
//     sqft/sqm scope, so it can't be normalized against the US baseline
//     with any confidence.
//   post_construction: AU sources disagreed by nearly an order of
//     magnitude depending on pricing basis -- a Perth per-sqm figure
//     ($8-15/sqm) implies roughly $1,300-2,440 for a mid-size home, a
//     Sydney job-level guide implies ~$300-1,000, and a Melbourne guide
//     implies just $144-180. Too inconsistent to pick a number over the
//     fallback.
const AU_SERVICE_FACTORS = {
  carpet: 0.65,
  upholstery: 0.85,
  air_duct: 0.80,
  dryer_vent: 1.00,
  airbnb: 1.00,
  apartment: 0.70,
  commercial: 0.85,
  mold_remediation: 0.95,
};
const AU_GENERAL_SERVICE_FACTOR = 1.53;
const COUNTRIES = {
  US: { name: 'United States', currencyCode: 'USD', currencySymbol: '$' },
  CA: { name: 'Canada', currencyCode: 'CAD', currencySymbol: 'C$' },
  GB: { name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£' },
  AU: { name: 'Australia', currencyCode: 'AUD', currencySymbol: 'A$' },
};

module.exports = {
  STATE_PRICING_MULTIPLIERS,
  STATE_LABOR_RATES,
  STATE_MARKET_MATURITY,
  STATE_NAMES,
  STATE_AVERAGE_HOME_CLEANING_COST,
  CANADA_PROVINCE_LABOR_RATES,
  CANADA_PROVINCE_PRICING_MULTIPLIERS,
  CANADA_SERVICE_FACTORS,
  CANADA_GENERAL_SERVICE_FACTOR,
  CANADA_PROVINCE_NAMES,
  UK_REGION_MULTIPLIERS,
  UK_REGION_NAMES,
  UK_SERVICE_FACTORS,
  UK_GENERAL_SERVICE_FACTOR,
  AU_REGION_MULTIPLIERS,
  AU_REGION_NAMES,
  AU_SERVICE_FACTORS,
  AU_GENERAL_SERVICE_FACTOR,
  COUNTRIES,
  DEFAULT_COMPANY_CONFIG,
  HOME_SQFT_BASE_PRICES,
  BEDROOM_ADDON,
  BATHROOM_ADDON,
  CLEANING_TYPE_MULTIPLIERS,
  HOME_EXTRAS,
  LAUNDRY_PER_BED_RATE,
  CONDITION_MULTIPLIERS,
  APARTMENT_SIZE_PRICES,
  COMMERCIAL_SQFT_RATES,
  COMMERCIAL_SERVICE_LEVELS,
  COMMERCIAL_VISITS_PER_MONTH,
  COMMERCIAL_FREQUENCY_MULTIPLIER,
  DAY_PORTER_DAILY_RATE,
  COMMERCIAL_RESTROOM_PER_VISIT_RATE,
  COMMERCIAL_ONE_TIME_CONDITION_MULTIPLIERS,
  COMMERCIAL_ONE_TIME_RESTROOM_BASE_RATE,
  COMMERCIAL_ONE_TIME_MINIMUM_CHARGE,
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
  MOLD_SQFT_PRICE_CURVE,
  interpolateMoldPriceRange,
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
