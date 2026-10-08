import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChevronDown } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';
import { getAreaPageContent, getAreaPageList } from './demoSeoContent';
import { demoAbsoluteUrl, breadcrumbJsonLd, faqJsonLd } from './demoSeo';

function FaqBlock({ site, faqs }) {
  const c = site.colors;
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {faqs.map((f, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={f.q} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', textAlign: 'left', fontFamily: site.fontBody }}
            >
              <span style={{ fontWeight: 700, fontSize: 14.5, color: c.ink }}>{f.q}</span>
              <ChevronDown size={18} color={c.textMuted} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {isOpen && <div style={{ padding: '0 20px 18px', fontSize: 13.5, color: c.textMuted, lineHeight: 1.65 }}>{f.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Dedicated per-city landing page (/website-example/:slug/service-areas/:areaSlug) --
// mirrors the real client sites' service-areas_.$slug route: its own meta
// title, description, H1, local-flavor intro, and FAQs, plus
// LocalBusiness/Breadcrumb/FAQ schema, instead of one combined area list.
export default function DemoAreaPage({ areaSlug }) {
  const { site, openQuote } = useDemoSite();
  const c = site.colors;
  const content = getAreaPageContent(site, areaSlug);

  if (!content) {
    if (typeof window !== 'undefined') window.location.replace(`/website-example/${site.slug}/service-areas`);
    return null;
  }

  const otherAreas = getAreaPageList(site).filter((a) => a.slug !== areaSlug);
  const canonical = demoAbsoluteUrl(site, `/service-areas/${content.slug}`);
  const breadcrumb = breadcrumbJsonLd(site, [
    { name: 'Home', path: '' },
    { name: 'Service Areas', path: '/service-areas' },
    { name: content.area, path: `/service-areas/${content.slug}` },
  ]);

  return (
    <>
      <Helmet>
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex, follow" />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(content.faqs))}</script>
      </Helmet>

      <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 12.5, color: c.textMuted, marginBottom: 18 }}>
            <a href={`/website-example/${site.slug}`} style={{ color: c.textMuted, textDecoration: 'none' }}>Home</a>
            {' › '}
            <a href={`/website-example/${site.slug}/service-areas`} style={{ color: c.textMuted, textDecoration: 'none' }}>Service Areas</a>
            {' › '}
            <span style={{ color: c.ink, fontWeight: 600 }}>{content.area}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            <MapPin size={13} /> Service Area
          </div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px', marginBottom: 18, lineHeight: 1.2 }}>{content.h1}</h1>
          {content.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 15.5, color: c.textMuted, lineHeight: 1.7, maxWidth: 640, marginBottom: 14 }}>{p}</p>
          ))}
          <button onClick={openQuote} style={{ background: c.primary, color: 'white', border: 'none', padding: '13px 26px', borderRadius: 9, fontWeight: 700, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody, marginTop: 8 }}>Get a Free Quote</button>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 20, fontWeight: 700, color: c.ink, marginBottom: 18 }}>What to Know About Cleaning in {content.area}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20 }}>
            {content.localNotes.map((note) => (
              <div key={note.title} style={{ background: c.bgAlt, border: `1px solid ${c.border}`, borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: c.ink, marginBottom: 8 }}>{note.title}</div>
                <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.65, margin: 0 }}>{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: c.bgAlt }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 20, fontWeight: 700, color: c.ink, marginBottom: 16 }}>Services Available in {content.area}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
            {content.services.map((s) => (
              <a key={s.slug} href={`/website-example/${site.slug}/services/${s.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: c.ink }}>{s.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: c.ink, marginBottom: 24, textAlign: 'center' }}>{content.area} FAQs</h2>
          <FaqBlock site={site} faqs={content.faqs} />
        </div>
      </div>

      {otherAreas.length > 0 && (
        <div style={{ padding: 'clamp(30px, 6vw, 48px) 20px', background: c.bgAlt }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Nearby Areas We Serve</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
              {otherAreas.map((a) => (
                <a key={a.slug} href={`/website-example/${site.slug}/service-areas/${a.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color={c.primary} />
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: c.ink }}>{a.area}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: c.primaryDark, padding: 'clamp(36px, 7vw, 60px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: 'white', marginBottom: 10 }}>Ready to book in {content.area}?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 22, fontSize: 14 }}>Get a free, no-obligation quote today.</p>
          <button onClick={openQuote} style={{ background: c.accent, color: c.primaryDark, padding: '13px 28px', borderRadius: 9, border: 'none', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
        </div>
      </div>
    </>
  );
}
