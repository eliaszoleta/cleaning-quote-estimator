import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Calculator, Home, Building2, ShieldAlert, MessageCircle, Users, Sparkles, Code2, Handshake } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';

const h2Style = { fontSize: 19, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.65, margin: 0 };
const cardStyle = { background: COLORS.surface, borderRadius: RADIUS.lg, padding: 'clamp(18px, 5vw, 32px)', border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.sm };

function IconBadge({ Icon, color, bg }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: RADIUS.sm, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 20px', background: COLORS.surfaceMuted, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}` }}>
      <IconBadge Icon={Icon} color={color} bg={bg} />
      <h3 style={{ fontSize: 15.5, fontWeight: 800, color: COLORS.ink, margin: 0 }}>{title}</h3>
      <p style={{ ...pStyle, fontSize: 13.5, flex: 1 }}>{children}</p>
      <a href={href} style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, textDecoration: 'none' }}>{linkLabel} →</a>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: COLORS.primaryHover, color: 'white', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {number}
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: COLORS.ink, margin: '0 0 4px' }}>{title}</h3>
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
    <div style={{ background: COLORS.surfaceMuted, minHeight: '100vh' }}>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>

      {/* Page Hero -- asymmetric two-column layout instead of the centered
          headline-over-stats pattern used on every other hero band on the
          site. Left: eyebrow/title/subtitle, left-aligned. Right: the three
          stats as a distinct "fact sheet" card (frosted glass, vertical
          list) rather than plain numbers -- gives this page its own
          identity instead of reading as another copy of the same hero. */}
      <div style={{ background: COLORS.heroGradient, padding: 'clamp(40px, 7vw, 72px) 20px clamp(80px, 11vw, 128px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
              About Us
            </div>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, color: 'white', lineHeight: 1.18, marginBottom: 20, letterSpacing: '-0.02em' }}>
              About Clean Estimator
            </h1>
            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.75, maxWidth: 480, margin: 0 }}>
              We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: RADIUS.xl, padding: '4px 28px', backdropFilter: 'blur(8px)' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '20px 0', borderBottom: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{s.number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '-48px auto 0', padding: '0 20px clamp(36px, 7vw, 80px)', position: 'relative' }}>

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
              <ProductCard Icon={Code2} color="#0891b2" bg="#ecfeff" title="Embeddable Widget" href="/estimator" linkLabel="For companies">
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
          <div style={{ background: COLORS.primaryMuted, borderRadius: RADIUS.lg, padding: '28px 32px', border: `1px solid ${COLORS.primaryMutedBorder}` }}>
            <SectionHeading Icon={ShieldAlert} color={COLORS.primaryHover} bg="rgba(255,255,255,0.6)">Disclaimer</SectionHeading>
            <p style={pStyle}>
              Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{ background: COLORS.heroGradient, borderRadius: RADIUS.xl, padding: '40px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -100, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} aria-hidden="true" />
          <div style={{ position: 'relative' }}>
            <div style={{ width: 44, height: 44, borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageCircle size={22} color="#93c5fd" strokeWidth={2.1} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>Questions or Feedback?</h2>
            <p style={{ color: '#cbd5e1', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>We're a small team and we read every message.</p>
            <a
              href="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', background: 'white', color: COLORS.ink, borderRadius: RADIUS.sm, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              Contact Us
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
