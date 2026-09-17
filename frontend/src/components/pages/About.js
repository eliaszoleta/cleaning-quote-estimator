import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert, MessageCircle, Sparkles, Code2, Handshake } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';

const h2Style = { fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.65, margin: 0 };

function IconBadge({ Icon, color, bg }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: RADIUS.sm, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={21} strokeWidth={2.1} />
    </div>
  );
}

function ProductCard({ Icon, color, bg, title, children, href, linkLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 20px', background: COLORS.surface, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.sm }}>
      <IconBadge Icon={Icon} color={color} bg={bg} />
      <h3 style={{ fontSize: 15.5, fontWeight: 800, color: COLORS.ink, margin: 0 }}>{title}</h3>
      <p style={{ ...pStyle, fontSize: 13.5, flex: 1 }}>{children}</p>
      <a href={href} style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, textDecoration: 'none' }}>{linkLabel} →</a>
    </div>
  );
}

// Connected timeline instead of a plain stacked list -- the vertical rule
// between step circles is what makes this read as a sequence rather than
// three disconnected list items, without needing a card to contain it.
function Step({ number, title, children, isLast }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: COLORS.primaryHover, color: 'white', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {number}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, background: COLORS.border, marginTop: 6, minHeight: 24 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 26 }}>
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

      {/* Page Hero -- same centered, single-column layout as the Website +
          Chatbot hero (eyebrow / h1 / subtitle, calm type scale), instead
          of the asymmetric two-column version this had before. Stat row
          keeps the same hairline-separated treatment underneath, sized down
          to match. */}
      <div style={{ background: COLORS.heroGradient, color: 'white', padding: 'clamp(40px, 9vw, 96px) 20px clamp(48px, 9vw, 96px)' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>
            About Us
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, lineHeight: 1.3, marginBottom: 16, letterSpacing: '-0.5px' }}>
            About Clean Estimator
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 540, margin: '0 auto', lineHeight: 1.55 }}>
            We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '36px auto 0', flexWrap: 'wrap', rowGap: 16 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.14)', margin: '0 28px' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{s.number}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '-28px auto 0', padding: '0 20px clamp(36px, 7vw, 80px)', position: 'relative' }}>

        {/* Our mission -- an opening statement rather than a card, so the
            page reads as an editorial piece first and a stack of feature
            boxes second. Thin accent rule gives it structure without a
            border/shadow/icon-badge treatment repeated seven more times
            down the page. */}
        <section style={{ marginBottom: 52, paddingLeft: 20, borderLeft: `3px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Our Mission
          </div>
          <p style={{ fontSize: 'clamp(17px, 2.4vw, 21px)', color: COLORS.ink, lineHeight: 1.6, fontWeight: 500, margin: 0, maxWidth: 640 }}>
            Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.
          </p>
        </section>

        {/* What we offer -- the actual product lineup, not just the public
            calculator: the embeddable widget and the local partner program
            are both real, separate things a visitor might not know exist
            from the hero copy alone. Cards here are the one place a card
            grid actually earns its keep -- three distinct products really
            do read best side by side. */}
        <section style={{ marginBottom: 52 }}>
          <h2 style={{ ...h2Style, marginBottom: 10 }}>What We Offer</h2>
          <p style={{ ...pStyle, marginBottom: 24, maxWidth: 640 }}>
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
        </section>

        {/* How it works -- connected timeline, no card */}
        <section style={{ marginBottom: 52 }}>
          <h2 style={{ ...h2Style, marginBottom: 24 }}>How It Works</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Step number={1} title="Pick a service">
              House cleaning, carpet cleaning, commercial cleaning, mold remediation, and more — 9 services in total, each with its own quick questions.
            </Step>
            <Step number={2} title="Answer a few quick questions">
              Home size, condition, how often you want service, and your state — that's it. No phone calls, no waiting on a callback.
            </Step>
            <Step number={3} title="Get your instant price range" isLast>
              See a real, state-adjusted price range in under a minute, plus the full breakdown of exactly what's driving that number.
            </Step>
          </div>
        </section>

        {/* How we calculate prices -- plain prose, same as Who We Serve
            below, so the page alternates between prose and the one
            legitimate card grid instead of boxing every section. */}
        <section style={{ marginBottom: 52, maxWidth: 640 }}>
          <h2 style={{ ...h2Style, marginBottom: 10 }}>How We Calculate Prices</h2>
          <p style={pStyle}>
            Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.
          </p>
        </section>

        {/* Who we serve */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ ...h2Style, marginBottom: 18 }}>Who We Serve</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px 32px' }}>
            <p style={pStyle}>
              <strong style={{ color: COLORS.ink }}>Homeowners &amp; property managers</strong> looking for fast, unbiased price guidance before calling cleaning companies.
            </p>
            <p style={pStyle}>
              <strong style={{ color: COLORS.ink }}>Cleaning companies</strong> who want to embed our calculator on their own site to capture leads with accurate, localized estimates.
            </p>
          </div>
        </section>

        {/* Disclaimer note -- the one place a tinted box is warranted, since
            it's a genuine notice that should visually stand apart from the
            surrounding prose, not another repeat of the same card style. */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ background: COLORS.primaryMuted, borderRadius: RADIUS.lg, padding: '18px 22px', border: `1px solid ${COLORS.primaryMutedBorder}`, display: 'flex', gap: 12 }}>
            <ShieldAlert size={18} color={COLORS.primaryHover} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ ...pStyle, fontSize: 13.5 }}>
              <strong style={{ color: COLORS.primaryHover }}>Disclaimer:</strong> Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
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
