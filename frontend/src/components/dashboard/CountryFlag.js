import React from 'react';

// Real flag glyphs, not the 🇺🇸/🇨🇦/🇬🇧/🇦🇺 emoji previously used as the
// <option> text -- those rendered fine on Android (where the mobile
// screenshot that drove this fix was taken) but as blank space or a bare
// "CA"/"GB" text fallback on several desktop OS/browser combos (Windows in
// particular ships without a flag-emoji font by default), so the same
// country switcher looked broken on desktop while working on mobile.
// Hand-drawn, simplified inline SVGs instead of an external flag-icon CDN
// or npm package -- renders identically everywhere with no network
// dependency, consistent with how every other icon in this app
// (lucide-react) is already self-contained. Not pixel-accurate flags (the
// UK/AU crosses and the CA maple leaf are simplified down to something
// legible at ~16px), just recognizable at the size this is actually shown.
//
// Shared between CompanyDashboard.js's header country switcher and
// OverviewTab.js's "Account Country" stat card -- extracted here instead
// of defined twice so both stay in sync with the same artwork.
export default function CountryFlag({ country, size = 16 }) {
  const h = size * 0.72;
  const common = { width: size, height: h, viewBox: '0 0 20 15', style: { borderRadius: 2, flexShrink: 0, display: 'block' } };
  if (country === 'CA') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#fff" />
      <rect width="5" height="15" fill="#D80621" />
      <rect x="15" width="5" height="15" fill="#D80621" />
      <path d="M10 3l.8 2.1 2-.9-.6 2 1.8.3-1.5 1.3.9 1.9-2-.6.1 2-1.5-1.3-1.5 1.3.1-2-2 .6.9-1.9-1.5-1.3 1.8-.3-.6-2 2 .9z" fill="#D80621" />
    </svg>
  );
  if (country === 'GB') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#00247D" />
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#CF142B" strokeWidth="1.2" />
      <path d="M10 0 V15 M0 7.5 H20" stroke="#fff" strokeWidth="5" />
      <path d="M10 0 V15 M0 7.5 H20" stroke="#CF142B" strokeWidth="3" />
    </svg>
  );
  if (country === 'AU') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#00247D" />
      <path d="M0 0 L10 7.5 M10 0 L0 7.5" stroke="#fff" strokeWidth="1.4" />
      <path d="M0 0 L10 7.5 M10 0 L0 7.5" stroke="#CF142B" strokeWidth="0.6" />
      <path d="M5 0 V7.5 M0 3.75 H10" stroke="#fff" strokeWidth="2.2" />
      <path d="M5 0 V7.5 M0 3.75 H10" stroke="#CF142B" strokeWidth="1.2" />
      <circle cx="4" cy="11.5" r="1.1" fill="#fff" />
      <circle cx="14" cy="4" r="0.8" fill="#fff" />
      <circle cx="16.5" cy="7" r="0.8" fill="#fff" />
      <circle cx="17.5" cy="11" r="0.8" fill="#fff" />
      <circle cx="13.5" cy="12.5" r="0.6" fill="#fff" />
    </svg>
  );
  // US (and the fallback for an unrecognized/undefined country, same as
  // every country-aware piece of this app already defaulting to US).
  return (
    <svg {...common}>
      <rect width="20" height="15" fill="#fff" />
      <g fill="#B22234">
        <rect y="0" width="20" height="1.15" />
        <rect y="2.3" width="20" height="1.15" />
        <rect y="4.6" width="20" height="1.15" />
        <rect y="6.9" width="20" height="1.15" />
        <rect y="9.2" width="20" height="1.15" />
        <rect y="11.5" width="20" height="1.15" />
        <rect y="13.8" width="20" height="1.15" />
      </g>
      <rect width="8" height="8.1" fill="#3C3B6E" />
    </svg>
  );
}
