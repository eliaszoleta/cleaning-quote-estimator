const axios = require('axios');
const {
  STATE_PRICING_MULTIPLIERS,
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
  STATE_NAMES,
} = require('../config/defaults');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function applyMultiplier(range, mult) {
  return { low: Math.round(range.low * mult), high: Math.round(range.high * mult) };
}
function addRange(a, b) {
  return { low: Math.round(a.low + b.low), high: Math.round(a.high + b.high) };
}
function round2(n) { return Math.round(n * 100) / 100; }

async function geocodeZip(zip) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { postalcode: zip, country: 'US', format: 'json', limit: 1 },
      headers: { 'User-Agent': 'CleanCalc/1.0 (cleaningcalculator.app)' },
      timeout: 8000,
    });
    if (response.data && response.data.length > 0) {
      const { display_name } = response.data[0];
      const stateMatch = display_name.match(/,\s*([A-Z]{2}),\s*United States/);
      const state = stateMatch ? stateMatch[1] : null;
      return { state, display_name };
    }
  } catch (err) {
    console.warn('Geocoding failed:', err.message);
  }
  return null;
}

function getStateMultiplier(state) {
  return STATE_PRICING_MULTIPLIERS[state] || 1.0;
}

// ─── Service Calculators ──────────────────────────────────────────────────────

function calculateHomeResidential(details, stateMultiplier, companyConfig) {
  const {
    sqftTier = '1500_2000',
    bedrooms = '3',
    bathrooms = '2',
    cleaningType = 'standard',
    frequency = 'one_time',
    extras = [],
    condition = 'good',
  } = details;

  const cfg = companyConfig?.services?.homeResidential || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 100;

  // Base price
  const base = HOME_SQFT_BASE_PRICES[sqftTier] || HOME_SQFT_BASE_PRICES['1500_2000'];
  const bdAddon = BEDROOM_ADDON[bedrooms] || 0;
  const baAddon = BATHROOM_ADDON[bathrooms] || 0;

  let range = { low: base.low + bdAddon + baAddon, high: base.high + bdAddon + baAddon };
  range = applyMultiplier(range, stateMultiplier * markup);

  const adjustments = [{ label: `Base price (${sqftTier.replace('_', '–')} sq ft)`, low: base.low, high: base.high }];
  if (bdAddon > 0) adjustments.push({ label: `${bedrooms} bedrooms`, low: bdAddon, high: bdAddon });
  if (baAddon > 0) adjustments.push({ label: `${bathrooms} bathrooms`, low: baAddon, high: baAddon });

  // Cleaning type multiplier
  const cleanMult = CLEANING_TYPE_MULTIPLIERS[cleaningType] || CLEANING_TYPE_MULTIPLIERS.standard;
  if (cleaningType !== 'standard') {
    const before = { ...range };
    range = { low: Math.round(range.low * cleanMult.low), high: Math.round(range.high * cleanMult.high) };
    adjustments.push({ label: `${cleaningType.replace('_', ' ')} multiplier`, low: range.low - before.low, high: range.high - before.high });
  }

  // Extras
  for (const extra of extras) {
    const addon = HOME_EXTRAS[extra];
    if (addon) {
      const adj = applyMultiplier(addon, stateMultiplier * markup);
      range = addRange(range, adj);
      adjustments.push({ label: extra.replace(/_/g, ' '), low: adj.low, high: adj.high });
    }
  }

  // Condition
  const condMult = CONDITION_MULTIPLIERS[condition] || CONDITION_MULTIPLIERS.good;
  if (condition !== 'good') {
    const before = { ...range };
    range = { low: Math.round(range.low * condMult.low), high: Math.round(range.high * condMult.high) };
    adjustments.push({ label: `Condition: ${condition}`, low: range.low - before.low, high: range.high - before.high });
  }

  // Minimum
  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  // Frequency discount
  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  let recurringLow = null, recurringHigh = null, annualSavings = null;
  if (frequency !== 'one_time' && discount > 0) {
    recurringLow = Math.round(range.low * (1 - discount));
    recurringHigh = Math.round(range.high * (1 - discount));
    const visitsPerYear = { weekly: 52, biweekly: 26, monthly: 12 }[frequency] || 12;
    annualSavings = Math.round(((range.low + range.high) / 2 - (recurringLow + recurringHigh) / 2) * visitsPerYear);
    adjustments.push({ label: `${frequency} discount (${Math.round(discount * 100)}% off)`, low: -Math.round(range.low * discount), high: -Math.round(range.high * discount) });
  }

  return {
    serviceType: 'home_residential',
    totalLow: recurringLow || range.low,
    totalHigh: recurringHigh || range.high,
    basePrice: (base.low + base.high) / 2,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: recurringLow,
    recurringMonthlyHigh: recurringHigh,
    recurringAnnualSavings: annualSavings,
    keyFactors: [
      { label: 'Home size', impact: sqftTier },
      { label: 'Cleaning type', impact: cleaningType },
      { label: 'Frequency', impact: frequency },
    ],
    disclaimer: null,
    urgencyLevel: 'normal',
  };
}

