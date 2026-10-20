import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

// The one question the public homepage/landing pages' instant-results flow
// (CleaningCalculator.js's askUserType) still needs an answer to, now that
// skipLeadCapture has dropped the rest of the old LeadCaptureStep (name,
// email, phone) entirely -- this is that same "I am a…" selector from
// LeadCaptureStep.js, pulled out on its own so it can run without the
// fields around it. The answer decides whether ResultsScreen shows the
// Midpoint Price row: a homeowner shopping for a quote shouldn't see a
// single anchor number to negotiate a real cleaning company down to (see
// ResultsScreen.js's own comment), but a cleaning business owner evaluating
// this as a potential tool for themselves should see exactly what Calculator
// Mode gives a subscriber, midpoint included.
export default function UserTypeStep({ onBack, onNext, loading, primaryColor }) {
  const [userType, setUserType] = useState('');
  const [touched, setTouched] = useState(false);

  const canSubmit = !loading && (userType === 'homeowner' || userType === 'business');

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onNext(userType);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 5, letterSpacing: '-0.2px' }}>One quick question</h2>
      <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 22 }}>This just tailors what we show you next -- no contact info needed.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['homeowner', 'I’m a homeowner, getting a quote'], ['business', 'I own a cleaning business or work as a cleaner']].map(([id, label]) => (
          <button
            key={id} type="button" onClick={() => setUserType(id)}
            style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 10, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${userType === id ? primaryColor : touched && !canSubmit ? '#dc2626' : '#e2e8f0'}`,
              background: userType === id ? `${primaryColor}0d` : 'white',
              color: userType === id ? primaryColor : '#374151',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {touched && !userType && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>Please select one.</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
        <button
          type="button" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b' }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          type="button" onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 20px', borderRadius: 10, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, color: 'white', background: canSubmit ? primaryColor : '#cbd5e1', transition: 'all 0.15s' }}
        >
          {loading ? <><Loader2 size={15} className="spin" /> Calculating…</> : 'Get My Estimate →'}
        </button>
      </div>
    </div>
  );
}
