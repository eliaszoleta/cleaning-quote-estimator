import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ClipboardList, MapPin, Settings, Check, Star,
  Quote, ShieldCheck, Zap, ArrowRight, Rocket, Sparkles, Tag,
  Building2, TrendingDown, Filter, Mail, Code2, Lock, Send,
} from 'lucide-react';
import Header from '../ui/Header';
import Footer from '../ui/Footer';

const PRIMARY = '#1d4ed8';

// One plan, one accurate pricing engine -- used internally by default, with
// a calculator widget for the company's website included for anyone who
// also wants public lead capture.
const FEATURES = [
  { Icon: Zap,           color: '#7c3aed', bg: '#f5f3ff', title: 'Unlimited internal calculations', desc: 'Run as many estimates as you need, every month, with no per-quote cost.' },
  { Icon: Lock,          color: '#1d4ed8', bg: '#eff6ff', title: 'Instant result, nothing public',  desc: "See the number immediately on your own screen — it's never shown to a customer unless you decide to share it." },
  { Icon: Send,          color: '#0d9488', bg: '#f0fdfa', title: 'Email a result to a coworker',    desc: 'One click sends a specific estimate to a teammate\'s inbox — no shared logins needed.' },
  { Icon: MapPin,        color: '#059669', bg: '#ecfdf5', title: 'ZIP-code accurate pricing',       desc: 'State-specific pricing multipliers ensure your quotes reflect your local market.' },
  { Icon: Settings,      color: '#ea580c', bg: '#fff7ed', title: 'Per-service markup control',      desc: 'Want to add your own margin on top? Set your own markup for each service, and every quote automatically includes it.' },
  { Icon: ClipboardList, color: '#2563eb', bg: '#fdf4ff', title: 'All 12 service calculators',       desc: 'Regular cleaning, deep clean, move-out, Airbnb turnover, post-construction, and more.' },
  { Icon: Code2,         color: '#0891b2', bg: '#ecfeff', title: 'Calculator widget for your website', desc: 'Want public lead capture too? The same plan includes an embeddable, white-label calculator widget for your site — no upgrade required.' },
];

// Why we moved away from pitching a public price-range widget as the
// default: showing a customer a minimum price before they've even talked
// to you invites exactly the lowballing a business owner doesn't want.
const PROBLEMS = [
  { Icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', title: 'Customers negotiate toward the floor', desc: 'Show someone a "$249–$319" range and they\'ll push for $249 every time — even on jobs that should price higher.' },
  { Icon: Filter,       color: '#d97706', bg: '#fffbeb', title: 'A public price invites tire-kickers',  desc: 'Price-shoppers who were never going to book will happily grab a number and move on to the next cheaper quote.' },
  { Icon: ShieldCheck,  color: '#16a34a', bg: '#f0fdf4', title: 'Keep pricing power on your side',       desc: 'Run the numbers yourself, quote with confidence, and only show a price when you decide to.' },
];

const STEPS = [
  { n: '1', Icon: Rocket,   color: '#1d4ed8', bg: '#eff6ff', title: 'Sign up',               desc: 'Create your account and start your 14-day free trial.' },
  { n: '2', Icon: Settings, color: '#7c3aed', bg: '#f5f3ff', title: 'Set up your profile',    desc: 'Add your logo, service area, and the services you offer — accurate pricing is already built in.' },
  { n: '3', Icon: Zap,      color: '#ea580c', bg: '#fff7ed', title: 'Run instant estimates',  desc: 'Get an accurate number the moment you need one — for your own quoting, not a public page.' },
  { n: '4', Icon: Code2,    color: '#0891b2', bg: '#ecfeff', title: 'Embed it too, if you want', desc: "Want leads coming straight from your website? Paste its calculator widget code on your site anytime — it's included." },
];

