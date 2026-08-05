import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets, MapPin } from 'lucide-react';
import { getServiceBySlug, getRelatedServices, typicalCost } from '../../data/services';
import { getFeaturedStates, adjustForState } from '../../data/statePricing';

const ICONS = {
  home_residential: Home,
  apartment: Building2,
  commercial: Building,
  carpet: Layers,
  air_duct: Wind,
  dryer_vent: Flame,
  tile_grout: Grid3x3,
  mold_remediation: AlertTriangle,
  water_damage: Droplets,
};

function formatPrice(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// Per-sq-ft tier rates are often well under $1 (e.g. commercial: $0.052–$0.185/sq ft) —
// rounding those to whole dollars collapses them all to "$0". Show cents for rates.
function formatTierPrice(n, service) {
  return service.unitType === 'per_sqft' ? `$${n.toFixed(2)}` : formatPrice(n);
}

function unitSuffix(service) {
  if (service.unitType === 'per_sqft') return '/sq ft';
  if (service.unitType === 'per_room') return '/room';
  return '';
}

function TiersTable({ service }) {
  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Tier</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Price</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {service.tiers.map((tier, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
              <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{tier.label}</td>
              <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 700, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                {formatTierPrice(tier.low, service)}–{formatTierPrice(tier.high, service)}<span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 12 }}>{unitSuffix(service)}</span>
              </td>
              <td style={{ padding: '10px 14px', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>{tier.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StateMiniTable({ service }) {
  const tier = service.tiers[service.typicalTierIndex] || service.tiers[0];
  const qty = service.unitType === 'flat' ? 1 : (service.typicalQuantity || 1) * (service.typicalVisitsPerMonth || 1);
  const states = getFeaturedStates();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
      {states.map(state => {
        const range = adjustForState(tier.low * qty, tier.high * qty, state);
        return (
          <a key={state.code} href={`/cleaning-cost/${state.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ border: '1px solid #f1f5f9', background: '#fafafa', borderRadius: 8, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#0f172a' }}><MapPin size={11} color="#2563eb" />{state.name}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>{formatPrice(range.low)}–{formatPrice(range.high)}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

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

export default function ServicePage({ slug }) {
  const service = getServiceBySlug(slug);

  if (!service) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ color: '#0f172a' }}>Service not found</h2>
      <a href="/" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to home</a>
    </div>
  );

  const Icon = ICONS[service.id] || Home;
  const cost = typicalCost(service);
  const related = getRelatedServices(service);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'Cleaning Services', item: 'https://www.cleanestimator.com/#services' },
      { '@type': 'ListItem', position: 3, name: service.name, item: `https://www.cleanestimator.com/cleaning-services/${service.slug}` },
    ],
  };
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.metaDescription,
    provider: { '@type': 'Organization', name: 'Clean Estimator', url: 'https://www.cleanestimator.com' },
    areaServed: 'United States',
    offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: String(cost.low), highPrice: String(cost.high) },
  };

  return (
    <>
      <Helmet>
        <title>{service.seoTitle}</title>
        <meta name="description" content={service.metaDescription} />
        <link rel="canonical" href={`https://www.cleanestimator.com/cleaning-services/${service.slug}`} />
        <meta property="og:title" content={service.seoTitle} />
        <meta property="og:description" content={service.metaDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={service.seoTitle} />
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 24px 64px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

          <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 24, flexWrap: 'wrap' }}>
            <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
            <span>›</span>
            <span style={{ color: '#0f172a' }}>{service.name}</span>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '32px 36px', marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon size={22} color="#2563eb" strokeWidth={1.75} />
            </div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: 10 }}>{service.name} Cost 2026</h1>
            <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>{service.tagline}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#2563eb' }}>{formatPrice(cost.low)} – {formatPrice(cost.high)}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                {service.unitType === 'flat' ? 'typical job cost' : service.unitType === 'per_room' ? `for a ${service.typicalQuantity}-room home` : service.id === 'commercial' ? `for a ${service.typicalQuantity.toLocaleString()} sq ft office, weekly` : `for ${service.typicalQuantity.toLocaleString()} sq ft`}
              </span>
            </div>
          </div>

          {service.disclaimer && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '13px 16px', marginBottom: 24, display: 'flex', gap: 10 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 3, fontSize: 13 }}>Important</div>
                <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>{service.disclaimer}</p>
              </div>
            </div>
          )}

          <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 12, padding: '18px 24px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Get a ZIP-code accurate {service.name.toLowerCase()} estimate</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Free · No signup · 60 seconds</div>
            </div>
            <a href={`/?service=${service.id}`} style={{ background: 'white', color: '#2563eb', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              Calculate Now →
            </a>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '32px 36px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Pricing by Tier</h2>
            <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 4 }}>National average pricing — {service.unit}.</p>
            <TiersTable service={service} />

            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginTop: 32, marginBottom: 14 }}>What to Know</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {service.bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14.5, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                  <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span>{b}
                </li>
              ))}
            </ul>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginTop: 32, marginBottom: 14 }}>{service.name} Cost by State</h2>
            <StateMiniTable service={service} />

            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginTop: 32, marginBottom: 14 }}>FAQs</h2>
            <FaqAccordion faqs={service.faqs} />
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '24px 28px', marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>Ready to get an accurate estimate?</div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Use our free calculator for a ZIP-code accurate {service.name.toLowerCase()} estimate in under 60 seconds.</p>
            <a href={`/?service=${service.id}`} style={{ background: '#2563eb', color: 'white', padding: '12px 28px', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Get My Free Estimate →
            </a>
          </div>

          {related.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Related Services</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {related.map(r => (
                  <a key={r.slug} href={`/cleaning-services/${r.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 6 }}>{r.name}</div>
                      <span style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600 }}>See pricing →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
