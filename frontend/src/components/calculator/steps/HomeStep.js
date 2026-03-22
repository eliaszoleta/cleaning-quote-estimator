import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

const SQFT_OPTIONS = [
  { id: 'under_1000', label: 'Under 1,000 sq ft', sub: 'Small home / condo' },
  { id: '1000_1500', label: '1,000 – 1,500 sq ft', sub: 'Modest home' },
  { id: '1500_2000', label: '1,500 – 2,000 sq ft', sub: 'Average home' },
  { id: '2000_2500', label: '2,000 – 2,500 sq ft', sub: 'Larger home' },
  { id: '2500_3000', label: '2,500 – 3,000 sq ft', sub: 'Spacious home' },
  { id: '3000_4000', label: '3,000 – 4,000 sq ft', sub: 'Large home' },
  { id: '4000_plus', label: '4,000+ sq ft', sub: 'Estate / luxury home' },
];

const CLEANING_TYPES = [
  { id: 'standard', label: 'Standard Clean', desc: 'Dusting, vacuuming, mopping, bathrooms, kitchen' },
  { id: 'deep_clean', label: 'Deep Clean', desc: 'Everything in standard + inside appliances, baseboards, detailed scrubbing' },
  { id: 'move_in_out', label: 'Move-In / Move-Out', desc: 'Full top-to-bottom clean for vacant home' },
  { id: 'post_construction', label: 'Post-Construction', desc: 'Debris removal, dust, paint splatter cleanup' },
];

const FREQUENCY = [
  { id: 'one_time', label: 'One-Time' },
  { id: 'weekly', label: 'Weekly', discount: '20% off' },
  { id: 'biweekly', label: 'Bi-Weekly', discount: '15% off' },
  { id: 'monthly', label: 'Monthly', discount: '10% off' },
];

const EXTRAS = [
  { id: 'inside_fridge', label: 'Inside Fridge' },
  { id: 'inside_oven', label: 'Inside Oven' },
  { id: 'inside_cabinets', label: 'Inside Cabinets' },
  { id: 'laundry', label: 'Laundry (wash & fold)' },
  { id: 'windows_interior', label: 'Interior Windows' },
  { id: 'garage', label: 'Garage' },
  { id: 'patio', label: 'Patio / Deck' },
  { id: 'pet_hair', label: 'Pet Hair Removal' },
  { id: 'basement', label: 'Finished Basement' },
];

export default function HomeStep({ value, onBack, onNext, primaryColor }) {
  const [sqftTier, setSqftTier] = useState(value.sqftTier || '1500_2000');
  const [bedrooms, setBedrooms] = useState(value.bedrooms || '3');
  const [bathrooms, setBathrooms] = useState(value.bathrooms || '2');
  const [cleaningType, setCleaningType] = useState(value.cleaningType || 'standard');
  const [frequency, setFrequency] = useState(value.frequency || 'one_time');
  const [extras, setExtras] = useState(value.extras || []);
  const [condition, setCondition] = useState(value.condition || 'good');

  const toggleExtra = (id) => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const handleNext = () => onNext({ sqftTier, bedrooms, bathrooms, cleaningType, frequency, extras, condition });

  return (
    <StepWrapper
      title="Tell us about your home"
      subtitle="More details = more accurate estimate"
      onBack={onBack}
      onNext={handleNext}
      primaryColor={primaryColor}
    >
      {/* Home size */}
      <Section label="Home size">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SQFT_OPTIONS.map(o => (
            <OptionCard key={o.id} selected={sqftTier === o.id} onClick={() => setSqftTier(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{o.sub}</div>
            </OptionCard>
          ))}
        </div>
      </Section>

      {/* Bedrooms & bathrooms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section label="Bedrooms">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1','2','3','4','5','6+'].map(n => (
              <ChipBtn key={n} selected={bedrooms === n} onClick={() => setBedrooms(n)} primaryColor={primaryColor}>{n}</ChipBtn>
            ))}
          </div>
        </Section>
        <Section label="Bathrooms">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1','1.5','2','2.5','3','4+'].map(n => (
              <ChipBtn key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</ChipBtn>
            ))}
          </div>
        </Section>
      </div>

      {/* Cleaning type */}
      <Section label="Cleaning type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CLEANING_TYPES.map(o => (
            <OptionCard key={o.id} selected={cleaningType === o.id} onClick={() => setCleaningType(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{o.desc}</div>
            </OptionCard>
          ))}
        </div>
      </Section>

      {/* Frequency */}
      <Section label="How often?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCY.map(f => (
            <button
              key={f.id}
              onClick={() => setFrequency(f.id)}
              style={{
                padding: '10px 18px', borderRadius: 8, border: `2px solid ${frequency === f.id ? primaryColor : '#e2e8f0'}`,
                background: frequency === f.id ? primaryColor : 'white',
                color: frequency === f.id ? 'white' : '#374151',
                cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}
            >
              {f.label}
              {f.discount && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.85 }}>({f.discount})</span>}
            </button>
          ))}
        </div>
      </Section>

      {/* Home condition */}
      <Section label="Home condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['good','Good'],['fair','Fair'],['poor','Neglected']].map(([id,label]) => (
            <ChipBtn key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</ChipBtn>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          Neglected homes with heavy buildup may cost 25–50% more.
        </p>
      </Section>

      {/* Add-ons */}
      <Section label="Add-ons (optional)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXTRAS.map(ex => (
            <button
              key={ex.id}
              onClick={() => toggleExtra(ex.id)}
              style={{
                padding: '8px 14px', borderRadius: 20, border: `2px solid ${extras.includes(ex.id) ? primaryColor : '#e2e8f0'}`,
                background: extras.includes(ex.id) ? `${primaryColor}15` : 'white',
                color: extras.includes(ex.id) ? primaryColor : '#374151',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </Section>
    </StepWrapper>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, primaryColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`,
        background: selected ? `${primaryColor}10` : 'white',
        transition: 'all 0.15s', width: '100%',
      }}
    >
      {children}
    </button>
  );
}

function ChipBtn({ selected, onClick, primaryColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 8, border: `2px solid ${selected ? primaryColor : '#e2e8f0'}`,
        background: selected ? primaryColor : 'white', color: selected ? 'white' : '#374151',
        cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
