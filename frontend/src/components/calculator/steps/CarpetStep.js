import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

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

      <div style={{ display: 'flex', background: COLORS.surfaceMuted, borderRadius: RADIUS.sm, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['rooms','By Rooms'],['sqft','By Sq Ft']].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '8px 20px', borderRadius: RADIUS.sm - 2, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: mode === m ? COLORS.surface : 'transparent', color: mode === m ? COLORS.ink : COLORS.body, boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
        ))}
      </div>

      {mode === 'rooms' ? (
        <StepSection label={`Number of rooms: ${rooms}`}>
          <input type="range" min={1} max={15} step={1} value={rooms} onChange={e => setRooms(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            <span>1 room</span><span>15 rooms</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.body, marginTop: 8 }}>Average room = ~130–150 sq ft. Counts living room, bedrooms, hallways.</p>
        </StepSection>
      ) : (
        <StepSection label="Total carpet square footage">
          <input type="number" min={50} max={10000} value={sqft || ''} onChange={e => setSqft(+e.target.value)} placeholder="e.g. 800"
            style={{ width: '100%', padding: '12px 16px', border: `2px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 16, outline: 'none' }} />
        </StepSection>
      )}

      <StepSection label="Carpet condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['light','Light soiling'],['moderate','Moderate soiling'],['heavy','Heavily soiled'],['pet','Pet stains/odors']].map(([id,label]) => (
            <StepChip key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Cleaning method">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['steam','Steam (Hot Water Extraction)','Best deep clean, takes 6–12h to dry'],['dry','Dry Cleaning','Quick-dry, less effective on deep stains'],['encapsulation','Encapsulation','Commercial-grade, low moisture']].map(([id,label,desc]) => (
            <StepOptionCard key={id} selected={method === id} onClick={() => setMethod(id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 13, color: method === id ? primaryColor : COLORS.ink }}>{label}</div>
              <div style={{ fontSize: 11, color: COLORS.body, marginTop: 4 }}>{desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label={`Flights of stairs: ${stairs}`}>
        <input type="range" min={0} max={5} step={1} value={stairs} onChange={e => setStairs(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>None</span><span>5 flights</span></div>
      </StepSection>

      <StepSection label="Add-ons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['area_rug','Area Rug'],['scotchgard','Scotchgard Protection'],['deodorizer','Deodorizer'],['pet_treatment','Pet Odor Treatment']].map(([id,label]) => (
            <StepPillToggle key={id} selected={extras.includes(id)} onClick={() => toggleExtra(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
