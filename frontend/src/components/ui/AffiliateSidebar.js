import React, { useState, useEffect, useRef } from 'react';
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

// Full-size cards (110px image, stacked top:90) run to roughly 700px tall
// for all 3 products -- fine against a full laptop-height screen, but a
// short browser window (shrunk taskbar-height Chrome, a laptop with the
// bookmarks bar and a couple of tab rows eating into the viewport) doesn't
// have that much room below the top:90 offset. Rather than scrolling the
// sidebar internally (a scrollbar/scroll-nav inside a small marketing
// widget reads as broken, and hides the 3rd product by default), switch to
// smaller "dense" cards -- same row layout already used for the
// mobile/stacked fallback -- once the viewport is too short for the
// full-size version. 700 (3 cards) + 90 (top offset) + ~40 (label/footer/
// padding) + buffer.
const DENSE_HEIGHT_THRESHOLD = 860;

function computeIsDense() {
  return window.innerHeight < DENSE_HEIGHT_THRESHOLD;
}

const TOP_OFFSET = 90;
const FOOTER_GAP = 20;

// Keeps a position:fixed floating card from ever sliding over the site
// footer. A plain `position: fixed; top: 90` has no idea where the page
// ends -- once the footer scrolls into view, the card just sits on top of
// it, which is exactly what happened on blog posts (any page long enough
// to scroll the footer above the fold with room to spare). This is the
// classic "affix with a lower boundary" pattern: on every scroll, work out
// where the card's top edge would need to land, in document coordinates,
// to keep its bottom edge FOOTER_GAP above the footer's top -- once the
// card's natural (viewport-fixed) position would go past that point,
// switch it to position:absolute pinned at that document coordinate
// instead, so it scrolls away with the rest of the page from then on,
// docked just above the footer rather than overlapping it. Returns null
// while the card should render normally fixed, or a doc-coordinate top
// once it should be docked.
function useFooterDockTop(active, cardHeight) {
  const [dockTop, setDockTop] = useState(null);

  useEffect(() => {
    if (!active) { setDockTop(null); return undefined; }

    let ticking = false;
    const recompute = () => {
      ticking = false;
      const footer = document.querySelector('footer');
      if (!footer || !cardHeight) { setDockTop(null); return; }
      const scrollY = window.scrollY;
      const footerDocTop = footer.getBoundingClientRect().top + scrollY;
      const maxDocTop = footerDocTop - cardHeight - FOOTER_GAP;
      const naturalDocTop = scrollY + TOP_OFFSET;
      setDockTop(naturalDocTop > maxDocTop ? maxDocTop : null);
    };
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(recompute);
    };

    recompute();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [active, cardHeight]);

  return dockTop;
}

