import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

export default function WaterDamageStep({ value, onBack, onNext, primaryColor }) {
  const [cause, setCause] = useState(value.cause || 'pipe_burst');
  const [sqft, setSqft] = useState(value.sqft || 500);
  const [areas, setAreas] = useState(value.areas || ['first_floor']);
  const [waterCategory, setWaterCategory] = useState(value.waterCategory || 'clean');
  const [whenHappened, setWhenHappened] = useState(value.whenHappened || 'today');
  const [damageClass, setDamageClass] = useState(value.damageClass || 'wet_carpets');
  const [hasInsurance, setHasInsurance] = useState(value.hasInsurance !== false);
  const [contentsDamaged, setContentsDamaged] = useState(value.contentsDamaged || false);

  const toggleArea = id => setAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const isUrgent = ['today','24_48h'].includes(whenHappened);

  return (
    <StepWrapper title="Water damage details" subtitle="Act fast — mold can begin in 24–48 hours" onBack={onBack} onNext={() => onNext({ cause, sqft, areas, waterCategory, whenHappened, damageClass, hasInsurance, contentsDamaged })} primaryColor={primaryColor}>

      {isUrgent && (
        <div style={{ background: '#fff1f2', border: '2px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 15 }}>🚨 Emergency — Call a restoration company NOW</div>
          <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}>The longer you wait, the more damage spreads. Most restoration companies offer 24/7 emergency service. This estimate is a rough guide — get a professional on-site immediately.</div>
        </div>
      )}

      <Section label="When did the water damage occur?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['today','Today / Ongoing'],['24_48h','24–48 hours ago'],['days_3_7','3–7 days ago'],['week_plus','Over a week ago']].map(([id,label]) => (
            <button key={id} onClick={() => setWhenHappened(id)} style={{ padding: '10px 18px', borderRadius: 8, border: `2px solid ${whenHappened === id ? (isUrgent ? '#dc2626' : primaryColor) : '#e2e8f0'}`, background: whenHappened === id ? (isUrgent ? '#fff1f2' : `${primaryColor}10`) : 'white', color: whenHappened === id ? (isUrgent ? '#dc2626' : primaryColor) : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{label}</button>
          ))}
        </div>
      </Section>

      <Section label="Cause of water damage">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[['pipe_burst','Burst / Broken Pipe'],['appliance_leak','Appliance Leak'],['toilet_overflow','Toilet Overflow'],['roof_leak','Roof Leak'],['flooding','Natural Flooding'],['sewage','Sewage Backup']].map(([id,label]) => (
            <button key={id} onClick={() => setCause(id)} style={{ padding: '10px 14px', textAlign: 'left', borderRadius: 8, border: `2px solid ${cause === id ? primaryColor : '#e2e8f0'}`, background: cause === id ? `${primaryColor}10` : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: cause === id ? primaryColor : '#374151' }}>{label}</button>
          ))}
        </div>
      </Section>

      <Section label="Water category">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['clean','Category 1: Clean Water','Pipe burst, appliance supply line'],
            ['gray','Category 2: Gray Water','Washing machine, dishwasher overflow (+30%)'],
            ['black','Category 3: Black Water','Sewage, flooding (+60–100%)'],
          ].map(([id,label,desc]) => (
            <button key={id} onClick={() => setWaterCategory(id)} style={{ padding: '12px 10px', textAlign: 'left', borderRadius: 10, border: `2px solid ${waterCategory === id ? primaryColor : '#e2e8f0'}`, background: waterCategory === id ? `${primaryColor}10` : 'white', cursor: 'pointer', width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: waterCategory === id ? primaryColor : '#0f172a' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section label={`Affected area: ~${sqft.toLocaleString()} sq ft`}>
        <input type="range" min={100} max={5000} step={100} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>100 sq ft</span><span>5,000 sq ft</span></div>
      </Section>

      <Section label="Areas affected (select all)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['first_floor','First Floor'],['second_floor','Second Floor'],['basement','Basement'],['crawl_space','Crawl Space'],['multiple','Multiple Floors']].map(([id,label]) => (
            <button key={id} onClick={() => toggleArea(id)} style={{ padding: '9px 16px', borderRadius: 20, border: `2px solid ${areas.includes(id) ? primaryColor : '#e2e8f0'}`, background: areas.includes(id) ? `${primaryColor}15` : 'white', color: areas.includes(id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {areas.includes(id) ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Damage severity">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['wet_carpets','Wet carpets / floors only'],['wet_walls','Walls / drywall soaked'],['structural','Structural damage / subfloor']].map(([id,label]) => (
            <button key={id} onClick={() => setDamageClass(id)} style={{ padding: '10px 18px', borderRadius: 8, border: `2px solid ${damageClass === id ? primaryColor : '#e2e8f0'}`, background: damageClass === id ? primaryColor : 'white', color: damageClass === id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{label}</button>
          ))}
        </div>
      </Section>

      <Section label="Insurance & contents">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setHasInsurance(!hasInsurance)} style={{ padding: '10px 16px', borderRadius: 8, border: `2px solid ${hasInsurance ? primaryColor : '#e2e8f0'}`, background: hasInsurance ? `${primaryColor}10` : 'white', color: hasInsurance ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {hasInsurance ? '✓ ' : ''}I have homeowner's insurance
          </button>
          <button onClick={() => setContentsDamaged(!contentsDamaged)} style={{ padding: '10px 16px', borderRadius: 8, border: `2px solid ${contentsDamaged ? primaryColor : '#e2e8f0'}`, background: contentsDamaged ? `${primaryColor}10` : 'white', color: contentsDamaged ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {contentsDamaged ? '✓ ' : ''}Furniture / contents also damaged
          </button>
        </div>
      </Section>
    </StepWrapper>
  );
}

function Section({ label, children }) {
  return <div style={{ marginBottom: 24 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>{label}</div>{children}</div>;
}
