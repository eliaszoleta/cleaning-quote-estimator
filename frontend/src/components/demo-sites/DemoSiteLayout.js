import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Menu, X } from 'lucide-react';
import DemoSiteContext from './DemoSiteContext';
import QuotePopupModal from './QuotePopupModal';
import DemoChatWidget from './DemoChatWidget';

const PAGES = [
  { key: 'home', label: 'Home', path: '' },
  { key: 'about', label: 'About', path: '/about' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'service-areas', label: 'Service Areas', path: '/service-areas' },
  { key: 'contact', label: 'Contact', path: '/contact' },
];

function Logo({ site, dark }) {
  const c = site.colors;
  return (
    <a href={`/website-example/${site.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, background: dark ? site.colors.accent : c.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: dark ? c.primaryDark : 'white', fontWeight: 800, fontSize: 13, fontFamily: site.fontHeading }}>{site.logoLabel}</span>
      </div>
      <span style={{ fontWeight: 800, fontSize: 17, color: dark ? 'white' : c.ink, fontFamily: site.fontHeading, letterSpacing: '-0.2px' }}>{site.businessName}</span>
    </a>
  );
}

// Three structurally different nav treatments, matched to each site's
// layout group -- not just a recolor of the same bar.
function PhoneCta({ site, style, iconColor }) {
  return (
    <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: site.fontBody, flexShrink: 0, ...style }}>
      <Phone size={15} color={iconColor} /> {site.phone}
    </a>
  );
}

function NavA({ site, current }) {
  const c = site.colors;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 120, fontFamily: site.fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Logo site={site} />
        <div className="demo-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{ textDecoration: 'none', fontSize: 14, fontWeight: current === p.key ? 700 : 500, color: current === p.key ? c.primary : '#475569' }}>
              {p.label}
            </a>
          ))}
        </div>
        <PhoneCta site={site} iconColor="white" style={{ background: c.primary, color: 'white', padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 13.5 }} />
        <button className="demo-nav-burger" onClick={() => setOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: c.ink }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="demo-nav-mobile" style={{ borderTop: `1px solid ${c.border}`, padding: '10px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{ textDecoration: 'none', fontSize: 14.5, fontWeight: current === p.key ? 700 : 500, color: current === p.key ? c.primary : '#475569' }}>{p.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

function NavB({ site, current }) {
  const c = site.colors;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: c.primaryDark, position: 'sticky', top: 0, zIndex: 120, fontFamily: site.fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Logo site={site} dark />
        <div className="demo-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{
              textDecoration: 'none', fontSize: 13.5, fontWeight: 600, color: current === p.key ? c.accent : 'rgba(255,255,255,0.78)',
              paddingBottom: 4, borderBottom: current === p.key ? `2px solid ${c.accent}` : '2px solid transparent',
            }}>
              {p.label}
            </a>
          ))}
        </div>
        <PhoneCta site={site} iconColor={c.primaryDark} style={{ background: c.accent, color: c.primaryDark, padding: '10px 18px', borderRadius: 8, fontWeight: 800, fontSize: 13.5 }} />
        <button className="demo-nav-burger" onClick={() => setOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="demo-nav-mobile" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', padding: '10px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{ textDecoration: 'none', fontSize: 14.5, fontWeight: 600, color: current === p.key ? c.accent : 'rgba(255,255,255,0.85)' }}>{p.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

function NavC({ site, current }) {
  const c = site.colors;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: c.bg, position: 'sticky', top: 0, zIndex: 120, fontFamily: site.fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <a href={`/website-example/${site.slug}`} style={{ textDecoration: 'none', fontFamily: site.fontHeading, fontWeight: 700, fontSize: 20, color: c.ink, letterSpacing: '-0.3px' }}>
          {site.businessName}
        </a>
        <div className="demo-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{
              textDecoration: 'none', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: current === p.key ? c.accent : c.textMuted,
            }}>
              {p.label}
            </a>
          ))}
        </div>
        <PhoneCta site={site} iconColor={c.bg} style={{ background: c.ink, color: c.bg, padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }} />
        <button className="demo-nav-burger" onClick={() => setOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: c.ink }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="demo-nav-mobile" style={{ borderTop: `1px solid ${c.border}`, padding: '10px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{ textDecoration: 'none', fontSize: 13.5, fontWeight: 600, color: current === p.key ? c.accent : c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

const NAVS = { A: NavA, B: NavB, C: NavC };

function DemoFooter({ site }) {
  const c = site.colors;
  return (
    <div style={{ background: c.primaryDark, color: 'rgba(255,255,255,0.85)', padding: 'clamp(36px, 7vw, 56px) 20px 28px', fontFamily: site.fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, marginBottom: 32 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'white', marginBottom: 10, fontFamily: site.fontHeading }}>{site.businessName}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 280 }}>{site.tagline}</p>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.accent, marginBottom: 12 }}>Contact</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 8 }}><Phone size={13} /> {site.phone}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 8 }}><Mail size={13} /> {site.email}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5 }}><MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {site.address}, {site.city}, {site.state} {site.zip}</div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.accent, marginBottom: 12 }}>Pages</div>
          {PAGES.map(p => (
            <a key={p.key} href={`/website-example/${site.slug}${p.path}`} style={{ display: 'block', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13.5, marginBottom: 8 }}>{p.label}</a>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
        © {new Date().getFullYear()} {site.businessName}. All rights reserved. · Serving {site.city} since {site.founded}.
      </div>
    </div>
  );
}

export default function DemoSiteLayout({ site, current, children }) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const Nav = NAVS[site.layout] || NavA;

  return (
    <DemoSiteContext.Provider value={{ site, openQuote: () => setQuoteOpen(true) }}>
      <Helmet>
        <title>{site.businessName} | {site.city}, {site.state}</title>
        <meta name="description" content={site.tagline} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* Sample banner -- always visible, always honest about what this is */}
      <div style={{ background: '#0f172a', color: 'white', padding: '10px 20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 150, fontFamily: "'Poppins', Arial, sans-serif" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>
          🎨 Sample design — {site.businessName} is a fictional example, not an actual customer.
        </span>
        {' '}
        <a href="/website-example" style={{ color: '#93c5fd', fontWeight: 700, fontSize: 12.5, textDecoration: 'none', marginRight: 14 }}>See all samples</a>
        <a href="/website-for-cleaning-companies#apply" style={{ color: '#93c5fd', fontWeight: 700, fontSize: 12.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>Want one like this? Apply here →</a>
      </div>

      <div style={{ fontFamily: site.fontBody }}>
        <Nav site={site} current={current} />
        {children}
        <DemoFooter site={site} />
      </div>

      <QuotePopupModal open={quoteOpen} onClose={() => setQuoteOpen(false)} businessName={site.businessName} accent={site.colors.primary} font={site.fontBody} />
      <DemoChatWidget site={site} />

      <style>{`
        @media (max-width: 760px) {
          .demo-nav-links { display: none !important; }
          .demo-nav-burger { display: flex !important; align-items: center; }
        }
      `}</style>
    </DemoSiteContext.Provider>
  );
}
