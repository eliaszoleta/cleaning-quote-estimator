// ─── City cleaning cost data ────────────────────────────────────────────────
// Top 100 US cities by population. Pricing is intentionally NOT a separate
// per-city number — it reuses the same state-level multiplier from
// statePricing.js that the calculator itself and the state pages already
// quote. Inventing distinct city-specific price data with no real backing
// data source is exactly the kind of fabricated-precision mistake that had
// to be corrected once already on this site (blog copy contradicting the
// calculator's real numbers); city pages differentiate on genuine local
// content, not made-up numbers.

import { getStateBySlug, adjustForState } from './statePricing';
import { getAllServices, typicalCost } from './services';

const CITIES = [
  { name: 'New York', stateSlug: 'new-york', population: 8258000 },
  { name: 'Los Angeles', stateSlug: 'california', population: 3820000 },
  { name: 'Chicago', stateSlug: 'illinois', population: 2665000 },
  { name: 'Houston', stateSlug: 'texas', population: 2314000 },
  { name: 'Phoenix', stateSlug: 'arizona', population: 1650000 },
  { name: 'Philadelphia', stateSlug: 'pennsylvania', population: 1550000 },
  { name: 'San Antonio', stateSlug: 'texas', population: 1495000 },
  { name: 'San Diego', stateSlug: 'california', population: 1385000 },
  { name: 'Dallas', stateSlug: 'texas', population: 1300000 },
  { name: 'Jacksonville', stateSlug: 'florida', population: 972000 },
  { name: 'Austin', stateSlug: 'texas', population: 975000 },
  { name: 'Fort Worth', stateSlug: 'texas', population: 958000 },
  { name: 'San Jose', stateSlug: 'california', population: 1013000 },
  { name: 'Columbus', stateSlug: 'ohio', population: 913000 },
  { name: 'Charlotte', stateSlug: 'north-carolina', population: 897000 },
  { name: 'Indianapolis', stateSlug: 'indiana', population: 887000 },
  { name: 'San Francisco', stateSlug: 'california', population: 842000 },
  { name: 'Seattle', stateSlug: 'washington', population: 749000 },
  { name: 'Denver', stateSlug: 'colorado', population: 717000 },
  { name: 'Oklahoma City', stateSlug: 'oklahoma', population: 695000 },
  { name: 'Nashville', stateSlug: 'tennessee', population: 690000 },
  { name: 'El Paso', stateSlug: 'texas', population: 682000 },
  { name: 'Washington', stateSlug: 'washington-dc', population: 690000 },
  { name: 'Boston', stateSlug: 'massachusetts', population: 654000 },
  { name: 'Las Vegas', stateSlug: 'nevada', population: 651000 },
  { name: 'Portland', stateSlug: 'oregon', population: 635000 },
  { name: 'Detroit', stateSlug: 'michigan', population: 633000 },
  { name: 'Louisville', stateSlug: 'kentucky', population: 628000 },
  { name: 'Memphis', stateSlug: 'tennessee', population: 621000 },
  { name: 'Baltimore', stateSlug: 'maryland', population: 585000 },
  { name: 'Milwaukee', stateSlug: 'wisconsin', population: 577000 },
  { name: 'Albuquerque', stateSlug: 'new-mexico', population: 561000 },
  { name: 'Tucson', stateSlug: 'arizona', population: 545000 },
  { name: 'Fresno', stateSlug: 'california', population: 545000 },
  { name: 'Sacramento', stateSlug: 'california', population: 525000 },
  { name: 'Kansas City', stateSlug: 'missouri', population: 509000 },
  { name: 'Mesa', stateSlug: 'arizona', population: 512000 },
  { name: 'Atlanta', stateSlug: 'georgia', population: 499000 },
  { name: 'Omaha', stateSlug: 'nebraska', population: 486000 },
  { name: 'Colorado Springs', stateSlug: 'colorado', population: 480000 },
  { name: 'Raleigh', stateSlug: 'north-carolina', population: 476000 },
  { name: 'Miami', stateSlug: 'florida', population: 442000 },
  { name: 'Long Beach', stateSlug: 'california', population: 466000 },
  { name: 'Virginia Beach', stateSlug: 'virginia', population: 459000 },
  { name: 'Oakland', stateSlug: 'california', population: 440000 },
  { name: 'Minneapolis', stateSlug: 'minnesota', population: 429000 },
  { name: 'Tulsa', stateSlug: 'oklahoma', population: 411000 },
  { name: 'Tampa', stateSlug: 'florida', population: 399000 },
  { name: 'Arlington', stateSlug: 'texas', population: 398000 },
  { name: 'New Orleans', stateSlug: 'louisiana', population: 383000 },
  { name: 'Wichita', stateSlug: 'kansas', population: 397000 },
  { name: 'Cleveland', stateSlug: 'ohio', population: 373000 },
  { name: 'Bakersfield', stateSlug: 'california', population: 410000 },
  { name: 'Aurora', stateSlug: 'colorado', population: 397000 },
  { name: 'Anaheim', stateSlug: 'california', population: 346000 },
  { name: 'Honolulu', stateSlug: 'hawaii', population: 345000 },
  { name: 'Santa Ana', stateSlug: 'california', population: 310000 },
  { name: 'Riverside', stateSlug: 'california', population: 317000 },
  { name: 'Corpus Christi', stateSlug: 'texas', population: 317000 },
  { name: 'Lexington', stateSlug: 'kentucky', population: 322000 },
  { name: 'Stockton', stateSlug: 'california', population: 320000 },
  { name: 'Henderson', stateSlug: 'nevada', population: 320000 },
  { name: 'Saint Paul', stateSlug: 'minnesota', population: 311000 },
  { name: 'St. Louis', stateSlug: 'missouri', population: 301000 },
  { name: 'Cincinnati', stateSlug: 'ohio', population: 309000 },
  { name: 'Pittsburgh', stateSlug: 'pennsylvania', population: 303000 },
  { name: 'Greensboro', stateSlug: 'north-carolina', population: 299000 },
  { name: 'Anchorage', stateSlug: 'alaska', population: 291000 },
  { name: 'Plano', stateSlug: 'texas', population: 288000 },
  { name: 'Lincoln', stateSlug: 'nebraska', population: 292000 },
  { name: 'Orlando', stateSlug: 'florida', population: 316000 },
  { name: 'Irvine', stateSlug: 'california', population: 314000 },
  { name: 'Newark', stateSlug: 'new-jersey', population: 305000 },
  { name: 'Toledo', stateSlug: 'ohio', population: 267000 },
  { name: 'Durham', stateSlug: 'north-carolina', population: 285000 },
  { name: 'Chula Vista', stateSlug: 'california', population: 275000 },
  { name: 'Fort Wayne', stateSlug: 'indiana', population: 270000 },
  { name: 'Jersey City', stateSlug: 'new-jersey', population: 292000 },
  { name: 'St. Petersburg', stateSlug: 'florida', population: 259000 },
  { name: 'Laredo', stateSlug: 'texas', population: 260000 },
  { name: 'Madison', stateSlug: 'wisconsin', population: 270000 },
  { name: 'Chandler', stateSlug: 'arizona', population: 279000 },
  { name: 'Buffalo', stateSlug: 'new-york', population: 278000 },
  { name: 'Lubbock', stateSlug: 'texas', population: 262000 },
  { name: 'Scottsdale', stateSlug: 'arizona', population: 243000 },
  { name: 'Reno', stateSlug: 'nevada', population: 273000 },
  { name: 'Glendale', stateSlug: 'arizona', population: 251000 },
  { name: 'Gilbert', stateSlug: 'arizona', population: 275000 },
  { name: 'Winston-Salem', stateSlug: 'north-carolina', population: 250000 },
  { name: 'North Las Vegas', stateSlug: 'nevada', population: 262000 },
  { name: 'Norfolk', stateSlug: 'virginia', population: 238000 },
  { name: 'Chesapeake', stateSlug: 'virginia', population: 250000 },
  { name: 'Garland', stateSlug: 'texas', population: 246000 },
  { name: 'Irving', stateSlug: 'texas', population: 260000 },
  { name: 'Hialeah', stateSlug: 'florida', population: 223000 },
  { name: 'Fremont', stateSlug: 'california', population: 230000 },
  { name: 'Boise', stateSlug: 'idaho', population: 235000 },
  { name: 'Richmond', stateSlug: 'virginia', population: 227000 },
  { name: 'Baton Rouge', stateSlug: 'louisiana', population: 227000 },
  { name: 'Spokane', stateSlug: 'washington', population: 230000 },
];

