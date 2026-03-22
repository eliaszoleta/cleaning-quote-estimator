import React, { useState } from 'react';
import { Flame, AlertTriangle, Square } from 'lucide-react';
import StepWrapper from './StepWrapper';

export default function DryerVentStep({ value, onBack, onNext, primaryColor }) {
  const [propertyType, setPropertyType] = useState(value.propertyType || 'residential');
  const [dryerCount, setDryerCount] = useState(value.dryerCount || 1);
  const [ventLength, setVentLength] = useState(value.ventLength || 'medium');
  const [ventType, setVentType] = useState(value.ventType || 'standard');
  const [clogSuspected, setClogSuspected] = useState(value.clogSuspected || false);
  const [multiUnit, setMultiUnit] = useState(value.multiUnit || false);

  return (
    <StepWrapper title="Dryer vent cleaning details" subtitle="Clogged dryer vents are a top cause of house fires" onBack={onBack} onNext={() => onNext({ propertyType, dryerCount, ventLength, ventType, clogSuspected, multiUnit })} primaryColor={primaryColor}>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Flame size={14} color="#d97706" /> Safety reminder:</span>
        <span style={{ color: '#78350f', fontSize: 14, marginLeft: 6 }}>The U.S. Fire Administration recommends dryer vent cleaning at least once a year. Clogged vents cause 2,900+ fires annually.</span>
      </div>

      <Section label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial / Laundromat']].map(([id,label]) => (
            <Chip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor}>{label}</Chip>
          ))}
        </div>
      </Section>

      {propertyType === 'commercial' ? (
        <>
          <Section label={`Number of dryers: ${dryerCount}`}>
            <input type="range" min={1} max={50} step={1} value={dryerCount} onChange={e => setDryerCount(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>1</span><span>50</span></div>
          </Section>
          {dryerCount >= 10 && (
            <Section label="Multi-unit discount">
              <button onClick={() => setMultiUnit(!multiUnit)} style={{ padding: '12px 16px', borderRadius: 8, border: `2px solid ${multiUnit ? primaryColor : '#e2e8f0'}`, background: multiUnit ? `${primaryColor}10` : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: multiUnit ? primaryColor : '#374151' }}>
                Apply 15% bulk discount (10+ dryers)
              </button>
            </Section>
          )}
        </>
      ) : (
        <>
          <Section label="Vent length / run">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['short','Short (< 10 ft)'],['medium','Medium (10–25 ft)'],['long','Long (25–50 ft)'],['very_long','Very Long (50+ ft)']].map(([id,label]) => (
                <Chip key={id} selected={ventLength === id} onClick={() => setVentLength(id)} primaryColor={primaryColor}>{label}</Chip>
              ))}
            </div>
          </Section>
          <Section label="Vent routing type">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['standard','Standard (through wall)'],['roof','Through roof'],['underground','Underground'],['periscope','Periscope / tight space']].map(([id,label]) => (
                <Chip key={id} selected={ventType === id} onClick={() => setVentType(id)} primaryColor={primaryColor}>{label}</Chip>
              ))}
            </div>
          </Section>
        </>
      )}

      <Section label="Suspected clog?">
        <button onClick={() => setClogSuspected(!clogSuspected)} style={{ padding: '14px 20px', borderRadius: 10, border: `2px solid ${clogSuspected ? '#dc2626' : '#e2e8f0'}`, background: clogSuspected ? '#fff1f2' : 'white', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: clogSuspected ? '#dc2626' : '#374151' }}>
            <span style={{ display: 'flex' }}>{clogSuspected ? <AlertTriangle size={17} color="#dc2626" /> : <Square size={17} color="#94a3b8" />}</span>
            Yes — dryer takes more than one cycle or I smell burning
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, paddingLeft: 30 }}>Confirmed clogs require additional clearing work (+$50–$100).</div>
        </button>
      </Section>
    </StepWrapper>
  );
}

function Section({ label, children }) {
  return <div style={{ marginBottom: 24 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>{label}</div>{children}</div>;
}
function Chip({ selected, onClick, primaryColor, children }) {
  return <button onClick={onClick} style={{ padding: '9px 18px', borderRadius: 8, border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`, background: selected ? primaryColor : 'white', color: selected ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{children}</button>;
}
