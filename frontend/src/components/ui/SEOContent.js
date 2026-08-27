import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets, Check, MapPin, Ruler, ListChecks, RefreshCw, PlusCircle, Sparkles } from 'lucide-react';
import { getAllFaqs } from '../../data/faqs';
import { getAllServices, typicalCost } from '../../data/services';
import { getFeaturedStates } from '../../data/statePricing';

const FAQ = getAllFaqs();

const PRICE_FACTORS = [
  { Icon: Ruler, term: 'Home Size (Square Footage)', detail: 'Your base price scales with square footage — $90–$115 for a home under 1,000 sq ft, up to $272–$338 for a home over 3,000 sq ft.' },
  { Icon: ListChecks, term: 'Service Type', detail: 'Standard cleaning is the baseline. Deep cleaning costs 68–85% more, and move-in/move-out cleaning costs 88–105% more than a standard visit.' },
  { Icon: MapPin, term: 'Location (ZIP Code)', detail: 'State and city cost-of-living adjust your price — California and New York run 30–60% above the national average; many Southern and Midwest states run below it.' },
  { Icon: RefreshCw, term: 'Cleaning Frequency', detail: 'Recurring service is cheaper per visit: weekly gets a 20% discount, biweekly 15%, and monthly 10% off the one-time rate.' },
  { Icon: PlusCircle, term: 'Add-Ons', detail: 'Inside oven ($38–$50), inside fridge ($30–$42), interior windows ($52–$65), and laundry are priced separately on top of the base clean.' },
  { Icon: Sparkles, term: 'Home Condition', detail: 'A home that hasn\'t been professionally cleaned in months typically costs 22–28% more for the first visit than one already in good condition.' },
];

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
const COLORS = {
  home_residential: { color: '#2563eb', bg: '#eff6ff' },
  apartment: { color: '#4f46e5', bg: '#eef2ff' },
  commercial: { color: '#7c3aed', bg: '#f5f3ff' },
  carpet: { color: '#059669', bg: '#ecfdf5' },
  air_duct: { color: '#0891b2', bg: '#ecfeff' },
  dryer_vent: { color: '#ea580c', bg: '#fff7ed' },
  tile_grout: { color: '#0d9488', bg: '#f0fdfa' },
  mold_remediation: { color: '#d97706', bg: '#fffbeb' },
  water_damage: { color: '#0284c7', bg: '#f0f9ff' },
};
const TIER_NOTE = {
  high: 'Higher cost of living drives premium pricing',
  low: 'Lower cost market, competitive pricing',
  average: 'Close to the national average for cleaning service costs',
};

// Short, human labels for the price shown on each service card — kept
// separate from the raw unit type so the wording matches how homeowners
// actually think about each service (e.g. "requires inspection" for mold).
const DETAIL_OVERRIDES = {
  home_residential: 'per visit, standard clean',
  apartment: 'per visit',
  commercial: 'per month, 2,000 sq ft office (weekly)',
  carpet: 'for a 5-room home',
  air_duct: 'per system',
  dryer_vent: 'per dryer',
  tile_grout: 'for 300 sq ft',
  mold_remediation: 'requires inspection',
  water_damage: 'emergency service',
};

