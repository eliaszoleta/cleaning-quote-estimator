import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

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
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const EXTRAS = [
  { id: 'inside_fridge', label: 'Inside Fridge' },
  { id: 'inside_oven', label: 'Inside Oven' },
  { id: 'inside_cabinets', label: 'Inside Cabinets' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'windows_interior', label: 'Interior Windows' },
  { id: 'balcony', label: 'Balcony / Patio' },
];

export default function ApartmentStep({ value, onBack, onNext, primaryColor, companyConfig }) {
  // Only reflects a real, company-set discount (Discount tab) -- off by
  // default, so a fresh account shows no "% off" tag on any frequency
  // until the company actually configures one.
  const frequencyDiscounts = companyConfig?.services?.apartment?.frequencyDiscounts || {};
  const [size, setSize] = useState(value.size || '2br');
  const [bathrooms, setBathrooms] = useState(value.bathrooms || '1');
  const [cleaningType, setCleaningType] = useState(value.cleaningType || 'standard');
  const [frequency, setFrequency] = useState(value.frequency || 'one_time');
  const [furnished, setFurnished] = useState(value.furnished !== false);
  const [extras, setExtras] = useState(value.extras || []);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Apartment details" subtitle="Get an accurate quote for your unit" onBack={onBack} onNext={() => onNext({ size, bathrooms, cleaningType, frequency, furnished, extras })} primaryColor={primaryColor}>
      <StepSection label="Apartment size">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SIZES.map(o => (
            <StepOptionCard key={o.id} selected={size === o.id} onClick={() => setSize(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body }}>{o.sub}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Bathrooms">
        <div style={{ display: 'flex', gap: 8 }}>
          {['1','1.5','2','2.5','3+'].map(n => <StepChip key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</StepChip>)}
        </div>
      </StepSection>

      <StepSection label="Cleaning type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CLEANING_TYPES.map(t => <StepChip key={t.id} selected={cleaningType === t.id} onClick={() => setCleaningType(t.id)} primaryColor={primaryColor}>{t.label}</StepChip>)}
        </div>
      </StepSection>

      <StepSection label="Frequency">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCY.map(f => {
            const discountPct = Math.round((frequencyDiscounts[f.id] || 0) * 100);
            return (
              <StepChip key={f.id} selected={frequency === f.id} onClick={() => setFrequency(f.id)} primaryColor={primaryColor}>
                {f.label}{discountPct > 0 && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.85 }}>({discountPct}% off)</span>}
              </StepChip>
            );
          })}
        </div>
      </StepSection>

      <StepSection label="Is the apartment furnished?">
        <div style={{ display: 'flex', gap: 8 }}>
          <StepChip selected={furnished} onClick={() => setFurnished(true)} primaryColor={primaryColor}>Yes, furnished</StepChip>
          <StepChip selected={!furnished} onClick={() => setFurnished(false)} primaryColor={primaryColor}>No, vacant</StepChip>
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Vacant apartments typically cost 10–15% less.</p>
      </StepSection>

      <StepSection label="Add-ons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXTRAS.map(ex => (
            <StepPillToggle key={ex.id} selected={extras.includes(ex.id)} onClick={() => toggleExtra(ex.id)} primaryColor={primaryColor}>{ex.label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
