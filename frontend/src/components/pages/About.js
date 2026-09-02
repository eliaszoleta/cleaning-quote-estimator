import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Calculator, Users, ShieldCheck } from 'lucide-react';

const ACCENT = '#1d4ed8';

const SECTION_ICONS = [Target, Calculator, Users, ShieldCheck];

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 88px' }}>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 700, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>About Clean Estimator</h1>
        <p style={{ fontSize: 17, color: '#475569', marginBottom: 48, lineHeight: 1.75, maxWidth: 600 }}>
          We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
        </p>
        <div>
          {[
            { title: 'Our mission', body: 'Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.' },
            { title: 'How we calculate prices', body: 'Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.' },
            { title: 'Who we serve', body: 'Clean Estimator serves two groups: (1) homeowners and property managers looking for fast, unbiased price guidance before calling cleaning companies, and (2) cleaning companies who want to embed our calculator on their own websites to capture leads with accurate, localized estimates.' },
            { title: 'Disclaimer', body: "Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking." },
          ].map(({ title, body }, i) => {
            const Icon = SECTION_ICONS[i];
            return (
              <div key={title} style={{ display: 'flex', gap: 18, padding: '28px 0', borderTop: '1px solid #e5e7eb' }}>
                <Icon size={20} strokeWidth={1.75} color={ACCENT} style={{ flexShrink: 0, marginTop: 3 }} />
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h2>
                  <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75 }}>{body}</p>
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ marginTop: 40 }}>
          <a href="/contact" style={{ background: ACCENT, color: 'white', padding: '13px 30px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15, display: 'inline-block' }}>Contact Us</a>
        </div>
      </div>
    </>
  );
}
