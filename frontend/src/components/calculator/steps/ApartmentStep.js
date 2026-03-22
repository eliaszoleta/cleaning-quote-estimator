import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

const SIZES = [
  { id: 'studio', label: 'Studio', sub: '< 500 sq ft' },
  { id: '1br', label: '1 Bedroom', sub: '500–800 sq ft' },
  { id: '2br', label: '2 Bedrooms', sub: '800–1,200 sq ft' },
  { id: '3br', label: '3 Bedrooms', sub: '1,200–1,600 sq ft' },
  { id: '4br_plus', label: '4+ Bedrooms', sub: '1,600+ sq ft' },
];

const CLEANING_TYPES = [
  { id: 'standard', label: 'Standard Clean' },
  { id: 'deep_clean', label: 'Deep Clean' },
  { id: 'move_in_out', label: 'Move-In / Move-Out' },
];

const FREQUENCY = [
  { id: 'one_time', label: 'One-Time' },
  { id: 'weekly', label: 'Weekly', discount: '15% off' },
  { id: 'biweekly', label: 'Bi-Weekly', discount: '10% off' },
  { id: 'monthly', label: 'Monthly', discount: '5% off' },
];

const EXTRAS = [
  { id: 'inside_fridge', label: 'Inside Fridge' },
  { id: 'inside_oven', label: 'Inside Oven' },
  { id: 'inside_cabinets', label: 'Inside Cabinets' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'windows_interior', label: 'Interior Windows' },
  { id: 'balcony', label: 'Balcony / Patio' },
];

export default function ApartmentStep({ value, onBack, onNext, primaryColor }) {
  const [size, setSize] = useState(value.size || '2br');
  const [bathrooms, setBathrooms] = useState(value.bathrooms || '1');
  const [cleaningType, setCleaningType] = useState(value.cleaningType || 'standard');
  const [frequency, setFrequency] = useState(value.frequency || 'one_time');
  const [furnished, setFurnished] = useState(value.furnished !== false);
  const [extras, setExtras] = useState(value.extras || []);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Apartment details" subtitle="Get an accurate quote for your unit" onBack={onBack} onNext={() => onNext({ size, bathrooms, cleaningType, frequency, furnished, extras })} primaryColor={primaryColor}>
      <Section label="Apartment size">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SIZES.map(o => (
            <Opt key={o.id} selected={size === o.id} onClick={() => setSize(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{o.sub}</div>
            </Opt>
          ))}
        </div>
      </Section>

      <Section label="Bathrooms">
        <div style={{ display: 'flex', gap: 8 }}>
          {['1','1.5','2','2.5','3+'].map(n => <Chip key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</Chip>)}
        </div>
      </Section>

      <Section label="Cleaning type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CLEANING_TYPES.map(t => <Chip key={t.id} selected={cleaningType === t.id} onClick={() => setCleaningType(t.id)} primaryColor={primaryColor}>{t.label}</Chip>)}
        </div>
      </Section>

      <Section label="Frequency">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCY.map(f => (
            <button key={f.id} onClick={() => setFrequency(f.id)} style={{ padding: '10px 18px', borderRadius: 8, border: `2px solid ${frequency === f.id ? primaryColor : '#e2e8f0'}`, background: frequency === f.id ? primaryColor : 'white', color: frequency === f.id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {f.label}{f.discount && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.85 }}>({f.discount})</span>}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Is the apartment furnished?">
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip selected={furnished} onClick={() => setFurnished(true)} primaryColor={primaryColor}>Yes, furnished</Chip>
          <Chip selected={!furnished} onClick={() => setFurnished(false)} primaryColor={primaryColor}>No, vacant</Chip>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Vacant apartments typically cost 10–15% less.</p>
      </Section>

      <Section label="Add-ons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXTRAS.map(ex => (
            <button key={ex.id} onClick={() => toggleExtra(ex.id)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${extras.includes(ex.id) ? primaryColor : '#e2e8f0'}`, background: extras.includes(ex.id) ? `${primaryColor}15` : 'white', color: extras.includes(ex.id) ? primaryColor : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {extras.includes(ex.id) ? '✓ ' : ''}{ex.label}
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
function Opt({ selected, onClick, primaryColor, children }) {
  return <button onClick={onClick} style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`, background: selected ? `${primaryColor}10` : 'white', width: '100%' }}>{children}</button>;
}
function Chip({ selected, onClick, primaryColor, children }) {
  return <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`, background: selected ? primaryColor : 'white', color: selected ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{children}</button>;
}
