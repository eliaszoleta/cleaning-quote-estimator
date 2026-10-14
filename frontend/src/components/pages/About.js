import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert, MessageCircle, Sparkles, Code2, Handshake, Lightbulb } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';
import './PageHero.css';

const h2Style = { fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.01em' };
const pStyle = { fontSize: 14.5, color: '#334155', lineHeight: 1.65, margin: 0 };

function IconBadge({ Icon, color, bg }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: RADIUS.sm, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={21} strokeWidth={2.1} />
    </div>
  );
}

// Horizontal icon-left / content-right layout -- once the card stretches
// full width (stacked instead of a 3-column grid), a vertical icon-on-top
// layout leaves the text narrow and stranded on the left with empty space
// on the right. This lets the title/paragraph use the full card width.
function ProductCard({ Icon, color, bg, title, children, href, linkLabel }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: '22px 24px', background: COLORS.surface, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.sm }}>
      <IconBadge Icon={Icon} color={color} bg={bg} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 800, color: COLORS.ink, margin: '0 0 6px' }}>{title}</h3>
        <p style={{ ...pStyle, fontSize: 13.5, marginBottom: 10 }}>{children}</p>
        <a href={href} style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, textDecoration: 'none' }}>{linkLabel} →</a>
      </div>
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
  { number: '10', label: 'Service types' },
  { number: '100%', label: 'Free, no signup' },
];

