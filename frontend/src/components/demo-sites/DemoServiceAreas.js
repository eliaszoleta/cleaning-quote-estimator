import React from 'react';
import { MapPin } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';

export default function DemoServiceAreas() {
  const { site, openQuote } = useDemoSite();
  const c = site.colors;

  return (
    <>
      <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Service Areas</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px', marginBottom: 14 }}>Proudly Serving {site.city} &amp; Beyond</h1>
          <p style={{ fontSize: 15.5, color: c.textMuted, maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
            Not sure if we cover your neighborhood? Reach out — we're always adding new areas.
          </p>
        </div>
      </div>

      <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
          {site.serviceAreas.map(area => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 12, background: c.bgAlt, border: `1px solid ${c.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={16} color={c.primary} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: c.ink }}>{area}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: c.primaryDark, padding: 'clamp(36px, 7vw, 60px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: 'white', marginBottom: 10 }}>See Your Area on the List?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 22, fontSize: 14 }}>Get a free, no-obligation quote for your home today.</p>
          <button onClick={openQuote} style={{ background: c.accent, color: c.primaryDark, padding: '13px 28px', borderRadius: 9, border: 'none', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
        </div>
      </div>
    </>
  );
}
