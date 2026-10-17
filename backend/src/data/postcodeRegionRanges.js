// Best-effort UK postcode-area (the letters before the first digit, e.g.
// "SW" in "SW1A 1AA") -> region mapping. Mirrors zipStateRanges.js's role
// for US ZIPs and postalProvinceRanges.js's for Canadian postal codes:
// calculateCleaning's fallback region resolution when no region was
// explicitly provided, and the same lookup
// frontend/src/data/postcodeRegionRanges.js does client-side to validate
// LocationStep's optional postcode field against the region already
// selected.
//
// Royal Mail's ~120 postcode areas don't align perfectly with the 12 ITL1
// statistical regions used elsewhere in this file -- several areas
// genuinely straddle a regional boundary (Royal Mail post towns don't
// follow county/region lines), and a handful of areas below are assigned
// to their PRIMARY region only, same accepted imprecision ZIP3_RANGES
// already carries for US ZIPs. Good enough for "does this postcode look
// like it's roughly in this region," not a claim of authoritative accuracy
// -- this is only ever a soft fallback, never the primary way a region
// gets set (the visitor always picks their own region directly).
const POSTCODE_AREA_TO_REGION = {
  // London (Greater London, including the outer-London areas that don't
  // use a single-letter London prefix)
  E: 'LONDON', EC: 'LONDON', N: 'LONDON', NW: 'LONDON', SE: 'LONDON', SW: 'LONDON', W: 'LONDON', WC: 'LONDON',
  BR: 'LONDON', CR: 'LONDON', DA: 'LONDON', EN: 'LONDON', HA: 'LONDON', IG: 'LONDON', KT: 'LONDON',
  RM: 'LONDON', SM: 'LONDON', TW: 'LONDON', UB: 'LONDON',
  // South East
  BN: 'SOUTH_EAST', CT: 'SOUTH_EAST', GU: 'SOUTH_EAST', ME: 'SOUTH_EAST', OX: 'SOUTH_EAST',
  PO: 'SOUTH_EAST', RH: 'SOUTH_EAST', SL: 'SOUTH_EAST', SO: 'SOUTH_EAST', TN: 'SOUTH_EAST',
  RG: 'SOUTH_EAST', MK: 'SOUTH_EAST', SP: 'SOUTH_EAST', HP: 'SOUTH_EAST',
  // East of England
  AL: 'EAST_OF_ENGLAND', CB: 'EAST_OF_ENGLAND', CM: 'EAST_OF_ENGLAND', CO: 'EAST_OF_ENGLAND',
  IP: 'EAST_OF_ENGLAND', LU: 'EAST_OF_ENGLAND', NR: 'EAST_OF_ENGLAND', SG: 'EAST_OF_ENGLAND',
  SS: 'EAST_OF_ENGLAND', WD: 'EAST_OF_ENGLAND',
  // South West
  BA: 'SOUTH_WEST', BH: 'SOUTH_WEST', BS: 'SOUTH_WEST', DT: 'SOUTH_WEST', EX: 'SOUTH_WEST',
  GL: 'SOUTH_WEST', PL: 'SOUTH_WEST', SN: 'SOUTH_WEST', TA: 'SOUTH_WEST', TQ: 'SOUTH_WEST', TR: 'SOUTH_WEST',
  // West Midlands
  B: 'WEST_MIDLANDS', CV: 'WEST_MIDLANDS', DY: 'WEST_MIDLANDS', HR: 'WEST_MIDLANDS',
  TF: 'WEST_MIDLANDS', WR: 'WEST_MIDLANDS', WS: 'WEST_MIDLANDS', WV: 'WEST_MIDLANDS',
  // East Midlands
  DE: 'EAST_MIDLANDS', LE: 'EAST_MIDLANDS', LN: 'EAST_MIDLANDS', NG: 'EAST_MIDLANDS',
  NN: 'EAST_MIDLANDS', PE: 'EAST_MIDLANDS',
  // Yorkshire and the Humber
  BD: 'YORKSHIRE', DN: 'YORKSHIRE', HD: 'YORKSHIRE', HG: 'YORKSHIRE', HU: 'YORKSHIRE',
  HX: 'YORKSHIRE', LS: 'YORKSHIRE', S: 'YORKSHIRE', WF: 'YORKSHIRE', YO: 'YORKSHIRE',
  // North West
  BB: 'NORTH_WEST', BL: 'NORTH_WEST', CA: 'NORTH_WEST', CH: 'NORTH_WEST', CW: 'NORTH_WEST',
  FY: 'NORTH_WEST', L: 'NORTH_WEST', LA: 'NORTH_WEST', M: 'NORTH_WEST', OL: 'NORTH_WEST',
  PR: 'NORTH_WEST', SK: 'NORTH_WEST', WA: 'NORTH_WEST', WN: 'NORTH_WEST',
  // North East
  DH: 'NORTH_EAST', DL: 'NORTH_EAST', NE: 'NORTH_EAST', SR: 'NORTH_EAST', TS: 'NORTH_EAST',
  // Scotland
  AB: 'SCOTLAND', DD: 'SCOTLAND', DG: 'SCOTLAND', EH: 'SCOTLAND', FK: 'SCOTLAND', G: 'SCOTLAND',
  HS: 'SCOTLAND', IV: 'SCOTLAND', KA: 'SCOTLAND', KW: 'SCOTLAND', KY: 'SCOTLAND', ML: 'SCOTLAND',
  PA: 'SCOTLAND', PH: 'SCOTLAND', TD: 'SCOTLAND', ZE: 'SCOTLAND',
  // Wales
  CF: 'WALES', LD: 'WALES', LL: 'WALES', NP: 'WALES', SA: 'WALES', SY: 'WALES',
  // Northern Ireland
  BT: 'NORTHERN_IRELAND',
};

// Returns a region key, or null if the postcode's area letters aren't
// recognized -- null means "unknown," never treated as a mismatch by
// callers. UK postcode areas are the letters before the first digit (1-2
// letters almost always -- "GIR" for the single Girobank special case is
// deliberately not handled here, it isn't a real region).
function regionForPostcode(postcode) {
  const match = String(postcode || '').trim().toUpperCase().match(/^([A-Z]{1,2})\d/);
  if (!match) return null;
  return POSTCODE_AREA_TO_REGION[match[1]] || null;
}

module.exports = { regionForPostcode };
