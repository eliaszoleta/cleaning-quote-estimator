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

// ids must match CLEANING_TYPE_MULTIPLIERS' keys in backend/src/config/defaults.js
// exactly -- this used to say 'deep_clean' here while the backend only ever had
// a 'deep' key, so every Deep Clean quote silently fell through to the Standard
// multiplier (1.0x instead of the correct 1.68-1.85x).
const CLEANING_TYPES = [
  { id: 'standard', label: 'Standard Clean' },
  { id: 'deep', label: 'Deep Clean' },
  { id: 'move_in_out', label: 'Move-In / Move-Out' },
];

const FREQUENCY = [
  { id: 'one_time', label: 'One-Time' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// ids must match HOME_EXTRAS' keys exactly (calculateApartment reuses the
// same table as House Cleaning) -- 'windows_interior' and 'balcony' used to
// not match the backend's 'interior_windows'/'balcony_patio' keys at all, so
// those two add-ons silently cost $0 when selected.
const EXTRAS = [
  { id: 'inside_fridge', label: 'Inside Fridge' },
  { id: 'inside_oven', label: 'Inside Oven' },
  { id: 'inside_cabinets', label: 'Inside Cabinets' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'interior_windows', label: 'Interior Windows' },
  { id: 'balcony_patio', label: 'Balcony / Patio' },
];

export default function ApartmentStep({ value, onBack, onNext, primaryColor, companyConfig, country, isFinalStep, loading }) {
  // Only reflects a real, company-set discount (Services tab) -- off by
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
    <StepWrapper title={country === 'GB' ? 'Flat details' : country === 'AU' ? 'Unit details' : 'Apartment details'} subtitle="Get an accurate quote for your unit" onBack={onBack} onNext={() => onNext({ size, bathrooms, cleaningType, frequency, furnished, extras })} primaryColor={primaryColor} nextLabel={isFinalStep ? 'See Estimate' : undefined} loading={loading}>
      <StepSection label={country === 'GB' ? 'Flat size' : country === 'AU' ? 'Unit size' : 'Apartment size'}>
        <div className="calc-grid-size">
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
