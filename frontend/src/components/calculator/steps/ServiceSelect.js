import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets, Sofa, KeyRound, Construction } from 'lucide-react';
import { COLORS, RADIUS } from '../../../styles/theme';

const TILE_MIN = 260;
const TILE_MAX = 300;
const GRID_GAP = 10;

// Picks a column count (1..maxCols) that lays the n cards out closest to a
// square block, rather than always maximizing columns just because the
// width allows it -- e.g. 4 cards in a width that fits 3 columns looks
// better as a clean 2x2 square than as a lopsided 3-then-1 row with an
// orphan card dangling alone underneath. Scored by, in order: how close
// columns-vs-rows are to each other (the "squareness"), how few empty
// cells the resulting grid leaves in its last row, and finally the
// highest column count among any remaining ties (so it still prefers
// using more of the available width when squareness is a wash either way).
function pickSquareColumns(n, maxCols) {
  let best = 1;
  let bestScore = Infinity;
  for (let c = 1; c <= maxCols; c++) {
    const rows = Math.ceil(n / c);
    const squareness = Math.abs(c - rows);
    const emptyCells = c * rows - n;
    // squareness and emptyCells (both single digits for up to 12 services)
    // dominate c in this weighting, so the comparison is effectively
    // squareness first, emptyCells second, and highest c last as the
    // tiebreak when both of those are equal.
    const score = squareness * 100 + emptyCells * 10 - c;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// "Most Requested" mirrors the verified tagline already shipped for this service in
// data/services.js ("...the most requested service on Clean Estimator") — not a new claim.
// configKey maps this step's serviceType (snake_case, what /api/calculate
// expects) to the camelCase key the dashboard's Services tab actually
// toggles on/off in companyConfig.services -- the two id conventions never
// matched directly, which is exactly why disabling a service there had no
// effect here.
const SERVICES = [
  { id: 'home_residential', configKey: 'homeResidential', Icon: Home,          label: 'House Cleaning',           desc: 'Standard, deep clean, move-in/out', color: '#2563eb', bg: '#eff6ff', popular: true },
  { id: 'apartment',        configKey: 'apartment',       Icon: Building2,      label: 'Apartment Cleaning',       desc: 'Studio to 4+ bedrooms',             color: '#4f46e5', bg: '#eef2ff' },
  { id: 'commercial',       configKey: 'commercial',      Icon: Building,       label: 'Commercial Cleaning',      desc: 'Offices, retail, warehouses',        color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'carpet',           configKey: 'carpet',          Icon: Layers,         label: 'Carpet Cleaning',          desc: 'Steam, dry-clean, stain removal',    color: '#059669', bg: '#ecfdf5' },
  { id: 'upholstery',       configKey: 'upholstery',      Icon: Sofa,           label: 'Upholstery Cleaning',      desc: 'Sofas, chairs, sectionals & more',   color: '#be185d', bg: '#fdf2f8' },
  { id: 'air_duct',         configKey: 'airDuct',         Icon: Wind,           label: 'Air Duct Cleaning',        desc: 'HVAC duct cleaning & sanitizing',    color: '#0891b2', bg: '#ecfeff' },
  { id: 'dryer_vent',       configKey: 'dryerVent',       Icon: Flame,          label: 'Dryer Vent Cleaning',      desc: 'Fire prevention, efficiency',        color: '#ea580c', bg: '#fff7ed' },
  { id: 'tile_grout',       configKey: 'tileGrout',       Icon: Grid3x3,        label: 'Tile & Grout Cleaning',    desc: 'Deep clean, sealing, recoloring',    color: '#0d9488', bg: '#f0fdfa' },
  { id: 'mold_remediation', configKey: 'moldRemediation', Icon: AlertTriangle,  label: 'Mold Remediation',         desc: 'Assessment, removal, prevention',    color: '#d97706', bg: '#fffbeb' },
  { id: 'water_damage',     configKey: 'waterDamage',     Icon: Droplets,       label: 'Water Damage Restoration', desc: 'Emergency extraction & drying',      color: '#0284c7', bg: '#f0f9ff' },
  { id: 'airbnb',           configKey: 'airbnb',          Icon: KeyRound,       label: 'Airbnb Hosts & Vacation Rentals', desc: 'Turnover cleaning between guests', color: '#9333ea', bg: '#faf5ff' },
  { id: 'post_construction', configKey: 'postConstruction', Icon: Construction, label: 'Post-Construction',        desc: 'Debris, dust & paint splatter cleanup', color: '#78716c', bg: '#fafaf9' },
];

// UK pilot (Oct 2026) -- real UK trade terminology, not a translation (see
// serviceTypeLabel's matching comment in utils/formatters.js for the
// sourcing). Only the card label changes; icon/color/description already
// read fine as-is.
const UK_LABEL_OVERRIDES = {
  apartment: 'Flat Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};

// Australia pilot (Nov 2026) -- see formatters.js's matching comment.
const AU_LABEL_OVERRIDES = {
  apartment: 'Unit Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};

const COUNTRY_LABEL_OVERRIDES = { GB: UK_LABEL_OVERRIDES, AU: AU_LABEL_OVERRIDES };

// isMobile comes from CleaningCalculator's own ResizeObserver on the card
// element (not window.innerWidth) -- this step used to measure the window
// itself, which is correct inside a real <iframe> embed (the iframe has
// its own window) but not for CleaningCalculator rendered directly, like
// the dashboard's Branding tab preview -- there "window" is the whole
// desktop browser, so a narrow preview panel never actually counted as
// mobile, and looked different from how the same widget renders on a real
// site.
export default function ServiceSelect({ onSelect, primaryColor, companyName, ctaHeadline, ctaHeadlineEnabled, services, embedded, isMobile, country, countrySelector = null }) {
  const wrapRef = useRef(null);
  // Real measured width of this step's own content area, used below to pick
  // an explicit column count for the embedded-desktop grid instead of
  // relying on the CSS 'auto-fit'/'auto-fill' keyword -- when a track's max
  // bound is a fixed length (not 1fr), the browser uses THAT max (300px),
  // not the min (260px), to decide how many tracks fit, which rounds down
  // to fewer, more sparsely-packed columns than the container can actually
  // hold and leaves the remainder as unusable blank space. Picking the
  // count ourselves off the min width instead, then letting minmax(260,300)
  // size each resulting track, uses the real available width.
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    // Resets back to 0 (not just skips re-measuring) whenever mobile --
    // CleaningCalculator's own isMobile detection runs in a useEffect of
    // its own, a render cycle after this component's first mount, so
    // isMobile briefly reads false on that very first render and this
    // effect's ResizeObserver fires once for real, capturing whatever
    // width existed in that split second. Without the reset below,
    // isMobile flipping true right after left that one stale measurement
    // sitting in state forever -- capping contentMaxWidth (and the whole
    // heading+subtext+grid block) at a narrow desktop-sized width on every
    // subsequent mobile render for the rest of the session, which is
    // exactly what made the service list look too narrow only on a fresh
    // page load, correcting itself the moment this component happened to
    // unmount and remount (e.g. navigating away a step and back).
    if (!el || !embedded || isMobile) { setGridWidth(0); return; }
    const check = (width) => setGridWidth(width);
    check(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => check(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [embedded, isMobile]);

  // No companyConfig (main cleanestimator.com site) or a service with no
  // explicit entry both default to shown -- only an explicit enabled:false
  // hides it, matching the same default used everywhere else (DEFAULT_SVC
  // in the dashboard's Services tab).
  const labelOverrides = COUNTRY_LABEL_OVERRIDES[country];
  const visibleServices = SERVICES
    .filter(s => services?.[s.configKey]?.enabled !== false)
    .map(s => (labelOverrides && labelOverrides[s.id]) ? { ...s, label: labelOverrides[s.id] } : s);

  // The fixed-tile "squared" layout below exists for a real third-party
  // embed, whose container width a company's host site controls and could
  // be any arbitrary (often narrow) value -- picking an explicit column
  // count there avoids a ragged, half-empty last row. But two of our own
  // surfaces also render with embedded=true purely to get THOSE other
  // behaviors (instant on-screen results, no iframe-postMessage scrolling)
  // -- the dashboard's "Run an Estimate" tool (RunEstimateTab.js) and the
  // Branding tab's live preview -- and both are comfortably wide, predictable
  // surfaces, not odd-width embeds. Forcing the narrow-embed tile math on
  // them anyway picked only 2 columns at ~700px wide, fewer than the public
  // site's plain auto-fill grid manages in less space. Past this width, just
  // use the same dense grid the public site uses instead of the squared one.
  const WIDE_EMBED_MIN_WIDTH = 500;
  const useSquaredGrid = embedded && !(gridWidth > 0 && gridWidth >= WIDE_EMBED_MIN_WIDTH);

  // widthCols is how many columns the measured width can fit at all; the
  // actual column count used is whichever of 1..widthCols lays out this
  // many cards closest to a square block (see pickSquareColumns) -- maxing
  // out columns just because the width allows it left an orphan card alone
  // in a half-empty last row whenever the enabled count didn't divide
  // evenly into the max, instead of a tidier, more compact square.
  const widthCols = useSquaredGrid && gridWidth > 0 ? Math.max(1, Math.floor((gridWidth + GRID_GAP) / (TILE_MIN + GRID_GAP))) : null;
  const gridCols = widthCols ? pickSquareColumns(Math.max(visibleServices.length, 1), widthCols) : null;
  // The actual rendered width of a gridCols-column grid once its tracks
  // settle at their max (300px) -- capped at gridWidth itself in case
  // pickSquareColumns picked a count whose tracks need to shrink toward
  // their min to fit, so this never asks for more width than genuinely
  // exists. Centering the heading+subtext+grid together at this width
  // (rather than centering the grid alone) keeps the heading's left edge
  // lined up with the grid's, instead of the heading staying flush left
  // while the grid centers independently and drifts out of alignment with it.
  const contentMaxWidth = gridCols && gridWidth > 0
    ? Math.min(gridCols * TILE_MAX + (gridCols - 1) * GRID_GAP, gridWidth)
    : undefined;

  return (
    <div ref={wrapRef}>
      <div style={{ maxWidth: contentMaxWidth, margin: contentMaxWidth ? '0 auto' : undefined }}>
      {/* The Branding tab's "Headline" field (ctaHeadline), and its
          show/hide toggle (ctaHeadlineEnabled, default shown), previously
          only reached LeadCaptureStep, a screen further into the flow the
          live preview never advances to -- so typing a custom headline (or
          toggling it off) there visibly did nothing. Respecting both here
          too, since this is the first (and in a static preview, the only)
          screen a company actually sees them apply to. */}
      {/* countrySelector (CleaningCalculator's public-page country picker)
          renders on the same line as the heading instead of as a row of
          its own above it -- on mobile, a separate row left it floating
          disconnected from the heading it's actually scoped to (reported
          from a live screenshot). flexWrap/rowGap is the fallback for a
          long custom ctaHeadline (Branding tab's own field, no length
          limit) that genuinely can't fit alongside the pill at any width:
          it drops to its own line below instead of overlapping/squishing. */}
      {(ctaHeadlineEnabled !== false || countrySelector) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', rowGap: 6, marginBottom: 4 }}>
          {ctaHeadlineEnabled !== false && (
            <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.3px', margin: 0, flex: '1 1 auto', minWidth: 0 }}>
              {ctaHeadline || (companyName ? `${companyName} — Get Your Quote` : 'What service do you need?')}
            </h2>
          )}
          {countrySelector}
        </div>
      )}
      <p style={{ color: COLORS.body, fontSize: 13, marginBottom: 18 }}>
        Tap a service to get your free, instant estimate.
      </p>

      <div className="cc-svc-grid" style={{
        display: 'grid',
        // 195px let a narrow row (like the dashboard's Branding preview, or
        // a widget embedded in a sidebar) fit 3 across whenever exactly 6-7
        // services were enabled -- an uneven "3 then 3" split instead of a
        // clean 2-per-row grid. Only companies' embedded widget ever has a
        // subset of services enabled in the first place -- the main
        // cleanestimator.com calculator always shows the full service list, so it keeps the
        // original, unbounded 195px/1fr instead of being changed for a
        // problem it can't actually hit.
        //
        // For the embedded case, gridCols (computed above via
        // pickSquareColumns off the real measured width) picks the column
        // count explicitly rather than via the 'auto-fit' keyword -- partly
        // because 'auto-fit' sizes its repeat count off minmax's fixed max
        // bound (300px) rather than its min, under-filling wide containers,
        // and partly because always maximizing columns whenever the width
        // allowed it left an orphan card alone in a half-empty last row
        // instead of a tidier, more square-looking block. Each resulting
        // track still sizes itself within minmax(260px, 300px), so a card
        // never grows into an oversized rectangle either way. Before
        // gridCols is measured (a brief instant on first mount), 'auto-fit'
        // is a reasonable placeholder since it can only ever be too
        // conservative for that one frame, never wrong in a visible way.
        gridTemplateColumns: isMobile
          ? 'repeat(2, 1fr)'
          : useSquaredGrid ? `repeat(${gridCols || 'auto-fit'}, minmax(${TILE_MIN}px, ${TILE_MAX}px))` : 'repeat(auto-fill, minmax(195px, 1fr))',
        gap: isMobile ? 8 : 10,
      }}>
        {visibleServices.map(({ id, Icon, label, desc, color, bg, popular }, i) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              position: 'relative',
              background: COLORS.surface,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
              padding: isMobile ? '12px 10px' : '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              display: 'block',
              width: '100%',
              boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
              animation: 'cc-card-in 0.35s ease backwards',
              animationDelay: `${i * 35}ms`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = `0 4px 20px ${color}22`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              const tile = e.currentTarget.querySelector('.svc-tile');
              tile.style.background = color;
              tile.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03)';
              e.currentTarget.style.transform = 'none';
              const tile = e.currentTarget.querySelector('.svc-tile');
              tile.style.background = bg;
              tile.style.color = color;
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          >
            {popular && (
              <span style={{
                position: 'absolute', top: -8, left: 14,
                background: primaryColor || COLORS.primary, color: 'white', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.03em', textTransform: 'uppercase',
                padding: '2.5px 8px', borderRadius: RADIUS.pill, whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                Most Requested
              </span>
            )}
            <div
              className="svc-tile"
              style={{
                width: 34, height: 34, borderRadius: RADIUS.sm,
                background: bg, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: COLORS.ink, marginBottom: 2, lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.4 }}>{desc}</div>
          </button>
        ))}
      </div>
      </div>

      <style>{`
        @keyframes cc-card-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
