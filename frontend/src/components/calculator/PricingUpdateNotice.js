import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { COLORS, RADIUS } from '../../styles/theme';

// Only ever shown on our own public-facing calculator pages (homepage,
// /cleaning-cost-calculator) -- never inside CleaningCalculator itself,
// since that same component also renders as a real third-party embed on a
// company's own site (EmbedWrapper.js) and inside the dashboard's internal
// "Run an Estimate" tool, neither of which should surface this kind of
// meta-commentary about cleanestimator.com's own data quality to someone
// else's customers or to a paying company's staff.
//
// Dismissible per-visitor (localStorage) AND hard-expires on its own after
// EXPIRES_AT, so a "we just refreshed our pricing" claim can't quietly go
// stale and sit there making the same announcement forever.
const STORAGE_KEY = 'cc-pricing-update-notice-dismissed-2026-10';
const EXPIRES_AT = new Date('2026-12-15T00:00:00Z').getTime();

export default function PricingUpdateNotice() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (Date.now() > EXPIRES_AT) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {}
    setDismissed(false);
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: COLORS.successMuted, border: `1px solid ${COLORS.successBorder}`,
        borderRadius: RADIUS.md, padding: '14px 16px', marginBottom: 18,
        maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
      }}
    >
      <CheckCircle2 size={17} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#14532d', marginBottom: 2 }}>
          Pricing data refreshed — October 2026
        </div>
        <p style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5, margin: 0 }}>
          Every rate below was cross-checked this month against current HomeAdvisor, Angi, Thumbtack, and BLS labor data, state by state — the same database every Clean Estimator subscriber's quotes run on.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: 2, flexShrink: 0, display: 'flex', opacity: 0.7 }}
        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = 0.7; }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
