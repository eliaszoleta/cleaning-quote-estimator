import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

export default function TileGroutStep({ value, onBack, onNext, primaryColor }) {
  const [sqft, setSqft] = useState(value.sqft || 200);
  const [tileType, setTileType] = useState(value.tileType || 'ceramic');
  const [condition, setCondition] = useState(value.condition || 'moderate');
  const [services, setServices] = useState(value.services || ['deep_clean']);
  const [soapScum, setSoapScum] = useState(value.soapScum || false);
  const [hardWater, setHardWater] = useState(value.hardWater || false);
  const [caulkLinearFt, setCaulkLinearFt] = useState(value.caulkLinearFt || 0);

  const toggleService = id => setServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <StepWrapper title="Tile & grout cleaning details" onBack={onBack} onNext={() => onNext({ sqft, tileType, condition, services, soapScum, hardWater, caulkLinearFt })} primaryColor={primaryColor}>

      <StepSection label={`Area to clean: ${sqft} sq ft`}>
        <input type="range" min={50} max={2000} step={25} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>50 sq ft</span><span>2,000 sq ft</span></div>
        <p style={{ fontSize: 12, color: COLORS.body, marginTop: 6 }}>Average bathroom: ~50–80 sq ft. Average kitchen: ~150–300 sq ft.</p>
      </StepSection>

      <StepSection label="Tile material">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['ceramic','Ceramic'],['porcelain','Porcelain'],['natural_stone','Natural Stone'],['travertine','Travertine'],['slate','Slate']].map(([id,label]) => (
            <StepChip key={id} selected={tileType === id} onClick={() => setTileType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
        {(tileType === 'natural_stone' || tileType === 'travertine') && (
          <p style={{ fontSize: 12, color: COLORS.warning, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> Natural stone requires specialized cleaning products — costs 30–40% more than ceramic.</p>
        )}
      </StepSection>

      <StepSection label="Current condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['light','Lightly soiled'],['moderate','Moderately dirty'],['heavy','Heavy buildup'],['neglected','Years of neglect']].map(([id,label]) => (
            <StepChip key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Services needed (select all that apply)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['deep_clean','Deep Clean & Scrub'],['grout_sealing','Grout Sealing'],['grout_recoloring','Grout Recoloring'],['caulk_replacement','Caulk Replacement']].map(([id,label]) => (
            <StepPillToggle key={id} selected={services.includes(id)} onClick={() => toggleService(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>

      {services.includes('caulk_replacement') && (
        <StepSection label={`Linear feet of caulk to replace: ${caulkLinearFt} ft`}>
          <input type="range" min={0} max={100} step={5} value={caulkLinearFt} onChange={e => setCaulkLinearFt(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}><span>0 ft</span><span>100 ft</span></div>
        </StepSection>
      )}

      <StepSection label="Special issues">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'soapScum', val: soapScum, set: setSoapScum, label: 'Heavy soap scum' },
            { key: 'hardWater', val: hardWater, set: setHardWater, label: 'Hard water deposits' },
          ].map(({ key, val, set, label }) => (
            <StepPillToggle key={key} selected={val} onClick={() => set(!val)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
