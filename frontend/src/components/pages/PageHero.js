import React from 'react';
import './PageHero.css';

// Shared full-bleed dark hero band for the standalone calculator/estimator
// landing pages -- breadcrumb + title + subtitle only. Each page renders its
// own light-background content (the calculator card, why-points, FAQ, etc.)
// separately below it in a `.page-hero-content` wrapper, with the card
// pulled up via a negative margin to sink into this band's bottom edge,
// same technique as the homepage's own hero in CleaningCalculator.js.
export default function PageHero({ breadcrumbLabel, title, subtitle, subtitleAlign }) {
  return (
    <div className="page-hero-band">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="page-hero-inner">
        <div className="page-hero-breadcrumb">
          <a href="/">Home</a><span>&rsaquo;</span>
          <span>{breadcrumbLabel}</span>
        </div>
        <div className="page-hero-block">
          <h1 className="page-hero-title">{title}</h1>
          <p className="page-hero-subtitle" style={subtitleAlign ? { textAlign: subtitleAlign } : undefined}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
