import React, { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import CleaningCalculator from '../../calculator/CleaningCalculator';
import { postEstimateShare } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { COLORS, SHADOWS } from '../../../styles/theme';

// Run the real calculator against this company's own pricing config and
// see the result on screen immediately -- no lead capture, no email sent
// to a stranger, nothing saved as a lead. The point is to stop handing a
// prospect a price range they can lowball against, and instead give the
// business's own staff a fast, accurate internal pricing tool. Reuses
// CleaningCalculator wholesale (the same component the public widget and
// Branding tab's live preview already use) via embedded+skipLeadCapture,
// rather than building a second calculator from scratch. Rendered full-page
// by Calculator Mode in CompanyDashboard.js -- no header, no surrounding
// copy, just the calculator card, mirroring how CalculatorPage.js presents
// it on the public site.
export default function RunEstimateTab({ config, user }) {
  // Viewport-based (not CleaningCalculator's own card-width isMobile) --
  // this banner lives outside the calculator card, above it, so it needs
  // its own mobile check at the same 768px cutoff OverviewTab.js and the
  // rest of the dashboard already use.
  const mobileQuery = () => window.matchMedia('(max-width: 768px)');
  const [isMobile, setIsMobile] = useState(() => mobileQuery().matches);
  useEffect(() => {
    const mq = mobileQuery();
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // On mobile only, the teaser banner disappears the instant a service is
  // picked (per the user) -- on desktop it stays put regardless of step.
  const [onServiceStep, setOnServiceStep] = useState(true);
  const showTeaser = !isMobile || onServiceStep;
  // companyId has to be set on the companyConfig object handed to
  // CleaningCalculator -- POST /api/calculate only applies this company's
  // real markup/minimum-charge settings when a companyId is present (it
  // re-fetches the saved config server-side by that id); without it, the
  // backend computes with an empty, un-customized config.
  //
  // services/serviceStates/serviceCities are dropped on purpose -- those are
  // Widget Mode's public-facing restrictions (which services the embedded
  // widget shows, which states/cities it's scoped to), purely a client-side
  // display filter the backend never enforces. Calculator Mode is an
  // internal tool for pricing ANY job, so it always offers every service
  // and all 50 states regardless of what Widget Mode is configured to show
  // visitors.
  const companyConfig = {
    ...(config || {}),
    companyId: user?.id || null,
    services: undefined,
    serviceStates: [],
    serviceCities: {},
  };

  const handleShareEmail = async ({ to, clientName, serviceType, zip, state, serviceDetails }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in');
    await postEstimateShare(token, { to, clientName, serviceType, zip, state, serviceDetails });
  };

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 'clamp(24px, 5vw, 64px) clamp(6px, 2.5vw, 16px)' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        {/* Same "Coming Soon" teaser as the Overview tab (see OverviewTab.js
            for the one it mirrors), capped to the calculator card's own
            width here (not stretched full-width, per the user) rather than
            matching Widget Mode's wider layout. On mobile only: a tightened
            (smaller font/padding) version, and it disappears the instant a
            service is picked -- CleaningCalculator reports that via
            onStepChange below. Desktop keeps the original size and stays
            visible regardless of step. */}
        {showTeaser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #ddd6fe', borderRadius: 7, padding: isMobile ? '8px 10px' : '16px 20px', marginBottom: isMobile ? 12 : 16, flexWrap: 'wrap' }}>
            <div style={{ width: isMobile ? 26 : 38, height: isMobile ? 26 : 38, borderRadius: 7, background: 'white', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: SHADOWS.sm }}>
              <Receipt size={isMobile ? 13 : 18} strokeWidth={2.1} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, marginBottom: isMobile ? 1 : 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: isMobile ? 11.5 : 13.5, fontWeight: 700, color: COLORS.ink }}>Invoicing &amp; Stripe Payments</span>
                <span style={{ fontSize: isMobile ? 8.5 : 10, fontWeight: 700, color: '#7c3aed', background: 'white', border: '1px solid #ddd6fe', borderRadius: 20, padding: isMobile ? '1px 6px' : '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>Coming Soon</span>
              </div>
              <p style={{ fontSize: isMobile ? 10.5 : 12.5, color: COLORS.body, margin: 0, lineHeight: isMobile ? 1.3 : 1.5 }}>
                Turn an estimate into a real invoice, send it to your client, and get paid straight to your own bank account via your own connected Stripe account — or just download a PDF copy if you'd rather send it and collect payment yourself.
              </p>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <CleaningCalculator
            companyConfig={companyConfig}
            embedded={true}
            cardRadius={10}
            skipLeadCapture={true}
            instantResults={true}
            onShareEmail={handleShareEmail}
            onStepChange={step => setOnServiceStep(step === 'service')}
          />
        </div>
      </div>
    </div>
  );
}