function slugify(name) {
  return name.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function withComputed(c) {
  const state = getStateBySlug(c.stateSlug);
  return {
    ...c,
    slug: `${slugify(c.name)}-${state.code.toLowerCase()}`,
    stateName: state.name,
    stateCode: state.code,
    stateSlugRef: state.slug,
    low: state.low,
    high: state.high,
    multiplier: state.multiplier,
    tier: state.tier,
  };
}

const ALL_CITIES = CITIES.map(withComputed);

export function getAllCities() {
  return [...ALL_CITIES].sort((a, b) => b.population - a.population);
}

export function getCityBySlug(slug) {
  return ALL_CITIES.find(c => c.slug === slug) || null;
}

export function getCitiesByState(stateSlug) {
  return ALL_CITIES.filter(c => c.stateSlugRef === stateSlug).sort((a, b) => b.population - a.population);
}

export function getFeaturedCities() {
  return getAllCities().slice(0, 8);
}

// Per-service pricing for a city, reusing the same state-multiplier math the
// calculator and state pages already use -- not a separate city-level number.
export function cityServicePrices(city) {
  return getAllServices().map(service => {
    const national = typicalCost(service);
    const adjusted = adjustForState(national.low, national.high, { multiplier: city.multiplier });
    return { service, ...adjusted };
  });
}
