import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

// ids must match HOME_SQFT_BASE_PRICES' keys in backend/src/config/defaults.js
// exactly -- post-construction reuses the same sqft price table as House
// Cleaning, just with its own multiplier layered on top.
const SQFT_OPTIONS = [
  { id: 'under_1000', label: 'Under 1,000 sq ft', sub: 'Small home / condo' },
  { id: '1000_1500', label: '1,000 – 1,500 sq ft', sub: 'Modest home' },
  { id: '1500_2000', label: '1,500 – 2,000 sq ft', sub: 'Average home' },
  { id: '2000_2500', label: '2,000 – 2,500 sq ft', sub: 'Larger home' },
  { id: '2500_3000', label: '2,500 – 3,000 sq ft', sub: 'Spacious home' },
  { id: 'over_3000', label: 'Over 3,000 sq ft', sub: 'Large home / estate' },
];

// ids must match POST_CONSTRUCTION_TYPE_MULTIPLIERS' keys exactly.
const CONSTRUCTION_TYPES = [
  { id: 'light', label: 'Light Renovation / Touch-Up', desc: 'Painting, flooring, a single room or two' },
  { id: 'moderate', label: 'Moderate Renovation', desc: 'Multiple rooms, a kitchen or bath remodel' },
  { id: 'full', label: 'New Construction / Major Renovation', desc: 'Whole-home build or gut renovation' },
];

// ids must match POST_CONSTRUCTION_ADDONS' keys exactly.
const EXTRAS = [
  { id: 'window_cleaning', label: 'Window Cleaning' },
  { id: 'debris_haulaway', label: 'Debris Haul-Away' },
  { id: 'vent_dust_removal', label: 'Vent / Duct Dust Removal' },
];

export default function PostConstructionStep({ value, onBack, onNext, primaryColor, isFinalStep, loading }) {
  const [sqftTier, setSqftTier] = useState(value.sqftTier || '1500_2000');
  const [constructionType, setConstructionType] = useState(value.constructionType || 'light');
  const [extras, setExtras] = useState(value.extras || []);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Post-construction cleanup details" subtitle="Get a quote for cleanup after renovation or new construction" onBack={onBack} onNext={() => onNext({ sqftTier, constructionType, extras })} primaryColor={primaryColor} nextLabel={isFinalStep ? 'See Estimate' : undefined} loading={loading}>
      <StepSection label="Home / unit size">
        <div className="calc-grid-size">
          {SQFT_OPTIONS.map(o => (
            <StepOptionCard key={o.id} selected={sqftTier === o.id} onClick={() => setSqftTier(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body }}>{o.sub}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Scope of work">
        <div className="calc-grid-3">
          {CONSTRUCTION_TYPES.map(o => (
            <StepOptionCard key={o.id} selected={constructionType === o.id} onClick={() => setConstructionType(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{o.desc}</div>
            </StepOptionCard>
          ))}
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Moderate renovations typically cost 8–18% more than a light touch-up; new construction or a major renovation runs 15–30% more.</p>
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
