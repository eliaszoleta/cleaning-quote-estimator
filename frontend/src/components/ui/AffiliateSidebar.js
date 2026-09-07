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

// Matches CleaningCalculator.js's card width (same constant
// FloatingPartnerBanner.js uses on the right) -- used to work out whether
// there's real space in the LEFT margin for this sidebar before docking it
// there, instead of a guessed viewport-width breakpoint. A separate check
// from the partner banner's (different width, different side), so the two
// never fight over the same math.
const CONTENT_MAX_WIDTH = 720;
const SIDEBAR_WIDTH = 208;
const LEFT_OFFSET = 16;
const SAFE_GAP = 24;

function computeHasRoom() {
  const margin = (window.innerWidth - CONTENT_MAX_WIDTH) / 2;
  return margin >= LEFT_OFFSET + SIDEBAR_WIDTH + SAFE_GAP;
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

// Sitewide-capable, currently only mounted on the homepage (App.js). On a
// wide viewport it floats in the left margin next to the calculator card,
// mirroring how FloatingPartnerBanner docks in the right margin -- both
// only ever show up where there's real space, never overlapping the
// centered content column. Below that width it renders inline, in normal
// document flow, right where <AffiliateSidebar /> is placed in the page --
// stacked under the calculator instead of squeezed into a margin that
// isn't there.
export default function AffiliateSidebar() {
  const [hasRoom, setHasRoom] = useState(computeHasRoom);

  useEffect(() => {
    const onResize = () => setHasRoom(computeHasRoom());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (hasRoom) {
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
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px clamp(28px, 6vw, 44px)' }}>
      <SidebarInner compact />
    </div>
  );
}
