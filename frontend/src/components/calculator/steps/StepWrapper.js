import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function StepWrapper({ title, subtitle, onBack, onNext, primaryColor, nextLabel = 'Continue', canNext = true, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.2px' }}>{title}</h2>
      {subtitle && <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 22 }}>{subtitle}</p>}
      <div style={{ marginBottom: 8 }}>{children}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '13px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10,
            background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          style={{
            flex: 1, padding: '13px 20px', borderRadius: 10, border: 'none',
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
