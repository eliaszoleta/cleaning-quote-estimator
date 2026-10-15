import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { StepSection, StepChip, StepPillToggle } from './StepUI';
import { COLORS, RADIUS } from '../../../styles/theme';

const ITEMS = [
  ['sofa', 'Sofa', '3-seat couch'],
  ['loveseat', 'Loveseat', '2-seat couch'],
  ['chair', 'Chair / Recliner', 'Single armchair or recliner'],
  ['sectional', 'Sectional', 'L-shaped or multi-piece'],
  ['ottoman', 'Ottoman', ''],
];

export default function UpholsteryStep({ value, onBack, onNext, primaryColor, isFinalStep, loading }) {
  const [items, setItems] = useState(value.items || { sofa: 1, loveseat: 0, chair: 0, sectional: 0, ottoman: 0 });
  const [fabricType, setFabricType] = useState(value.fabricType || 'fabric');
  const [condition, setCondition] = useState(value.condition || 'moderate');
  const [extras, setExtras] = useState(value.extras || []);

  const setQty = (id, delta) => setItems(prev => ({ ...prev, [id]: Math.max(0, Math.min(10, (prev[id] || 0) + delta)) }));
  const toggleExtra = id => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const totalItems = Object.values(items).reduce((s, n) => s + (n || 0), 0);

  return (
    <StepWrapper
      title="Upholstery cleaning details"
      onBack={onBack}
      onNext={() => onNext({ items, fabricType, condition, extras })}
      primaryColor={primaryColor}
      canNext={totalItems > 0}
      nextLabel={isFinalStep ? 'See Estimate' : undefined}
      loading={loading}
    >
      <StepSection label="What needs cleaning?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ITEMS.map(([id, label, desc]) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.sm, background: items[id] > 0 ? `${primaryColor}0d` : COLORS.surface }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{label}</div>
                {desc && <div style={{ fontSize: 11.5, color: COLORS.muted }}>{desc}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setQty(id, -1)}
                  disabled={!items[id]}
                  aria-label={`Fewer ${label}`}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${COLORS.border}`, background: COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: items[id] ? 'pointer' : 'not-allowed', opacity: items[id] ? 1 : 0.4, color: COLORS.body }}
                >
                  <Minus size={13} />
                </button>
                <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700, fontSize: 15, color: COLORS.ink }}>{items[id] || 0}</span>
                <button
                  type="button"
                  onClick={() => setQty(id, 1)}
                  aria-label={`More ${label}`}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {totalItems === 0 && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>Add at least one item to continue.</p>}
      </StepSection>

      <StepSection label="Fabric type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['fabric', 'Fabric'], ['leather', 'Leather']].map(([id, label]) => (
            <StepChip key={id} selected={fabricType === id} onClick={() => setFabricType(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['light', 'Light soiling'], ['moderate', 'Moderate soiling'], ['heavy', 'Heavily soiled'], ['pet', 'Pet stains/odors']].map(([id, label]) => (
            <StepChip key={id} selected={condition === id} onClick={() => setCondition(id)} primaryColor={primaryColor}>{label}</StepChip>
          ))}
        </div>
      </StepSection>

      <StepSection label="Add-ons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['fabric_protector', 'Fabric Protector'], ['deodorizer', 'Deodorizer']].map(([id, label]) => (
            <StepPillToggle key={id} selected={extras.includes(id)} onClick={() => toggleExtra(id)} primaryColor={primaryColor}>{label}</StepPillToggle>
          ))}
        </div>
      </StepSection>
    </StepWrapper>
  );
}
