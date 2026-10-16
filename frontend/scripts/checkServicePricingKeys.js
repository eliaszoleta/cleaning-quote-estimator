#!/usr/bin/env node
// Guards against the exact bug class an October 2026 audit found across
// nearly every calculator service: a Step component offers a selectable
// option whose id doesn't match any key in the backend's price table for
// that field, so it silently falls back to a default (usually the
// cheapest/no-multiplier one) or adds $0 -- no error, no crash, just a
// wrong quote nobody notices until a customer or the business owner does.
// The worst case found: "Deep Clean" sent cleaningType: 'deep_clean' while
// CLEANING_TYPE_MULTIPLIERS' key was 'deep' -- every Deep Clean quote on
// House and Apartment Cleaning silently priced as Standard (no +68-85%)
// for who knows how long.
//
// This reads the REAL, current option ids straight out of each Step
// component's source (not a hand-maintained duplicate list, which is
// exactly what let the original bugs drift unnoticed) and checks each one
// against the backend price table(s) that field actually keys into. Run
// automatically before every frontend build (see package.json's
// "prebuild") so a new/renamed option with no matching backend price
// fails the build loudly instead of shipping silently.
//
// This is a safety net, not a full static analyzer: each FIELDS entry
// below names which array/regex pattern in which Step file holds a given
// field's option ids, and which defaults.js table(s) should contain every
// one of those ids as a key. Adding a brand-new priceable field to a Step
// component means adding its own entry here too -- the script can't
// discover that part on its own, only verify ids once told where to look.

const fs = require('fs');
const path = require('path');

const STEPS_DIR = path.join(__dirname, '../src/components/calculator/steps');
const DEFAULTS = require('../../backend/src/config/defaults');

function read(file) {
  return fs.readFileSync(path.join(STEPS_DIR, file), 'utf8');
}