function calculateApartment(details, stateMultiplier, companyConfig) {
  const {
    size = '2br',
    bathrooms = '1',
    cleaningType = 'standard',
    frequency = 'one_time',
    furnished = true,
    extras = [],
  } = details;

  const cfg = companyConfig?.services?.apartment || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 85;

  const base = APARTMENT_SIZE_PRICES[size] || APARTMENT_SIZE_PRICES['2br'];
  const baAddon = BATHROOM_ADDON[bathrooms] || 0;

  let range = { low: base.low + baAddon, high: base.high + baAddon };
  if (!furnished) {
    range = { low: Math.round(range.low * 0.85), high: Math.round(range.high * 0.85) };
  }
  range = applyMultiplier(range, stateMultiplier * markup);

  const adjustments = [{ label: `${size.toUpperCase()} apartment`, low: base.low, high: base.high }];

  const cleanMult = CLEANING_TYPE_MULTIPLIERS[cleaningType] || CLEANING_TYPE_MULTIPLIERS.standard;
  if (cleaningType !== 'standard') {
    range = { low: Math.round(range.low * cleanMult.low), high: Math.round(range.high * cleanMult.high) };
  }

  for (const extra of extras) {
    const addon = HOME_EXTRAS[extra];
    if (addon) {
      const adj = applyMultiplier(addon, stateMultiplier * markup);
      range = addRange(range, adj);
      adjustments.push({ label: extra.replace(/_/g, ' '), low: adj.low, high: adj.high });
    }
  }

  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  let recurringLow = null, recurringHigh = null, annualSavings = null;
  if (frequency !== 'one_time' && discount > 0) {
    recurringLow = Math.round(range.low * (1 - discount));
    recurringHigh = Math.round(range.high * (1 - discount));
    const visitsPerYear = { weekly: 52, biweekly: 26, monthly: 12 }[frequency] || 12;
    annualSavings = Math.round(((range.low + range.high) / 2 - (recurringLow + recurringHigh) / 2) * visitsPerYear);
  }

  return {
    serviceType: 'apartment',
    totalLow: recurringLow || range.low,
    totalHigh: recurringHigh || range.high,
    basePrice: (base.low + base.high) / 2,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: recurringLow,
    recurringMonthlyHigh: recurringHigh,
    recurringAnnualSavings: annualSavings,
    keyFactors: [
      { label: 'Apartment size', impact: size },
      { label: 'Cleaning type', impact: cleaningType },
      { label: 'Furnished', impact: furnished ? 'Yes' : 'No' },
    ],
    disclaimer: null,
    urgencyLevel: 'normal',
  };
}

