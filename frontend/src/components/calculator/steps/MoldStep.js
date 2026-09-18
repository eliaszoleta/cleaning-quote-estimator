import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

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

      <div style={{ background: COLORS.dangerMuted, border: `1px solid ${COLORS.dangerBorder}`, borderRadius: RADIUS.sm, padding: '12px 16px', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={14} /> Important:</span>
        <span style={{ color: '#7f1d1d', fontSize: 14, marginLeft: 6 }}>Mold remediation always requires an in-person inspection by a licensed contractor. These estimates are very rough ballparks only.</span>
      </div>

      <StepSection label="Estimated affected area">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            ['small','Small','< 10 sq ft (e.g. corner of shower)'],
            ['medium','Medium','10–100 sq ft (e.g. bathroom wall)'],
            ['large','Large','100–300 sq ft (e.g. basement)'],
            ['extensive','Extensive','300+ sq ft (major contamination)'],
          ].map(([id,label,desc]) => (
            <StepOptionCard key={id} selected={affectedSize === id} onClick={() => setAffectedSize(id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14, color: affectedSize === id ? primaryColor : COLORS.ink }}>{label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Location(s) affected (select all that apply)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LOCATIONS.map(l => (
            <StepPillToggle key={l.id} selected={locations.includes(l.id)} onClick={() => toggleLocation(l.id)} primaryColor={primaryColor}>{l.label}</StepPillToggle>
          ))}
        </div>
      </StepSection>

      <StepSection label="Mold type (if known)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['not_sure','Not Sure'],['black_mold','Black Mold (Stachybotrys)'],['white_mold','White Mold'],['green_mold','Green / Common Mold']].map(([id,label]) => (
            <StepChip key={id} selected={moldType === id} onClick={() => setMoldType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Has the moisture source been fixed?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['yes','Yes — leak/source is fixed'],['not_fixed','No — still leaking'],['not_sure','Not sure']].map(([id,label]) => (
            <StepChip key={id} selected={sourceFixed === id} onClick={() => setSourceFixed(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
        {sourceFixed === 'not_fixed' && <p style={{ fontSize: 12, color: COLORS.danger, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> The moisture source MUST be fixed before remediation — otherwise mold will return within weeks.</p>}
      </StepSection>

      <StepSection label="Property type">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['residential','Residential'],['commercial','Commercial (+30–50%)']].map(([id,label]) => (
            <StepChip key={id} selected={propertyType === id} onClick={() => setPropertyType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Additional services">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['air_testing','Air Quality Testing (+$220–$290)'],['clearance_test','Post-Remediation Clearance Test (+$190–$250)']].map(([id,label]) => (
            <StepPillToggle key={id} selected={extras.includes(id)} onClick={() => toggleExtra(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
