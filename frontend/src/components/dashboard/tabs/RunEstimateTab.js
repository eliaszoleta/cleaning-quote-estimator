import React from 'react';
import { Zap } from 'lucide-react';
import CleaningCalculator from '../../calculator/CleaningCalculator';
import { postEstimateShare } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

// Run the real calculator against this company's own pricing config and
// see the result on screen immediately -- no lead capture, no email sent
// to a stranger, nothing saved as a lead. The point is to stop handing a
// prospect a price range they can lowball against, and instead give the
// business's own staff a fast, accurate internal pricing tool. Reuses
// CleaningCalculator wholesale (the same component the public widget and
// Branding tab's live preview already use) via embedded+skipLeadCapture,
// rather than building a second calculator from scratch.
export default function RunEstimateTab({ config, user }) {
  // companyId has to be set on the companyConfig object handed to
  // CleaningCalculator -- POST /api/calculate only applies this company's
  // real markup/minimum-charge settings when a companyId is present (it
  // re-fetches the saved config server-side by that id); without it, the
  // backend computes with an empty, un-customized config.
  const companyConfig = { ...(config || {}), companyId: user?.id || null };

  const handleShareEmail = async ({ to, serviceType, zip, state, serviceDetails }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in');
    await postEstimateShare(token, { to, serviceType, zip, state, serviceDetails });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Zap size={20} color="#2563eb" />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>Run an Estimate</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
          Run unlimited price estimates for your own quoting — using your real pricing, markup, and service settings. Nothing here is shown to a customer or saved as a lead; the result is yours alone, and you can email it to a coworker when you're done.
        </p>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <CleaningCalculator
          companyConfig={companyConfig}
          embedded={true}
          skipLeadCapture={true}
          onShareEmail={handleShareEmail}
        />
      </div>
    </div>
  );
}
