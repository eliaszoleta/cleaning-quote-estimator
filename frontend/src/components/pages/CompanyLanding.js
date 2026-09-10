import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Palette, ClipboardList, MapPin, Settings, Code2, Key, Check, Star,
  BellRing, Send, Quote, ShieldCheck, Zap, ArrowRight,
} from 'lucide-react';
import Header from '../ui/Header';
import Footer from '../ui/Footer';
import CleaningCalculator from '../calculator/CleaningCalculator';

const PRIMARY = '#1d4ed8';

const FEATURES = [
  { Icon: Palette,       color: '#7c3aed', bg: '#f5f3ff', title: 'White-label branding',       desc: 'Your logo, colors, and call-to-action text. Visitors never see the Clean Estimator name.' },
  { Icon: ClipboardList, color: '#2563eb', bg: '#eff6ff', title: 'Every lead is 100% yours',    desc: 'Name, email, phone, timeline, and the exact price they were quoted — stored permanently in your own dashboard. Never shared with other cleaners, never resold, never visible to anyone but you.' },
  { Icon: BellRing,      color: '#dc2626', bg: '#fef2f2', title: 'Instant lead alerts — zero setup', desc: "The moment someone gets an estimate on your site, you get an email with their name, phone, and full price breakdown. No CRM, no Zapier, nothing to configure — it works the day you embed the widget." },
  { Icon: Send,          color: '#0d9488', bg: '#f0fdfa', title: 'Every estimate email is branded as yours', desc: "Visitors get a follow-up email carrying your logo, your phone number, and your call-to-action — not ours. Every completed estimate is another touchpoint with your business sitting in their inbox." },
  { Icon: MapPin,        color: '#059669', bg: '#ecfdf5', title: 'ZIP-code accurate pricing',   desc: 'State-specific pricing multipliers ensure your quotes reflect your local market.' },
  { Icon: Settings,      color: '#ea580c', bg: '#fff7ed', title: 'Per-service markup control',  desc: 'Adjust pricing up or down per service. Set your own minimum charges.' },
  { Icon: Code2,         color: '#0891b2', bg: '#ecfeff', title: 'Easy to embed',               desc: 'Paste the embed code to add the calculator to any website, Wix, Squarespace, or WordPress.' },
  { Icon: Key,           color: '#d97706', bg: '#fffbeb', title: 'API for CRM sync',            desc: 'Already have a CRM? Pull leads via REST API into HubSpot, Salesforce, or any tool using Zapier or Make — optional, on top of the email alerts you get by default.' },
];

const STEPS = [
  { n: '1', title: 'Sign up',                  desc: 'Create your account and start your 30-day free trial — no credit card required.' },
  { n: '2', title: 'Customize your widget',    desc: 'Add your logo, set your brand colors, configure which services you offer, and write your CTA.' },
  { n: '3', title: 'Embed on your site',       desc: "Copy the embed code and paste it anywhere on your website. That's it." },
  { n: '4', title: 'Capture leads',            desc: 'Watch leads flow in. Manage them in your dashboard or sync to your CRM.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.',  company: 'Sparkle Cleaning Services — Austin, TX', text: "We've been using Clean Estimator for 4 months and it's generated 47 qualified leads. Conversion rate is way higher than our contact form because visitors are pre-qualified." },
  { name: 'James R.',  company: 'Pro Restoration Group — Denver, CO',      text: 'The water damage and mold calculators are exactly what we needed. Customers come in already understanding the price range, so there\'s less sticker shock on-site.' },
  { name: 'Maria L.',  company: 'Crystal Clean Commercial — Miami, FL',    text: "Setup took about 20 minutes. The embed is seamless — my website visitors don't even realize it's a third-party tool." },
];

const PLAN_FEATURES = [
  'Unlimited calculator sessions',
  'White-label branding',
  'Every lead 100% yours, never shared',
  'Instant email alerts on every lead',
  'Branded follow-up emails to visitors',
  'API access',
  'All 9 service calculators',
  'CSV export',
  'Priority support',
];

