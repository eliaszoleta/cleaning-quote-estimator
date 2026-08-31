import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, X, MapPin } from 'lucide-react';
import { getCachedPartnerMatch } from '../../utils/partnerLookup';

const DISMISS_KEY = 'cleanestimator_partner_banner_dismissed';

// Sitewide floating card for the exclusive local partner in the visitor's
// city (same match Supabase `partners` lookup ResultsScreen's inline
// PartnerCard uses). Renders nothing until the match resolves client-side,
// so it never appears in prerendered/static HTML or a crawler's first
// paint -- no effect on indexed content or layout shift (position: fixed,
// shown only after a short delay, and small enough to stay clear of
// Google's intrusive-interstitial mobile-ranking guidance).
export default function FloatingPartnerBanner() {
  const [partner, setPartner] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* ignore */ }

    // TEMP-PREVIEW-ONLY -- forced fake data (555 = reserved fictional phone
    // prefix, no real number) so the banner is visible on the live deploy
    // for review. Revert to getCachedPartnerMatch() before this ships.
    Promise.resolve({ business_name: 'Immaculate Restoration', city: 'Las Vegas', state: 'NV', phone: '(702) 555-0148', logo_url: 'https://immaculaterestoration.com/wp-content/uploads/immaculate-restoration-logo.webp' }).then(match => {
      if (cancelled || !match) return;
      setPartner(match);
      setTimeout(() => { if (!cancelled) setVisible(true); }, 1500);
    });

    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  if (!partner || !visible) return null;

  // Portal to document.body -- Header's backdropFilter creates a new CSS
  // containing block for any position:fixed descendant, which would anchor
  // this to the header's own (small) box instead of the real viewport.
  return createPortal(
    <div
      role="complementary"
      aria-label={`Recommended local cleaner: ${partner.business_name}`}
      style={{
        position: 'fixed',
        top: isMobile ? 'auto' : 80,
        bottom: isMobile ? 12 : 'auto',
        right: isMobile ? 10 : 16,
        zIndex: 90,
        width: isMobile ? 190 : 268,
        maxWidth: 'calc(100vw - 20px)',
        background: 'white',
        border: `1.5px solid #2563eb`,
        borderRadius: isMobile ? 12 : 14,
        boxShadow: '0 10px 34px rgba(15,23,42,0.16)',
        padding: isMobile ? '10px 12px' : '14px 16px',
        animation: `partnerBannerIn 0.25s ease-out`,
      }}
    >
      <style>{`@keyframes partnerBannerIn { from { opacity: 0; transform: translateY(${isMobile ? 8 : -8}px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ position: 'absolute', top: isMobile ? 5 : 8, right: isMobile ? 5 : 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', display: 'flex' }}
      >
        <X size={isMobile ? 12 : 14} />
      </button>

      <div style={{ fontSize: isMobile ? 8.5 : 10.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: isMobile ? 5 : 8, paddingRight: 16 }}>
        Local Cleaner Near You
      </div>

      {partner.logo_url && (
        <img
          src={partner.logo_url}
          alt={partner.business_name}
          style={{ maxWidth: '100%', maxHeight: isMobile ? 26 : 44, objectFit: 'contain', display: 'block', margin: isMobile ? '0 auto 6px' : '0 auto 10px' }}
        />
      )}

      <div style={{ marginBottom: isMobile ? 8 : 12, textAlign: partner.logo_url ? 'center' : 'left' }}>
        <div style={{ fontWeight: 800, fontSize: isMobile ? 11.5 : 14.5, color: '#0f172a', lineHeight: 1.25 }}>
          {partner.business_name}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: partner.logo_url ? 'center' : 'flex-start', gap: 4, fontSize: 12, color: '#64748b', marginTop: 2 }}>
            <MapPin size={11} color="#94a3b8" /> {partner.city}, {partner.state}
          </div>
        )}
      </div>

      {partner.phone && (
        <a
          href={`tel:${partner.phone}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#16a34a', color: 'white', padding: isMobile ? '7px 10px' : '9px 14px', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? 11 : 13 }}
        >
          <Phone size={isMobile ? 11 : 13} /> {isMobile ? 'Call Now' : `Call ${partner.phone}`}
        </a>
      )}
    </div>,
    document.body
  );
}
