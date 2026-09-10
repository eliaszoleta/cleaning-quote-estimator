import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { stateForZip } from '../../../data/zipStateRanges';

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

export default function LocationStep({ value, onBack, onNext, primaryColor, serviceStates = [], serviceCities = {} }) {
  const [state, setState] = useState(value.state || (serviceStates.length === 1 ? serviceStates[0] : ''));
  const [city, setCity] = useState(value.city || '');
  const [zip, setZip] = useState(value.zip || '');

  // A company that's told us which states it actually serves doesn't need
  // its visitors picking from a generic 50-state list -- pricing only ever
  // needs the state (city has zero effect on the math, see
  // cleaningCalculation.js), but asking for a state that isn't in their
  // service area is just confusing/irrelevant, and a single-state operator
  // gets to skip the state question entirely and ask something actually
  // useful instead: which city, for lead context.
  const scoped = serviceStates.length > 0;
  const singleState = serviceStates.length === 1;
  const scopedStates = US_STATES.filter(([abbr]) => serviceStates.includes(abbr));
  // serviceCities is keyed by state -- a company serving multiple states
  // only ever wants the cities THEY listed for whichever state is actually
  // selected, not every city they've entered across every state mixed
  // into one list.
  const citiesForState = serviceCities[singleState ? serviceStates[0] : state] || [];

  const selectState = (code) => {
    setState(code);
    setCity(''); // a city picked for the old state won't belong to the new one
    setZip(''); // ditto for a ZIP that was only valid in the old state
  };

  // ZIP is optional -- this only ever flags a *confident* mismatch (the
  // ZIP's prefix resolves to a real, different state), never an
  // unrecognized prefix (US territory, or just not fully typed yet), so a
  // legitimate ZIP is never blocked on a false positive.
  const zipStateGuess = zip.length === 5 ? stateForZip(zip) : null;
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
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    outline: 'none', marginTop: 6, letterSpacing: 2, background: 'white',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={17} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Where is the property?</h2>
      </div>
      <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 22 }}>
        Prices vary significantly by location. We use this to give you an accurate local estimate.
      </p>

      {singleState ? (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>City</label>
          {citiesForState.length > 0 ? (
            <select
              value={city} onChange={e => setCity(e.target.value)}
              style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
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
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
              onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
              autoFocus
            />
          )}
          <p style={{ color: '#94a3b8', fontSize: 12.5, marginTop: 5 }}>Serving {scopedStates[0]?.[1] || serviceStates[0]}</p>
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>State</label>
          <select
            value={state} onChange={e => selectState(e.target.value)}
            style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          >
            <option value="">Select your state…</option>
            {(scoped ? scopedStates : US_STATES).map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
          </select>

          {/* ZIP only appears once a state is picked -- optional, and only
              here as a sanity check against that state (see zipMismatch
              above), not a second, independent way to set location. */}
          {state && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                ZIP Code <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
              </label>
              <input
                type="text" inputMode="numeric" maxLength={5} value={zip}
                onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="e.g. 90210"
                style={{ ...inputStyle, borderColor: zipMismatch ? '#dc2626' : '#e2e8f0' }}
                onFocus={e => { e.target.style.borderColor = zipMismatch ? '#dc2626' : primaryColor; }}
                onBlur={e => { e.target.style.borderColor = zipMismatch ? '#dc2626' : '#e2e8f0'; }}
                onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
              />
              {zipMismatch && (
                <p style={{ color: '#dc2626', fontSize: 12.5, marginTop: 5 }}>
                  That ZIP isn't in {US_STATES.find(([abbr]) => abbr === state)?.[1] || state}.
                </p>
              )}
            </div>
          )}

          {scoped && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>City</label>
              {citiesForState.length > 0 ? (
                <select
                  value={city} onChange={e => setCity(e.target.value)}
                  style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = primaryColor; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
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
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                  onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b' }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={handleNext} disabled={!canContinue}
          style={{ flex: 1, padding: '13px 20px', borderRadius: 10, border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, color: 'white', background: canContinue ? primaryColor : '#cbd5e1', transition: 'all 0.15s' }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
