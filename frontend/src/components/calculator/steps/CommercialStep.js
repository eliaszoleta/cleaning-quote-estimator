import React, { useState } from 'react';
import StepWrapper from './StepWrapper';

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

      <Section label="Building type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {BUILDING_TYPES.map(t => (
            <button key={t.id} onClick={() => setBuildingType(t.id)} style={{ padding: '10px 14px', textAlign: 'left', borderRadius: 8, border: `2px solid ${buildingType === t.id ? primaryColor : '#e2e8f0'}`, background: buildingType === t.id ? `${primaryColor}10` : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: buildingType === t.id ? primaryColor : '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section label={`Square footage: ${sqft.toLocaleString()}`}>
          <input type="range" min={500} max={50000} step={500} value={sqft} onChange={e => setSqft(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            <span>500 sq ft</span><span>50,000 sq ft</span>
          </div>
        </Section>
        <Section label={`Restrooms: ${restrooms}`}>
          <input type="range" min={1} max={20} step={1} value={restrooms} onChange={e => setRestrooms(+e.target.value)}
            style={{ width: '100%', accentColor: primaryColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            <span>1</span><span>20</span>
          </div>
        </Section>
      </div>

      <Section label="Cleaning frequency">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FREQUENCIES.map(f => (
            <button key={f.id} onClick={() => setFrequency(f.id)} style={{ padding: '10px 18px', borderRadius: 8, border: `2px solid ${frequency === f.id ? primaryColor : '#e2e8f0'}`, background: frequency === f.id ? primaryColor : 'white', color: frequency === f.id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Service level">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SERVICE_LEVELS.map(l => (
            <button key={l.id} onClick={() => setServiceLevel(l.id)} style={{ padding: '12px 10px', textAlign: 'left', borderRadius: 10, border: `2px solid ${serviceLevel === l.id ? primaryColor : '#e2e8f0'}`, background: serviceLevel === l.id ? `${primaryColor}10` : 'white', cursor: 'pointer', width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: serviceLevel === l.id ? primaryColor : '#0f172a' }}>{l.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section label="Options">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'dayPorter', val: dayPorter, set: setDayPorter, label: 'Day Porter Service', hint: 'On-site porter during business hours' },
            { key: 'afterHours', val: afterHours, set: setAfterHours, label: 'After-Hours Cleaning', hint: '+15% for after-hours access' },
          ].map(({ key, val, set, label, hint }) => (
            <button key={key} onClick={() => set(!val)} style={{ padding: '12px 16px', borderRadius: 10, border: `2px solid ${val ? primaryColor : '#e2e8f0'}`, background: val ? `${primaryColor}10` : 'white', cursor: 'pointer', textAlign: 'left', minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: val ? primaryColor : '#374151' }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${val ? primaryColor : '#94a3b8'}`, background: val ? primaryColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white' }}>{val ? '✓' : ''}</span>
                {label}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, paddingLeft: 26 }}>{hint}</div>
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