function calculateCommercial(details, stateMultiplier, companyConfig) {
  const {
    buildingType = 'office',
    sqft = 2000,
    restrooms = 2,
    frequency = 'weekly',
    serviceLevel = 'standard',
    dayPorter = false,
    afterHours = false,
  } = details;

  const cfg = companyConfig?.services?.commercial || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 200;

  const sqftRate = COMMERCIAL_SQFT_RATES[buildingType] || COMMERCIAL_SQFT_RATES.office;
  const levelMult = COMMERCIAL_SERVICE_LEVELS[serviceLevel] || COMMERCIAL_SERVICE_LEVELS.standard;
  const visitsPerMonth = COMMERCIAL_VISITS_PER_MONTH[frequency] || 4;

  const afterHoursMult = afterHours ? 1.15 : 1.0;

  const perVisitLow = Math.round(sqft * sqftRate.low * levelMult.low * afterHoursMult * stateMultiplier * markup);
  const perVisitHigh = Math.round(sqft * sqftRate.high * levelMult.high * afterHoursMult * stateMultiplier * markup);

  const monthlyLow = Math.max(perVisitLow * visitsPerMonth, minCharge);
  const monthlyHigh = Math.max(perVisitHigh * visitsPerMonth, minCharge);

  const adjustments = [
    { label: `${buildingType} @ ${sqft.toLocaleString()} sq ft`, low: perVisitLow, high: perVisitHigh },
    { label: `${visitsPerMonth} visits/month`, low: 0, high: 0 },
  ];

  if (afterHours) adjustments.push({ label: 'After-hours access (+15%)', low: Math.round(perVisitLow * 0.15), high: Math.round(perVisitHigh * 0.15) });

  let porterMonthlyLow = 0, porterMonthlyHigh = 0;
  if (dayPorter) {
    const workDays = 22;
    porterMonthlyLow = Math.round(DAY_PORTER_DAILY_RATE.low * workDays * stateMultiplier * markup);
    porterMonthlyHigh = Math.round(DAY_PORTER_DAILY_RATE.high * workDays * stateMultiplier * markup);
    adjustments.push({ label: 'Day porter (monthly)', low: porterMonthlyLow, high: porterMonthlyHigh });
  }

  const restroomSurcharge = restrooms > 2 ? (restrooms - 2) * 30 : 0;
  if (restroomSurcharge > 0) adjustments.push({ label: `${restrooms} restrooms surcharge`, low: restroomSurcharge, high: restroomSurcharge });

  return {
    serviceType: 'commercial',
    totalLow: monthlyLow + porterMonthlyLow + restroomSurcharge,
    totalHigh: monthlyHigh + porterMonthlyHigh + restroomSurcharge,
    basePrice: (perVisitLow + perVisitHigh) / 2,
    adjustments,
    unit: 'per_month',
    recurringMonthlyLow: monthlyLow + porterMonthlyLow,
    recurringMonthlyHigh: monthlyHigh + porterMonthlyHigh,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Building type', impact: buildingType },
      { label: 'Square footage', impact: sqft.toLocaleString() + ' sq ft' },
      { label: 'Frequency', impact: frequency },
    ],
    disclaimer: null,
    urgencyLevel: 'normal',
  };
}

