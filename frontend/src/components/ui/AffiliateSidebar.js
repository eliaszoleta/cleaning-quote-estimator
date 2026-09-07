import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Cleaning-related Amazon Associates picks, shown alongside the homepage
// calculator. Static list (not admin-editable) -- update here to change
// what's shown. Each amazonUrl already carries the affiliate tag.
const PRODUCTS = [
  {
    name: 'BISSELL TurboClean PET Upright Carpet & Upholstery Cleaner',
    image: 'https://m.media-amazon.com/images/I/71V4Vf4AMSL._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4gBlwJ2',
  },
  {
    name: 'BISSELL Little Green Max Pet SmartMix Carpet Cleaner',
    image: 'https://m.media-amazon.com/images/I/71IEytWCclL._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4imhIg9',
  },
  {
    name: 'Electric Spin Scrubber, Bathroom Shower Cleaning Brush',
    image: 'https://m.media-amazon.com/images/I/71aQbSwuNxL._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4xbDeYA',
  },
];

const SIDEBAR_WIDTH = 208;
const LEFT_OFFSET = 16;

// Flat "laptop and up" cutoff, precomputed to be the actual minimum width
// where the sidebar (LEFT_OFFSET + SIDEBAR_WIDTH = 224px) clears the wider
// of the two content columns this mounts next to (BlogPost.js's 760px --
// the homepage calculator's 720px needs less) without touching it: 760 +
// 2*224 = 1208, rounded up for a small buffer. Below this, real laptops
// showed a genuine overlap with the content, not just an overly-cautious
// threshold -- confirmed by screenshotting 1024px, where the sidebar's
// right edge visibly cut into the calculator card. Modern laptops almost
// always report 1280px+ of CSS viewport width even on a 13" screen, so
// this covers virtually all of them; only tablets, a non-maximized window,
// or a zoomed-in browser fall below it.
// Default only -- a wider content column needs a higher cutoff of its own,
// passed in via the desktopBreakpoint prop below.
const DESKTOP_BREAKPOINT = 1220;

function computeIsDesktop(breakpoint) {
  return window.innerWidth >= breakpoint;
}

