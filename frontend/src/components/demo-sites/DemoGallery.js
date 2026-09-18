import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, MapPin } from 'lucide-react';
import SITES from './siteConfigs';

export default function DemoGallery() {
  return (
    <>
      <Helmet>
        <title>Sample Website Designs | Clean Estimator</title>
        <meta name="description" content="Browse real, working sample websites Clean Estimator builds for cleaning companies -- ten distinct designs, each with its own look." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(48px, 9vw, 90px) 20px clamp(56px, 9vw, 96px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>Sample Designs</div>
          <h1 style={{ fontSize: 'clamp(26px,4.5vw,40px)', fontWeight: 800, lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.5px' }}>
            See What Your Website Could Actually Look Like
          </h1>
          <p style={{ fontSize: 15.5, color: '#94a3b8', maxWidth: 600, margin: '0 auto 8px', lineHeight: 1.6 }}>
            {SITES.length} real, working sample sites for cleaning businesses — every one a different design, not one template reskinned ten times. Click any card to open the full site in a new tab.
          </p>
          <p style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>All businesses shown are fictional examples, not actual customers.</p>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20 }}>
          {SITES.map(site => (
            <a
              key={site.slug}
              href={`/website-example/${site.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gallery-card"
              style={{
                display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden',
                background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              }}
            >
              <div style={{ height: 96, background: `linear-gradient(135deg, ${site.colors.primary} 0%, ${site.colors.primaryDark} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: site.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: site.colors.primaryDark, fontFamily: site.fontHeading }}>
                  {site.logoLabel}
                </div>
                <ArrowUpRight size={18} color="rgba(255,255,255,0.85)" style={{ position: 'absolute', top: 14, right: 16 }} />
              </div>
              <div style={{ padding: '18px 20px 20px' }}>
                <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 4 }}>{site.businessName}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{site.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#94a3b8', fontWeight: 600 }}>
                  <MapPin size={12} /> {site.city}, {site.state}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
                  {[site.colors.primary, site.colors.accent, site.colors.bg].map((clr, i) => (
                    <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: clr, border: '1px solid rgba(0,0,0,0.08)' }} />
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ padding: 'clamp(40px, 8vw, 72px) 20px', background: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Like What You See?</h2>
          <p style={{ fontSize: 14.5, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>We'll build one just as custom for your business — free to preview, no payment until you approve it.</p>
          <a href="/website-for-cleaning-companies#apply" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1d4ed8', color: 'white', padding: '14px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 22px rgba(29,78,216,0.3)' }}>
            Request Website Sample →
          </a>
        </div>
      </div>

      <style>{`
        .gallery-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .gallery-card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(15,23,42,0.14); }
        @media (prefers-reduced-motion: reduce) { .gallery-card { transition: none; } }
      `}</style>
    </>
  );
}
