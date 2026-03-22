import React, { useState } from 'react';

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
    width: '100%',
    padding: '14px 16px',
    fontSize: 18,
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    outline: 'none',
    marginTop: 8,
    letterSpacing: 2,
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Where is the property?</h2>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>
        Prices vary significantly by location. We use this to give you an accurate local estimate.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['zip', 'ZIP Code'], ['state', 'State']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#0f172a' : '#64748b',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'zip' ? (
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>ZIP Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 90210"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            onKeyDown={e => { if (e.key === 'Enter' && canContinue) handleNext(); }}
            autoFocus
          />
          {zip && zip.length < 5 && (
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>Enter 5 digits</p>
          )}
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>State</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            style={{ ...inputStyle, letterSpacing: 0, cursor: 'pointer', background: 'white' }}
            onFocus={e => { e.target.style.borderColor = primaryColor; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          >
            <option value="">Select your state…</option>
            {US_STATES.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button
          onClick={onBack}
          style={{ padding: '14px 24px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#64748b' }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canContinue}
          style={{
            flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed',
            fontSize: 15, fontWeight: 700, color: 'white',
            background: canContinue ? primaryColor : '#94a3b8',
            transition: 'all 0.15s',
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
