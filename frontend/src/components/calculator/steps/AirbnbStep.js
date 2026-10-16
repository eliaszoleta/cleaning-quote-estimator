import React, { useState } from 'react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard, StepPillToggle } from './StepUI';
import { COLORS } from '../../../styles/theme';

// ids must match AIRBNB_SIZE_PRICES' keys in backend/src/config/defaults.js exactly.
const SIZES = [
  { id: 'studio_1br', label: 'Studio / 1 Bedroom', sub: '< 800 sq ft' },
  { id: '2br', label: '2 Bedrooms', sub: '800–1,200 sq ft' },
  { id: '3br', label: '3 Bedrooms', sub: '1,200–1,800 sq ft' },
  { id: '4br_plus', label: '4+ Bedrooms', sub: '1,800+ sq ft' },
];

const TURNAROUND = [
  { id: 'standard', label: 'Standard Turnover', desc: 'Scheduled between guest stays' },
  { id: 'same_day_rush', label: 'Same-Day Rush', desc: 'Checkout and next check-in the same day' },
];

const FREQUENCY = [
  { id: 'one_time', label: 'One-Time' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// ids must match AIRBNB_ADDONS' keys exactly.
const EXTRAS = [
  { id: 'linens_laundry', label: 'Linens & Laundry' },
  { id: 'restocking_supplies', label: 'Restocking Supplies' },
  { id: 'deep_clean_turnover', label: 'Periodic Deep-Clean Turnover' },
];

export default function AirbnbStep({ value, onBack, onNext, primaryColor, companyConfig, isFinalStep, loading }) {
  // Only reflects a real, company-set discount (Services tab) -- off by
  // default, so a fresh account shows no "% off" tag on any frequency
  // until the company actually configures one.
  const frequencyDiscounts = companyConfig?.services?.airbnb?.frequencyDiscounts || {};
  const [size, setSize] = useState(value.size || '2br');
  const [bathrooms, setBathrooms] = useState(value.bathrooms || '1');
  const [turnaround, setTurnaround] = useState(value.turnaround || 'standard');
  const [frequency, setFrequency] = useState(value.frequency || 'one_time');
  const [extras, setExtras] = useState(value.extras || []);

  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  return (
    <StepWrapper title="Airbnb / vacation rental details" subtitle="Get a quote for turnover cleaning between guests" onBack={onBack} onNext={() => onNext({ size, bathrooms, turnaround, frequency, extras })} primaryColor={primaryColor} nextLabel={isFinalStep ? 'See Estimate' : undefined} loading={loading}>
      <StepSection label="Unit size">
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['1','1.5','2','2.5','3+'].map(n => <StepChip key={n} selected={bathrooms === n} onClick={() => setBathrooms(n)} primaryColor={primaryColor}>{n}</StepChip>)}
        </div>
      </StepSection>

      <StepSection label="Turnaround">
        <div className="calc-grid-2">
          {TURNAROUND.map(o => (
            <StepOptionCard key={o.id} selected={turnaround === o.id} onClick={() => setTurnaround(o.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{o.desc}</div>
            </StepOptionCard>
          ))}
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Same-day rush turnovers typically cost 30–40% more.</p>
      </StepSection>

      <StepSection label="How often do you need turnover cleaning?">
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