// Pulls every id out of `{ id: 'x', ... }` object-literal options within
// the named const's array literal (stops at the first top-level `];`).
function idsFromObjectConst(src, constName) {
  const start = src.indexOf(`const ${constName} = [`);
  if (start === -1) throw new Error(`const ${constName} not found`);
  const end = src.indexOf('\n];', start);
  const block = src.slice(start, end === -1 ? undefined : end);
  return [...block.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
}

// Pulls the first element of every ['id', ...] tuple within the named
// const's array literal.
function idsFromTupleConst(src, constName) {
  const start = src.indexOf(`const ${constName} = [`);
  if (start === -1) throw new Error(`const ${constName} not found`);
  const end = src.indexOf('\n];', start);
  const block = src.slice(start, end === -1 ? undefined : end);
  return [...block.matchAll(/\[\s*'([^']+)'/g)].map(m => m[1]);
}

// Pulls ids from an inline tuple array that isn't its own const -- scoped
// to the single line containing `anchor` (a unique substring on that
// line), e.g. a StepSection's label prop right before the options render.
function idsFromInlineTupleLine(src, anchor) {
  const lineStart = src.indexOf(anchor);
  if (lineStart === -1) throw new Error(`anchor not found: ${anchor}`);
  const lineEnd = src.indexOf('\n', lineStart);
  const line = src.slice(lineStart, lineEnd);
  return [...line.matchAll(/\[\s*'([^']+)'/g)].map(m => m[1]);
}

// Pulls ids from a flat `['a','b','c'].map(` array (no label, id doubles
// as display text) -- scoped the same way.
function idsFromFlatArrayLine(src, anchor) {
  const lineStart = src.indexOf(anchor);
  if (lineStart === -1) throw new Error(`anchor not found: ${anchor}`);
  const lineEnd = src.indexOf('.map(', lineStart);
  const segment = src.slice(lineStart, lineEnd);
  return [...segment.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

function checkIds(ids, tables, label, errors) {
  for (const id of ids) {
    const found = tables.some(t => Object.prototype.hasOwnProperty.call(t, id));
    if (!found) errors.push(`${label}: "${id}" has no matching key in its backend price table`);
  }
}

const errors = [];

// ── Home ──────────────────────────────────────────────────────────────
{
  const src = read('HomeStep.js');
  checkIds(idsFromObjectConst(src, 'SQFT_OPTIONS'), [DEFAULTS.HOME_SQFT_BASE_PRICES], 'HomeStep sqftTier', errors);
  checkIds(idsFromObjectConst(src, 'CLEANING_TYPES'), [DEFAULTS.CLEANING_TYPE_MULTIPLIERS], 'HomeStep cleaningType', errors);
  checkIds(idsFromObjectConst(src, 'EXTRAS'), [DEFAULTS.HOME_EXTRAS], 'HomeStep extras', errors);
  checkIds(idsFromFlatArrayLine(src, "{['1','2','3','4','5+']"), [DEFAULTS.BEDROOM_ADDON], 'HomeStep bedrooms', errors);
  checkIds(idsFromFlatArrayLine(src, "{['1','1.5','2','2.5','3','3+']"), [DEFAULTS.BATHROOM_ADDON], 'HomeStep bathrooms', errors);
  checkIds(idsFromInlineTupleLine(src, "[['good','Good']"), [DEFAULTS.CONDITION_MULTIPLIERS], 'HomeStep condition', errors);
}

// ── Apartment ─────────────────────────────────────────────────────────
{
  const src = read('ApartmentStep.js');
  checkIds(idsFromObjectConst(src, 'SIZES'), [DEFAULTS.APARTMENT_SIZE_PRICES], 'ApartmentStep size', errors);
  checkIds(idsFromObjectConst(src, 'CLEANING_TYPES'), [DEFAULTS.CLEANING_TYPE_MULTIPLIERS], 'ApartmentStep cleaningType', errors);
  checkIds(idsFromObjectConst(src, 'EXTRAS'), [DEFAULTS.HOME_EXTRAS], 'ApartmentStep extras', errors);
  checkIds(idsFromFlatArrayLine(src, "{['1','1.5','2','2.5','3+']"), [DEFAULTS.BATHROOM_ADDON], 'ApartmentStep bathrooms', errors);
}

// ── Commercial ────────────────────────────────────────────────────────
{
  const src = read('CommercialStep.js');
  // 'church' is a known, intentional fallback to the office rate -- not
  // priced on its own, so it's excluded here rather than flagged forever.
  const buildingTypes = idsFromObjectConst(src, 'BUILDING_TYPES').filter(id => id !== 'church');
  checkIds(buildingTypes, [DEFAULTS.COMMERCIAL_SQFT_RATES], 'CommercialStep buildingType', errors);
  checkIds(idsFromObjectConst(src, 'FREQUENCIES'), [DEFAULTS.COMMERCIAL_VISITS_PER_MONTH], 'CommercialStep frequency', errors);
  checkIds(idsFromObjectConst(src, 'ONE_TIME_CONDITIONS'), [DEFAULTS.COMMERCIAL_ONE_TIME_CONDITION_MULTIPLIERS], 'CommercialStep condition', errors);
  checkIds(idsFromObjectConst(src, 'SERVICE_LEVELS'), [DEFAULTS.COMMERCIAL_SERVICE_LEVELS], 'CommercialStep serviceLevel', errors);
}

// ── Carpet ────────────────────────────────────────────────────────────
{
  const src = read('CarpetStep.js');
  checkIds(idsFromInlineTupleLine(src, "[['light','Light soiling'],['moderate','Moderate soiling'],['heavy','Heavily soiled'],['pet','Pet stains/odors']]"), [DEFAULTS.CARPET_CONDITION_MULTIPLIERS], 'CarpetStep condition', errors);
  checkIds(idsFromInlineTupleLine(src, "[['steam','Steam"), [DEFAULTS.CARPET_METHOD_MULTIPLIERS], 'CarpetStep method', errors);
  checkIds(idsFromInlineTupleLine(src, "[['area_rug','Area Rug']"), [DEFAULTS.CARPET_ADDONS], 'CarpetStep extras', errors);
}

// ── Upholstery ────────────────────────────────────────────────────────
{
  const src = read('UpholsteryStep.js');
  checkIds(idsFromTupleConst(src, 'ITEMS'), [DEFAULTS.UPHOLSTERY_ITEM_PRICES], 'UpholsteryStep items', errors);
  checkIds(idsFromInlineTupleLine(src, "[['light', 'Light soiling']"), [DEFAULTS.UPHOLSTERY_CONDITION_MULTIPLIERS], 'UpholsteryStep condition', errors);
  checkIds(idsFromInlineTupleLine(src, "[['fabric_protector', 'Fabric Protector']"), [DEFAULTS.UPHOLSTERY_ADDONS], 'UpholsteryStep extras', errors);
}

// ── Air Duct ──────────────────────────────────────────────────────────
{
  const src = read('AirDuctStep.js');
  checkIds(idsFromInlineTupleLine(src, "[['sanitization','UV Sanitizing']"), [DEFAULTS.AIR_DUCT_ADDONS], 'AirDuctStep extras', errors);
}

// ── Dryer Vent ────────────────────────────────────────────────────────
{
  const src = read('DryerVentStep.js');
  checkIds(idsFromInlineTupleLine(src, "[['short','Short"), [DEFAULTS.DRYER_VENT_LENGTH_ADDON], 'DryerVentStep ventLength', errors);
  checkIds(idsFromInlineTupleLine(src, "[['standard','Standard (through wall)']"), [DEFAULTS.DRYER_VENT_TYPE_ADDON], 'DryerVentStep ventType', errors);
}

// ── Tile & Grout ──────────────────────────────────────────────────────
{
  const src = read('TileGroutStep.js');
  checkIds(idsFromInlineTupleLine(src, "[['ceramic','Ceramic']"), [DEFAULTS.TILE_PRICE_PER_SQFT], 'TileGroutStep tileType', errors);
  checkIds(idsFromInlineTupleLine(src, "[['light','Lightly soiled']"), [DEFAULTS.TILE_CONDITION_MULTIPLIERS], 'TileGroutStep condition', errors);
}

// ── Mold ──────────────────────────────────────────────────────────────
{
  const src = read('MoldStep.js');
  // affectedSize was a 4-tier bucket picker (checked against MOLD_PRICE_RANGES);
  // replaced Oct 2026 with a real sq-ft slider (see MOLD_SQFT_PRICE_CURVE /
  // interpolateMoldPriceRange in defaults.js), which has no discrete ids to
  // check against a key table the way the other option-card steps do.
  checkIds(idsFromInlineTupleLine(src, "[['not_sure','Not Sure']"), [DEFAULTS.MOLD_TYPE_MULTIPLIERS], 'MoldStep moldType', errors);
  checkIds(idsFromInlineTupleLine(src, "[['yes','Yes"), [DEFAULTS.MOLD_SOURCE_FIXED_MULTIPLIERS], 'MoldStep sourceFixed', errors);
}

// ── Water Damage ──────────────────────────────────────────────────────
{
  const src = read('WaterDamageStep.js');
  checkIds(idsFromInlineTupleLine(src, "['clean','Category 1"), [DEFAULTS.WATER_CATEGORY_MULTIPLIERS], 'WaterDamageStep waterCategory', errors);
}

if (errors.length > 0) {
  console.error('\n✗ Service pricing key check FAILED -- these calculator options have no matching backend price:\n');
  errors.forEach(e => console.error('  - ' + e));
  console.error('\nEither fix the frontend id to match the real backend key, or add the missing key to backend/src/config/defaults.js.\n');
  process.exit(1);
}

console.log('✓ Service pricing key check passed -- every calculator option has a matching backend price.');
