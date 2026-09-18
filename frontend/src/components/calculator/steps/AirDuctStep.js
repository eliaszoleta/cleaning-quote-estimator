import React, { useState } from 'react';
import { AlertTriangle, Square } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepPillToggle } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

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

      <StepSection label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial']].map(([id,label]) => (
            <StepChip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      {propertyType === 'commercial' ? (
        <StepSection label={`Square footage: ${sqft.toLocaleString()}`}>
          <input type="range" min={500} max={100000} step={500} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>500 sq ft</span><span>100,000 sq ft</span></div>
        </StepSection>
      ) : (
        <>
          <StepSection label="Number of vents/registers">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['under_10','< 10 vents'],['10_20','10–20 vents'],['20_30','20–30 vents'],['30_plus','30+ vents']].map(([id,label]) => (
                <StepChip key={id} selected={ventCount === id} onClick={() => setVentCount(id)} primaryColor={primaryColor}>{label}</StepChip>
              ))}
            </div>
          </StepSection>
          <StepSection label={`HVAC systems: ${systemCount}`}>
            <input type="range" min={1} max={5} step={1} value={systemCount} onChange={e => setSystemCount(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>1 system</span><span>5 systems</span></div>
          </StepSection>
        </>
      )}

      <StepSection label="Add-on services">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['sanitizing','UV Sanitizing'],['dryer_vent','Dryer Vent (bundle)'],['coil_cleaning','Coil Cleaning'],['filter_replacement','Filter Replacement']].map(([id,label]) => (
            <StepPillToggle key={id} selected={extras.includes(id)} onClick={() => toggleExtra(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>

      <StepSection label="Mold concern">
        <button onClick={() => setMoldSuspected(!moldSuspected)} style={{ padding: '14px 20px', borderRadius: RADIUS.md, border: `2px solid ${moldSuspected ? COLORS.danger : COLORS.border}`, background: moldSuspected ? COLORS.dangerMuted : COLORS.surface, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: moldSuspected ? COLORS.danger : COLORS.ink }}>
            <span style={{ display: 'flex' }}>{moldSuspected ? <AlertTriangle size={18} color={COLORS.danger} /> : <Square size={18} color={COLORS.muted} />}</span>
            I suspect mold or musty odors in my ductwork
          </div>
          <div style={{ fontSize: 12, color: COLORS.body, marginTop: 6, paddingLeft: 30 }}>
            Mold in ductwork requires specialized treatment (+40–50%). An inspection is required before remediation.
          </div>
        </button>
      </StepSection>
    </StepWrapper>
  );
}
