import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* ignore */ }

    // TEMP-PREVIEW-ONLY -- forced fake data (555 = reserved fictional phone
    // prefix, no real number; logo is a placeholder text banner, not the
    // real client logo) so the banner is visible on the live deploy for
    // review. Revert to getCachedPartnerMatch() before this ships.
    const placeholderLogo = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="70"><rect width="400" height="70" fill="none"/><text x="200" y="40" font-family="Arial, sans-serif" font-weight="800" font-size="30" fill="#2563eb" text-anchor="middle">IMMACULATE</text><text x="200" y="60" font-family="Arial, sans-serif" font-weight="500" font-size="13" letter-spacing="4" fill="#94a3b8" text-anchor="middle">RESTORATION</text></svg>'
    );
    Promise.resolve({ business_name: 'Immaculate Restoration', city: 'Las Vegas', state: 'NV', phone: '(702) 555-0148', logo_url: placeholderLogo }).then(match => {
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

  return (
    <div
      role="complementary"
      aria-label={`Recommended local cleaner: ${partner.business_name}`}
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 90,
        width: 268,
        maxWidth: 'calc(100vw - 32px)',
        background: 'white',
        border: '1.5px solid #2563eb',
        borderRadius: 14,
        boxShadow: '0 10px 34px rgba(15,23,42,0.16)',
        padding: '14px 16px',
        animation: 'partnerBannerIn 0.25s ease-out',
      }}
    >
      <style>{`@keyframes partnerBannerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', display: 'flex' }}
      >
        <X size={14} />
      </button>

      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingRight: 18 }}>
        Local Cleaner Near You
      </div>

      {partner.logo_url && (
        <img
          src={partner.logo_url}
          alt={partner.business_name}
          style={{ maxWidth: '100%', maxHeight: 44, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }}
        />
      )}

      <div style={{ marginBottom: 12, textAlign: partner.logo_url ? 'center' : 'left' }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', lineHeight: 1.25 }}>
          {partner.business_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: partner.logo_url ? 'center' : 'flex-start', gap: 4, fontSize: 12, color: '#64748b', marginTop: 2 }}>
          <MapPin size={11} color="#94a3b8" /> {partner.city}, {partner.state}
        </div>
      </div>

      {partner.phone && (
        <a
          href={`tel:${partner.phone}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#16a34a', color: 'white', padding: '9px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
        >
          <Phone size={13} /> Call {partner.phone}
        </a>
      )}
    </div>
  );
}