const TRUST_BADGES = [
  { Icon: ShieldCheck, text: 'No credit card required for trial' },
  { Icon: Zap,          text: 'Live on your site in 30 minutes' },
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

// Browser chrome around the *actual* CleaningCalculator (embedded mode,
// same component a company's own visitors use), not a redrawn approximation
// -- so this stays accurate to the real product and a visitor can actually
// click through it, plus a floating notification chip echoing the
// instant-lead-alert feature.
function WidgetPreview() {
  return (
    <div className="ce-float" style={{ position: 'relative' }}>
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 70px -20px rgba(2,6,23,0.55), 0 8px 20px rgba(2,6,23,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fca5a5' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fcd34d' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
          <div style={{ marginLeft: 10, flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#94a3b8' }}>
            yourcompany.com
          </div>
        </div>
        <div style={{ height: 480, overflowY: 'auto' }}>
          <CleaningCalculator embedded />
        </div>
      </div>

      {/* Floating lead-alert chip */}
      <div style={{
        position: 'absolute', left: -18, bottom: -22, display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', borderRadius: 12, padding: '11px 16px 11px 12px',
        boxShadow: '0 14px 32px -8px rgba(2,6,23,0.35)', border: '1px solid #f1f5f9',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BellRing size={14} color="#dc2626" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>New lead: Sarah M.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94a3b8' }}>
            <span className="ce-pulse-dot" /> just now &middot; $249&ndash;$319 quoted
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
        <title>Embed a Cleaning Cost Calculator on Your Website | Clean Estimator for Companies</title>
        <meta name="description" content="Add a branded cleaning cost estimator to your website. Capture leads, customize pricing, white-label branding. 30-day free trial, no credit card required. $159/month." />
        <link rel="canonical" href="https://www.cleanestimator.com/estimator" />
      </Helmet>
      <div className="app">
        <Header />
        <main>

          {/* Hero -- restrained accent line + eyebrow instead of a pill
              badge (same language as the About page hero), and a two-column
              layout with a small static "product shot" of the widget so the
              page shows the thing it's selling instead of only describing it. */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '96px 24px 110px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 56, alignItems: 'center' }}>
              <div>
                <div style={{ width: 44, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #818cf8)', marginBottom: 22 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
                  For cleaning companies
                </div>
                <h1 style={{ fontSize: 'clamp(30px,4.6vw,48px)', fontWeight: 800, lineHeight: 1.12, marginBottom: 18, letterSpacing: '-1px', color: 'white' }}>
                  Give every homeowner an instant cleaning estimate<br />
                  <span style={{ color: '#60a5fa' }}>on your website</span>
                </h1>
                <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 480, marginBottom: 32, lineHeight: 1.65 }}>
                  Capture more leads, reduce tire-kickers, and close more jobs with a white-label estimator that works 24/7 — and emails you the second someone's ready to book.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/company" className="ce-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
                    Start Free Trial <Arrow size={16} />
                  </a>
                  <a href="/?service=home_residential" className="ce-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                    See Demo
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 380 }}>
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

          {/* Features */}
          <div style={{ padding: '84px 24px', maxWidth: 1120, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>Everything you need</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 52 }}>No technical skills required. Set up in under 30 minutes.</p>
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

          {/* How it works -- same card language as the Features grid above
              (tinted badge, left-aligned copy) instead of free-floating
              circles on bare background, so this section reads as part of
              the same designed page rather than a separate template block. */}
          <div style={{ background: '#f8fafc', padding: '84px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>Up and running in 30 minutes</h2>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 52 }}>Four steps, no developer required.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                {STEPS.map(s => (
                  <div key={s.n} className="ce-card" style={{ ...cardStyle, padding: '24px 22px' }}>
                    <div className="ce-step-badge" style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontWeight: 800, fontSize: 14.5, marginBottom: 16 }}>{s.n}</div>
                    <h3 style={{ fontWeight: 700, fontSize: 15.5, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ padding: '84px 24px', maxWidth: 1120, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 44, letterSpacing: '-0.4px' }}>What cleaning companies say</h2>
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

          {/* Pricing + closing CTA, merged into one section -- these used to
              be two separate full-bleed blocks each ending in its own big
              blue button, which read as a hard-sell "buy now, then buy
              again" pattern rather than a normal SaaS pricing section. One
              section, one plan, one call to action. */}
          <div id="pricing" style={{ background: '#f8fafc', padding: '84px 24px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>

              <div>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.4px' }}>Simple, transparent pricing</h2>
                <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.65, marginBottom: 28, maxWidth: 400 }}>
                  One plan, everything included, no surprises. Built for independent cleaning companies who want more booked jobs from their own website.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {TRUST_BADGES.map(({ Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155', fontSize: 14.5, fontWeight: 600 }}>
                      <Icon size={16} color="#16a34a" strokeWidth={2.3} />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ce-card" style={{ ...cardStyle, borderRadius: 14, padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #818cf8)' }} />
                <div style={{ padding: '30px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>$159</span>
                    <span style={{ fontSize: 14, color: '#64748b' }}>/month</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 22 }}>After your 30-day free trial &middot; cancel anytime</div>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, textAlign: 'left' }}>
                    {PLAN_FEATURES.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, fontSize: 14, color: '#374151' }}>
                        <span style={{ width: 17, height: 17, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={10} color="#16a34a" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a href="/company" className="ce-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PRIMARY, color: 'white', padding: '13px 0', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                    Start Free Trial <Arrow size={15} />
                  </a>
                </div>
              </div>

            </div>
          </div>

        </main>
        <Footer />
      </div>

      {/* Small, tasteful motion only -- a hover lift on cards/badges, an
          arrow nudge on buttons, a slow idle float on the hero mockup, and
          a live-status pulse on its "new lead" chip. Respects
          prefers-reduced-motion. */}
      <style>{`
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
