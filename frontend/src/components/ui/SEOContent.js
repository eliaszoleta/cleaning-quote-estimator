import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets, Check } from 'lucide-react';

const FAQ = [
  { q: 'How much does house cleaning cost in 2026?', a: 'The average house cleaning cost in 2026 is $120–$250 for a standard clean of a 1,500–2,500 sq ft home. Prices vary widely by state — California and New York average $160–$300, while Texas and Florida average $110–$200. Use our free cleaning cost calculator above to get a ZIP-code specific estimate in seconds.' },
  { q: 'How do I calculate cleaning costs for my home?', a: 'To calculate cleaning costs, use our free cleaning cost estimator: select your service type, enter your ZIP code, and specify your home size and bedrooms. Our calculator uses real market data and state-by-state pricing to generate an accurate estimate in under 60 seconds. You can also estimate manually: multiply your home\'s square footage by $0.05–$0.15 for a standard clean, then adjust for your local cost of living.' },
  { q: 'How much should I pay for house cleaning?', a: 'A fair price for house cleaning in 2026 is $120–$180 for a small home (under 1,500 sq ft), $150–$250 for a medium home (1,500–2,500 sq ft), and $200–$350+ for a large home (2,500+ sq ft). Deep cleans and first-time cleans cost 1.5–2× more than recurring visits. Always get at least 3 quotes before booking.' },
  { q: 'How much does apartment cleaning cost?', a: 'Apartment cleaning typically costs $85–$150 for a studio or 1-bedroom, $110–$180 for a 2-bedroom, and $150–$250 for a 3-bedroom apartment. Move-in/move-out cleans cost significantly more ($150–$350+) due to the additional time required. Our cleaning cost calculator provides apartment-specific estimates by ZIP code.' },
  { q: 'How much does carpet cleaning cost?', a: 'Professional carpet cleaning costs $100–$300 for a typical home. Most companies charge $25–$75 per room, with a minimum charge of $75–$100. Steam cleaning (hot water extraction) is the most common and effective method. Pet odor treatment adds $30–$80 per room.' },
  { q: 'How much does air duct cleaning cost?', a: 'Air duct cleaning costs $300–$700 for a typical residential home. The price depends on the number of vents, HVAC systems, and any add-on services like sanitizing or mold treatment.' },
  { q: 'How often should you clean air ducts?', a: 'The EPA recommends cleaning air ducts every 3–5 years, or sooner if you notice visible mold growth, pest infestation, excessive dust, or after major renovations that generate debris.' },
  { q: 'How much does commercial cleaning cost per square foot?', a: 'Commercial cleaning typically costs $0.07–$0.20 per square foot per visit. A 2,000 sq ft office cleaned weekly would cost approximately $400–$1,200 per month depending on service level and location.' },
  { q: 'How much does mold remediation cost?', a: 'Mold remediation costs $500–$6,000+ depending on the extent of contamination. Small bathroom mold patches cost $500–$1,500, while extensive basement or crawl space contamination can cost $3,000–$15,000+. Always get an in-person inspection first.' },
  { q: 'Is dryer vent cleaning worth it?', a: 'Yes — absolutely. The U.S. Fire Administration reports that clogged dryer vents cause approximately 2,900 home fires annually. Professional dryer vent cleaning costs $100–$200 and should be done at least once per year.' },
  { q: 'What factors affect cleaning service costs?', a: 'The main factors that affect cleaning costs are: (1) Home size — larger homes cost more, (2) Location — cities and high cost-of-living states charge more, (3) Frequency — weekly and biweekly clients get 10–20% discounts, (4) Service type — deep cleans and move-out cleans cost more than standard recurring cleans, (5) Condition — heavily cluttered or dirty homes may incur surcharges, and (6) Add-ons — oven, fridge, and window cleaning typically cost extra.' },
  { q: 'Is it cheaper to hire a cleaning service or clean yourself?', a: 'Hiring a professional cleaning service costs $120–$250 per visit for a standard home, but saves 3–6 hours of your time. For many homeowners, the time savings and professional results justify the cost. Recurring service packages (weekly or biweekly) offer the best value at $80–$160 per visit with consistency discounts. DIY is cheaper upfront but requires purchasing supplies and the right techniques to achieve the same results.' },
  { q: 'How do I get a free cleaning estimate?', a: 'Use the Clean Estimator cleaning cost calculator at the top of this page — it\'s completely free, requires no signup, and gives you an instant estimate based on your ZIP code, service type, and home size. For an official quote, contact 2–3 local cleaning companies and request an in-home or virtual walkthrough.' },
];

const STATES_DATA = [
  { state: 'California', avg: '$165–$290', note: 'High cost of living drives premium pricing' },
  { state: 'New York', avg: '$155–$280', note: 'NYC metro significantly higher than upstate' },
  { state: 'Texas', avg: '$110–$195', note: 'Competitive market with many providers' },
  { state: 'Florida', avg: '$115–$200', note: 'High demand due to tourism/vacation rentals' },
  { state: 'Illinois', avg: '$120–$215', note: 'Chicago metro commands higher rates' },
  { state: 'Washington', avg: '$140–$250', note: 'Seattle/Bellevue among highest in nation' },
  { state: 'Colorado', avg: '$130–$230', note: 'Growing market, rates rising rapidly' },
  { state: 'Arizona', avg: '$105–$185', note: 'Lower cost market, growing population' },
];

