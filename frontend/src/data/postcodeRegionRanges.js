// Best-effort UK postcode-area -> region mapping, used only as a soft
// "does this postcode look like it's in the region you picked" sanity
// check on the location step's optional postcode field (LocationStep.js)
// -- never the source of truth for pricing, that's always the region the
// visitor explicitly selected. Mirrors
// backend/src/data/postcodeRegionRanges.js, which does the same lookup
// server-side as calculateCleaning's fallback region resolution for
// callers that skip region entirely.
const POSTCODE_AREA_TO_REGION = {
  E: 'LONDON', EC: 'LONDON', N: 'LONDON', NW: 'LONDON', SE: 'LONDON', SW: 'LONDON', W: 'LONDON', WC: 'LONDON',
  BR: 'LONDON', CR: 'LONDON', DA: 'LONDON', EN: 'LONDON', HA: 'LONDON', IG: 'LONDON', KT: 'LONDON',
  RM: 'LONDON', SM: 'LONDON', TW: 'LONDON', UB: 'LONDON',
  BN: 'SOUTH_EAST', CT: 'SOUTH_EAST', GU: 'SOUTH_EAST', ME: 'SOUTH_EAST', OX: 'SOUTH_EAST',
  PO: 'SOUTH_EAST', RH: 'SOUTH_EAST', SL: 'SOUTH_EAST', SO: 'SOUTH_EAST', TN: 'SOUTH_EAST',
  RG: 'SOUTH_EAST', MK: 'SOUTH_EAST', SP: 'SOUTH_EAST', HP: 'SOUTH_EAST',
  AL: 'EAST_OF_ENGLAND', CB: 'EAST_OF_ENGLAND', CM: 'EAST_OF_ENGLAND', CO: 'EAST_OF_ENGLAND',
  IP: 'EAST_OF_ENGLAND', LU: 'EAST_OF_ENGLAND', NR: 'EAST_OF_ENGLAND', SG: 'EAST_OF_ENGLAND',
  SS: 'EAST_OF_ENGLAND', WD: 'EAST_OF_ENGLAND',
  BA: 'SOUTH_WEST', BH: 'SOUTH_WEST', BS: 'SOUTH_WEST', DT: 'SOUTH_WEST', EX: 'SOUTH_WEST',
  GL: 'SOUTH_WEST', PL: 'SOUTH_WEST', SN: 'SOUTH_WEST', TA: 'SOUTH_WEST', TQ: 'SOUTH_WEST', TR: 'SOUTH_WEST',
  B: 'WEST_MIDLANDS', CV: 'WEST_MIDLANDS', DY: 'WEST_MIDLANDS', HR: 'WEST_MIDLANDS',
  TF: 'WEST_MIDLANDS', WR: 'WEST_MIDLANDS', WS: 'WEST_MIDLANDS', WV: 'WEST_MIDLANDS',
  DE: 'EAST_MIDLANDS', LE: 'EAST_MIDLANDS', LN: 'EAST_MIDLANDS', NG: 'EAST_MIDLANDS',
  NN: 'EAST_MIDLANDS', PE: 'EAST_MIDLANDS',
  BD: 'YORKSHIRE', DN: 'YORKSHIRE', HD: 'YORKSHIRE', HG: 'YORKSHIRE', HU: 'YORKSHIRE',
  HX: 'YORKSHIRE', LS: 'YORKSHIRE', S: 'YORKSHIRE', WF: 'YORKSHIRE', YO: 'YORKSHIRE',
  BB: 'NORTH_WEST', BL: 'NORTH_WEST', CA: 'NORTH_WEST', CH: 'NORTH_WEST', CW: 'NORTH_WEST',
  FY: 'NORTH_WEST', L: 'NORTH_WEST', LA: 'NORTH_WEST', M: 'NORTH_WEST', OL: 'NORTH_WEST',
  PR: 'NORTH_WEST', SK: 'NORTH_WEST', WA: 'NORTH_WEST', WN: 'NORTH_WEST',
  DH: 'NORTH_EAST', DL: 'NORTH_EAST', NE: 'NORTH_EAST', SR: 'NORTH_EAST', TS: 'NORTH_EAST',
  AB: 'SCOTLAND', DD: 'SCOTLAND', DG: 'SCOTLAND', EH: 'SCOTLAND', FK: 'SCOTLAND', G: 'SCOTLAND',
  HS: 'SCOTLAND', IV: 'SCOTLAND', KA: 'SCOTLAND', KW: 'SCOTLAND', KY: 'SCOTLAND', ML: 'SCOTLAND',
  PA: 'SCOTLAND', PH: 'SCOTLAND', TD: 'SCOTLAND', ZE: 'SCOTLAND',
  CF: 'WALES', LD: 'WALES', LL: 'WALES', NP: 'WALES', SA: 'WALES', SY: 'WALES',
  BT: 'NORTHERN_IRELAND',
};

export function regionForPostcode(postcode) {
  const match = String(postcode || '').trim().toUpperCase().match(/^([A-Z]{1,2})\d/);
  if (!match) return null;
  return POSTCODE_AREA_TO_REGION[match[1]] || null;
}
