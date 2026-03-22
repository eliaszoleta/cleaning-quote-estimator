import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';

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

export default function LocationStep({ value, onBack, onNext, primaryColor }) {
  const [zip, setZip] = useState(value.zip || '');
  const [state, setState] = useState(value.state || '');
  const [mode, setMode] = useState(value.zip ? 'zip' : 'state');

  const canContinue = mode === 'zip' ? /^\d{5}$/.test(zip) : !!state;

  const handleNext = () => {
    if (!canContinue) return;
    onNext(mode === 'zip' ? { zip, state: '' } : { zip: '', state });
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

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 9, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {[['zip', 'ZIP Code'], ['state', 'State']].map(([m, label]) => (
          <button
            key={m} onClick={() => setMode(m)}
            style={{
              padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13.5,
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#0f172a' : '#64748b',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'zip' ? (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>ZIP Code</label>
          <input
            type="text" inputMode="numeric" maxLength={5} value={zip}
            onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 90210"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
            autoFocus
          />
          {zip && zip.length < 5 && <p style={{ color: '#94a3b8', fontSize: 12.5, marginTop: 5 }}>Enter all 5 digits</p>}
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>State</label>
          <select
            value={state} onChange={e => setState(e.target.value)}
            style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          >
            <option value="">Select your state…</option>
            {US_STATES.map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
          </select>
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
