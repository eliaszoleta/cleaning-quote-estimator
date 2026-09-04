import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Calculator, Home, Building2, ShieldAlert, MessageCircle } from 'lucide-react';

const h2Style = { fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.8, margin: 0 };
const cardStyle = { background: 'white', borderRadius: 16, padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

function IconBadge({ Icon, color, bg }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={21} strokeWidth={2.1} />
    </div>
  );
}

function SectionHeading({ Icon, color, bg, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <IconBadge Icon={Icon} color={color} bg={bg} />
      <h2 style={h2Style}>{children}</h2>
    </div>
  );
}

const STATS = [
  { number: '50', label: 'States covered' },
  { number: '9', label: 'Service types' },
  { number: '100%', label: 'Free, no signup' },
];

export default function About() {
  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>

      {/* Page Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '64px 24px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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

        {/* Stat strip -- bridges the dark hero into the page instead of an abrupt cut to white cards */}
        <div style={{ position: 'relative', maxWidth: 480, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '20px 8px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{s.number}</div>
              <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Our mission */}
        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <SectionHeading Icon={Target} color="#1d4ed8" bg="#eff6ff">Our Mission</SectionHeading>
            <p style={pStyle}>
              Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.
            </p>
          </div>
        </section>

        {/* How we calculate prices */}
        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <SectionHeading Icon={Calculator} color="#7c3aed" bg="#f5f3ff">How We Calculate Prices</SectionHeading>
            <p style={pStyle}>
              Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.
            </p>
          </div>
        </section>

        {/* Who we serve */}
        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <h2 style={{ ...h2Style, marginBottom: 20 }}>Who We Serve</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <IconBadge Icon={Home} color="#16a34a" bg="#f0fdf4" />
                <p style={pStyle}>
                  <strong style={{ color: '#0f172a' }}>Homeowners &amp; property managers</strong> looking for fast, unbiased price guidance before calling cleaning companies.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <IconBadge Icon={Building2} color="#ea580c" bg="#fff7ed" />
                <p style={pStyle}>
                  <strong style={{ color: '#0f172a' }}>Cleaning companies</strong> who want to embed our calculator on their own site to capture leads with accurate, localized estimates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer note */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ background: '#eff6ff', borderRadius: 16, padding: '28px 32px', border: '1px solid #bfdbfe' }}>
            <SectionHeading Icon={ShieldAlert} color="#1e40af" bg="rgba(255,255,255,0.6)">Disclaimer</SectionHeading>
            <p style={pStyle}>
              Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MessageCircle size={22} color="#93c5fd" strokeWidth={2.1} />
          </div>
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
