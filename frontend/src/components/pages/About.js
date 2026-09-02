import React from 'react';
import { Helmet } from 'react-helmet-async';

const h2Style = { fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.8, marginBottom: 0 };
const cardStyle = { background: 'white', borderRadius: 16, padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

export default function About() {
  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>

      {/* Page Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '64px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(37,99,235,0.18)', filter: 'blur(50px)' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>About Us</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>
            About Clean Estimator
          </h1>
          <p style={{ fontSize: 17, color: '#cbd5e1', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Our mission */}
        <section style={{ marginBottom: 40 }}>
          <div style={cardStyle}>
            <h2 style={h2Style}>Our Mission</h2>
            <p style={pStyle}>
              Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.
            </p>
          </div>
        </section>

        {/* How we calculate prices */}
        <section style={{ marginBottom: 40 }}>
          <div style={cardStyle}>
            <h2 style={h2Style}>How We Calculate Prices</h2>
            <p style={pStyle}>
              Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.
            </p>
          </div>
        </section>

        {/* Who we serve */}
        <section style={{ marginBottom: 40 }}>
          <div style={cardStyle}>
            <h2 style={h2Style}>Who We Serve</h2>
            <p style={pStyle}>
              Clean Estimator serves two groups: (1) homeowners and property managers looking for fast, unbiased price guidance before calling cleaning companies, and (2) cleaning companies who want to embed our calculator on their own websites to capture leads with accurate, localized estimates.
            </p>
          </div>
        </section>

        {/* Disclaimer note */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ background: '#eff6ff', borderRadius: 16, padding: '28px 32px', border: '1px solid #bfdbfe' }}>
            <h2 style={{ ...h2Style, marginTop: 0 }}>Disclaimer</h2>
            <p style={pStyle}>
              Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>Questions or Feedback?</h2>
          <p style={{ color: '#cbd5e1', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>We're a small team and we read every message.</p>
          <a
            href="/contact"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', background: 'white', color: '#0f172a', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Contact Us
          </a>
        </section>

      </div>
    </div>
  );
}
