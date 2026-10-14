import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, ChevronDown } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';
import { getServicePageContent, getServicePageList } from './demoSeoContent';
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

// Dedicated per-service landing page (/website-example/:slug/services/:serviceSlug) --
// mirrors the real client sites' services_.$slug route: its own meta title,
// description, H1, intro copy, and FAQs, plus Service/Breadcrumb/FAQ schema,
// instead of a single combined services listing page.
export default function DemoServicePage({ serviceSlug }) {
  const { site, openQuote } = useDemoSite();
  const c = site.colors;
  const content = getServicePageContent(site, serviceSlug);

  if (!content) {
    if (typeof window !== 'undefined') window.location.replace(`/website-example/${site.slug}/services`);
    return null;
  }

  const otherServices = getServicePageList(site).filter((s) => s.slug !== serviceSlug);
  const canonical = demoAbsoluteUrl(site, `/services/${content.slug}`);
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${content.name} in ${site.city}, ${site.state}`,
    description: content.metaDescription,
    provider: { '@type': 'LocalBusiness', name: site.businessName },
    areaServed: { '@type': 'City', name: site.city },
  };
  const breadcrumb = breadcrumbJsonLd(site, [
    { name: 'Home', path: '' },
    { name: 'Services', path: '/services' },
    { name: content.name, path: `/services/${content.slug}` },
  ]);

  return (
    <>
      <Helmet>
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex, follow" />
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(content.faqs.map((f) => ({ q: f.q, a: f.a }))))}</script>
      </Helmet>

      <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 12.5, color: c.textMuted, marginBottom: 18 }}>
            <a href={`/website-example/${site.slug}`} style={{ color: c.textMuted, textDecoration: 'none' }}>Home</a>
            {' › '}
            <a href={`/website-example/${site.slug}/services`} style={{ color: c.textMuted, textDecoration: 'none' }}>Services</a>
            {' › '}
            <span style={{ color: c.ink, fontWeight: 600 }}>{content.name}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Service</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px', marginBottom: 18, lineHeight: 1.2 }}>{content.h1}</h1>
          {content.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 15.5, color: c.textMuted, lineHeight: 1.7, maxWidth: 640, marginBottom: 14 }}>{p}</p>
          ))}
          <button onClick={openQuote} style={{ background: c.primary, color: 'white', border: 'none', padding: '13px 26px', borderRadius: 9, fontWeight: 700, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody, marginTop: 8 }}>Get a Free Quote</button>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 40 }}>
          <div>
            <img src={content.image} alt={`${content.name} in ${site.city}, ${site.state}`} loading="lazy" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 16, boxShadow: '0 10px 30px rgba(15,23,42,0.1)', marginBottom: 24 }} />
            <h2 style={{ fontFamily: site.fontHeading, fontSize: 20, fontWeight: 700, color: c.ink, marginBottom: 14 }}>Ideal For</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content.idealFor.map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: c.textMuted, lineHeight: 1.65, marginBottom: 10 }}>
                  <Check size={16} color={c.primary} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />{item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 style={{ fontFamily: site.fontHeading, fontSize: 20, fontWeight: 700, color: c.ink, marginBottom: 16 }}>What's Included</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {content.included.map((block) => (
                <div key={block.area} style={{ background: c.bgAlt, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: c.ink, marginBottom: 10 }}>{block.area}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {block.tasks.map((t, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: c.textMuted, lineHeight: 1.6, marginBottom: 6 }}>
                        <Check size={13} color={c.primary} strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: c.bgAlt }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 24 }}>
          {content.whyUs.map((w) => (
            <div key={w.title} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24 }}>
              <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 16.5, color: c.ink, marginBottom: 8 }}>{w.title}</div>
              <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.65, margin: 0 }}>{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 'clamp(36px, 7vw, 64px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: c.ink, marginBottom: 24, textAlign: 'center' }}>{content.name} FAQs</h2>
          <FaqBlock site={site} faqs={content.faqs} />
        </div>
      </div>

      {otherServices.length > 0 && (
        <div style={{ padding: 'clamp(30px, 6vw, 48px) 20px', background: c.bgAlt }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Other Services</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
              {otherServices.map((s) => (
                <a key={s.slug} href={`/website-example/${site.slug}/services/${s.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: c.ink }}>{s.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: c.primaryDark, padding: 'clamp(36px, 7vw, 60px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: 'white', marginBottom: 10 }}>Ready for {content.name.toLowerCase()} in {site.city}?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 22, fontSize: 14 }}>Get a free, no-obligation quote today.</p>
          <button onClick={openQuote} style={{ background: c.accent, color: c.primaryDark, padding: '13px 28px', borderRadius: 9, border: 'none', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
        </div>
      </div>
    </>
  );
}
