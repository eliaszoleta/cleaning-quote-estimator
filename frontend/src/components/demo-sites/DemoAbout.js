import React from 'react';
import { useDemoSite } from './DemoSiteContext';
import ImagePlaceholder from './ImagePlaceholder';

export default function DemoAbout() {
  const { site } = useDemoSite();
  const c = site.colors;
  const years = new Date().getFullYear() - site.founded;
  const imageFirst = site.layout === 'B';

  return (
    <>
      <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>About Us</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px' }}>The Story Behind {site.businessName}</h1>
        </div>
      </div>

      <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
          {imageFirst && <ImagePlaceholder note={site.aboutImageNote} height={340} accent={c.primary} />}
          <div>
            {site.aboutStory.map((p, i) => (
              <p key={i} style={{ fontSize: 15.5, color: c.ink, lineHeight: 1.75, marginBottom: 18 }}>{p}</p>
            ))}
          </div>
          {!imageFirst && <ImagePlaceholder note={site.aboutImageNote} height={340} accent={c.primary} />}
        </div>
      </div>

      {/* Stats row -- illustrative */}
      <div style={{ background: c.primaryDark, padding: 'clamp(32px, 6vw, 52px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24, textAlign: 'center' }}>
          {[
            { n: `${years}+`, label: 'Years in business' },
            { n: '1,000s', label: 'Homes cleaned' },
            { n: `${site.serviceAreas.length}`, label: 'Areas served' },
            { n: '5.0', label: 'Average rating' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: site.fontHeading, fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, color: c.accent, marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
