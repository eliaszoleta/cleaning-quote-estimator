import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import StepWrapper from './StepWrapper';

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

      <Section label={`Area to clean: ${sqft} sq ft`}>
        <input type="range" min={50} max={2000} step={25} value={sqft} onChange={e => setSqft(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>50 sq ft</span><span>2,000 sq ft</span></div>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Average bathroom: ~50–80 sq ft. Average kitchen: ~150–300 sq ft.</p>
      </Section>

      <Section label="Tile material">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['ceramic','Ceramic'],['porcelain','Porcelain'],['natural_stone','Natural Stone'],['travertine','Travertine'],['slate','Slate']].map(([id,label]) => (
            <Chip key={id} selected={tileType === id} onClick={() => setTileType(id)} primaryColor={primaryColor}>{label}</Chip>
          ))}
        </div>
        {(tileType === 'natural_stone' || tileType === 'travertine') && (
          <p style={{ fontSize: 12, color: '#d97706', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> Natural stone requires specialized cleaning products — costs 30–40% more than ceramic.</p>
        )}
      </Section>

      <Section label="Current condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['light','Lightly soiled'],['moderate','Moderately dirty'],['heavy','Heavy buildup'],['neglected','Years of neglect']].map(([id,label]) => (
            <Chip key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</Chip>
          ))}
        </div>
      </Section>

      <Section label="Services needed (select all that apply)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['deep_clean','Deep Clean & Scrub'],['grout_sealing','Grout Sealing'],['grout_recoloring','Grout Recoloring'],['caulk_replacement','Caulk Replacement']].map(([id,label]) => (
            <button key={id} onClick={() => toggleService(id)} style={{ padding: '9px 16px', borderRadius: 20, border: `2px solid ${services.includes(id) ? primaryColor : '#e2e8f0'}`, background: services.includes(id) ? `${primaryColor}15` : 'white', color: services.includes(id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      {services.includes('caulk_replacement') && (
        <Section label={`Linear feet of caulk to replace: ${caulkLinearFt} ft`}>
          <input type="range" min={0} max={100} step={5} value={caulkLinearFt} onChange={e => setCaulkLinearFt(+e.target.value)} style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}><span>0 ft</span><span>100 ft</span></div>
        </Section>
      )}

      <Section label="Special issues">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'soapScum', val: soapScum, set: setSoapScum, label: 'Heavy soap scum' },
            { key: 'hardWater', val: hardWater, set: setHardWater, label: 'Hard water deposits' },
          ].map(({ key, val, set, label }) => (
            <button key={key} onClick={() => set(!val)} style={{ padding: '9px 16px', borderRadius: 20, border: `2px solid ${val ? primaryColor : '#e2e8f0'}`, background: val ? `${primaryColor}15` : 'white', color: val ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
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
function Chip({ selected, onClick, primaryColor, children }) {
  return <button onClick={onClick} style={{ padding: '9px 18px', borderRadius: 8, border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`, background: selected ? primaryColor : 'white', color: selected ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{children}</button>;
}
