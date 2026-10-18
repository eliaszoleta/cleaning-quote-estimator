import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { COLORS, RADIUS } from '../../styles/theme';

// Shown on our own public-facing calculator pages (homepage,
// /cleaning-cost-calculator) and in the dashboard's internal "Run an
// Estimate" tool (our own paying subscribers' staff -- see the
// skipLeadCapture-gated render in CleaningCalculator.js) -- but never on a
// real third-party embed of CleaningCalculator (EmbedWrapper.js) or
// BrandingTab.js's live preview of one, since this message is meta-
// commentary about cleanestimator.com's own data quality that would be
// confusing or off-brand shown to someone else's customers.
//
// country defaults 'US' so the public calculator pages (no company config,
// no country in scope at all) keep showing this exactly as before -- the
// gate below only matters for the dashboard's Calculator Mode, where a
// CA/GB/AU company would otherwise see a claim that's specifically about
// US data (HomeAdvisor/Angi/Thumbtack/BLS, "state by state") as if it
// applied to their own country's pricing too.
const STORAGE_KEY = 'cc-pricing-update-notice-dismissed-2026-10';
const EXPIRES_AT = new Date('2026-12-15T00:00:00Z').getTime();

export default function PricingUpdateNotice({ country = 'US', onVisibleChange }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (Date.now() > EXPIRES_AT) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {}
    setDismissed(false);
  }, []);

  const visible = country === 'US' && !dismissed;

  // Lets a caller that wraps this in its own spacing (CalculatorPage.js,
  // EstimatorPage.js -- both put it in a `padding: 16px 16px 0` div to
  // give it breathing room off the card's rounded top corner) collapse
  // that wrapper to 0 padding instead of leaving a dead ~16px gap between
  // the card's top edge and whatever comes next (the step header) when
  // this component has nothing to show -- already dismissed in a past
  // session (the common case once this notice has been up a while), past
  // its EXPIRES_AT, or a non-US company. Fires on mount with the real
  // answer (not just whenever it happens to render true) and again the
  // instant the visitor clicks dismiss, so the wrapper collapses live
  // rather than only on the next page load.
  useEffect(() => {
    onVisibleChange?.(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onVisibleChange is a setState function from the caller; including it would only matter if its identity changed across renders, which would itself be a bug in the caller
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  return (
    <div className="pricing-update-notice" role="status">
      {/* Media query (not a JS isMobile check) so this stays correct at any
          resize without needing the width observer CleaningCalculator.js uses
          for its own layout -- this component has no such plumbing today. */}
      <style>{`
        .pricing-update-notice {
          display: flex; align-items: flex-start; gap: 12px;
          background: ${COLORS.successMuted}; border: 1px solid ${COLORS.successBorder};
          border-radius: ${RADIUS.md}px; padding: 14px 16px; margin-bottom: 18px;
          max-width: 720px; margin-left: auto; margin-right: auto;
        }
        .pricing-update-notice .punc-title { font-weight: 700; font-size: 13.5px; color: #14532d; margin-bottom: 2px; }
        .pricing-update-notice .punc-body { font-size: 12.5px; color: #166534; line-height: 1.5; margin: 0; }
        @media (max-width: 640px) {
          .pricing-update-notice { gap: 7px; padding: 8px 8px; margin-bottom: 12px; }
          .pricing-update-notice .punc-icon { width: 14px; height: 14px; }
          .pricing-update-notice .punc-title { font-size: 11.5px; margin-bottom: 1px; }
          .pricing-update-notice .punc-body { font-size: 10.5px; line-height: 1.35; }
          .pricing-update-notice .punc-dismiss { padding: 0; }
        }
      `}</style>
      <CheckCircle2 size={17} color={COLORS.success} className="punc-icon" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="punc-title">Pricing data refreshed — October 2026</div>
        <p className="punc-body">
          Every rate below was cross-checked this month against current HomeAdvisor, Angi, Thumbtack, and BLS labor data, state by state — the same database every Clean Estimator subscriber's quotes run on.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="punc-dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: 2, flexShrink: 0, display: 'flex', opacity: 0.7 }}
        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = 0.7; }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
