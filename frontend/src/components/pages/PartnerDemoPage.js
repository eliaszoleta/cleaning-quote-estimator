import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Eye } from 'lucide-react';
import CleaningCalculator from '../calculator/CleaningCalculator';
import { PartnerBannerCard } from '../partners/FloatingPartnerBanner';

const PRIMARY = '#2563eb';

// Sample data only -- shown to prospects on this page regardless of their
// own location, so a business anywhere can open this link and see exactly
// how their own listing will look once they're an active partner in their
// city. Never touches Supabase or the real partner-matching logic.
const SAMPLE_PARTNER = {
  id: 'demo',
  business_name: 'Sparkle Clean Co.',
  address: '123 Main St, Austin, TX',
  phone: '(555) 123-4567',
  website: 'https://example.com',
  logo_url: null,
};

// Shared by a partner-recruitment sales pitch: a link to send prospects so
// they can see the floating banner and the results-page "Recommended
// Cleaner" card live, with sample data, instead of taking our word for it
// in a screenshot. Not meant to be found via search -- noindex'd below.
export default function PartnerDemoPage() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const t = setTimeout(() => setBannerVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>See Your Listing in Action | Clean Estimator</title>
        <meta name="description" content="A live demo of exactly how your business will appear on Clean Estimator -- the floating banner and the results-page recommendation card, both shown with sample data." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px, 6vw, 56px) 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: PRIMARY, fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginBottom: 14 }}>
            <Eye size={13} /> Live Demo
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4.5vw, 36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>
            See Exactly How Your Listing Will Look
          </h1>
          <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.65, maxWidth: 560, margin: '0 auto' }}>
            This page is live, not a mockup — using a sample business ("Sparkle Clean Co.") so you can see your own future placement without needing to already be a partner in your city. There are two real placements to look for, one right away and one after you try the calculator below.
          </p>
        </div>

        {bannerVisible && !bannerDismissed && createPortal(
          <PartnerBannerCard
            partner={SAMPLE_PARTNER}
            isMobile={isMobile}
            onDismiss={() => setBannerDismissed(true)}
            onCallClick={() => {}}
          />,
          document.body
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 28, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0f172a' }}>1. The floating banner — look now.</strong> It should already be showing in the bottom-right corner. That's what follows a visitor across every page in your city once you're live, not just this one.
        </div>

        <div style={{ background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: 14, padding: '16px 20px', marginBottom: 16, fontSize: 13.5, color: '#1e40af', lineHeight: 1.6 }}>
          <strong>2. The results-page card — try it below.</strong> This second placement only appears after a visitor completes an estimate, so run one through the calculator (any service works) to see it appear with your price.
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <CleaningCalculator embedded siteLanding demoPartner={SAMPLE_PARTNER} />
        </div>

        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <a
            href="/partner-with-us#apply"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: PRIMARY, color: 'white', padding: '13px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 8px 22px rgba(37,99,235,0.3)' }}
          >
            Get This for Your City <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </>
  );
}
