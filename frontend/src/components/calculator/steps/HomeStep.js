import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

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
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
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

export default function HomeStep({ value, onBack, onNext, primaryColor, companyConfig }) {
  // Only reflects a real, company-set discount (Discount tab) -- off by
  // default, so a fresh account shows no "% off" tag on any frequency
  // until the company actually configures one.
  const frequencyDiscounts = companyConfig?.services?.homeResidential?.frequencyDiscounts || {};
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
      <StepSection label="Home size">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SQFT_OPTIONS.map(o => (
            <StepOptionCard key={o.id} selected={sqftTier === o.id} onClick={() => setSqftTier(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body }}>{o.sub}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      {/* Bedrooms & bathrooms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <StepSection label="Bedrooms">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1','2','3','4','5','6+'].map(n => (
              <StepChip key={n} selected={bedrooms === n} onClick={() => setBedrooms(n)} primaryColor={primaryColor}>{n}</StepChip>
            ))}
          </div>
        </StepSection>
        <StepSection label="Bathrooms">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1','1.5','2','2.5','3','4+'].map(n => (
              <StepChip key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</StepChip>
            ))}
          </div>
        </StepSection>
      </div>

      {/* Cleaning type */}
      <StepSection label="Cleaning type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CLEANING_TYPES.map(o => (
            <StepOptionCard key={o.id} selected={cleaningType === o.id} onClick={() => setCleaningType(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{o.desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      {/* Frequency */}
      <StepSection label="How often?">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCY.map(f => {
            const discountPct = Math.round((frequencyDiscounts[f.id] || 0) * 100);
            return (
              <StepChip key={f.id} selected={frequency === f.id} onClick={() => setFrequency(f.id)} primaryColor={primaryColor}>
                {f.label}
                {discountPct > 0 && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.85 }}>({discountPct}% off)</span>}
              </StepChip>
            );
          })}
        </div>
      </StepSection>

      {/* Home condition */}
      <StepSection label="Home condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['good','Good'],['fair','Fair'],['poor','Neglected']].map(([id,label]) => (
            <StepChip key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
          Neglected homes with heavy buildup may cost 25–50% more.
        </p>
      </StepSection>

      {/* Add-ons */}
      <StepSection label="Add-ons (optional)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXTRAS.map(ex => (
            <StepPillToggle key={ex.id} selected={extras.includes(ex.id)} onClick={() => toggleExtra(ex.id)} primaryColor={primaryColor}>{ex.label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