function calculateCarpet(details, stateMultiplier, companyConfig) {
  const {
    rooms = 3,
    sqft = null,
    condition = 'moderate',
    method = 'steam',
    extras = [],
    stairs = 0,
  } = details;

  const cfg = companyConfig?.services?.carpet || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 90;

  const condMult = CARPET_CONDITION_MULTIPLIERS[condition] || CARPET_CONDITION_MULTIPLIERS.moderate;
  const methodMult = CARPET_METHOD_MULTIPLIERS[method] || CARPET_METHOD_MULTIPLIERS.steam;

  let range;
  if (sqft && sqft > 0) {
    range = {
      low: Math.round(sqft * CARPET_PRICE_PER_SQFT.low * condMult.low * methodMult.low),
      high: Math.round(sqft * CARPET_PRICE_PER_SQFT.high * condMult.high * methodMult.high),
    };
  } else {
    range = {
      low: Math.round(rooms * CARPET_PRICE_PER_ROOM.low * condMult.low * methodMult.low),
      high: Math.round(rooms * CARPET_PRICE_PER_ROOM.high * condMult.high * methodMult.high),
    };
  }

  range = applyMultiplier(range, stateMultiplier * markup);

  const adjustments = [
    { label: sqft ? `${sqft} sq ft carpet` : `${rooms} rooms`, low: range.low, high: range.high },
  ];

  for (const extra of extras) {
    if (extra === 'area_rug') {
      const adj = applyMultiplier(CARPET_ADDONS.area_rug, stateMultiplier * markup);
      range = addRange(range, adj);
      adjustments.push({ label: 'Area rug cleaning', low: adj.low, high: adj.high });
    } else if (CARPET_ADDONS[extra]) {
      const adj = applyMultiplier(CARPET_ADDONS[extra], stateMultiplier * markup);
      range = addRange(range, adj);
      adjustments.push({ label: extra.replace(/_/g, ' '), low: adj.low, high: adj.high });
    }
  }

  if (stairs > 0) {
    const stairAdj = applyMultiplier({ low: stairs * CARPET_STAIRS_PER_FLIGHT.low, high: stairs * CARPET_STAIRS_PER_FLIGHT.high }, stateMultiplier * markup);
    range = addRange(range, stairAdj);
    adjustments.push({ label: `${stairs} flight(s) of stairs`, low: stairAdj.low, high: stairAdj.high });
  }

  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  return {
    serviceType: 'carpet',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: (CARPET_PRICE_PER_ROOM.low + CARPET_PRICE_PER_ROOM.high) / 2 * rooms,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Area', impact: sqft ? sqft + ' sq ft' : rooms + ' rooms' },
      { label: 'Condition', impact: condition },
      { label: 'Method', impact: method },
    ],
    disclaimer: null,
    urgencyLevel: 'normal',
  };
}

function calculateAirDuct(details, stateMultiplier, companyConfig) {
  const {
    propertyType = 'residential',
    sqft = 1800,
    ventCount = '10_20',
    systemCount = 1,
    extras = [],
    moldSuspected = false,
  } = details;

  const cfg = companyConfig?.services?.airDuct || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 300;

  let range;
  if (propertyType === 'commercial') {
    range = {
      low: Math.round(sqft * AIR_DUCT_COMMERCIAL_PER_SQFT.low),
      high: Math.round(sqft * AIR_DUCT_COMMERCIAL_PER_SQFT.high),
    };
  } else {
    range = { ...AIR_DUCT_BASE };
    const extraVents = { 'under_10': 0, '10_20': 5, '20_30': 15, '30_plus': 25 }[ventCount] || 0;
    if (extraVents > 0) {
      range = addRange(range, { low: extraVents * AIR_DUCT_PER_VENT.low, high: extraVents * AIR_DUCT_PER_VENT.high });
    }
    if (systemCount > 1) {
      const extraSystems = systemCount - 1;
      range = addRange(range, { low: extraSystems * AIR_DUCT_PER_SYSTEM.low, high: extraSystems * AIR_DUCT_PER_SYSTEM.high });
    }
  }

  range = applyMultiplier(range, stateMultiplier * markup);
  const adjustments = [{ label: 'Base duct cleaning', low: AIR_DUCT_BASE.low, high: AIR_DUCT_BASE.high }];

  for (const extra of extras) {
    if (AIR_DUCT_ADDONS[extra]) {
      const adj = applyMultiplier(AIR_DUCT_ADDONS[extra], stateMultiplier * markup);
      range = addRange(range, adj);
      adjustments.push({ label: extra.replace(/_/g, ' '), low: adj.low, high: adj.high });
    }
  }

  if (moldSuspected) {
    const moldSurcharge = { low: Math.round(range.low * 0.43), high: Math.round(range.high * 0.47) };
    range = addRange(range, moldSurcharge);
    adjustments.push({ label: 'Mold suspected surcharge (+43–47%)', low: moldSurcharge.low, high: moldSurcharge.high });
  }

  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  return {
    serviceType: 'air_duct',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: (AIR_DUCT_BASE.low + AIR_DUCT_BASE.high) / 2,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Property type', impact: propertyType },
      { label: 'Vent count', impact: ventCount.replace('_', '–') },
      { label: 'Mold concern', impact: moldSuspected ? 'Yes (+surcharge)' : 'No' },
    ],
    disclaimer: moldSuspected ? 'Mold in ductwork requires professional inspection before remediation. Final pricing depends on extent of mold growth.' : null,
    urgencyLevel: moldSuspected ? 'high' : 'normal',
  };
}

