import React, { useState } from 'react';
import { Siren } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

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
        <div style={{ background: COLORS.dangerMuted, border: `2px solid #fca5a5`, borderRadius: RADIUS.sm, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: COLORS.danger, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}><Siren size={15} /> Emergency — Call a restoration company NOW</div>
          <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}>The longer you wait, the more damage spreads. Most restoration companies offer 24/7 emergency service. This estimate is a rough guide — get a professional on-site immediately.</div>
        </div>
      )}

      <StepSection label="When did the water damage occur?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['today','Today / Ongoing'],['24_48h','24–48 hours ago'],['days_3_7','3–7 days ago'],['week_plus','Over a week ago']].map(([id,label]) => (
            <button key={id} onClick={() => setWhenHappened(id)} style={{ padding: '10px 18px', borderRadius: RADIUS.sm, border: `2px solid ${whenHappened === id ? (isUrgent ? COLORS.danger : primaryColor) : COLORS.border}`, background: whenHappened === id ? (isUrgent ? COLORS.dangerMuted : `${primaryColor}10`) : COLORS.surface, color: whenHappened === id ? (isUrgent ? COLORS.danger : primaryColor) : COLORS.ink, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{label}</button>
          ))}
        </div>
      </StepSection>

      <StepSection label="Cause of water damage">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[['pipe_burst','Burst / Broken Pipe'],['appliance_leak','Appliance Leak'],['toilet_overflow','Toilet Overflow'],['roof_leak','Roof Leak'],['flooding','Natural Flooding'],['sewage','Sewage Backup']].map(([id,label]) => (
            <StepOptionCard key={id} selected={cause === id} onClick={() => setCause(id)} primaryColor={primaryColor}>
              <span style={{ fontWeight: 600, fontSize: 13, color: cause === id ? primaryColor : COLORS.ink }}>{label}</span>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Water category">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['clean','Category 1: Clean Water','Pipe burst, appliance supply line'],
            ['gray','Category 2: Gray Water','Washing machine, dishwasher overflow (+30%)'],
            ['black','Category 3: Black Water','Sewage, flooding (+60–100%)'],
          ].map(([id,label,desc]) => (
            <StepOptionCard key={id} selected={waterCategory === id} onClick={() => setWaterCategory(id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 13, color: waterCategory === id ? primaryColor : COLORS.ink }}>{label}</div>
              <div style={{ fontSize: 11, color: COLORS.body, marginTop: 4 }}>{desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label={`Affected area: ~${sqft.toLocaleString()} sq ft`}>
        <input type="range" min={100} max={5000} step={100} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>100 sq ft</span><span>5,000 sq ft</span></div>
      </StepSection>

      <StepSection label="Areas affected (select all)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['first_floor','First Floor'],['second_floor','Second Floor'],['basement','Basement'],['crawl_space','Crawl Space'],['multiple','Multiple Floors']].map(([id,label]) => (
            <StepPillToggle key={id} selected={areas.includes(id)} onClick={() => toggleArea(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>

      <StepSection label="Damage severity">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['wet_carpets','Wet carpets / floors only'],['wet_walls','Walls / drywall soaked'],['structural','Structural damage / subfloor']].map(([id,label]) => (
            <StepChip key={id} selected={damageClass === id} onClick={() => setDamageClass(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Insurance & contents">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setHasInsurance(!hasInsurance)} style={{ padding: '10px 16px', borderRadius: RADIUS.sm, border: `2px solid ${hasInsurance ? primaryColor : COLORS.border}`, background: hasInsurance ? `${primaryColor}10` : COLORS.surface, color: hasInsurance ? primaryColor : COLORS.ink, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            I have homeowner's insurance
          </button>
          <button onClick={() => setContentsDamaged(!contentsDamaged)} style={{ padding: '10px 16px', borderRadius: RADIUS.sm, border: `2px solid ${contentsDamaged ? primaryColor : COLORS.border}`, background: contentsDamaged ? `${primaryColor}10` : COLORS.surface, color: contentsDamaged ? primaryColor : COLORS.ink, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Furniture / contents also damaged
          </button>
        </div>
      </StepSection>
    </StepWrapper>
  );
}
