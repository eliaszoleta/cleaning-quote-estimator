import React from 'react';
import { Helmet } from 'react-helmet-async';

const PRIMARY = '#1d4ed8';

const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#0f172a',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 14,
  paddingBottom: 12,
  borderBottom: `2px solid ${PRIMARY}`,
  display: 'inline-block',
};

const bodyStyle = { fontSize: 15.5, color: '#475569', lineHeight: 1.75 };

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>

      <div style={{ background: '#fafafa' }}>
        {/* Hero */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '76px 24px 0' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 18 }}>About</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 22 }}>
            Cleaning shouldn&apos;t come with a mystery price tag.
          </h1>
          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.75, maxWidth: 600 }}>
            We built Clean Estimator because no one should have to call three companies and wait on callbacks just to find out what a cleaning job costs.
          </p>
        </div>

        {/* Stat strip */}
        <div style={{ maxWidth: 720, margin: '44px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            {[['9', 'services priced'], ['50', 'states + D.C. covered'], ['$0', 'cost to use']].map(([n, l], i) => (
              <div key={l} style={{ flex: 1, padding: '22px 8px', textAlign: 'center', borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{n}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission — pull quote */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 0' }}>
          <p style={{ fontSize: 23, color: '#0f172a', lineHeight: 1.6, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Our mission is simple: make cleaning prices <span style={{ color: PRIMARY }}>transparent, accessible, and instant</span> &mdash; so you can walk into a conversation with a cleaning company already knowing what to expect.
          </p>
        </div>

        {/* How we price it / Who it's for */}
        <div style={{ maxWidth: 720, margin: '56px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '40px 48px' }}>
            <div>
              <h2 style={labelStyle}>How we price it</h2>
              <p style={bodyStyle}>
                Every estimate comes from industry pricing data and state-by-state cost-of-living adjustments, updated as market rates shift. We show ranges, not single numbers, because the exact price always depends on details only visible in person.
              </p>
            </div>
            <div>
              <h2 style={labelStyle}>Who it&apos;s for</h2>
              <p style={bodyStyle}>
                Homeowners and property managers get fast, unbiased price guidance before they ever pick up the phone. Cleaning companies embed our calculator on their own site to turn visitors into qualified, ready-to-book leads.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer — fine print aside */}
        <div style={{ maxWidth: 720, margin: '56px auto 0', padding: '0 24px' }}>
          <div style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>A note on our numbers</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 600 }}>
              Every estimate is a starting point, not a quote. Actual cost depends on the property&apos;s condition, local competition, and the company you hire. Always get a couple of quotes from licensed, insured pros before booking.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ maxWidth: 720, margin: '64px auto 0', padding: '36px 24px 90px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/cleaning-cost-calculator" style={{ background: PRIMARY, color: 'white', padding: '13px 26px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
            Try the calculator
          </a>
          <a href="/contact" style={{ color: '#0f172a', padding: '12px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15, border: '1px solid #e2e8f0' }}>
            Get in touch
          </a>
        </div>
      </div>
    </>
  );
}
