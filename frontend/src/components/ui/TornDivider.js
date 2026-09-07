import React from 'react';

// Torn-paper edge divider between two differently-colored sections -- the
// signature transition motif this redesign borrows from getjobber.com's
// dark-navy/light-content section rhythm. Self-contained strip: `topColor`
// fills the upper part (continuing whatever section sits above it),
// `bottomColor` fills the jagged shape torn out of it, continuing into
// whatever section sits below. Drop it between any two sections regardless
// of which component renders which side. Deterministic zigzag (not random
// per-render) so it doesn't jitter between reloads or break screenshot diffs.
export default function TornDivider({ topColor = '#ffffff', bottomColor = '#0f172a', height = 30, fullBleed = false }) {
  return (
    <div style={{ background: topColor, lineHeight: 0, ...(fullBleed ? { width: '100vw', marginLeft: 'calc(50% - 50vw)' } : {}) }}>
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height }}
        aria-hidden="true"
      >
        <path
          d="M0,40 L0,15 L36,21 L78,10 L119,18 L162,7 L205,16 L248,5 L292,14 L337,4 L382,13 L428,3 L474,12 L521,2 L568,11 L616,1 L664,10 L713,4 L762,13 L812,5 L862,14 L913,3 L964,12 L1016,4 L1068,13 L1121,3 L1175,12 L1200,8 L1200,40 Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  );
}