const TESTIMONIALS = [
  { name: 'Daniel K.', company: 'KeyStone Cleaning Co. — Dewey, OK',  text: "We stopped showing customers a price range. I run the numbers myself in two minutes flat and text over a confident quote — no more haggling from the bottom of a range." },
  { name: 'Sarah M.',  company: 'Sparkle Cleaning Services — Austin, TX', text: "We embedded it on our site too and it's generated 47 qualified leads in 4 months. Conversion rate is way higher than our contact form because visitors are pre-qualified." },
  { name: 'Maria L.',  company: 'Crystal Clean Commercial — Miami, FL',  text: "My estimators run it on their phones during walkthroughs and email me the number before they even leave the driveway. Every one of them quotes the exact same job the exact same price now — that never happened when pricing lived in everyone's head." },
];

const PLAN_FEATURES = [
  'Unlimited Price Calculations',
  'Instant On-Screen Results',
  'All 12 Service Calculators',
  'One-Click Result Sharing with Coworkers',
  'ZIP-Code-Based Local Pricing',
  'Per-Service Markups',
  'Website Widget for Lead Capture',
  'Instant Email Lead Alerts',
  'API Access for Integrations',
];

const TRUST_BADGES = [
  { Icon: ShieldCheck, text: '14-day free trial' },
  { Icon: Zap,          text: 'First estimate in 2 minutes' },
  { Icon: Check,        text: 'Cancel anytime' },
];

const cardStyle = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' };

function FeatureIcon({ Icon, color, bg }) {
  return (
    <div className="ce-feature-icon" style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={19} color={color} strokeWidth={1.9} />
    </div>
  );
}

// Nudges the icon 3px on hover -- applied inside any .ce-btn-* link so the
// button feels responsive to the cursor instead of just changing color.
function Arrow({ size }) {
  return <span className="ce-arrow"><ArrowRight size={size} /></span>;
}

// Real results across a few of the 12 service types -- shows the range of
// what the engine actually prices, not just the one "pick a service" step
// a single static screenshot used to freeze on.
const HERO_GALLERY = [
  { src: '/images/marketing/hero-result-commercial.png', alt: 'Commercial cleaning estimate result' },
  { src: '/images/marketing/hero-result-water-damage.png', alt: 'Water damage restoration estimate result' },
  { src: '/images/marketing/hero-result-mold-remediation.png', alt: 'Mold remediation estimate result' },
  { src: '/images/marketing/hero-result-apartment.png', alt: 'Apartment cleaning estimate result' },
  { src: '/images/marketing/hero-result-carpet.png', alt: 'Carpet cleaning estimate result' },
  { src: '/images/marketing/hero-result-tile-grout.png', alt: 'Tile and grout cleaning estimate result' },
  { src: '/images/marketing/hero-result-air-duct.png', alt: 'Air duct cleaning estimate result' },
  { src: '/images/marketing/hero-result-house-cleaning.png', alt: 'House cleaning estimate result' },
];