function calculateDryerVent(details, stateMultiplier, companyConfig) {
  const {
    propertyType = 'residential',
    dryerCount = 1,
    ventLength = 'medium',
    ventType = 'standard',
    clogSuspected = false,
    multiUnit = false,
  } = details;

  const cfg = companyConfig?.services?.dryerVent || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 80;

  let range;
  if (propertyType === 'commercial') {
    range = applyMultiplier({ low: dryerCount * DRYER_VENT_COMMERCIAL_RATE.low, high: dryerCount * DRYER_VENT_COMMERCIAL_RATE.high }, stateMultiplier * markup);
  } else {
    range = { ...DRYER_VENT_BASE };
    const lengthAddon = DRYER_VENT_LENGTH_ADDON[ventLength] || DRYER_VENT_LENGTH_ADDON.medium;
    const typeAddon = DRYER_VENT_TYPE_ADDON[ventType] || DRYER_VENT_TYPE_ADDON.standard;
    range = addRange(addRange(range, lengthAddon), typeAddon);
    if (clogSuspected) range = addRange(range, DRYER_VENT_CLOG_ADDON);
    range = applyMultiplier(range, stateMultiplier * markup);
  }

  if (multiUnit && dryerCount >= 10) {
    range = applyMultiplier(range, 0.85);
  }

  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  return {
    serviceType: 'dryer_vent',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: (DRYER_VENT_BASE.low + DRYER_VENT_BASE.high) / 2,
    adjustments: [
      { label: 'Base dryer vent cleaning', low: DRYER_VENT_BASE.low, high: DRYER_VENT_BASE.high },
      ...(clogSuspected ? [{ label: 'Clog removal', low: DRYER_VENT_CLOG_ADDON.low, high: DRYER_VENT_CLOG_ADDON.high }] : []),
    ],
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Vent length', impact: ventLength },
      { label: 'Vent type', impact: ventType },
      { label: 'Clog detected', impact: clogSuspected ? 'Yes' : 'No' },
    ],
    disclaimer: 'Clogged dryer vents are a leading cause of house fires. Regular cleaning (annually) is strongly recommended.',
    urgencyLevel: clogSuspected ? 'high' : 'normal',
  };
}

