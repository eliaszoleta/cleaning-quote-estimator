import React, { useState } from 'react';
import { Flame, AlertTriangle, Square } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

export default function DryerVentStep({ value, onBack, onNext, primaryColor }) {
  const [propertyType, setPropertyType] = useState(value.propertyType || 'residential');
  const [dryerCount, setDryerCount] = useState(value.dryerCount || 1);
  const [ventLength, setVentLength] = useState(value.ventLength || 'medium');
  const [ventType, setVentType] = useState(value.ventType || 'standard');
  const [clogSuspected, setClogSuspected] = useState(value.clogSuspected || false);
  const [multiUnit, setMultiUnit] = useState(value.multiUnit || false);

  return (
    <StepWrapper title="Dryer vent cleaning details" subtitle="Clogged dryer vents are a top cause of house fires" onBack={onBack} onNext={() => onNext({ propertyType, dryerCount, ventLength, ventType, clogSuspected, multiUnit })} primaryColor={primaryColor}>

      <div style={{ background: COLORS.warningMuted, border: `1px solid ${COLORS.warningBorder}`, borderRadius: RADIUS.sm, padding: '12px 16px', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Flame size={14} color={COLORS.warning} /> Safety reminder:</span>
        <span style={{ color: '#78350f', fontSize: 14, marginLeft: 6 }}>The U.S. Fire Administration recommends dryer vent cleaning at least once a year. Clogged vents cause 2,900+ fires annually.</span>
      </div>

      <StepSection label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial / Laundromat']].map(([id,label]) => (
            <StepChip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      {propertyType === 'commercial' ? (
        <>
          <StepSection label={`Number of dryers: ${dryerCount}`}>
            <input type="range" min={1} max={50} step={1} value={dryerCount} onChange={e => setDryerCount(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>1</span><span>50</span></div>
          </StepSection>
          {dryerCount >= 10 && (
            <StepSection label="Multi-unit discount">
              <button onClick={() => setMultiUnit(!multiUnit)} style={{ padding: '12px 16px', borderRadius: RADIUS.sm, border: `2px solid ${multiUnit ? primaryColor : COLORS.border}`, background: multiUnit ? `${primaryColor}10` : COLORS.surface, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: multiUnit ? primaryColor : COLORS.ink }}>
                Apply 15% bulk discount (10+ dryers)
              </button>
            </StepSection>
          )}
        </>
      ) : (
        <>
          <StepSection label="Vent length / run">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['short','Short (< 10 ft)'],['medium','Medium (10–25 ft)'],['long','Long (25–50 ft)'],['very_long','Very Long (50+ ft)']].map(([id,label]) => (
                <StepChip key={id} selected={ventLength === id} onClick={() => setVentLength(id)} primaryColor={primaryColor}>{label}</StepChip>
              ))}
            </div>
          </StepSection>
          <StepSection label="Vent routing type">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['standard','Standard (through wall)'],['roof','Through roof'],['underground','Underground'],['periscope','Periscope / tight space']].map(([id,label]) => (
                <StepChip key={id} selected={ventType === id} onClick={() => setVentType(id)} primaryColor={primaryColor}>{label}</StepChip>
              ))}
            </div>
          </StepSection>
        </>
      )}

      <StepSection label="Suspected clog?">
        <button onClick={() => setClogSuspected(!clogSuspected)} style={{ padding: '14px 20px', borderRadius: RADIUS.md, border: `2px solid ${clogSuspected ? COLORS.danger : COLORS.border}`, background: clogSuspected ? COLORS.dangerMuted : COLORS.surface, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: clogSuspected ? COLORS.danger : COLORS.ink }}>
            <span style={{ display: 'flex' }}>{clogSuspected ? <AlertTriangle size={17} color={COLORS.danger} /> : <Square size={17} color={COLORS.muted} />}</span>
            Yes — dryer takes more than one cycle or I smell burning
          </div>
          <div style={{ fontSize: 12, color: COLORS.body, marginTop: 6, paddingLeft: 30 }}>Confirmed clogs require additional clearing work (+$50–$100).</div>
        </button>
      </StepSection>
    </StepWrapper>
  );
}
