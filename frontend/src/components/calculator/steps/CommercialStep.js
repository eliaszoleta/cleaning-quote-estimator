import React, { useState } from 'react';
import { Check } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepOptionCard } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

const BUILDING_TYPES = [
  { id: 'office', label: 'Office / Professional' },
  { id: 'retail', label: 'Retail / Showroom' },
  { id: 'medical', label: 'Medical / Dental' },
  { id: 'restaurant', label: 'Restaurant / Kitchen' },
  { id: 'warehouse', label: 'Warehouse / Industrial' },
  { id: 'school', label: 'School / Daycare' },
  { id: 'gym', label: 'Gym / Fitness' },
  { id: 'church', label: 'Church / Event Space' },
];

const FREQUENCIES = [
  { id: 'daily', label: 'Daily (5×/wk)' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const SERVICE_LEVELS = [
  { id: 'basic', label: 'Basic', desc: 'Trash, vacuuming, restrooms' },
  { id: 'standard', label: 'Standard', desc: '+ surfaces, mopping, breakroom' },
  { id: 'premium', label: 'Premium', desc: '+ detailed, windows, floors' },
];

export default function CommercialStep({ value, onBack, onNext, primaryColor }) {
  const [buildingType, setBuildingType] = useState(value.buildingType || 'office');
  const [sqft, setSqft] = useState(value.sqft || 2000);
  const [restrooms, setRestrooms] = useState(value.restrooms || 2);
  const [frequency, setFrequency] = useState(value.frequency || 'weekly');
  const [serviceLevel, setServiceLevel] = useState(value.serviceLevel || 'standard');
  const [dayPorter, setDayPorter] = useState(value.dayPorter || false);
  const [afterHours, setAfterHours] = useState(value.afterHours || false);

  return (
    <StepWrapper title="Commercial property details" subtitle="Prices quoted per month" onBack={onBack} onNext={() => onNext({ buildingType, sqft, restrooms, frequency, serviceLevel, dayPorter, afterHours })} primaryColor={primaryColor}>

      <StepSection label="Building type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {BUILDING_TYPES.map(t => (
            <StepOptionCard key={t.id} selected={buildingType === t.id} onClick={() => setBuildingType(t.id)} primaryColor={primaryColor}>
              <span style={{ fontWeight: 600, fontSize: 14, color: buildingType === t.id ? primaryColor : COLORS.ink }}>{t.label}</span>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <StepSection label={`Square footage: ${sqft.toLocaleString()}`}>
          <input type="range" min={500} max={50000} step={500} value={sqft} onChange={e => setSqft(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            <span>500 sq ft</span><span>50,000 sq ft</span>
          </div>
        </StepSection>
        <StepSection label={`Restrooms: ${restrooms}`}>
          <input type="range" min={1} max={20} step={1} value={restrooms} onChange={e => setRestrooms(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            <span>1</span><span>20</span>
          </div>
        </StepSection>
      </div>

      <StepSection label="Cleaning frequency">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCIES.map(f => (
            <StepChip key={f.id} selected={frequency === f.id} onClick={() => setFrequency(f.id)} primaryColor={primaryColor}>{f.label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Service level">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SERVICE_LEVELS.map(l => (
            <StepOptionCard key={l.id} selected={serviceLevel === l.id} onClick={() => setServiceLevel(l.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14, color: serviceLevel === l.id ? primaryColor : COLORS.ink }}>{l.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{l.desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Options">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { key: 'dayPorter', val: dayPorter, set: setDayPorter, label: 'Day Porter Service', hint: 'On-site porter during business hours' },
            { key: 'afterHours', val: afterHours, set: setAfterHours, label: 'After-Hours Cleaning', hint: '+15% for after-hours access' },
          ].map(({ key, val, set, label, hint }) => (
            <button key={key} onClick={() => set(!val)} style={{ padding: '12px 16px', borderRadius: RADIUS.md, border: `2px solid ${val ? primaryColor : COLORS.border}`, background: val ? `${primaryColor}10` : COLORS.surface, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: val ? primaryColor : COLORS.ink }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${val ? primaryColor : COLORS.muted}`, background: val ? primaryColor : COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{val ? <Check size={11} color="white" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" /> : null}</span>
                {label}
              </div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4, paddingLeft: 26 }}>{hint}</div>
            </button>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