function formatPrice(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

const SERVICES = getAllServices().map(service => {
  const cost = typicalCost(service);
  return {
    Icon: ICONS[service.id] || Home,
    ...COLORS[service.id],
    title: service.name,
    range: `${formatPrice(cost.low)} – ${formatPrice(cost.high)}`,
    detail: DETAIL_OVERRIDES[service.id] || service.unit,
    href: `/cleaning-services/${service.slug}`,
    facts: service.bullets.slice(0, 3),
  };
});

const STATES_DATA = getFeaturedStates().map(s => ({
  state: s.name,
  avg: `${formatPrice(s.low)}–${formatPrice(s.high)}`,
  note: TIER_NOTE[s.tier],
  href: `/cleaning-cost/${s.slug}`,
}));

export default function SEOContent() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Clean Estimator — Free Cleaning Cost Calculator',
    url: 'https://www.cleanestimator.com',
    description: 'Free cleaning cost calculator and estimator for US homeowners and businesses. Instant, ZIP-code specific estimates for house cleaning, carpet, air duct, mold remediation, water damage, and more across all 50 states.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '3142',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Free cleaning cost estimates with no signup',
      'ZIP-code specific pricing across all 50 US states',
      'House cleaning cost calculator',
      'Carpet cleaning cost estimator',
      'Air duct cleaning cost calculator',
      'Commercial cleaning cost calculator',
      'Mold remediation cost estimator',
      'Water damage restoration cost estimator',
      'Dryer vent cleaning cost calculator',
      'Tile and grout cleaning cost estimator',
      'Apartment cleaning cost calculator',
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Clean Estimator',
      url: 'https://www.cleanestimator.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cleanestimator.com/og-image.png',
        width: 1200,
        height: 630,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>Free Cleaning Cost Calculator 2026 | Clean Estimator</title>
        <meta name="description" content="Free cleaning cost calculator for 2026. Get instant ZIP-code specific estimates: house cleaning $90–$338, carpet cleaning $44–$100/room, air duct from $330, commercial, mold remediation & more. No signup needed." />
        <meta name="keywords" content="cleaning cost calculator, cleaning cost estimator, house cleaning cost calculator, how much does cleaning cost, cleaning estimate, carpet cleaning cost, air duct cleaning cost, commercial cleaning rates, mold remediation cost, cleaning price calculator, free cleaning estimate" />
        <link rel="canonical" href="https://www.cleanestimator.com/" />
        <meta property="og:site_name" content="Clean Estimator" />
        <meta property="og:title" content="Free Cleaning Cost Calculator 2026 | Clean Estimator" />
        <meta property="og:description" content="Instant ZIP-code specific cleaning cost estimates. House cleaning, carpet, air duct, mold remediation and more. Free, no signup." />
        <meta property="og:url" content="https://www.cleanestimator.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.cleanestimator.com/og-image.png" />
        <meta property="og:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CleanEstimator" />
        <meta name="twitter:title" content="Free Cleaning Cost Calculator 2026 | Clean Estimator" />
        <meta name="twitter:description" content="Free cleaning cost calculator — instant ZIP-code specific estimates for any cleaning service. No signup required." />
        <meta name="twitter:image" content="https://www.cleanestimator.com/og-image.png" />
        <meta name="twitter:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
      </Helmet>

      <div id="services" style={{ background: 'white', marginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          {/* Services grid */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.5px' }}>
              Cleaning Cost Calculator — Every Service, Every State
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', maxWidth: 580, margin: '0 auto' }}>
              Clean Estimator covers 9 cleaning and restoration services with ZIP-code specific pricing across all 50 states. Select a service below to get your instant estimate.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 80 }}>
            {SERVICES.map(({ Icon, color, bg, title, range, detail, href, facts }) => (
              <a
                key={title} href={href}
                style={{ display: 'block', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 20px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${color}22`; e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; const tile = e.currentTarget.querySelector('.svc-icon'); tile.style.background = color; tile.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; const tile = e.currentTarget.querySelector('.svc-icon'); tile.style.background = bg; tile.style.color = color; }}
              >
                <div
                  className="svc-icon"
                  style={{ width: 40, height: 40, borderRadius: 10, background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, transition: 'all 0.2s' }}
                >
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginBottom: 2, letterSpacing: '-0.3px' }}>{range}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>{detail}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {facts.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#475569', marginBottom: 5, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <Check size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />{f}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>

          {/* State pricing table */}
          <div style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.3px' }}>
              House Cleaning Cost by State — 2026 Averages
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, marginBottom: 32 }}>
              Average price for standard cleaning of a 2,000 sq ft home.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {STATES_DATA.map(s => (
                <a key={s.state} href={s.href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', borderRadius: 10, padding: '13px 16px', border: '1px solid #f1f5f9', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 14, color: '#0f172a' }}><MapPin size={12} color="#2563eb" />{s.state}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.note}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#2563eb', whiteSpace: 'nowrap', marginLeft: 12 }}>{s.avg}</div>
                  </div>
                </a>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94a3b8', marginTop: 14 }}>
              Prices vary. <a href="/" style={{ color: '#2563eb' }}>Use the calculator above</a> for a ZIP-code specific estimate.
            </p>
          </div>

          {/* How the cleaning estimator calculates price */}
          <div style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.3px' }}>
              How Our Cleaning Calculator Estimate Your Price
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, maxWidth: 640, margin: '0 auto 36px' }}>
              Clean Estimator is a free cleaning cost calculator that builds every quote from six real variables — not a flat national guess. Here's exactly what goes into your number.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 980, margin: '0 auto' }}>
              {PRICE_FACTORS.map(({ Icon, term, detail }) => (
                <div key={term} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} strokeWidth={2.25} />
                    </span>
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{term}</strong>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, margin: 0 }}>{detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 36, letterSpacing: '-0.3px' }}>
              Frequently Asked Questions
            </h2>
            <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQ.map(({ q, a }) => (
                <details key={q} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <summary style={{ padding: '16px 22px', fontWeight: 600, fontSize: 15, color: '#0f172a', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {q}
                    <span style={{ fontSize: 18, color: '#2563eb', flexShrink: 0, marginLeft: 12, fontWeight: 400 }}>+</span>
                  </summary>
                  <div style={{ padding: '0 22px 16px', fontSize: 14.5, color: '#374151', lineHeight: 1.7 }}>{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
