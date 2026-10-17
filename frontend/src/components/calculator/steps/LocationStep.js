import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { stateForZip } from '../../../data/zipStateRanges';
import { provinceForPostal } from '../../../data/postalProvinceRanges';
import { regionForPostcode } from '../../../data/postcodeRegionRanges';
import { stateForPostcode } from '../../../data/postcodeStateRanges';
import { COLORS, RADIUS } from '../../../styles/theme';

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
  ['DC','Washington D.C.'],
];

// Canada pilot (Oct 2026) -- codes/names must match CANADA_PROVINCE_NAMES'
// keys in backend/src/config/defaults.js exactly.
const CA_PROVINCES = [
  ['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],['NB','New Brunswick'],
  ['NL','Newfoundland and Labrador'],['NS','Nova Scotia'],['NT','Northwest Territories'],
  ['NU','Nunavut'],['ON','Ontario'],['PE','Prince Edward Island'],['QC','Quebec'],
  ['SK','Saskatchewan'],['YT','Yukon'],
];

// UK pilot (Oct 2026) -- codes/names must match UK_REGION_NAMES' keys in
// backend/src/config/defaults.js exactly (the 12 ITL1 statistical regions).
const GB_REGIONS = [
  ['LONDON','London'],['SOUTH_EAST','South East England'],['EAST_OF_ENGLAND','East of England'],
  ['SOUTH_WEST','South West England'],['NORTH_WEST','North West England'],['WEST_MIDLANDS','West Midlands'],
  ['EAST_MIDLANDS','East Midlands'],['SCOTLAND','Scotland'],['YORKSHIRE','Yorkshire and the Humber'],
  ['WALES','Wales'],['NORTHERN_IRELAND','Northern Ireland'],['NORTH_EAST','North East England'],
];

// Australia pilot (Nov 2026) -- codes/names must match AU_REGION_NAMES'
// keys in backend/src/config/defaults.js exactly (the 8 states/territories).
const AU_STATES = [
  ['NSW','New South Wales'],['VIC','Victoria'],['QLD','Queensland'],['WA','Western Australia'],
  ['SA','South Australia'],['TAS','Tasmania'],['ACT','Australian Capital Territory'],['NT','Northern Territory'],
];

// Canadian postal codes are "A1A 1A1" -- letter/digit/letter, space,
// digit/letter/digit. Formatted as the visitor types (uppercased, space
// inserted after the 3rd character) rather than left as a raw 6-character
// string, since that's the format everyone recognizes as a real postal code.
function formatCaPostal(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
}

// UK postcodes are "SW1A 1AA" -- a variable-length outward code (2-4 chars)
// then a fixed 3-char inward code, space-separated. Formatted as the
// visitor types by always splitting 3 characters off the end, which is
// correct for every valid UK postcode length.
function formatGbPostcode(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  return clean.length > 3 ? `${clean.slice(0, -3)} ${clean.slice(-3)}` : clean;
}

// Per-country config -- everything LocationStep's UI/validation needs that
// varies by country lives here, so adding a future country is a matter of
// adding one more entry instead of threading another isXx boolean through
// every branch below.
const COUNTRY_CONFIG = {
  US: {
    regions: US_STATES, regionWord: 'State', postalLabel: 'ZIP Code',
    postalPlaceholder: 'e.g. 90210', postalInputMode: 'numeric', postalMaxLength: 5,
    formatPostal: v => v.replace(/\D/g, '').slice(0, 5),
    isPostalComplete: zip => zip.length === 5,
    resolveRegionForPostal: stateForZip,
  },
  CA: {
    regions: CA_PROVINCES, regionWord: 'Province', postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. M5V 2T6', postalInputMode: 'text', postalMaxLength: 7,
    formatPostal: formatCaPostal,
    isPostalComplete: zip => zip.replace(/\s/g, '').length === 6,
    resolveRegionForPostal: provinceForPostal,
  },
  GB: {
    regions: GB_REGIONS, regionWord: 'Region', postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. SW1A 1AA', postalInputMode: 'text', postalMaxLength: 8,
    formatPostal: formatGbPostcode,
    isPostalComplete: zip => zip.replace(/\s/g, '').length >= 5,
    resolveRegionForPostal: regionForPostcode,
  },
  AU: {
    regions: AU_STATES, regionWord: 'State', postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. 2000', postalInputMode: 'numeric', postalMaxLength: 4,
    formatPostal: v => v.replace(/\D/g, '').slice(0, 4),
    isPostalComplete: zip => zip.length === 4,
    resolveRegionForPostal: stateForPostcode,
  },
};

export default function LocationStep({ value, onBack, onNext, primaryColor, serviceStates = [], serviceCities = {}, country = 'US' }) {
  const cfg = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.US;
  // "state" is used as the generic region-code variable name throughout --
  // it holds a province/region code for a non-US company, same field, same
  // meaning as DEFAULT_COMPANY_CONFIG's serviceStates (see defaults.js's
  // comment).
  const [state, setState] = useState(value.state || (serviceStates.length === 1 ? serviceStates[0] : ''));
  const [city, setCity] = useState(value.city || '');
  const [zip, setZip] = useState(value.zip || '');

  const REGIONS = cfg.regions;
  const regionWord = cfg.regionWord;

  // A company that's told us which regions it actually serves doesn't need
  // visitors picking from the full list -- pricing only ever needs the
  // region (city has zero effect on the math, see cleaningCalculation.js),
  // but asking about a region that isn't in their service area is just
  // confusing/irrelevant, and a single-region operator gets to skip the
  // region question entirely and ask something actually useful instead:
  // which city, for lead context.
  const scoped = serviceStates.length > 0;
  const singleState = serviceStates.length === 1;
  const scopedStates = REGIONS.filter(([abbr]) => serviceStates.includes(abbr));
  // serviceCities is keyed by region -- a company serving multiple regions
  // only ever wants the cities THEY listed for whichever region is
  // actually selected, not every city they've entered across every region
  // mixed into one list.
  const citiesForState = serviceCities[singleState ? serviceStates[0] : state] || [];

  const selectState = (code) => {
    setState(code);
    setCity(''); // a city picked for the old region won't belong to the new one
    setZip(''); // ditto for a postal code/ZIP/postcode that was only valid in the old region
  };

  // ZIP/postal/postcode is optional -- this only ever flags a *confident*
  // mismatch (the prefix resolves to a real, different region), never an
  // unrecognized prefix (a US territory, Canada's ambiguous 'X' prefix,
  // an unrecognized UK postcode area, or just not fully typed yet), so a
  // legitimate ZIP/postal/postcode is never blocked on a false positive.
  const zipComplete = cfg.isPostalComplete(zip);
  const zipStateGuess = zipComplete ? cfg.resolveRegionForPostal(zip) : null;
  const zipMismatch = !!zipStateGuess && zipStateGuess !== state;

  const canContinue = (scoped
    ? (singleState ? city.trim().length > 0 : !!state && city.trim().length > 0)
    : !!state) && !zipMismatch;

  const handleNext = () => {
    if (!canContinue) return;
    onNext({ zip, state: singleState ? serviceStates[0] : state, city: scoped ? city.trim() : '' });
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px', fontSize: 16,
    border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md,
    outline: 'none', marginTop: 6, letterSpacing: 2, background: COLORS.surface,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <div style={{ width: 36, height: 36, borderRadius: RADIUS.sm, background: COLORS.primaryMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={17} color={COLORS.primary} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.2px' }}>Where is the property?</h2>
      </div>
      <p style={{ color: COLORS.body, fontSize: 13.5, marginBottom: 22 }}>
        Prices vary significantly by location. We use this to give you an accurate local estimate.
      </p>

      {singleState ? (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>City</label>
          {citiesForState.length > 0 ? (
            <select
              value={city} onChange={e => setCity(e.target.value)}
              style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = COLORS.border; }}
              autoFocus
            >
              <option value="">Select your city…</option>
              {citiesForState.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              type="text" value={city}
              onChange={e => setCity(e.target.value)}
              placeholder={`e.g. a city in ${scopedStates[0]?.[1] || serviceStates[0]}`}
              style={{ ...inputStyle, letterSpacing: 0 }}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = COLORS.border; }}
              onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
              autoFocus
            />
          )}
          <p style={{ color: COLORS.muted, fontSize: 12.5, marginTop: 5 }}>Serving {scopedStates[0]?.[1] || serviceStates[0]}</p>
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{regionWord}</label>
          <select
            value={state} onChange={e => selectState(e.target.value)}
            style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = COLORS.border; }}
          >
            <option value="">Select your {regionWord.toLowerCase()}…</option>
            {(scoped ? scopedStates : REGIONS).map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
          </select>

          {/* ZIP/postal/postcode only appears once a region is picked --
              optional, and only here as a sanity check against that region
              (see zipMismatch above), not a second, independent way to set
              location. */}
          {state && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                {cfg.postalLabel} <span style={{ fontWeight: 400, color: COLORS.muted }}>(optional)</span>
              </label>
              <input
                type="text" inputMode={cfg.postalInputMode} maxLength={cfg.postalMaxLength} value={zip}
                onChange={e => setZip(cfg.formatPostal(e.target.value))}
                placeholder={cfg.postalPlaceholder}
                style={{ ...inputStyle, borderColor: zipMismatch ? COLORS.danger : COLORS.border }}
                onFocus={e => { e.target.style.borderColor = zipMismatch ? COLORS.danger : primaryColor; }}
                onBlur={e => { e.target.style.borderColor = zipMismatch ? COLORS.danger : COLORS.border; }}
                onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
              />
              {zipMismatch && (
                <p style={{ color: COLORS.danger, fontSize: 12.5, marginTop: 5 }}>
                  That {cfg.postalLabel.toLowerCase()} isn't in {REGIONS.find(([abbr]) => abbr === state)?.[1] || state}.
                </p>
              )}
            </div>
          )}

          {scoped && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>City</label>
              {citiesForState.length > 0 ? (
                <select
                  value={city} onChange={e => setCity(e.target.value)}
                  style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = primaryColor; }}
                  onBlur={e => { e.target.style.borderColor = COLORS.border; }}
                >
                  <option value="">Select your city…</option>
                  {citiesForState.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  type="text" value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. your city"
                  style={{ ...inputStyle, letterSpacing: 0 }}
                  onFocus={e => { e.target.style.borderColor = primaryColor; }}
                  onBlur={e => { e.target.style.borderColor = COLORS.border; }}
                  onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${COLORS.borderSubtle}` }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 20px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md, background: COLORS.surface, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: COLORS.body }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={handleNext} disabled={!canContinue}
          style={{ flex: 1, padding: '13px 20px', borderRadius: RADIUS.md, border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, color: 'white', background: canContinue ? primaryColor : '#cbd5e1', transition: 'all 0.15s' }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
