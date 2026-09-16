import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Phone, MapPin, Check, Star, MessageCircle, X, Send } from 'lucide-react';

// Fictional demo business -- same "Sparkle Clean Co." placeholder name used
// elsewhere on the site (PartnerWithUs.js, FloatingPartnerBanner.js demo
// data) so there's one consistent, obviously-fictional example business
// instead of inventing a new name that could ever be mistaken for a real
// customer's site. This page's whole point is to show design quality, not
// to claim social proof from a client that doesn't exist yet.
const GREEN = '#0d9488';
const GREEN_DARK = '#0f766e';

function ChatWidgetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200 }}>
      {open && (
        <div style={{ width: 'min(300px, calc(100vw - 40px))', background: 'white', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.25)', overflow: 'hidden', marginBottom: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ background: GREEN, color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Sparkle Clean Co.</div>
              <div style={{ fontSize: 11.5, opacity: 0.85 }}>Typically replies in a few minutes</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={16} /></button>
          </div>
          <div style={{ padding: 14, background: '#f8fafc', minHeight: 120 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px 14px 14px 14px', padding: '9px 12px', fontSize: 13, color: '#374151', maxWidth: '85%', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              Hi! 👋 Looking for a cleaning quote, or have a question about our services?
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', padding: 8, gap: 8 }}>
            <input readOnly placeholder="Type a message..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, padding: '8px 10px', background: '#f8fafc', borderRadius: 8 }} />
            <button style={{ background: GREEN, border: 'none', borderRadius: 8, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><Send size={14} /></button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open chat"
        style={{ width: 58, height: 58, borderRadius: '50%', background: GREEN, border: 'none', boxShadow: '0 10px 26px rgba(13,148,136,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 'auto' }}
      >
        {open ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>
    </div>
  );
}

const SERVICES = [
  { title: 'Standard Cleaning', desc: 'Regular upkeep for kitchens, bathrooms, floors, and living spaces.' },
  { title: 'Deep Cleaning', desc: 'A thorough, top-to-bottom clean for homes that need extra attention.' },
  { title: 'Move-In / Move-Out', desc: 'Spotless turnover cleaning for renters, landlords, and homeowners.' },
  { title: 'Recurring Service', desc: 'Weekly, bi-weekly, or monthly visits on a schedule that fits you.' },
];

export default function WebsiteExample() {
  return (
    <>
      <Helmet>
        <title>Example Website Design | Clean Estimator</title>
        <meta name="description" content="See a sample of the kind of website Clean Estimator builds for cleaning businesses, complete with an AI chatbot." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* Sample banner -- always visible, always honest about what this is */}
      <div style={{ background: '#0f172a', color: 'white', padding: '12px 20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 150 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          🎨 Sample design — this is an example of what your website could look like, not an actual customer.
        </span>
        {' '}
        <a href="/website-for-cleaning-companies#apply" style={{ color: '#93c5fd', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>Want one like this? Apply here →</a>
      </div>

      {/* Everything below is the demo site itself -- deliberately its own
          look (warm green palette, different type rhythm) instead of
          reusing cleanestimator.com's blue branding, since the whole point
          is to show this isn't one reskinned template. */}
      <div style={{ fontFamily: "'Poppins', Arial, sans-serif" }}>
        {/* Demo nav */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18, color: GREEN_DARK }}>
            <Sparkles size={20} color={GREEN} /> Sparkle Clean Co.
          </div>
          <a href="#quote" style={{ background: GREEN, color: 'white', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={14} /> (555) 123-4567
          </a>
        </div>

        {/* Demo hero */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)', padding: 'clamp(48px, 9vw, 96px) 20px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#d1fae5', color: GREEN_DARK, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, marginBottom: 18 }}>
              Serving the Greater Metro Area
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 5.5vw, 48px)', fontWeight: 800, color: '#134e4a', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' }}>
              A Spotless Home,<br />Without Lifting a Finger
            </h1>
            <p style={{ fontSize: 17, color: '#475569', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Trusted, insured cleaners serving your neighborhood. Get a free, no-obligation quote in under two minutes.
            </p>
            <div id="quote" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" style={{ background: GREEN, color: 'white', padding: '15px 30px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 26px rgba(13,148,136,0.3)', cursor: 'default', fontFamily: 'inherit' }}>
                Get a Free Quote
              </button>
              <button type="button" style={{ background: 'white', color: GREEN_DARK, padding: '15px 30px', borderRadius: 10, fontWeight: 700, fontSize: 15.5, border: `1.5px solid ${GREEN}`, cursor: 'default', fontFamily: 'inherit' }}>
                Our Services
              </button>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '20px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 36px' }}>
            {['Licensed & Insured', '5-Star Rated', 'Satisfaction Guaranteed', 'Same-Week Availability'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#334155' }}>
                <Check size={15} color={GREEN} strokeWidth={2.5} /> {item}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: '#f8fafc' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#134e4a', marginBottom: 40 }}>What We Offer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 18 }}>
              {SERVICES.map(s => (
                <div key={s.title} style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Sparkles size={18} color={GREEN_DARK} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: '#134e4a', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews (illustrative placeholders, clearly not real reviews) */}
        <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: 'white' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} color="#facc15" fill="#facc15" />)}
            </div>
            <p style={{ fontSize: 18, color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10 }}>
              "This is a placeholder review — your real site would feature your own customer reviews here, not a stock quote."
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>— Illustrative example only</p>
          </div>
        </div>

        {/* Contact / footer */}
        <div style={{ background: GREEN_DARK, color: 'white', padding: 'clamp(36px, 7vw, 60px) 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h3 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, marginBottom: 10 }}>Ready for a Cleaner Space?</h3>
            <p style={{ color: '#a7f3d0', marginBottom: 22, fontSize: 14.5 }}>Get your free quote today — no obligation, no pressure.</p>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: GREEN_DARK, padding: '14px 30px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 15.5, cursor: 'default', fontFamily: 'inherit' }}>
              <Phone size={16} /> Call (555) 123-4567
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, fontSize: 13, color: '#a7f3d0' }}>
              <MapPin size={13} /> Serving the Greater Metro Area &amp; surrounding suburbs
            </div>
          </div>
        </div>
      </div>

      <ChatWidgetDemo />
    </>
  );
}