const SERVICES = [
  { Icon: Home,          color: '#2563eb', bg: '#eff6ff', title: 'House Cleaning',           range: '$120 – $250',    detail: 'per visit, standard clean', href: '/?service=home_residential', facts: ['Prices based on sq footage & bedrooms', 'Deep clean costs 1.5–2× more', 'Recurring discounts up to 15%'] },
  { Icon: Building2,     color: '#4f46e5', bg: '#eef2ff', title: 'Apartment Cleaning',       range: '$85 – $200',     detail: 'per visit',                href: '/?service=apartment',         facts: ['Studio to 4+ bedroom', 'Move-in/out cleans cost more', 'Vacant units 10–15% cheaper'] },
  { Icon: Building,      color: '#7c3aed', bg: '#f5f3ff', title: 'Commercial Cleaning',      range: '$200 – $2,000+', detail: 'per month',                href: '/?service=commercial',        facts: ['Priced per sq ft per visit', 'Frequency heavily affects cost', 'Medical/restaurant rates higher'] },
  { Icon: Layers,        color: '#059669', bg: '#ecfdf5', title: 'Carpet Cleaning',          range: '$100 – $300',    detail: 'whole home',               href: '/?service=carpet',            facts: ['$25–$75 per room', 'Steam cleaning most effective', 'Pet odor treatment extra'] },
  { Icon: Wind,          color: '#0891b2', bg: '#ecfeff', title: 'Air Duct Cleaning',        range: '$300 – $700',    detail: 'per system',               href: '/?service=air_duct',          facts: ['Recommended every 3–5 years', 'More vents = higher cost', 'Mold treatment costs more'] },
  { Icon: Flame,         color: '#ea580c', bg: '#fff7ed', title: 'Dryer Vent Cleaning',      range: '$100 – $200',    detail: 'per dryer',                href: '/?service=dryer_vent',        facts: ['Prevents fire hazard', 'Annual cleaning recommended', 'Clogs cost $50–$100 extra'] },
  { Icon: Grid3x3,       color: '#0d9488', bg: '#f0fdfa', title: 'Tile & Grout Cleaning',   range: '$175 – $450',    detail: 'per project',              href: '/?service=tile_grout',        facts: ['Natural stone costs more', 'Sealing adds $1–$2/sq ft', 'Recoloring transforms appearance'] },
  { Icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', title: 'Mold Remediation',         range: '$500 – $6,000+', detail: 'requires inspection',      href: '/?service=mold_remediation',  facts: ['In-person inspection required', 'Fix moisture source first', 'Air testing adds $200–$500'] },
  { Icon: Droplets,      color: '#0284c7', bg: '#f0f9ff', title: 'Water Damage Restoration', range: '$1,500 – $8,000+', detail: 'emergency service',      href: '/?service=water_damage',      facts: ['Act within 24–48 hours', 'Category 3 (sewage) costs most', "Homeowner's insurance may cover"] },
];

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
    },
  };

  return (
    <>
      <Helmet>
        <title>Free Cleaning Cost Estimator 2026 — House, Carpet, Commercial | Clean Estimator</title>
        <meta name="description" content="Free cleaning cost calculator for 2026. Get instant ZIP-code specific estimates: house cleaning $120–$250, carpet cleaning $100–$300, air duct $300–$700, commercial, mold remediation & more. No signup needed." />
        <meta name="keywords" content="cleaning cost calculator, cleaning cost estimator, house cleaning cost calculator, how much does cleaning cost, cleaning estimate, carpet cleaning cost, air duct cleaning cost, commercial cleaning rates, mold remediation cost, cleaning price calculator, free cleaning estimate" />
        <link rel="canonical" href="https://www.cleanestimator.com/" />
        <meta property="og:site_name" content="Clean Estimator" />
        <meta property="og:title" content="Free Cleaning Cost Estimator 2026 | Clean Estimator" />
        <meta property="og:description" content="Instant ZIP-code specific cleaning cost estimates. House cleaning, carpet, air duct, mold remediation and more. Free, no signup." />
        <meta property="og:url" content="https://www.cleanestimator.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Cleaning Cost Estimator 2026 | Clean Estimator" />
        <meta name="twitter:description" content="Free cleaning cost calculator — instant ZIP-code specific estimates for any cleaning service. No signup required." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
      </Helmet>

      <div style={{ background: 'white', marginTop: 80 }}>
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
                <div key={s.state} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', borderRadius: 10, padding: '13px 16px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{s.state}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.note}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#2563eb', whiteSpace: 'nowrap', marginLeft: 12 }}>{s.avg}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94a3b8', marginTop: 14 }}>
              Prices vary. <a href="/" style={{ color: '#2563eb' }}>Use the calculator above</a> for a ZIP-code specific estimate.
            </p>
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
