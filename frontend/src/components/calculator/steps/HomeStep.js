import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

// ids must match HOME_SQFT_BASE_PRICES' keys exactly -- this used to split the
// top end into '3000_4000' and '4000_plus', neither of which existed in the
// backend's price table (only 'over_3000'), so both silently fell back to the
// 1,500-2,000 sq ft tier -- the two largest, most expensive homes quoted like
// an average-size one. Collapsed into the one tier the backend actually prices.
const SQFT_OPTIONS = [
  { id: 'under_1000', label: 'Under 1,000 sq ft', sub: 'Small home / condo' },
  { id: '1000_1500', label: '1,000 – 1,500 sq ft', sub: 'Modest home' },
  { id: '1500_2000', label: '1,500 – 2,000 sq ft', sub: 'Average home' },
  { id: '2000_2500', label: '2,000 – 2,500 sq ft', sub: 'Larger home' },
  { id: '2500_3000', label: '2,500 – 3,000 sq ft', sub: 'Spacious home' },
  { id: 'over_3000', label: 'Over 3,000 sq ft', sub: 'Large home / estate' },
];

// ids must match CLEANING_TYPE_MULTIPLIERS' keys in backend/src/config/defaults.js
// exactly -- this used to say 'deep_clean' here while the backend only ever had
// a 'deep' key, so every Deep Clean quote silently fell through to the Standard
// multiplier (1.0x instead of the correct 1.68-1.85x).
const CLEANING_TYPES = [
  { id: 'standard', label: 'Standard Clean', desc: 'Dusting, vacuuming, mopping, bathrooms, kitchen' },
  { id: 'deep', label: 'Deep Clean', desc: 'Everything in standard + inside appliances, baseboards, detailed scrubbing' },
  { id: 'move_in_out', label: 'Move-In / Move-Out', desc: 'Full top-to-bottom clean for vacant home' },
  { id: 'post_construction', label: 'Post-Construction', desc: 'Debris removal, dust, paint splatter cleanup' },
];

const FREQUENCY = [
  { id: 'one_time', label: 'One-Time' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// ids must match HOME_EXTRAS' keys in backend/src/config/defaults.js exactly --
// 'windows_interior' and 'patio' used to not match the backend's
// 'interior_windows'/'balcony_patio' keys at all, so those two add-ons
// silently cost $0 when selected (the addon loop just skips an unknown key
// rather than erroring). 'inside_cabinets' and 'pet_hair' had no backend
// price at all until now -- added to HOME_EXTRAS alongside this fix.
const EXTRAS = [
  { id: 'inside_fridge', label: 'Inside Fridge' },
  { id: 'inside_oven', label: 'Inside Oven' },
  { id: 'inside_cabinets', label: 'Inside Cabinets' },
  { id: 'laundry', label: 'Laundry (wash & fold)' },
  { id: 'interior_windows', label: 'Interior Windows' },
  { id: 'garage', label: 'Garage' },
  { id: 'balcony_patio', label: 'Patio / Deck' },
  { id: 'pet_hair', label: 'Pet Hair Removal' },
  { id: 'basement', label: 'Finished Basement' },
];

export default function HomeStep({ value, onBack, onNext, primaryColor, companyConfig, isFinalStep, loading }) {
  // Only reflects a real, company-set discount (Services tab) -- off by
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
      nextLabel={isFinalStep ? 'See Estimate' : undefined}
      loading={loading}
    >
      {/* Home size */}
      <StepSection label="Home size">
        <div className="calc-grid-size">
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
            {/* '5' and '6+' used to be separate chips, but BEDROOM_ADDON only
                has a '5+' key -- both silently added $0 instead of $75.
                Collapsed into the one tier the backend prices. */}
            {['1','2','3','4','5+'].map(n => (
              <StepChip key={n} selected={bedrooms === n} onClick={() => setBedrooms(n)} primaryColor={primaryColor}>{n}</StepChip>
            ))}
          </div>
        </StepSection>
        <StepSection label="Bathrooms">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Top tier was '4+' here but BATHROOM_ADDON's key is '3+' --
                silently added $0 instead of $90. Matches ApartmentStep.js's
                (correct) top tier; plain '3' is still its own, separately
                priced option. */}
            {['1','1.5','2','2.5','3','3+'].map(n => (
              <StepChip key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</StepChip>
            ))}
          </div>
        </StepSection>
      </div>

      {/* Cleaning type */}
      <StepSection label="Cleaning type">
        <div className="calc-grid-2">
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
          {/* 'Neglected' used to send id 'poor', but CONDITION_MULTIPLIERS'
              top key is 'needs_attention' -- silently applied a 1.0x (no
              increase) multiplier instead of the correct 1.22-1.28x, despite
              the line below promising 25-50% more. */}
          {[['good','Good'],['fair','Fair'],['needs_attention','Neglected']].map(([id,label]) => (
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
