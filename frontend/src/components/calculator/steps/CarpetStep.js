import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

export default function CarpetStep({ value, onBack, onNext, primaryColor }) {
  const [mode, setMode] = useState(value.sqft ? 'sqft' : 'rooms');
  const [rooms, setRooms] = useState(value.rooms || 3);
  const [sqft, setSqft] = useState(value.sqft || 0);
  const [condition, setCondition] = useState(value.condition || 'moderate');
  const [method, setMethod] = useState(value.method || 'steam');
  const [extras, setExtras] = useState(value.extras || []);
  const [stairs, setStairs] = useState(value.stairs || 0);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Carpet cleaning details" onBack={onBack} onNext={() => onNext({ rooms: mode === 'rooms' ? rooms : 0, sqft: mode === 'sqft' ? sqft : null, condition, method, extras, stairs })} primaryColor={primaryColor}>

      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['rooms','By Rooms'],['sqft','By Sq Ft']].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0f172a' : '#64748b', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
        ))}
      </div>

      {mode === 'rooms' ? (
        <Section label={`Number of rooms: ${rooms}`}>
          <input type="range" min={1} max={15} step={1} value={rooms} onChange={e => setRooms(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            <span>1 room</span><span>15 rooms</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Average room = ~130–150 sq ft. Counts living room, bedrooms, hallways.</p>
        </Section>
      ) : (
        <Section label="Total carpet square footage">
          <input type="number" min={50} max={10000} value={sqft || ''} onChange={e => setSqft(+e.target.value)} placeholder="e.g. 800"
            style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 16, outline: 'none' }} />
        </Section>
      )}

      <Section label="Carpet condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['light','Light soiling'],['moderate','Moderate soiling'],['heavy','Heavily soiled'],['pet','Pet stains/odors']].map(([id,label]) => (
            <button key={id} onClick={() => setCondition(id)} style={{ padding: '9px 16px', borderRadius: 8, border: `2px solid ${condition === id ? primaryColor : '#e2e8f0'}`, background: condition === id ? primaryColor : 'white', color: condition === id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{label}</button>
          ))}
        </div>
      </Section>

      <Section label="Cleaning method">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['steam','Steam (Hot Water Extraction)','Best deep clean, takes 6–12h to dry'],['dry','Dry Cleaning','Quick-dry, less effective on deep stains'],['encapsulation','Encapsulation','Commercial-grade, low moisture']].map(([id,label,desc]) => (
            <button key={id} onClick={() => setMethod(id)} style={{ padding: '12px 10px', textAlign: 'left', borderRadius: 10, border: `2px solid ${method === id ? primaryColor : '#e2e8f0'}`, background: method === id ? `${primaryColor}10` : 'white', cursor: 'pointer', width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: method === id ? primaryColor : '#0f172a' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section label={`Flights of stairs: ${stairs}`}>
        <input type="range" min={0} max={5} step={1} value={stairs} onChange={e => setStairs(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>None</span><span>5 flights</span></div>
      </Section>

      <Section label="Add-ons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['area_rug','Area Rug'],['scotchgard','Scotchgard Protection'],['deodorizer','Deodorizer'],['pet_treatment','Pet Odor Treatment']].map(([id,label]) => (
            <button key={id} onClick={() => toggleExtra(id)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${extras.includes(id) ? primaryColor : '#e2e8f0'}`, background: extras.includes(id) ? `${primaryColor}15` : 'white', color: extras.includes(id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </Section>
    </StepWrapper>
  );
}

function Section({ label, children }) {
  return <div style={{ marginBottom: 24 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>{label}</div>{children}</div>;
}
