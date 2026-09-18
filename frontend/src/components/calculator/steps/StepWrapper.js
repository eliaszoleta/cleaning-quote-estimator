import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { COLORS, RADIUS } from '../../../styles/theme';

export default function StepWrapper({ title, subtitle, onBack, onNext, primaryColor, nextLabel = 'Continue', canNext = true, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 4, letterSpacing: '-0.2px' }}>{title}</h2>
      {subtitle && <p style={{ color: COLORS.body, fontSize: 13.5, marginBottom: 22 }}>{subtitle}</p>}
      <div style={{ marginBottom: 8 }}>{children}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.borderSubtle}` }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '13px 20px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md,
            background: COLORS.surface, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: COLORS.body,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = COLORS.ink; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.body; }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          style={{
            flex: 1, padding: '13px 20px', borderRadius: RADIUS.md, border: 'none',
            cursor: canNext ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 700, color: 'white',
            background: canNext ? primaryColor : '#cbd5e1',
            transition: 'all 0.15s',
            letterSpacing: '0.01em',
          }}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}
