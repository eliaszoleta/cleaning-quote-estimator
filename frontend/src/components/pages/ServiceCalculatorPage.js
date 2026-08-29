import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Check } from 'lucide-react';
import { getServiceBySlug, getRelatedServices } from '../../data/services';
import CleaningCalculator from '../calculator/CleaningCalculator';

function FaqAccordion({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIndex(open ? -1 : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              aria-expanded={open}
            >
              <span style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{faq.q}</span>
              <ChevronDown size={16} color="#94a3b8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {open && (
              <div style={{ padding: '0 18px 16px' }}>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Derives /{service.slug}-calculator (all service slugs already end in
// "-cost", so this reads naturally as "[service] cost calculator") --
// used by both App.js routing and ServicePage.js's cross-link.
export function calculatorSlugFor(service) {
  return `${service.slug}-calculator`;
}

export default function ServiceCalculatorPage({ slug }) {
  // Once results are showing, ResultsScreen renders its own full page chrome
  // (grey background, its own card, Share/Print/disclaimer outside it) --
  // drop this wrapper's fixed white card so it isn't boxed in a second time.
  const [showingResults, setShowingResults] = useState(false);

  // slug here is the full calculator-page slug (e.g. "carpet-cleaning-cost-calculator");
  // strip the trailing "-calculator" to look up the underlying service.
  const service = getServiceBySlug(slug.replace(/-calculator$/, ''));

  if (!service) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ color: '#0f172a' }}>Calculator not found</h2>
      <a href="/cleaning-cost-calculator" style={{ color: '#2563eb', fontWeight: 600 }}>&larr; Back to the main calculator</a>
    </div>
  );

  const pageSlug = calculatorSlugFor(service);
  const title = `${service.name} Cost Calculator - Free Instant Estimate (2026)`;
  const description = `Free ${service.name.toLowerCase()} cost calculator with ZIP-code accurate pricing. ${service.tagline}`;
  const related = getRelatedServices(service);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: `${service.name} Cost Calculator`, item: `https://www.cleanestimator.com/${pageSlug}` },
    ],
  };
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${service.name} Cost Calculator`,
    url: `https://www.cleanestimator.com/${pageSlug}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.cleanestimator.com/${pageSlug}`} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20, flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a><span>&rsaquo;</span>
          <span style={{ color: '#0f172a' }}>{service.name} Cost Calculator</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: 14 }}>{service.name} Cost Calculator</h1>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            Get an instant, ZIP-code accurate {service.name.toLowerCase()} estimate — enter a few details and see a real price range in under 60 seconds. {service.tagline}
          </p>
        </div>

        <div style={showingResults ? undefined : { maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <CleaningCalculator embedded siteLanding initialService={service.id} onShowResults={setShowingResults} />
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20, textAlign: 'center' }}>What Affects Your {service.name} Price</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720, margin: '0 auto' }}>
            {service.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px' }}>
                <Check size={17} color="#16a34a" strokeWidth={3} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px 36px' }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{service.name} Cost Calculator FAQs</h2>
          <FaqAccordion faqs={service.faqs} />
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 14 }}>
            Want the full price breakdown by tier? See our <a href={`/cleaning-services/${service.slug}`} style={{ color: '#2563eb', fontWeight: 600 }}>complete {service.name.toLowerCase()} cost guide</a>.
          </p>
          {related.length > 0 && (
            <p style={{ fontSize: 13.5, color: '#94a3b8' }}>
              Other calculators:{' '}
              {related.map((r, i) => (
                <React.Fragment key={r.slug}>
                  {i > 0 && ' · '}
                  <a href={`/${calculatorSlugFor(r)}`} style={{ color: '#2563eb', fontWeight: 600 }}>{r.name}</a>
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
