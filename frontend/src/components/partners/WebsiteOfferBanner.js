import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import { getCachedPartnerMatchDetailed } from '../../utils/partnerLookup';
import { computeIsCompact } from './FloatingPartnerBanner';

const DISMISS_KEY = 'cleanestimator_website_offer_banner_dismissed';
const DESKTOP_BANNER_WIDTH = 268;
const DESKTOP_RIGHT_OFFSET = 16;
const DESKTOP_TOP_FALLBACK = 80;
const DESKTOP_TOP_GAP = 15;

// Pages that ARE the website-build offer (the sale page itself, and its demo)
// -- showing a banner that pitches the same thing you're already looking at
// is redundant, not a second chance to convert.
const EXCLUDED_PATHS = ['/website-for-cleaning-companies', '/partner-demo'];

// Mirror image of FloatingPartnerBanner's condition: that one shows the
// active partner IN the visitor's city; this one shows only when the
// lookup confirmed there ISN'T one yet -- pitching the free website build
// as the hook to recruit whoever becomes that city's exclusive partner.
// Never both at once, since the two conditions are exact opposites of the
// same lookup, and a failed lookup (network blip, ad blocker) shows
// neither rather than guessing.
export default function WebsiteOfferBanner() {
  const [city, setCity] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(computeIsCompact);
  const [headerTop, setHeaderTop] = useState(DESKTOP_TOP_FALLBACK);

  useEffect(() => {
    const onResize = () => setIsMobile(computeIsCompact());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Anchored to the real header height (id="site-header", Header.js)
  // instead of a hardcoded 80px -- that guess only matched the header's
  // one known height; any page (or future header variant) with a taller
  // header would put this banner right up against it, or overlapping it,
  // instead of sitting a consistent gap below it.
  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    const update = () => setHeaderTop(header.getBoundingClientRect().height + DESKTOP_TOP_GAP);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (EXCLUDED_PATHS.includes(path)) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* ignore */ }

    getCachedPartnerMatchDetailed().then(({ partner, ok, loc }) => {
      if (cancelled || !ok || partner || !loc) return;
      setCity(loc.city);
      setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
      }, 1500);
    });

    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  if (!city || !visible) return null;

  // Portal to document.body for the same reason as FloatingPartnerBanner --
  // Header's backdropFilter would otherwise anchor position:fixed to its
  // own small box instead of the real viewport.
  return createPortal(
    <div
      role="complementary"
      aria-label="Get a free cleaning website build"
      style={{
        position: 'fixed',
        top: isMobile ? 'auto' : headerTop,
        bottom: isMobile ? 12 : 'auto',
        right: isMobile ? 10 : DESKTOP_RIGHT_OFFSET,
        zIndex: 90,
        width: isMobile ? 'fit-content' : DESKTOP_BANNER_WIDTH,
        maxWidth: isMobile ? 'min(260px, calc(100vw - 20px))' : 'calc(100vw - 20px)',
        background: 'white',
        border: isMobile ? '1px solid rgba(15,23,42,0.045)' : '1px solid rgba(15,23,42,0.07)',
        borderRadius: isMobile ? 6 : 16,
        overflow: 'hidden',
        boxShadow: isMobile
          ? '0 1px 3px rgba(15,23,42,0.04), 0 8px 18px rgba(29,78,216,0.12)'
          : '0 2px 6px rgba(15,23,42,0.05), 0 18px 38px rgba(29,78,216,0.16)',
        padding: isMobile ? '8px 8px' : '14px 16px',
        animation: 'websiteOfferBannerIn 0.25s ease-out',
      }}
    >
      <style>{`@keyframes websiteOfferBannerIn { from { opacity: 0; transform: translateY(${isMobile ? 8 : -8}px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isMobile ? 2 : 3, background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />

      {!isMobile && (
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ position: 'absolute', top: 10, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', display: 'flex' }}
        >
          <X size={14} />
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 4 : 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9.5, fontWeight: 700, color: '#2563eb', background: '#eff6ff', textTransform: 'uppercase', letterSpacing: '0.05em', padding: isMobile ? '2px 7px' : '4px 10px', borderRadius: 20 }}>
          For Cleaning Companies
        </div>
      </div>

      <div style={{ marginBottom: isMobile ? 5 : 12, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: isMobile ? 11.5 : 14.5, color: '#0f172a', lineHeight: isMobile ? 1.2 : 1.35 }}>
          Don't have a cleaning website yet?
        </div>
        {!isMobile && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
            We build it, free — you decide if you want to keep it.
          </div>
        )}
      </div>

      <a
        href="/website-for-cleaning-companies#apply"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#1d4ed8', color: 'white', padding: isMobile ? '6px 8px' : '9px 14px', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? 11.5 : 13, whiteSpace: 'nowrap' }}
      >
        Get My Free Website Build <ArrowRight size={isMobile ? 11 : 13} />
      </a>
    </div>,
    document.body
  );
}