export default function About() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Helmet>
        <title>About Clean Estimator | Free Cleaning Cost Estimator</title>
        <meta name="description" content="Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/about" />
      </Helmet>

      {/* Page Hero -- same dark band / glow / left-aligned title+subtitle
          layout as the blog page hero (BlogIndex.js). Horizontal padding
          moves off the band and onto the inner block using the exact same
          maxWidth(760)+padding(20px)+margin:auto box as the body content
          wrapper below, so the title/subtitle line up with the body text
          instead of the wider 900px hero container. Vertical padding uses
          clamp() with the same max as before, so desktop is unchanged but
          the band gets noticeably shorter on mobile. */}
      <div className="page-hero-band" style={{ padding: 'clamp(18px, 5vw, 40px) 0 72px' }}>
        <div className="page-hero-glow" aria-hidden="true" />
        <div className="page-hero-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', textAlign: 'left' }}>
          <div style={{ display: 'inline-block', background: 'rgba(37,99,235,0.25)', color: '#93c5fd', padding: '5px 14px', borderRadius: RADIUS.pill, fontSize: 13, fontWeight: 600, marginBottom: 16, border: '1px solid rgba(37,99,235,0.35)' }}>
            About Clean Estimator
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 8, letterSpacing: '-0.01em' }}>
            Instant Quoting for Cleaning Businesses
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.55, maxWidth: 640, marginBottom: 24 }}>
            Clean Estimator started as a quoting problem for cleaning businesses: slow, manual pricing loses leads to whoever calls the prospect back first. We built an instant, accurate quoting engine cleaning companies could put to work right away — and opened a free version so homeowners get the same price transparency before they ever pick up the phone.
          </p>

          {/* Stats as frosted pills inside the hero itself, rather than a
              disconnected hairline-divided row in the light body below --
              reads as part of the same statement instead of a separate
              afterthought section. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: RADIUS.pill, padding: '8px 16px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{s.number}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px clamp(36px, 7vw, 80px)', position: 'relative' }}>

        {/* Content card sunk into the hero band's bottom edge, same
            treatment as BlogPost.js -- plus the identical "free estimate"
            CTA bar at the top of it, since a visitor reading about the
            company is exactly who that nudge toward the free calculator
            is for. */}
        <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 'clamp(18px, 5vw, 36px) clamp(16px, 4.5vw, 36px)', marginTop: -48, boxShadow: '0 8px 30px rgba(15,23,42,0.08)', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f8ff)', border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: 14, padding: 'clamp(14px, 4vw, 18px) clamp(14px, 4vw, 22px)', marginBottom: 'clamp(24px, 6vw, 36px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Lightbulb size={17} strokeWidth={2} /> Get a free local estimate for your project
            </span>
            <a href="/" style={{ background: COLORS.primary, color: 'white', padding: '9px 20px', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>Use Free Calculator &#8594;</a>
          </div>

        {/* Our mission -- a soft tinted card instead of a plain left-rule
            paragraph, so it reads as a designed statement piece up top
            rather than blending into the editorial prose below it. */}
        <section style={{ marginBottom: 52 }}>
          <div style={{ background: COLORS.primaryMuted, border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: RADIUS.xl, padding: 'clamp(22px, 5vw, 30px) clamp(22px, 5vw, 34px)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Our Mission
            </div>
            <p style={{ fontSize: 'clamp(15px, 4vw, 21px)', color: COLORS.ink, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
              Give cleaning businesses an instant, accurate quoting tool that turns website visitors into booked jobs instead of lost leads — and give homeowners that same price transparency, so every conversation starts with real numbers instead of a guessing game.
            </p>
          </div>
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
            Clean Estimator is three things working together: an internal quoting tool cleaning companies use to run unlimited, accurate on-screen estimates for their own jobs — with a white-labeled calculator widget for their website included whenever they also want public lead capture — a local partner program that turns estimate requests into real jobs, and a free public calculator anyone can use to see typical pricing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProductCard Icon={Code2} color="#0891b2" bg="#ecfeff" title="Internal Estimator" href="/estimator" linkLabel="For companies">
              Cleaning companies get unlimited, accurate on-screen estimates to quote jobs instantly — on the phone, during a walkthrough, or from the office — with a white-labeled widget for their own website included at no extra cost whenever they want public lead capture too.
            </ProductCard>
            <ProductCard Icon={Handshake} color="#db2777" bg="#fdf2f8" title="Local Partner Program" href="/partner-with-us" linkLabel="Get leads">
              We connect visitors who want a real quote with an exclusive local cleaning partner in their city — a warm, ready-to-call lead instead of a cold listing.
            </ProductCard>
            <ProductCard Icon={Sparkles} color="#d97706" bg="#fffbeb" title="Free Cost Calculator" href="/cleaning-cost-calculator" linkLabel="Try it">
              Instant price ranges for house cleaning, carpet cleaning, commercial cleaning, and 7 other services — no signup, no phone calls.
            </ProductCard>
          </div>
        </section>

        {/* How it works -- connected timeline, no card */}
        <section style={{ marginBottom: 52 }}>
          <h2 style={{ ...h2Style, marginBottom: 24 }}>How It Works</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Step number={1} title="Pick a service">
              House cleaning, carpet cleaning, commercial cleaning, mold remediation, and more — 10 services in total, each with its own quick questions.
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
              <strong style={{ color: COLORS.ink }}>Cleaning companies</strong> who want to quote instantly on their own site, capture more leads, and stop losing jobs to slower competitors.
            </p>
            <p style={pStyle}>
              <strong style={{ color: COLORS.ink }}>Homeowners &amp; property managers</strong> looking for fast, unbiased price guidance before calling cleaning companies.
            </p>
          </div>
        </section>

        {/* Disclaimer note -- the one place a tinted box is warranted, since
            it's a genuine notice that should visually stand apart from the
            surrounding prose, not another repeat of the same card style. */}
        <section style={{ marginBottom: 0 }}>
          <div style={{ background: COLORS.primaryMuted, borderRadius: RADIUS.lg, padding: '18px 22px', border: `1px solid ${COLORS.primaryMutedBorder}`, display: 'flex', gap: 12 }}>
            <ShieldAlert size={18} color={COLORS.primaryHover} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ ...pStyle, fontSize: 13.5 }}>
              <strong style={{ color: COLORS.primaryHover }}>Disclaimer:</strong> Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking.
            </p>
          </div>
        </section>
        </div>

        {/* Contact CTA */}
        <section style={{ background: COLORS.heroGradient, borderRadius: RADIUS.xl, padding: '40px 32px', marginTop: 40, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