function calculateTileGrout(details, stateMultiplier, companyConfig) {
  const {
    sqft = 200,
    tileType = 'ceramic',
    condition = 'moderate',
    services = ['deep_clean'],
    soapScum = false,
    hardWater = false,
    caulkLinearFt = 0,
  } = details;

  const cfg = companyConfig?.services?.tileGrout || {};
  const markup = cfg.markup || 1.0;
  const minCharge = cfg.minimumCharge || 175;

  const tileRate = TILE_PRICE_PER_SQFT[tileType] || TILE_PRICE_PER_SQFT.ceramic;
  const condMult = TILE_CONDITION_MULTIPLIERS[condition] || TILE_CONDITION_MULTIPLIERS.moderate;

  let range = {
    low: Math.round(sqft * tileRate.low * condMult.low),
    high: Math.round(sqft * tileRate.high * condMult.high),
  };
  range = applyMultiplier(range, stateMultiplier * markup);
  const adjustments = [{ label: `${sqft} sq ft ${tileType} tile cleaning`, low: range.low, high: range.high }];

  if (soapScum || hardWater) {
    const surcharge = { low: Math.round(range.low * 0.11), high: Math.round(range.high * 0.13) };
    range = addRange(range, surcharge);
    adjustments.push({ label: 'Soap scum / hard water deposits', low: surcharge.low, high: surcharge.high });
  }

  if (services.includes('grout_sealing')) {
    const adj = { low: Math.round(sqft * TILE_SERVICE_ADDONS.grout_sealing.perSqft.low * stateMultiplier * markup), high: Math.round(sqft * TILE_SERVICE_ADDONS.grout_sealing.perSqft.high * stateMultiplier * markup) };
    range = addRange(range, adj);
    adjustments.push({ label: 'Grout sealing', low: adj.low, high: adj.high });
  }
  if (services.includes('grout_recoloring')) {
    const adj = { low: Math.round(sqft * TILE_SERVICE_ADDONS.grout_recoloring.perSqft.low * stateMultiplier * markup), high: Math.round(sqft * TILE_SERVICE_ADDONS.grout_recoloring.perSqft.high * stateMultiplier * markup) };
    range = addRange(range, adj);
    adjustments.push({ label: 'Grout recoloring', low: adj.low, high: adj.high });
  }
  if (services.includes('caulk_replacement') && caulkLinearFt > 0) {
    const adj = { low: Math.round(caulkLinearFt * TILE_SERVICE_ADDONS.caulk_replacement.perLinFt.low), high: Math.round(caulkLinearFt * TILE_SERVICE_ADDONS.caulk_replacement.perLinFt.high) };
    range = addRange(range, adj);
    adjustments.push({ label: `Caulk replacement (${caulkLinearFt} lin ft)`, low: adj.low, high: adj.high });
  }

  range.low = Math.max(range.low, minCharge);
  range.high = Math.max(range.high, minCharge);

  return {
    serviceType: 'tile_grout',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: sqft * (tileRate.low + tileRate.high) / 2,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Area', impact: sqft + ' sq ft' },
      { label: 'Tile type', impact: tileType },
      { label: 'Condition', impact: condition },
    ],
    disclaimer: null,
    urgencyLevel: 'normal',
  };
}

