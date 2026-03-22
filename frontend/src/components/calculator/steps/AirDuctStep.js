import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

export default function AirDuctStep({ value, onBack, onNext, primaryColor }) {
  const [propertyType, setPropertyType] = useState(value.propertyType || 'residential');
  const [sqft, setSqft] = useState(value.sqft || 1800);
  const [ventCount, setVentCount] = useState(value.ventCount || '10_20');
  const [systemCount, setSystemCount] = useState(value.systemCount || 1);
  const [extras, setExtras] = useState(value.extras || []);
  const [moldSuspected, setMoldSuspected] = useState(value.moldSuspected || false);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Air duct cleaning details" subtitle="Regular duct cleaning improves air quality and HVAC efficiency" onBack={onBack} onNext={() => onNext({ propertyType, sqft, ventCount, systemCount, extras, moldSuspected })} primaryColor={primaryColor}>

      <Section label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial']].map(([id,label]) => (
            <Chip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor}>{label}</Chip>
          ))}
        </div>
      </Section>

      {propertyType === 'commercial' ? (
        <Section label={`Square footage: ${sqft.toLocaleString()}`}>
          <input type="range" min={500} max={100000} step={500} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>500 sq ft</span><span>100,000 sq ft</span></div>
        </Section>
      ) : (
        <>
          <Section label="Number of vents/registers">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['under_10','< 10 vents'],['10_20','10–20 vents'],['20_30','20–30 vents'],['30_plus','30+ vents']].map(([id,label]) => (
                <Chip key={id} selected={ventCount === id} onClick={() => setVentCount(id)} primaryColor={primaryColor}>{label}</Chip>
              ))}
            </div>
          </Section>
          <Section label={`HVAC systems: ${systemCount}`}>
            <input type="range" min={1} max={5} step={1} value={systemCount} onChange={e => setSystemCount(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>1 system</span><span>5 systems</span></div>
          </Section>
        </>
      )}

      <Section label="Add-on services">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['sanitizing','UV Sanitizing'],['dryer_vent','Dryer Vent (bundle)'],['coil_cleaning','Coil Cleaning'],['filter_replacement','Filter Replacement']].map(([id,label]) => (
            <button key={id} onClick={() => toggleExtra(id)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${extras.includes(id) ? primaryColor : '#e2e8f0'}`, background: extras.includes(id) ? `${primaryColor}15` : 'white', color: extras.includes(id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {extras.includes(id) ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Mold concern">
        <button onClick={() => setMoldSuspected(!moldSuspected)} style={{ padding: '14px 20px', borderRadius: 10, border: `2px solid ${moldSuspected ? '#dc2626' : '#e2e8f0'}`, background: moldSuspected ? '#fff1f2' : 'white', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: moldSuspected ? '#dc2626' : '#374151' }}>
            <span style={{ fontSize: 20 }}>{moldSuspected ? '⚠️' : '☐'}</span>
            I suspect mold or musty odors in my ductwork
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, paddingLeft: 30 }}>
            Mold in ductwork requires specialized treatment (+40–50%). An inspection is required before remediation.
          </div>
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
