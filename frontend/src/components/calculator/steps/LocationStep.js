import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { stateForZip } from '../../../data/zipStateRanges';
import { provinceForPostal } from '../../../data/postalProvinceRanges';
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

// Canadian postal codes are "A1A 1A1" -- letter/digit/letter, space,
// digit/letter/digit. Formatted as the visitor types (uppercased, space
// inserted after the 3rd character) rather than left as a raw 6-character
// string, since that's the format everyone recognizes as a real postal code.
function formatCaPostal(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
}

export default function LocationStep({ value, onBack, onNext, primaryColor, serviceStates = [], serviceCities = {}, country = 'US' }) {
  const isCa = country === 'CA';
  // "state" is used as the generic region-code variable name throughout --
  // it holds a province code for a CA company, same field, same meaning
  // as DEFAULT_COMPANY_CONFIG's serviceStates (see defaults.js's comment).
  const [state, setState] = useState(value.state || (serviceStates.length === 1 ? serviceStates[0] : ''));
  const [city, setCity] = useState(value.city || '');
  const [zip, setZip] = useState(value.zip || '');

  const REGIONS = isCa ? CA_PROVINCES : US_STATES;
  const regionWord = isCa ? 'Province' : 'State';
  const resolveRegionForPostal = isCa ? (v) => provinceForPostal(v) : (v) => stateForZip(v);

  // A company that's told us which states/provinces it actually serves
  // doesn't need visitors picking from the full list -- pricing only ever
  // needs the region (city has zero effect on the math, see
  // cleaningCalculation.js), but asking about a region that isn't in their
  // service area is just confusing/irrelevant, and a single-region
  // operator gets to skip the region question entirely and ask something
  // actually useful instead: which city, for lead context.
  const scoped = serviceStates.length > 0;
  const singleState = serviceStates.length === 1;
  const scopedStates = REGIONS.filter(([abbr]) => serviceStates.includes(abbr));
  // serviceCities is keyed by region -- a company serving multiple
  // states/provinces only ever wants the cities THEY listed for whichever
  // region is actually selected, not every city they've entered across
  // every region mixed into one list.
  const citiesForState = serviceCities[singleState ? serviceStates[0] : state] || [];

  const selectState = (code) => {
    setState(code);
    setCity(''); // a city picked for the old region won't belong to the new one
    setZip(''); // ditto for a postal code/ZIP that was only valid in the old region
  };

  // ZIP/postal is optional -- this only ever flags a *confident* mismatch
  // (the prefix resolves to a real, different region), never an
  // unrecognized prefix (US territory, Canada's ambiguous 'X' prefix, or
  // just not fully typed yet), so a legitimate ZIP/postal code is never
  // blocked on a false positive.
  const zipComplete = isCa ? zip.replace(/\s/g, '').length === 6 : zip.length === 5;
  const zipStateGuess = zipComplete ? resolveRegionForPostal(zip) : null;
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

          {/* ZIP/postal only appears once a region is picked -- optional, and
              only here as a sanity check against that region (see
              zipMismatch above), not a second, independent way to set
              location. */}
          {state && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                {isCa ? 'Postal Code' : 'ZIP Code'} <span style={{ fontWeight: 400, color: COLORS.muted }}>(optional)</span>
              </label>
              <input
                type="text" inputMode={isCa ? 'text' : 'numeric'} maxLength={isCa ? 7 : 5} value={zip}
                onChange={e => setZip(isCa ? formatCaPostal(e.target.value) : e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder={isCa ? 'e.g. M5V 2T6' : 'e.g. 90210'}
                style={{ ...inputStyle, borderColor: zipMismatch ? COLORS.danger : COLORS.border }}
                onFocus={e => { e.target.style.borderColor = zipMismatch ? COLORS.danger : primaryColor; }}
                onBlur={e => { e.target.style.borderColor = zipMismatch ? COLORS.danger : COLORS.border; }}
                onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
              />
              {zipMismatch && (
                <p style={{ color: COLORS.danger, fontSize: 12.5, marginTop: 5 }}>
                  That {isCa ? 'postal code' : 'ZIP'} isn't in {REGIONS.find(([abbr]) => abbr === state)?.[1] || state}.
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
