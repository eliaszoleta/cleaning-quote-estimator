import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About CleanCalc — Free Cleaning Cost Estimator</title>
        <meta name="description" content="CleanCalc provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
      </Helmet>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>About CleanCalc</h1>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.7 }}>
          We built CleanCalc to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { title: 'Our mission', body: 'Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.' },
            { title: 'How we calculate prices', body: 'Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.' },
            { title: 'Who we serve', body: 'CleanCalc serves two groups: (1) homeowners and property managers looking for fast, unbiased price guidance before calling cleaning companies, and (2) cleaning companies who want to embed our calculator on their own websites to capture leads with accurate, localized estimates.' },
            { title: 'Disclaimer', body: 'Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company\'s pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.' },
          ].map(({ title, body }) => (
            <div key={title} style={{ background: '#f8fafc', borderRadius: 12, padding: '24px 28px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h2>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>{body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a href="/contact" style={{ background: '#2563eb', color: 'white', padding: '13px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>Contact Us</a>
        </div>
      </div>
    </>
  );
}