function ProductCard({ product, compact }) {
  return (
    <a
      href={product.amazonUrl}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'stretch',
        gap: compact ? 12 : 8,
        textDecoration: 'none',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        style={{
          width: compact ? 64 : '100%',
          height: compact ? 64 : 110,
          objectFit: 'contain',
          flexShrink: 0,
          background: '#f8fafc',
          borderRadius: 8,
        }}
        onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
      />
      <div style={{ fontSize: 12.5, color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
        {product.name}
      </div>
    </a>
  );
}

function SidebarInner({ compact }) {
  return (
    <div
      style={{
        width: compact ? '100%' : SIDEBAR_WIDTH,
        background: compact ? 'transparent' : 'white',
        border: compact ? 'none' : '1px solid #e2e8f0',
        borderRadius: compact ? 0 : 16,
        padding: compact ? 0 : 14,
        boxShadow: compact ? 'none' : '0 4px 20px rgba(15,23,42,0.06)',
        // Floating (non-compact) card only: on a short laptop viewport, 3
        // full-size product cards stacked under the top:90 offset can run
        // past the bottom of the screen with no way to reach the last one.
        // Capping height and scrolling internally keeps every card
        // reachable regardless of screen height, instead of silently
        // clipping the last card off-screen.
        maxHeight: compact ? 'none' : 'calc(100vh - 110px)',
        overflowY: compact ? 'visible' : 'auto',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, padding: compact ? '0 2px' : 0 }}>
        Cleaning Products We Recommend
      </div>
      <div style={{ display: compact ? 'grid' : 'flex', gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(240px, 1fr))' : undefined, flexDirection: compact ? undefined : 'column', gap: 10 }}>
        {PRODUCTS.map(p => <ProductCard key={p.amazonUrl} product={p} compact={compact} />)}
      </div>
      <div style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 12, padding: compact ? '0 2px' : 0 }}>
        As an Amazon Associate, we earn from qualifying purchases.
      </div>
    </div>
  );
}

// Mounted on the homepage (720px calculator card) and every blog post
// (760px article column) -- contentMaxWidth tells it which, used only for
// the stacked fallback's own width below. On a laptop-or-wider viewport it
// always floats in the left margin next to that content column, mirroring
// how FloatingPartnerBanner docks in the right margin. Below that width it
// renders inline, in normal document flow, right where <AffiliateSidebar />
// is placed in the page -- stacked under the content instead of squeezed
// into a margin that isn't there (tablets and phones don't have one).
// padded: whether the inline/stacked fallback needs its own horizontal
// gutter. True by default (the homepage mounts this as a bare sibling
// under an unpadded <main>, so it supplies its own edge padding, matching
// CleaningCalculator/SEOContent's own wrappers). BlogPost.js passes false
// since it's nested inside an already-padded, already-760-wide content
// column -- adding padding on top of that would double-inset it relative
// to the article text right above it.
// mode: 'fixed' (default) portals to document.body and stays glued to the
// same screen position for the page's entire scroll -- correct for
// BlogPost.js, whose 760px article column keeps the same width top to
// bottom, so there's always room in the left margin. The homepage isn't
// uniform: the calculator card is 720px wide, but SEOContent's services/
// pricing/FAQ section further down is 1100px wide, leaving too little
// margin for the sidebar there -- a fixed position can't tell the
// difference and ends up overlapping that wider content once scrolled
// into it. mode="sticky" fixes that: the caller wraps just the calculator
// section in a `position: relative` box, and the sidebar renders in
// normal flow (no portal) as a zero-height position:sticky element inside
// it, so it floats alongside the calculator exactly like 'fixed' does,
// but stops sticking -- scrolling away with the rest of the page -- the
// moment that wrapper's bottom edge (the end of the calculator section)
// scrolls past the sticky offset, before the wider section ever begins.
// desktopBreakpoint: overrides DESKTOP_BREAKPOINT for pages whose content
// column is wider than the 720/760px this default was computed for. The
// standalone calculator landing pages (CalculatorPage, EstimatorPage,
// ServiceCalculatorPage) wrap their whole page -- calculator card, FAQ,
// everything -- in a single 900px-wide column, so the default 1220px
// cutoff (which only guarantees clearance against a 760px column) would
// let the sidebar overlap that wider content between ~1220-1360px.
export default function AffiliateSidebar({ contentMaxWidth = 720, padded = true, mode = 'fixed', desktopBreakpoint = DESKTOP_BREAKPOINT }) {
  const [isDesktop, setIsDesktop] = useState(() => computeIsDesktop(desktopBreakpoint));

  useEffect(() => {
    const onResize = () => setIsDesktop(computeIsDesktop(desktopBreakpoint));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktopBreakpoint]);

  if (isDesktop && mode === 'sticky') {
    // No portal needed: unlike 'fixed', position:sticky is scoped to this
    // element's own place in the DOM, so it doesn't need to escape any
    // ancestor's containing block. height:0 keeps this from adding any
    // layout height of its own to the wrapper the caller sized around the
    // calculator; the actual card is an absolutely-positioned child, anchored
    // to this sticky element's own box (which spans the wrapper's full
    // width), so it lands LEFT_OFFSET from the left edge same as 'fixed'.
    return (
      <div style={{ position: 'sticky', top: 90, height: 0, overflow: 'visible', zIndex: 40 }}>
        <div style={{ position: 'absolute', top: 0, left: LEFT_OFFSET }}>
          <SidebarInner compact={false} />
        </div>
      </div>
    );
  }

  if (isDesktop) {
    // Portal to document.body for the same reason FloatingPartnerBanner
    // does -- Header's backdropFilter creates a new CSS containing block
    // for any position:fixed descendant, which would anchor this to the
    // header's own (small) box instead of the real viewport.
    return createPortal(
      <div style={{ position: 'fixed', top: 90, left: LEFT_OFFSET, zIndex: 40 }}>
        <SidebarInner compact={false} />
      </div>,
      document.body
    );
  }

  return (
    <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: padded ? '0 20px clamp(28px, 6vw, 44px)' : '0 0 clamp(28px, 6vw, 44px)' }}>
      <SidebarInner compact />
    </div>
  );
}
