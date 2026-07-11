import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Calculator, Users, ShieldCheck } from 'lucide-react';

const SECTION_ICONS = [
  { Icon: Target, color: '#1e40af', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  { Icon: Calculator, color: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' },
  { Icon: Users, color: '#0891b2', bg: 'linear-gradient(135deg,#ecfeff,#cffafe)' },
  { Icon: ShieldCheck, color: '#15803d', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.01em' }}>About Clean Estimator</h1>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.7 }}>
          We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { title: 'Our mission', body: 'Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.' },
            { title: 'How we calculate prices', body: 'Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.' },
            { title: 'Who we serve', body: 'Clean Estimator serves two groups: (1) homeowners and property managers looking for fast, unbiased price guidance before calling cleaning companies, and (2) cleaning companies who want to embed our calculator on their own websites to capture leads with accurate, localized estimates.' },
            { title: 'Disclaimer', body: "Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking." },
          ].map(({ title, body }, i) => {
            const { Icon, color, bg } = SECTION_ICONS[i];
            return (
              <div key={title} style={{ background: 'white', borderRadius: 16, padding: '26px 28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 16px rgba(15,23,42,0.05)', display: 'flex', gap: 18 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h2>
                  <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>{body}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 44, textAlign: 'center' }}>
          <a href="/contact" style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8,#2563eb)', color: 'white', padding: '13px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', display: 'inline-block' }}>Contact Us</a>
        </div>
      </div>
    </>
  );
}
