import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { COLORS, RADIUS } from '../../../styles/theme';

// `loading` mirrors the pattern LeadCaptureStep.js already uses on its own
// submit button -- when this step's onNext directly triggers the
// calculation (no lead-capture step in between), the button needs the same
// "Calculating…" spinner state instead of looking like it did nothing while
// the request is in flight.
export default function StepWrapper({ title, subtitle, onBack, onNext, primaryColor, nextLabel = 'Continue', canNext = true, loading = false, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 4, letterSpacing: '-0.2px' }}>{title}</h2>
      {subtitle && <p style={{ color: COLORS.body, fontSize: 13.5, marginBottom: 22 }}>{subtitle}</p>}
      <div style={{ marginBottom: 8 }}>{children}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.borderSubtle}` }}>
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '13px 20px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md,
            background: COLORS.surface, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: COLORS.body,
            transition: 'all 0.15s', opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = COLORS.ink; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.body; }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext || loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '13px 20px', borderRadius: RADIUS.md, border: 'none',
            cursor: (canNext && !loading) ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 700, color: 'white',
            background: (canNext && !loading) ? primaryColor : '#cbd5e1',
            transition: 'all 0.15s',
            letterSpacing: '0.01em',
          }}
        >
          {loading ? <><Loader2 size={15} className="spin" /> Calculating…</> : <>{nextLabel} →</>}
        </button>
      </div>
    </div>
  );
}