// Auto-advancing slideshow of real result screenshots -- no browser-chrome
// wrapper around it, just the screenshots themselves crossfading, since the
// fake "yourcompany.com" address bar implied a public website page when
// these are actually internal results. Fixed-height + object-fit cover
// keeps the frame a constant size while the slides crossfade, even though
// the screenshots themselves are different heights (a commercial estimate's
// breakdown table is taller than a carpet one's).
function WidgetPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % HERO_GALLERY.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ce-float" style={{ position: 'relative' }}>
      <div style={{ position: 'relative', width: '100%', height: 'clamp(380px, 52vw, 520px)', borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 30px 70px -20px rgba(2,6,23,0.55), 0 8px 20px rgba(2,6,23,0.25)' }}>
        {HERO_GALLERY.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'top center',
              opacity: i === index ? 1 : 0,
              transition: 'opacity 0.7s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {HERO_GALLERY.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            style={{
              width: i === index ? 16 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
              background: i === index ? PRIMARY : 'rgba(255,255,255,0.35)', transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Floating "instant result" chip -- intentionally doesn't show a
          price, since the whole point of the Internal Estimator (now the
          primary pitch on this page) is that the number stays off any
          public-facing screen. */}
      <div style={{
        position: 'absolute', left: -18, bottom: -22, display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', borderRadius: 12, padding: '11px 16px 11px 12px',
        boxShadow: '0 14px 32px -8px rgba(2,6,23,0.35)', border: '1px solid #f1f5f9',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={14} color="#2563eb" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Estimate ready</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94a3b8' }}>
            <span className="ce-pulse-dot" /> calculated in 2 seconds &middot; yours alone
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyLanding() {
  return (
    <>
      <Helmet>
        <title>Internal Cleaning Price Estimator for Cleaning Companies | Clean Estimator</title>
        <meta name="description" content="An internal pricing tool for cleaning businesses. Run unlimited accurate estimates instantly on screen — with a calculator widget for your website included if you also want public lead capture. $25/month, 14-day free trial." />
        <link rel="canonical" href="https://www.cleanestimator.com/estimator" />
      </Helmet>
      <div className="app">
        <Header />
        <main>

          {/* Hero -- a pill eyebrow badge (matching the "Simple onboarding"
              / "Pricing" pills further down this same page) and a couple of
              soft glow blobs instead of a flat gradient, plus a two-column
              layout with a small static "product shot" of the widget so the
              page shows the thing it's selling instead of only describing it. */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: 'clamp(48px, 7vw, 80px) 0', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -100, right: '6%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: -120, left: '2%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.16), transparent 70%)', pointerEvents: 'none' }} />
            {/* maxWidth 1200 + padding 24px, matching Header.js's own
                container exactly, so the hero content's left edge lines
                up with the logo instead of sitting further left under a
                wider 1320px container. */}
            <div className="ce-hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gap: 56, alignItems: 'center', position: 'relative' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(96,165,250,0.12)', color: '#93c5fd', padding: '6px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', border: '1px solid rgba(96,165,250,0.3)', marginBottom: 18 }}>
                  <Building2 size={12} />
                  For cleaning companies
                </span>
                <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, lineHeight: 1.3, marginBottom: 16, letterSpacing: '-0.5px', color: 'white' }}>
                  Price every job right<br />
                  <span style={{ color: '#60a5fa' }}>without tipping your hand</span>
                </h1>
                <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 480, marginBottom: 32, lineHeight: 1.65 }}>
                  Clean Estimator is an internal pricing tool for cleaning businesses: unlimited, instant,{' '}
                  <span style={{ position: 'relative', fontWeight: 700, color: '#78350f', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', inset: '2px -2px', background: '#fde047', borderRadius: '3px 7px 4px 8px / 5px 3px 6px 4px', transform: 'rotate(-0.6deg)', zIndex: 0 }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>on-screen estimates</span>
                  </span>
                  {' '}ready the second you click — no more guessing what to charge. Want a public-facing version for your website too? It's included — no separate plan to buy.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/company?mode=signup" className="ce-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
                    Start Free Trial <Arrow size={16} />
                  </a>
                  <a href="#pricing" className="ce-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                    See Pricing
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 560 }}>
                  <WidgetPreview />
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '22px 24px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 40px' }}>
              {TRUST_BADGES.map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13.5, fontWeight: 600 }}>
                  <Icon size={15} color="#16a34a" strokeWidth={2.3} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* The "why" -- makes the case for keeping pricing internal before
              the page asks for a sale, since that's the actual strategic
              shift this redesign represents. */}
          <div style={{ padding: 'clamp(40px, 9vw, 84px) 20px', maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #fecaca' }}>
                <Lock size={12} />
                Why go internal
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>A public price range works against you</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 'clamp(28px, 6vw, 52px)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
              That's why most companies on Clean Estimator now run pricing internally instead of publishing it.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {PROBLEMS.map(({ Icon, color, bg, title, desc }) => (
                <div key={title} className="ce-card" style={{ ...cardStyle, padding: '24px 22px' }}>
                  <FeatureIcon Icon={Icon} color={color} bg={bg} />
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '16px 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features -- the shared pricing engine both plans run on. */}
          <div style={{ background: '#f8fafc', padding: 'clamp(40px, 9vw, 84px) 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>One accurate pricing engine, two ways to use it</h2>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 'clamp(28px, 6vw, 52px)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>Keep it internal, or put it on your website — the calculations underneath are the same either way.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                {FEATURES.map(({ Icon, color, bg, title, desc }) => (
                  <div key={title} className="ce-card" style={{ ...cardStyle, padding: '24px 22px' }}>
                    <FeatureIcon Icon={Icon} color={color} bg={bg} />
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '16px 0 8px' }}>{title}</h3>
                    <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How it works -- an icon+number "stepper" badge per card (icon
              says what the step is, the small numbered dot says where it
              falls in the sequence) with a connecting arrow between cards
              on wide screens, instead of a bare numbered square. */}
          <div style={{ padding: 'clamp(40px, 9vw, 84px) 20px', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -80, right: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
              <div className="ce-onboarding-eyebrow-wrap" style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: PRIMARY, padding: '6px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #dbeafe' }}>
                  <Sparkles size={12} />
                  Simple onboarding
                </span>
              </div>
              <h2 className="ce-onboarding-heading" style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>Start quoting in minutes</h2>
              <p className="ce-onboarding-desc" style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 'clamp(28px, 6vw, 52px)' }}>No developer needed. Easy to use.</p>
              <div className="ce-steps-grid">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.n}>
                    <div className="ce-card" style={{ ...cardStyle, padding: '26px 22px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: PRIMARY }} />
                      <div style={{ position: 'relative', width: 42, height: 42, marginBottom: 16 }}>
                        <div className="ce-feature-icon" style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <s.Icon size={19} color={s.color} strokeWidth={1.9} />
                        </div>
                        <div className="ce-step-badge" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: PRIMARY, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, border: '2px solid white', boxShadow: '0 1px 3px rgba(15,23,42,0.15)' }}>{s.n}</div>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: 15.5, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                      <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="ce-step-arrow" aria-hidden="true">
                        <ArrowRight size={18} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: 'clamp(40px, 9vw, 84px) 20px' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
              <h2 className="ce-testimonials-heading" style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 'clamp(24px, 5vw, 44px)', letterSpacing: '-0.4px' }}>What cleaning companies say</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                {TESTIMONIALS.map(t => (
                  <div key={t.name} className="ce-card" style={{ ...cardStyle, padding: '24px 22px' }}>
                    <Quote size={20} color="#dbeafe" fill="#dbeafe" style={{ marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />
                      ))}
                    </div>
                    <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, marginBottom: 18 }}>{t.text}</p>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{t.company}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing + closing CTA, merged into one section -- one plan, one
              call to action, same as before the two-way split was tried. */}
          <div id="pricing" style={{ padding: 'clamp(40px, 9vw, 84px) 20px', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -60, left: '4%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center', position: 'relative' }}>

              <div>
                <span className="ce-pricing-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: PRIMARY, padding: '6px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #dbeafe', marginBottom: 16 }}>
                  <Tag size={12} />
                  Pricing
                </span>
                <h2 className="ce-pricing-heading" style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 700, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.4px' }}>Simple, transparent pricing</h2>
                <p className="ce-pricing-desc" style={{ color: '#64748b', fontSize: 16, lineHeight: 1.65, marginBottom: 28, maxWidth: 400 }}>
                  One plan, everything included, no surprises. Run it as your internal pricing tool from day one, or add it as a calculator widget on your website whenever you're ready, at no extra cost.
                </p>
                <div className="ce-trust-badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, maxWidth: 420 }}>
                  {TRUST_BADGES.map(({ Icon, text }) => (
                    <div key={text} className="ce-card ce-trust-badge-card" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 11, padding: '12px 14px' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color="#16a34a" strokeWidth={2.3} />
                      </div>
                      <span style={{ color: '#334155', fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ce-card" style={{ ...cardStyle, borderRadius: 14, padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #818cf8)' }} />
                <div style={{ padding: '24px 24px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Lock size={22} color={PRIMARY} strokeWidth={2} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.3px' }}>Internal Estimator</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>$25</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Per month</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}>
                    <Zap size={12} /> 14-day free trial
                  </div>
                  <a href="/company?mode=signup" className="ce-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PRIMARY, color: 'white', padding: '13px 0', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    Start Free Trial <Arrow size={15} />
                  </a>
                  <div style={{ color: '#94a3b8', fontSize: 11.5, textAlign: 'center', marginBottom: 14 }}>
                    Card required to start — you won't be charged for 14 days.
                  </div>
                  <div style={{ height: 1, background: '#e2e8f0', marginBottom: 14 }} />
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Everything included:</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                    {PLAN_FEATURES.map(item => (
                      <li key={item} className="ce-plan-feature" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: '#374151' }}>
                        <span className="ce-plan-feature-dot" style={{ borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Check size={10} color="#16a34a" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12.5, marginTop: 32 }}>
              <Mail size={13} style={{ verticalAlign: -2, marginRight: 6 }} /> Questions? Email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb' }}>info@cleanestimator.com</a> and we'll help you get set up.
            </p>
          </div>

        </main>
        <Footer />
      </div>

      {/* Small, tasteful motion only -- a hover lift on cards/badges, an
          arrow nudge on buttons, a slow idle float on the hero mockup, and
          a live-status pulse on its "instant result" chip. Respects
          prefers-reduced-motion. */}
      <style>{`
        .ce-hero-grid { grid-template-columns: minmax(320px, 1fr) minmax(440px, 560px); }
        @media (max-width: 900px) { .ce-hero-grid { grid-template-columns: 1fr; } }
        .ce-steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; align-items: stretch; }
        .ce-step-arrow { display: none; }
        @media (min-width: 900px) {
          .ce-steps-grid { grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr; }
          .ce-step-arrow { display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
        }
        .ce-plan-feature { margin-bottom: 7px; font-size: 14px; line-height: 1.3; }
        .ce-plan-feature-dot { width: 17px; height: 17px; }
        @media (max-width: 480px) {
          .ce-plan-feature { margin-bottom: 5px; font-size: 15px; line-height: 1.3; }
          .ce-plan-feature-dot { width: 16px; height: 16px; }
          .ce-pricing-eyebrow { margin-bottom: 10px !important; }
          .ce-pricing-heading { margin-bottom: 8px !important; }
          .ce-pricing-desc { margin-bottom: 16px !important; font-size: 14px !important; line-height: 1.5 !important; }
          .ce-trust-badges-grid { gap: 8px !important; }
          .ce-trust-badge-card { padding: 9px 14px !important; }
          .ce-onboarding-eyebrow-wrap { margin-bottom: 8px !important; }
          .ce-onboarding-heading { margin-bottom: 6px !important; }
          .ce-onboarding-desc { margin-bottom: 22px !important; }
          .ce-testimonials-heading { margin-bottom: 18px !important; font-size: 21px !important; white-space: nowrap; }
        }
        .ce-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .ce-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px -10px rgba(15,23,42,0.16); border-color: #bfdbfe; }
        .ce-feature-icon { transition: transform 0.2s ease; }
        .ce-card:hover .ce-feature-icon { transform: scale(1.08) rotate(-2deg); }
        .ce-step-badge { transition: background 0.2s ease, color 0.2s ease; }
        .ce-card:hover .ce-step-badge { background: ${PRIMARY}; color: white; }
        .ce-btn-primary, .ce-btn-secondary { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .ce-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(29,78,216,0.45); }
        .ce-btn-secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .ce-arrow { display: inline-flex; transition: transform 0.15s ease; }
        .ce-btn-primary:hover .ce-arrow, .ce-btn-secondary:hover .ce-arrow { transform: translateX(3px); }
        @keyframes ce-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .ce-float { animation: ce-float 5s ease-in-out infinite; }
        @keyframes ce-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 70%, 100% { transform: scale(2.1); opacity: 0; } }
        .ce-pulse-dot { position: relative; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
        .ce-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #22c55e; animation: ce-pulse-ring 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ce-float, .ce-pulse-dot::after { animation: none; }
          .ce-card, .ce-btn-primary, .ce-btn-secondary, .ce-feature-icon, .ce-step-badge, .ce-arrow { transition: none; }
        }
      `}</style>
    </>
  );
}