function ProductCard({ product, dense }) {
  return (
    <a
      href={product.amazonUrl}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: dense ? 'row' : 'column',
        alignItems: dense ? 'center' : 'stretch',
        gap: dense ? 12 : 8,
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
          width: dense ? 56 : '100%',
          height: dense ? 56 : 110,
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

// floating: whether this renders as the bordered white card that overlays
// the page margin (true for both desktop cases) vs. transparent/full-width
// in normal document flow (mobile/stacked fallback).
// dense: whether cards use the small row layout (56px image, text beside
// it) vs. the full column layout (110px image on top, text below) -- an
// independent axis from `floating`, since a floating card can still need
// dense cards on a short viewport (see DENSE_HEIGHT_THRESHOLD above), and
// the stacked fallback always uses dense/row cards regardless of height.
function SidebarInner({ floating, dense }) {
  return (
    <div
      style={{
        width: floating ? SIDEBAR_WIDTH : '100%',
        background: floating ? 'white' : 'transparent',
        border: floating ? '1px solid #e2e8f0' : 'none',
        borderRadius: floating ? 16 : 0,
        padding: floating ? 14 : 0,
        boxShadow: floating ? '0 4px 20px rgba(15,23,42,0.06)' : 'none',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, padding: floating ? 0 : '0 2px' }}>
        Cleaning Products We Recommend
      </div>
      <div style={{ display: floating ? 'flex' : 'grid', gridTemplateColumns: floating ? undefined : 'repeat(auto-fit, minmax(240px, 1fr))', flexDirection: floating ? 'column' : undefined, gap: 10 }}>
        {PRODUCTS.map(p => <ProductCard key={p.amazonUrl} product={p} dense={dense} />)}
      </div>
      <div style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 12, padding: floating ? 0 : '0 2px' }}>
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
// className: applied to the in-flow root element only (the sticky-mode div
// and the mobile/stacked fallback div) -- not the portal/fixed div, which
// renders into document.body and isn't part of this component's layout
// flow. Lets a caller control this element's position within its own flex
// layout (e.g. via the `order` property) without needing DOM order itself
// to differ between desktop and mobile -- see App.js's use of this for the
// homepage, where mode="sticky" needs this element FIRST for the sticky
// offset trick to work, but mobile's stacked fallback needs it visually
// AFTER the calculator.
// wideBreakpoint: only meaningful with mode="sticky". Sticky mode exists
// so the sidebar doesn't overlap a wider section further down the page --
// but on a big enough monitor, there's already plenty of margin next to
// that wider section too, so disappearing there is overly cautious, not
// a real overlap risk. Once the viewport clears this width, mode="sticky"
// is upgraded in place to the same always-visible behavior as mode="fixed"
// instead of stopping at the calculator.
export default function AffiliateSidebar({ contentMaxWidth = 720, padded = true, mode = 'fixed', desktopBreakpoint = DESKTOP_BREAKPOINT, wideBreakpoint = null, className }) {
  const [isDesktop, setIsDesktop] = useState(() => computeIsDesktop(desktopBreakpoint));
  const [isDense, setIsDense] = useState(computeIsDense);
  const [isWide, setIsWide] = useState(() => wideBreakpoint != null && computeIsDesktop(wideBreakpoint));

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(computeIsDesktop(desktopBreakpoint));
      setIsDense(computeIsDense());
      setIsWide(wideBreakpoint != null && computeIsDesktop(wideBreakpoint));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktopBreakpoint, wideBreakpoint]);

  // Only the portal/fixed rendering below (mode="fixed", or mode="sticky"
  // once upgraded by wideBreakpoint) can ever reach the footer -- the
  // sticky-scoped-to-calculator rendering already stops well above it, so
  // there's nothing to measure or dock there.
  const fixedStyleActive = isDesktop && (mode === 'fixed' || (mode === 'sticky' && isWide));
  const cardRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(0);
  useEffect(() => {
    const h = cardRef.current ? cardRef.current.offsetHeight : 0;
    if (h && h !== cardHeight) setCardHeight(h);
  });
  const dockTop = useFooterDockTop(fixedStyleActive, cardHeight);

  if (isDesktop && mode === 'sticky' && !isWide) {
    // No portal needed: unlike 'fixed', position:sticky is scoped to this
    // element's own place in the DOM, so it doesn't need to escape any
    // ancestor's containing block. height:0 keeps this from adding any
    // layout height of its own to the wrapper the caller sized around the
    // calculator; the actual card is an absolutely-positioned child, anchored
    // to this sticky element's own box (which spans the wrapper's full
    // width), so it lands LEFT_OFFSET from the left edge same as 'fixed'.
    return (
      <div className={className} style={{ position: 'sticky', top: TOP_OFFSET, height: 0, overflow: 'visible', zIndex: 40 }}>
        <div style={{ position: 'absolute', top: 0, left: LEFT_OFFSET }}>
          <SidebarInner floating dense={isDense} />
        </div>
      </div>
    );
  }

  if (isDesktop) {
    // Portal to document.body for the same reason FloatingPartnerBanner
    // does -- Header's backdropFilter creates a new CSS containing block
    // for any position:fixed descendant, which would anchor this to the
    // header's own (small) box instead of the real viewport. Once dockTop
    // is set (the footer is close enough that a fixed position would
    // overlap it), switch to position:absolute pinned at that document
    // coordinate instead -- see useFooterDockTop above.
    const style = dockTop != null
      ? { position: 'absolute', top: dockTop, left: LEFT_OFFSET, zIndex: 40 }
      : { position: 'fixed', top: TOP_OFFSET, left: LEFT_OFFSET, zIndex: 40 };
    return createPortal(
      <div ref={cardRef} style={style}>
        <SidebarInner floating dense={isDense} />
      </div>,
      document.body
    );
  }

  return (
    <div className={className} style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: padded ? '0 20px clamp(28px, 6vw, 44px)' : '0 0 clamp(28px, 6vw, 44px)' }}>
      <SidebarInner floating={false} dense />
    </div>
  );
}
