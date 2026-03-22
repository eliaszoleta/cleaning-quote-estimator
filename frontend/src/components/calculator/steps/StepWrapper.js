import React from 'react';

export default function StepWrapper({ title, subtitle, onBack, onNext, primaryColor, nextLabel = 'Continue →', canNext = true, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{subtitle}</p>}
      <div style={{ marginBottom: 8 }}>{children}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          style={{ padding: '14px 24px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#64748b' }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          style={{
            flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none',
            cursor: canNext ? 'pointer' : 'not-allowed',
            fontSize: 15, fontWeight: 700, color: 'white',
            background: canNext ? primaryColor : '#94a3b8',
            transition: 'all 0.15s',
          }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