function calculateMold(details, stateMultiplier, companyConfig) {
  const {
    affectedSize = 'medium',
    locations = ['bathroom'],
    moldType = 'not_sure',
    sourceFixed = 'not_sure',
    testingNeeded = false,
    propertyType = 'residential',
    extras = [],
  } = details;

  const cfg = companyConfig?.services?.moldRemediation || {};
  const markup = cfg.markup || 1.0;

  const baseTier = MOLD_PRICE_RANGES[affectedSize] || MOLD_PRICE_RANGES.medium;
  const typeMult = MOLD_TYPE_MULTIPLIERS[moldType] || MOLD_TYPE_MULTIPLIERS.not_sure;
  const sourceMult = MOLD_SOURCE_FIXED_MULTIPLIERS[sourceFixed] || MOLD_SOURCE_FIXED_MULTIPLIERS.not_sure;

  // Known mold type and moisture-source status refine (narrow) the tier's base range
  // instead of leaving every job at the full tier width.
  const refinedBase = {
    low: baseTier.low * typeMult.low * sourceMult.low,
    high: baseTier.high * typeMult.high * sourceMult.high,
  };

  let range = applyMultiplier(refinedBase, stateMultiplier * markup);

  if (propertyType === 'commercial') {
    range = { low: Math.round(range.low * MOLD_COMMERCIAL_MULTIPLIER.low), high: Math.round(range.high * MOLD_COMMERCIAL_MULTIPLIER.high) };
  }

  const adjustments = [{ label: `${affectedSize} mold area remediation`, low: range.low, high: range.high }];

  if (locations.includes('hvac_ductwork')) {
    const adj = applyMultiplier(MOLD_ADDONS.hvac_cleaning, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'HVAC/ductwork included', low: adj.low, high: adj.high });
  }
  if (testingNeeded || extras.includes('air_testing')) {
    const adj = applyMultiplier(MOLD_ADDONS.air_testing, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'Air quality testing', low: adj.low, high: adj.high });
  }
  if (extras.includes('clearance_test')) {
    const adj = applyMultiplier(MOLD_ADDONS.clearance_test, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'Post-remediation clearance test', low: adj.low, high: adj.high });
  }

  const sourceWarning = sourceFixed === 'not_fixed' || sourceFixed === 'not_sure';

  return {
    serviceType: 'mold_remediation',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: (baseTier.low + baseTier.high) / 2,
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Affected area', impact: affectedSize },
      { label: 'Mold type', impact: moldType },
      { label: 'Moisture source', impact: sourceFixed === 'yes' ? 'Fixed' : sourceFixed === 'not_fixed' ? 'Still leaking' : 'Unknown' },
      { label: 'Locations', impact: locations.join(', ') },
    ],
    disclaimer: `IMPORTANT: These are preliminary estimates only. Mold remediation pricing requires an in-person inspection by a licensed remediation contractor. Final costs depend on the extent of contamination, building materials, and local regulations.${sourceWarning ? ' The moisture source must be identified and fixed BEFORE remediation, or mold will return.' : ''}`,
    urgencyLevel: 'critical',
  };
}

