import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Globe } from 'lucide-react';
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
// /website-approval/:token is where someone who already applied is
// reviewing their sample or paying -- pitching the same offer they're mid-
// way through completing would be confusing, not a second chance to convert.
const EXCLUDED_PREFIXES = ['/website-approval/'];

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
    if (EXCLUDED_PATHS.includes(path) || EXCLUDED_PREFIXES.some(p => path.startsWith(p))) return;
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
  const restingShadow = isMobile
    ? '0 1px 3px rgba(15,23,42,0.08), 0 8px 20px rgba(29,78,216,0.28)'
    : '0 4px 10px rgba(15,23,42,0.1), 0 20px 42px rgba(29,78,216,0.32)';

  return createPortal(
    <div
      role="complementary"
      aria-label="Get a free cleaning website build"
      className="wob-card"
      style={{
        position: 'fixed',
        top: isMobile ? 'auto' : headerTop,
        // iOS Safari's bottom toolbar (and the home-indicator gesture bar
        // on notched phones) draws on top of a plain `bottom: 12px` fixed
        // element instead of pushing it up -- env(safe-area-inset-bottom)
        // reports that toolbar's live height (0 on desktop, shrinking as
        // the toolbar auto-hides on scroll) and requires viewport-fit=cover
        // in index.html's viewport meta tag to report anything but 0.
        bottom: isMobile ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 'auto',
        right: isMobile ? 10 : DESKTOP_RIGHT_OFFSET,
        zIndex: 90,
        width: isMobile ? 'fit-content' : DESKTOP_BANNER_WIDTH,
        maxWidth: isMobile ? 'min(260px, calc(100vw - 20px))' : 'calc(100vw - 20px)',
        // Solid, saturated brand blue instead of the previous white/pale-blue
        // card -- the single biggest contrast jump against a mostly-white
        // page, without changing size/position (keeps this clear of
        // Google's intrusive-interstitial guidance, same as before).
        background: 'linear-gradient(165deg, #2563eb 0%, #1d4ed8 100%)',
        border: isMobile ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.22)',
        borderRadius: isMobile ? 8 : 16,
        overflow: 'hidden',
        boxShadow: restingShadow,
        padding: isMobile ? '8px 8px' : '16px 16px 14px',
        animation: `websiteOfferBannerIn 0.25s ease-out, wobPulseRing 1s ease-out 0.35s 2`,
      }}
    >
      <style>{`
        @keyframes websiteOfferBannerIn { from { opacity: 0; transform: translateY(${isMobile ? 8 : -8}px); } to { opacity: 1; transform: translateY(0); } }
        /* One-time attention pulse (fires twice, then settles) -- an expanding
           ring around the resting shadow, not a continuous/looping effect. */
        @keyframes wobPulseRing {
          0% { box-shadow: ${restingShadow}, 0 0 0 0 rgba(37,99,235,0.55); }
          70% { box-shadow: ${restingShadow}, 0 0 0 14px rgba(37,99,235,0); }
          100% { box-shadow: ${restingShadow}, 0 0 0 0 rgba(37,99,235,0); }
        }
        .wob-cta { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .wob-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,0.22); }
        .wob-arrow { display: inline-flex; transition: transform 0.15s ease; }
        .wob-cta:hover .wob-arrow { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .wob-cta, .wob-arrow { transition: none; }
          .wob-card { animation: none; }
        }
      `}</style>

      {/* Soft white glow in the corner, now that the card itself is the
          saturated brand blue instead of white. */}
      <div aria-hidden="true" style={{ position: 'absolute', top: -34, right: -34, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%)', pointerEvents: 'none' }} />

      {/* Amber accent strip -- pops against the blue card (a blue-on-blue
          line would have disappeared) and ties visually to the amber CTA. */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isMobile ? 2 : 3, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />

      {!isMobile && (
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ position: 'absolute', top: 10, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.75)', display: 'flex' }}
        >
          <X size={14} />
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 4 : 10, position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontWeight: 700, color: 'white', background: 'rgba(255,255,255,0.16)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: isMobile ? '2px 7px' : '4px 10px 4px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)' }}>
          <Globe size={isMobile ? 9 : 11} />
          For Cleaning Companies
        </div>
      </div>

      <div style={{ marginBottom: isMobile ? 5 : 12, textAlign: 'center', position: 'relative' }}>
        <div style={{ fontWeight: 800, fontSize: isMobile ? 11.5 : 14.5, color: 'white', lineHeight: isMobile ? 1.2 : 1.35 }}>
          Still Don't Have a Website?
        </div>
        {!isMobile && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.5 }}>
            We'll build your free sample first — you only pay if you like it and want to go live.
          </div>
        )}
      </div>

      <a
        className="wob-cta"
        href="/website-for-cleaning-companies#apply"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1e3a8a', padding: isMobile ? '6px 8px' : '9px 14px', borderRadius: 7, textDecoration: 'none', fontWeight: 800, fontSize: isMobile ? 11.5 : 13, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
      >
        Build My Free Sample <span className="wob-arrow"><ArrowRight size={isMobile ? 11 : 13} /></span>
      </a>
    </div>,
    document.body
  );
}
