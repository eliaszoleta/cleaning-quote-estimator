import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Palette, ClipboardList, MapPin, Settings, Code2, Key, Check, Star } from 'lucide-react';
import Header from '../ui/Header';
import Footer from '../ui/Footer';

const FEATURES = [
  { Icon: Palette,       color: '#7c3aed', bg: '#f5f3ff', title: 'White-label branding',       desc: 'Your logo, colors, and call-to-action text. Visitors never see the Clean Estimator name.' },
  { Icon: ClipboardList, color: '#2563eb', bg: '#eff6ff', title: 'Lead capture built-in',       desc: 'Collect name, email, phone, and timeline from every visitor before they see the estimate.' },
  { Icon: MapPin,        color: '#059669', bg: '#ecfdf5', title: 'ZIP-code accurate pricing',   desc: 'State-specific pricing multipliers ensure your quotes reflect your local market.' },
  { Icon: Settings,      color: '#ea580c', bg: '#fff7ed', title: 'Per-service markup control',  desc: 'Adjust pricing up or down per service. Set your own minimum charges.' },
  { Icon: Code2,         color: '#0891b2', bg: '#ecfeff', title: 'Easy one-line embed',         desc: 'Paste one line of HTML to add the calculator to any website, Wix, Squarespace, or WordPress.' },
  { Icon: Key,           color: '#d97706', bg: '#fffbeb', title: 'API for CRM sync',            desc: 'Pull leads via REST API into HubSpot, Salesforce, or any CRM using Zapier or Make.' },
];

const STEPS = [
  { n: '1', title: 'Sign up',                  desc: 'Create your account and start your 7-day free trial — credit card required.' },
  { n: '2', title: 'Customize your widget',    desc: 'Add your logo, set your brand colors, configure which services you offer, and write your CTA.' },
  { n: '3', title: 'Embed on your site',       desc: "Copy one line of code and paste it anywhere on your website. That's it." },
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
  'Lead capture dashboard',
  'API access',
  'All 9 service calculators',
  'CSV export',
  'Priority support',
];

export default function CompanyLanding() {
  return (
    <>
      <Helmet>
        <title>Embed a Cleaning Cost Calculator on Your Website | Clean Estimator for Companies</title>
        <meta name="description" content="Add a branded cleaning cost estimator to your website. Capture leads, customize pricing, white-label branding. 7-day free trial. $159/month." />
      </Helmet>
      <div className="app">
        <Header />
        <main>

          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '100px 24px 120px', textAlign: 'center' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ display: 'inline-block', background: 'rgba(37,99,235,0.25)', color: '#93c5fd', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 22, border: '1px solid rgba(37,99,235,0.35)', letterSpacing: '0.02em' }}>
                For cleaning companies
              </div>
              <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 18, letterSpacing: '-1px' }}>
                Add a Branded Cleaning<br />
                <span style={{ color: '#60a5fa' }}>Cost Calculator to Your Website</span>
              </h1>
              <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.6 }}>
                Capture more leads, reduce tire-kickers, and close more jobs with a white-label estimator that works 24/7.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/company" style={{ background: '#2563eb', color: 'white', padding: '15px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>Start Free Trial →</a>
                <a href="/?service=home_residential" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '15px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 16, border: '1px solid rgba(255,255,255,0.15)' }}>See Demo</a>
              </div>
              <p style={{ color: '#475569', fontSize: 13.5, marginTop: 14 }}>$159/mo after 7 days · Cancel anytime</p>
            </div>
          </div>

          {/* Features */}
          <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>Everything you need</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 52 }}>No technical skills required. Set up in under 30 minutes.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {FEATURES.map(({ Icon, color, bg, title, desc }) => (
                <div key={title} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '26px 22px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={20} color={color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background: '#f8fafc', padding: '80px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 52, letterSpacing: '-0.4px' }}>Up and running in 30 minutes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
                {STEPS.map(s => (
                  <div key={s.n} style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20, margin: '0 auto 14px' }}>{s.n}</div>
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: 44, letterSpacing: '-0.4px' }}>What cleaning companies say</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {TESTIMONIALS.map(t => (
                <div key={t.name} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '26px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={15} color="#f59e0b" fill="#f59e0b" />
                    ))}
                  </div>
                  <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, marginBottom: 18 }}>"{t.text}"</p>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{t.company}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div id="pricing" style={{ background: 'linear-gradient(135deg, #f0f7ff, #f8fafc)', padding: '56px 24px 42px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 350, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.4px' }}>Simple, transparent pricing</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>One plan. Everything included. No surprises.</p>
              <div style={{ background: 'white', border: '2px solid #2563eb', borderRadius: 16, padding: '26px 24px', boxShadow: '0 6px 28px rgba(37,99,235,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3, marginBottom: 3 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>$159</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>/month</span>
                </div>
                <div style={{ color: '#16a34a', fontWeight: 600, fontSize: 12, marginBottom: 20 }}>$159/mo after 7 days · Cancel anytime</div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, textAlign: 'left' }}>
                  {PLAN_FEATURES.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={9} color="#16a34a" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/company" style={{ display: 'block', background: '#2563eb', color: 'white', padding: '11px 0', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                  Start Free Trial →
                </a>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>$159/mo after 7 days · Cancel anytime</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '80px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.4px', color: '#0f172a' }}>Ready to capture more leads?</h2>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 30, maxWidth: 460, margin: '0 auto 30px' }}>Join cleaning companies already using Clean Estimator to turn website visitors into booked jobs.</p>
            <a href="/company" style={{ background: '#2563eb', color: 'white', padding: '15px 38px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 17 }}>Get Started Free →</a>
          </div>

        </main>
        <Footer />
      </div>
    </>
  );
}