function calculateWaterDamage(details, stateMultiplier, companyConfig) {
  const {
    cause = 'pipe_burst',
    sqft = 500,
    areas = ['first_floor'],
    waterCategory = 'clean',
    whenHappened = 'today',
    damageClass = 'wet_carpets',
    hasInsurance = true,
    contentsDamaged = false,
  } = details;

  const cfg = companyConfig?.services?.waterDamage || {};
  const markup = cfg.markup || 1.0;

  const catMult = WATER_CATEGORY_MULTIPLIERS[waterCategory] || WATER_CATEGORY_MULTIPLIERS.clean;

  // Extraction + drying scales with the actual affected sq ft (from the calculator's area
  // slider) instead of quoting every job the same flat range, floored at a small-loss minimum.
  const rawExtraction = {
    low: Math.max(sqft * WATER_EXTRACTION_DRYING_PER_SQFT.low, WATER_EXTRACTION_DRYING_MINIMUM.low),
    high: Math.max(sqft * WATER_EXTRACTION_DRYING_PER_SQFT.high, WATER_EXTRACTION_DRYING_MINIMUM.high),
  };

  let range = {
    low: Math.round(rawExtraction.low * catMult.low),
    high: Math.round(rawExtraction.high * catMult.high),
  };
  range = applyMultiplier(range, stateMultiplier * markup);

  const adjustments = [{ label: 'Water extraction + drying (3–5 days)', low: range.low, high: range.high }];

  if (damageClass === 'wet_walls' || damageClass === 'structural') {
    const adj = applyMultiplier({ ...WATER_STRUCTURAL_DRYING_ADDON }, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'Structural drying (walls opened)', low: adj.low, high: adj.high });
  }

  // Mold prevention if >72h
  const moldRisk = ['days_3_7', 'week_plus'].includes(whenHappened);
  if (moldRisk) {
    const adj = applyMultiplier({ ...WATER_MOLD_PREVENTION_ADDON }, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'Mold prevention treatment (required)', low: adj.low, high: adj.high });
  }

  if (contentsDamaged) {
    const adj = applyMultiplier({ ...WATER_CONTENTS_PACKOUT_ADDON }, stateMultiplier * markup);
    range = addRange(range, adj);
    adjustments.push({ label: 'Furniture / contents pack-out & cleaning', low: adj.low, high: adj.high });
  }

  const urgencyMsg = whenHappened === 'today' || whenHappened === '24_48h'
    ? 'Act now — mold can begin growing within 24–48 hours of water damage.'
    : 'Mold growth is likely after this time period. Remediation may be required in addition to restoration.';

  // For large or multi-area losses, show a separate (not summed into the total above)
  // full-restoration ballpark, scaled per sq ft rather than one flat $2k–$25k range.
  if (sqft > 1000 || areas.length > 1) {
    const fullRestoration = {
      low: Math.max(sqft * WATER_FULL_RESTORATION_PER_SQFT.low, WATER_FULL_RESTORATION_MINIMUM.low),
      high: Math.max(sqft * WATER_FULL_RESTORATION_PER_SQFT.high, WATER_FULL_RESTORATION_MINIMUM.high),
    };
    const adj = applyMultiplier(fullRestoration, stateMultiplier);
    adjustments.push({ label: 'Full restoration (drywall, flooring) — separate estimate, not included above', low: adj.low, high: adj.high, separate: true });
  }

  return {
    serviceType: 'water_damage',
    totalLow: range.low,
    totalHigh: range.high,
    basePrice: Math.round((rawExtraction.low + rawExtraction.high) / 2),
    adjustments,
    unit: 'flat',
    recurringMonthlyLow: null,
    recurringMonthlyHigh: null,
    recurringAnnualSavings: null,
    keyFactors: [
      { label: 'Water category', impact: waterCategory + ' water' },
      { label: 'Cause', impact: cause.replace(/_/g, ' ') },
      { label: 'Affected area', impact: `${sqft.toLocaleString()} sq ft` },
      { label: 'Time elapsed', impact: whenHappened },
      { label: 'Insurance', impact: hasInsurance ? 'May be covered' : 'Out of pocket' },
    ],
    disclaimer: `URGENT: ${urgencyMsg} These are preliminary estimates only — final pricing requires an in-person assessment. ${hasInsurance ? 'Your homeowner\'s insurance may cover water damage restoration. Contact your insurer immediately and document all damage with photos before cleanup begins.' : 'Contact a licensed water damage restoration company immediately.'}`,
    urgencyLevel: 'critical',
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

async function calculateCleaning(inputs, companyConfig = {}) {
  const { serviceType, zip, state: providedState, serviceDetails = {} } = inputs;

  // Resolve state
  let resolvedState = providedState || 'TX';
  if (zip) {
    const geo = await geocodeZip(zip);
    if (geo && geo.state) resolvedState = geo.state;
  }

  const stateMultiplier = getStateMultiplier(resolvedState);
  const stateName = STATE_NAMES[resolvedState] || resolvedState;

  let result;
  switch (serviceType) {
    case 'home_residential':  result = calculateHomeResidential(serviceDetails, stateMultiplier, companyConfig); break;
    case 'apartment':         result = calculateApartment(serviceDetails, stateMultiplier, companyConfig); break;
    case 'commercial':        result = calculateCommercial(serviceDetails, stateMultiplier, companyConfig); break;
    case 'carpet':            result = calculateCarpet(serviceDetails, stateMultiplier, companyConfig); break;
    case 'air_duct':          result = calculateAirDuct(serviceDetails, stateMultiplier, companyConfig); break;
    case 'dryer_vent':        result = calculateDryerVent(serviceDetails, stateMultiplier, companyConfig); break;
    case 'tile_grout':        result = calculateTileGrout(serviceDetails, stateMultiplier, companyConfig); break;
    case 'mold_remediation':  result = calculateMold(serviceDetails, stateMultiplier, companyConfig); break;
    case 'water_damage':      result = calculateWaterDamage(serviceDetails, stateMultiplier, companyConfig); break;
    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }

  return {
    ...result,
    state: resolvedState,
    stateName,
    stateMultiplier,
  };
}

module.exports = { calculateCleaning, geocodeZip };
