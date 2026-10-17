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

// ids must match COMMERCIAL_JOB_TYPE_LABELS' keys in
// backend/src/config/optionLabels.js exactly.
const JOB_TYPES = [
  { id: 'recurring', label: 'Recurring Service', desc: 'An ongoing janitorial contract, billed monthly' },
  { id: 'one_time', label: 'One-Time Deep Clean', desc: 'A single job -- move-out, post-eviction, or a long-vacant space' },
];

// ids must match COMMERCIAL_ONE_TIME_CONDITION_MULTIPLIERS' keys exactly.
const ONE_TIME_CONDITIONS = [
  { id: 'light', label: 'Occupied', desc: 'In regular use, just needs a thorough deep clean' },
  { id: 'moderate', label: 'Vacant, Lightly Neglected', desc: 'Empty under ~1 year, some buildup' },
  { id: 'severe', label: 'Vacant, Heavily Neglected', desc: 'Empty 1+ years, heavy grease/buildup, restoration-level' },
];

// three_per_week and twice_weekly fill the gap that used to exist between
// Weekly and Daily -- previously the only step up from once a week was all
// the way to 5x/week, with nothing in between for spaces (like gyms) that
// need more than weekly but not daily attention.
const FREQUENCIES = [
  { id: 'daily', label: 'Daily (5×/wk)' },
  { id: 'three_per_week', label: '3× a Week' },
  { id: 'twice_weekly', label: 'Twice a Week' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const SERVICE_LEVELS = [
  { id: 'basic', label: 'Basic', desc: 'Trash, vacuuming, restrooms' },
  { id: 'standard', label: 'Standard', desc: '+ surfaces, mopping, breakroom' },
  { id: 'premium', label: 'Premium', desc: '+ detailed, windows, floors' },
];

export default function CommercialStep({ value, onBack, onNext, primaryColor, companyConfig, isFinalStep, loading }) {
  // Only reflects a real, company-set discount (Services tab) -- off by
  // default, same as HomeStep.js/ApartmentStep.js's own frequencyDiscounts.
  const frequencyDiscounts = companyConfig?.services?.commercial?.frequencyDiscounts || {};
  const [jobType, setJobType] = useState(value.jobType || 'recurring');
  const [buildingType, setBuildingType] = useState(value.buildingType || 'office');
  const [sqft, setSqft] = useState(value.sqft || 2000);
  const [restrooms, setRestrooms] = useState(value.restrooms || 2);
  const [frequency, setFrequency] = useState(value.frequency || 'weekly');
  const [serviceLevel, setServiceLevel] = useState(value.serviceLevel || 'standard');
  const [condition, setCondition] = useState(value.condition || 'moderate');
  const [dayPorter, setDayPorter] = useState(value.dayPorter || false);
  const [afterHours, setAfterHours] = useState(value.afterHours || false);
  const isRecurring = jobType === 'recurring';

  return (
    <StepWrapper title="Commercial property details" subtitle={isRecurring ? 'Prices quoted per month' : 'A single job price, not a monthly rate'} onBack={onBack} onNext={() => onNext({ jobType, buildingType, sqft, restrooms, frequency, serviceLevel, condition, dayPorter, afterHours })} primaryColor={primaryColor} nextLabel={isFinalStep ? 'See Estimate' : undefined} loading={loading}>

      <StepSection label="Job type">
        <div className="calc-grid-2">
          {JOB_TYPES.map(t => (
            <StepOptionCard key={t.id} selected={jobType === t.id} onClick={() => setJobType(t.id)} primaryColor={primaryColor}>
              <div style={{ fontWeight: 700, fontSize: 14, color: jobType === t.id ? primaryColor : COLORS.ink }}>{t.label}</div>
              <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{t.desc}</div>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <StepSection label="Building type">
        <div className="calc-grid-size">
          {BUILDING_TYPES.map(t => (
            <StepOptionCard key={t.id} selected={buildingType === t.id} onClick={() => setBuildingType(t.id)} primaryColor={primaryColor}>
              <span style={{ fontWeight: 600, fontSize: 14, color: buildingType === t.id ? primaryColor : COLORS.ink }}>{t.label}</span>
            </StepOptionCard>
          ))}
        </div>
      </StepSection>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <StepSection label={`Square footage: ${sqft.toLocaleString()}`}>
          {/* A drag slider spanning 500-50,000 physically can't land on
              every value even at step={1} -- that's 49,500 positions
              squeezed into a few hundred pixels, so the thumb still jumps
              in rough increments no matter how fine the step is. Paired
              with a typeable exact value instead (same pattern CarpetStep.js
              already uses for its own sqft field) -- commercial customers
              usually know their exact square footage from a lease or floor
              plan, and at this service's $/sq ft rate times daily visits, a
              slider-forced ±250 sq ft rounding was enough to swing a
              monthly recurring quote by real money. */}
          <input type="range" min={500} max={50000} step={100} value={sqft} onChange={e => setSqft(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4, marginBottom: 10 }}>
            <span>500 sq ft</span><span>50,000 sq ft</span>
          </div>
          <input type="number" min={500} max={50000} value={sqft} onChange={e => setSqft(Math.max(0, +e.target.value))}
            placeholder="Exact sq ft"
            style={{ width: '100%', padding: '10px 14px', border: `2px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 15, outline: 'none' }} />
        </StepSection>
        <StepSection label={`Restrooms: ${restrooms}`}>
          <input type="range" min={1} max={20} step={1} value={restrooms} onChange={e => setRestrooms(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            <span>1</span><span>20</span>
          </div>
        </StepSection>
      </div>

      {isRecurring ? (
        <>
          <StepSection label="Cleaning frequency">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FREQUENCIES.map(f => {
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

          <StepSection label="Service level">
            <div className="calc-grid-2">
              {SERVICE_LEVELS.map(l => (
                <StepOptionCard key={l.id} selected={serviceLevel === l.id} onClick={() => setServiceLevel(l.id)} primaryColor={primaryColor}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: serviceLevel === l.id ? primaryColor : COLORS.ink }}>{l.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{l.desc}</div>
                </StepOptionCard>
              ))}
            </div>
          </StepSection>
        </>
      ) : (
        <StepSection label="Condition of the space">
          <div className="calc-grid-3">
            {ONE_TIME_CONDITIONS.map(c => (
              <StepOptionCard key={c.id} selected={condition === c.id} onClick={() => setCondition(c.id)} primaryColor={primaryColor}>
                <div style={{ fontWeight: 700, fontSize: 14, color: condition === c.id ? primaryColor : COLORS.ink }}>{c.label}</div>
                <div style={{ fontSize: 12, color: COLORS.body, marginTop: 4 }}>{c.desc}</div>
              </StepOptionCard>
            ))}
          </div>
        </StepSection>
      )}

      {isRecurring && <StepSection label="Options">
        <div className="calc-grid-2">
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
      </StepSection>}
    </StepWrapper>
  );
}
