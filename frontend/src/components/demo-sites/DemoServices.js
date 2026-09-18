import React from 'react';
import { Sparkles, Home as HomeIcon, Truck, Repeat, Leaf } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';

const ICONS = [Sparkles, HomeIcon, Truck, Repeat, Leaf];

function ServicesA({ site, onQuote }) {
  const c = site.colors;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 20 }}>
      {site.services.map((s, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <div key={s.title} style={{ background: c.card, borderRadius: 16, padding: 28, border: `1px solid ${c.border}` }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon size={20} color={c.primary} />
            </div>
            <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 17, color: c.ink, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</div>
            <button onClick={onQuote} style={{ background: 'none', border: 'none', color: c.primary, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0, fontFamily: site.fontBody }}>Request this service →</button>
          </div>
        );
      })}
    </div>
  );
}

function ServicesB({ site, onQuote }) {
  const c = site.colors;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {site.services.map((s, i) => (
        <div key={s.title} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '26px 0', borderBottom: i < site.services.length - 1 ? `1px solid ${c.border}` : 'none' }}>
          <div style={{ fontFamily: site.fontHeading, fontSize: 32, fontWeight: 800, color: c.accent, minWidth: 52 }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: c.ink, marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.65 }}>{s.desc}</div>
          </div>
          <button onClick={onQuote} style={{ background: c.primary, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: site.fontBody }}>Get Quote</button>
        </div>
      ))}
    </div>
  );
}

function ServicesC({ site, onQuote }) {
  const c = site.colors;
  return (
    <div>
      {site.services.map((s, i) => (
        <div key={s.title} style={{
          display: 'flex', alignItems: 'center', gap: 32, padding: '32px 0',
          borderBottom: i < site.services.length - 1 ? `1px solid ${c.border}` : 'none',
          flexDirection: i % 2 === 0 ? 'row' : 'row-reverse', textAlign: i % 2 === 0 ? 'left' : 'right',
        }}>
          <div style={{ fontFamily: site.fontHeading, fontSize: 'clamp(50px, 9vw, 90px)', fontWeight: 800, color: c.bgAlt, lineHeight: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 22, color: c.ink, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 14.5, color: c.textMuted, lineHeight: 1.7, marginBottom: 14, maxWidth: 460, marginLeft: i % 2 === 0 ? 0 : 'auto' }}>{s.desc}</div>
            <button onClick={onQuote} style={{ background: 'none', border: `1.5px solid ${c.ink}`, color: c.ink, padding: '9px 18px', borderRadius: 2, fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: site.fontBody }}>Request Quote</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const VARIANTS = { A: ServicesA, B: ServicesB, C: ServicesC };

export default function DemoServices() {
  const { site, openQuote } = useDemoSite();
  const c = site.colors;
  const Variant = VARIANTS[site.layout] || ServicesA;

  return (
    <>
      <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Services</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px', marginBottom: 14 }}>Everything Your Home Needs</h1>
          <p style={{ fontSize: 15.5, color: c.textMuted, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>From a one-time deep clean to a standing weekly visit, {site.businessName} tailors every job to your space.</p>
        </div>
      </div>

      <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Variant site={site} onQuote={openQuote} />
        </div>
      </div>

      <div style={{ background: c.primaryDark, padding: 'clamp(36px, 7vw, 60px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: 'white', marginBottom: 10 }}>Not sure what you need?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 22, fontSize: 14 }}>Tell us about your space and we'll recommend the right service.</p>
          <button onClick={openQuote} style={{ background: c.accent, color: c.primaryDark, padding: '13px 28px', borderRadius: 9, border: 'none', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
        </div>
      </div>
    </>
  );
}
