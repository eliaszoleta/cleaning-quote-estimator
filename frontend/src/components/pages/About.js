import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Calculator, Home, Building2, ShieldAlert, MessageCircle, Users, Sparkles, Code2, Handshake } from 'lucide-react';

const h2Style = { fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.8, margin: 0 };
const cardStyle = { background: 'white', borderRadius: 10, padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

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

function ProductCard({ Icon, color, bg, title, children, href, linkLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <IconBadge Icon={Icon} color={color} bg={bg} />
      <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h3>
      <p style={{ ...pStyle, fontSize: 13.5, flex: 1 }}>{children}</p>
      <a href={href} style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>{linkLabel} →</a>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1d4ed8', color: 'white', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {number}
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{title}</h3>
        <p style={{ ...pStyle, fontSize: 13.5 }}>{children}</p>
      </div>
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

      {/* Page Hero -- deliberately restrained: no gradient blob, no pill
          button. A thin accent rule + small-caps eyebrow do the "this is a
          distinct section" job a badge used to, with less visual noise;
          the stat row drops the boxed/bordered grid for plain numbers
          separated by a hairline, closer to how a stat line reads in
          editorial design than a dashboard widget. */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ width: 44, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #818cf8)', margin: '0 auto 24px' }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
            About Us
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, color: 'white', lineHeight: 1.18, marginBottom: 20, letterSpacing: '-0.02em' }}>
            About Clean Estimator
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.75, maxWidth: 540, margin: '0 auto' }}>
            We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '52px auto 0' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.14)', margin: '0 32px' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 23, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{s.number}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
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

        {/* What we offer -- the actual product lineup, not just the public
            calculator: the embeddable widget and the local partner program
            are both real, separate things a visitor might not know exist
            from the hero copy alone. */}
        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <SectionHeading Icon={Sparkles} color="#0f172a" bg="#f1f5f9">What We Offer</SectionHeading>
            <p style={{ ...pStyle, marginBottom: 20 }}>
              Clean Estimator is three things working together: a free pricing tool for anyone comparing cleaning costs, a white-labeled version of that same tool cleaning companies embed on their own site, and a local partner program that turns those estimates into real leads.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <ProductCard Icon={Sparkles} color="#d97706" bg="#fffbeb" title="Free Cost Calculator" href="/cleaning-cost-calculator" linkLabel="Try it">
                Instant price ranges for house cleaning, carpet cleaning, commercial cleaning, and 6 other services — no signup, no phone calls.
              </ProductCard>
              <ProductCard Icon={Code2} color="#0891b2" bg="#ecfeff" title="Embeddable Widget" href="/for-companies" linkLabel="For companies">
                Cleaning companies embed our calculator on their own site — their logo, their colors, their own markup — to capture leads instead of losing visitors to a contact form.
              </ProductCard>
              <ProductCard Icon={Handshake} color="#db2777" bg="#fdf2f8" title="Local Partner Program" href="/partner-with-us" linkLabel="Get leads">
                We connect visitors who want a real quote with an exclusive local cleaning partner in their city — a warm, ready-to-call lead instead of a cold listing.
              </ProductCard>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <h2 style={{ ...h2Style, marginBottom: 20 }}>How It Works</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Step number={1} title="Pick a service">
                House cleaning, carpet cleaning, commercial cleaning, mold remediation, and more — 9 services in total, each with its own quick questions.
              </Step>
              <Step number={2} title="Answer a few quick questions">
                Home size, condition, how often you want service, and your state — that's it. No phone calls, no waiting on a callback.
              </Step>
              <Step number={3} title="Get your instant price range">
                See a real, state-adjusted price range in under a minute, plus the full breakdown of exactly what's driving that number.
              </Step>
            </div>
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
            <SectionHeading Icon={Users} color="#4f46e5" bg="#eef2ff">Who We Serve</SectionHeading>
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
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: '28px 32px', border: '1px solid #bfdbfe' }}>
            <SectionHeading Icon={ShieldAlert} color="#1e40af" bg="rgba(255,255,255,0.6)">Disclaimer</SectionHeading>
            <p style={pStyle}>
              Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 14, padding: '40px 32px', textAlign: 'center' }}>
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
