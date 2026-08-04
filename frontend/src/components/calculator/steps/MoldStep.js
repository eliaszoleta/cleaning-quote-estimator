import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import StepWrapper from './StepWrapper';

const LOCATIONS = [
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'basement', label: 'Basement' },
  { id: 'attic', label: 'Attic' },
  { id: 'crawl_space', label: 'Crawl Space' },
  { id: 'hvac_ductwork', label: 'HVAC / Ductwork' },
  { id: 'walls', label: 'Walls / Drywall' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'garage', label: 'Garage' },
];

export default function MoldStep({ value, onBack, onNext, primaryColor }) {
  const [affectedSize, setAffectedSize] = useState(value.affectedSize || 'medium');
  const [locations, setLocations] = useState(value.locations || ['bathroom']);
  const [moldType, setMoldType] = useState(value.moldType || 'not_sure');
  const [sourceFixed, setSourceFixed] = useState(value.sourceFixed || 'not_sure');
  const [testingNeeded, setTestingNeeded] = useState(value.testingNeeded || false);
  const [propertyType, setPropertyType] = useState(value.propertyType || 'residential');
  const [extras, setExtras] = useState(value.extras || []);

  const toggleLocation = id => setLocations(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Mold remediation details" subtitle="These are preliminary estimates — a professional inspection is required" onBack={onBack} onNext={() => onNext({ affectedSize, locations, moldType, sourceFixed, testingNeeded, propertyType, extras })} primaryColor={primaryColor}>

      <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={14} /> Important:</span>
        <span style={{ color: '#7f1d1d', fontSize: 14, marginLeft: 6 }}>Mold remediation always requires an in-person inspection by a licensed contractor. These estimates are very rough ballparks only.</span>
      </div>

      <Section label="Estimated affected area">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            ['small','Small','< 10 sq ft (e.g. corner of shower)'],
            ['medium','Medium','10–100 sq ft (e.g. bathroom wall)'],
            ['large','Large','100–300 sq ft (e.g. basement)'],
            ['extensive','Extensive','300+ sq ft (major contamination)'],
          ].map(([id,label,desc]) => (
            <button key={id} onClick={() => setAffectedSize(id)} style={{ padding: '12px 14px', textAlign: 'left', borderRadius: 10, border: `2px solid ${affectedSize === id ? '#dc2626' : '#e2e8f0'}`, background: affectedSize === id ? '#fff1f2' : 'white', cursor: 'pointer', width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: affectedSize === id ? '#dc2626' : '#0f172a' }}>{label}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section label="Location(s) affected (select all that apply)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LOCATIONS.map(l => (
            <button key={l.id} onClick={() => toggleLocation(l.id)} style={{ padding: '9px 16px', borderRadius: 20, border: `2px solid ${locations.includes(l.id) ? '#dc2626' : '#e2e8f0'}`, background: locations.includes(l.id) ? '#fff1f2' : 'white', color: locations.includes(l.id) ? '#dc2626' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Mold type (if known)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['not_sure','Not Sure'],['black_mold','Black Mold (Stachybotrys)'],['white_mold','White Mold'],['green_mold','Green / Common Mold']].map(([id,label]) => (
            <Chip key={id} selected={moldType === id} onClick={() => setMoldType(id)} primaryColor='#dc2626' selectedBg='#fff1f2' selectedColor='#dc2626'>{label}</Chip>
          ))}
        </div>
      </Section>

      <Section label="Has the moisture source been fixed?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['yes','Yes — leak/source is fixed'],['not_fixed','No — still leaking'],['not_sure','Not sure']].map(([id,label]) => (
            <Chip key={id} selected={sourceFixed === id} onClick={() => setSourceFixed(id)} primaryColor={primaryColor} selectedBg={`${primaryColor}10`} selectedColor={primaryColor}>{label}</Chip>
          ))}
        </div>
        {sourceFixed === 'not_fixed' && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> The moisture source MUST be fixed before remediation — otherwise mold will return within weeks.</p>}
      </Section>

      <Section label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial (+30–50%)']].map(([id,label]) => (
            <Chip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor} selectedBg={`${primaryColor}10`} selectedColor={primaryColor}>{label}</Chip>
          ))}
        </div>
      </Section>

      <Section label="Additional services">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['air_testing','Air Quality Testing (+$200–$320)'],['clearance_test','Post-Remediation Clearance Test (+$180–$280)']].map(([id,label]) => (
            <button key={id} onClick={() => toggleExtra(id)} style={{ padding: '9px 16px', borderRadius: 20, border: `2px solid ${extras.includes(id) ? primaryColor : '#e2e8f0'}`, background: extras.includes(id) ? `${primaryColor}15` : 'white', color: extras.includes(id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
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
function Chip({ selected, onClick, primaryColor, selectedBg, selectedColor, children }) {
  return <button onClick={onClick} style={{ padding: '9px 18px', borderRadius: 8, border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`, background: selected ? selectedBg : 'white', color: selected ? selectedColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{children}</button>;
}
