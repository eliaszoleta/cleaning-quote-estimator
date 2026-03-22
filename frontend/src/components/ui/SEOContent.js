import React from 'react';
import { Helmet } from 'react-helmet-async';

const FAQ = [
  { q: 'How much does house cleaning cost in 2025?', a: 'The average house cleaning cost in 2025 is $120–$250 for a standard clean of a 1,500–2,500 sq ft home. Prices vary widely by state — California and New York average $160–$300, while Texas and Florida average $110–$200.' },
  { q: 'How much does carpet cleaning cost?', a: 'Professional carpet cleaning costs $100–$300 for a typical home. Most companies charge $25–$75 per room, with a minimum charge of $75–$100. Steam cleaning (hot water extraction) is the most common and effective method.' },
  { q: 'How much does air duct cleaning cost?', a: 'Air duct cleaning costs $300–$700 for a typical residential home. The price depends on the number of vents, HVAC systems, and any add-on services like sanitizing or mold treatment.' },
  { q: 'How often should you clean air ducts?', a: 'The EPA recommends cleaning air ducts every 3–5 years, or sooner if you notice visible mold growth, pest infestation, excessive dust, or after major renovations that generate debris.' },
  { q: 'How much does commercial cleaning cost per square foot?', a: 'Commercial cleaning typically costs $0.07–$0.20 per square foot per visit. A 2,000 sq ft office cleaned weekly would cost approximately $400–$1,200 per month depending on service level and location.' },
  { q: 'How much does mold remediation cost?', a: 'Mold remediation costs $500–$6,000+ depending on the extent of contamination. Small bathroom mold patches cost $500–$1,500, while extensive basement or crawl space contamination can cost $3,000–$15,000+. Always get an in-person inspection first.' },
  { q: 'Is dryer vent cleaning worth it?', a: 'Yes — absolutely. The U.S. Fire Administration reports that clogged dryer vents cause approximately 2,900 home fires annually. Professional dryer vent cleaning costs $100–$200 and should be done at least once per year.' },
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

export default function SEOContent() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Free Cleaning Cost Estimator 2025 — House, Carpet, Commercial | CleanCalc</title>
        <meta name="description" content="Get accurate cleaning cost estimates for any service in your ZIP code. House cleaning $120–$250, carpet cleaning $100–$300, commercial cleaning, air duct, mold remediation and more. Free, instant, no signup." />
        <meta name="keywords" content="cleaning cost calculator, house cleaning cost, carpet cleaning price, how much does cleaning cost, commercial cleaning rates, air duct cleaning cost, mold remediation cost, dryer vent cleaning" />
        <link rel="canonical" href="https://cleaningcalculator.app/" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div style={{ background: 'white', marginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          {/* Services grid */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
              Cleaning Cost Estimates for Every Service
            </h2>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
              CleanCalc covers 9 cleaning and restoration services with ZIP-code specific pricing across all 50 states.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 80 }}>
            {[
              { icon: '🏠', title: 'House Cleaning', range: '$120 – $250', detail: 'per visit, standard clean', href: '/?service=home_residential', facts: ['Prices based on sq footage & bedrooms', 'Deep clean costs 1.5–2× more', 'Recurring discounts up to 15%'] },
              { icon: '🏢', title: 'Apartment Cleaning', range: '$85 – $200', detail: 'per visit', href: '/?service=apartment', facts: ['Studio to 4+ bedroom', 'Move-in/out cleans cost more', 'Vacant units 10–15% cheaper'] },
              { icon: '🏬', title: 'Commercial Cleaning', range: '$200 – $2,000+', detail: 'per month', href: '/?service=commercial', facts: ['Priced per sq ft per visit', 'Frequency heavily affects cost', 'Medical/restaurant rates higher'] },
              { icon: '🪣', title: 'Carpet Cleaning', range: '$100 – $300', detail: 'whole home', href: '/?service=carpet', facts: ['$25–$75 per room', 'Steam cleaning most effective', 'Pet odor treatment extra'] },
              { icon: '💨', title: 'Air Duct Cleaning', range: '$300 – $700', detail: 'per system', href: '/?service=air_duct', facts: ['Recommended every 3–5 years', 'More vents = higher cost', 'Mold treatment costs more'] },
              { icon: '🔥', title: 'Dryer Vent Cleaning', range: '$100 – $200', detail: 'per dryer', href: '/?service=dryer_vent', facts: ['Prevents fire hazard', 'Annual cleaning recommended', 'Clogs cost $50–$100 extra'] },
              { icon: '🔲', title: 'Tile & Grout Cleaning', range: '$175 – $450', detail: 'per project', href: '/?service=tile_grout', facts: ['Natural stone costs more', 'Sealing adds $1–$2/sq ft', 'Recoloring transforms appearance'] },
              { icon: '⚠️', title: 'Mold Remediation', range: '$500 – $6,000+', detail: 'requires inspection', href: '/?service=mold_remediation', facts: ['In-person inspection required', 'Fix moisture source first', 'Air testing adds $200–$500'] },
              { icon: '💧', title: 'Water Damage Restoration', range: '$1,500 – $8,000+', detail: 'emergency service', href: '/?service=water_damage', facts: ['Act within 24–48 hours', 'Category 3 (sewage) costs most', 'Homeowner's insurance may cover'] },
            ].map(s => (
              <a key={s.title} href={s.href} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.12)'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{s.title}</h3>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb', marginBottom: 2 }}>{s.range}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{s.detail}</div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {s.facts.map(f => <li key={f} style={{ fontSize: 13, color: '#475569', marginBottom: 4, display: 'flex', gap: 6 }}><span style={{ color: '#16a34a' }}>✓</span>{f}</li>)}
                </ul>
              </a>
            ))}
          </div>

          {/* State pricing table */}
          <div style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 12 }}>
              House Cleaning Costs by State
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 36 }}>
              Average price for standard cleaning of a 2,000 sq ft home.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {STATES_DATA.map(s => (
                <div key={s.state} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{s.state}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.note}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#2563eb', whiteSpace: 'nowrap', marginLeft: 12 }}>{s.avg}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 16 }}>
              Prices vary. <a href="/" style={{ color: '#2563eb' }}>Use the calculator above</a> for a ZIP-code specific estimate.
            </p>
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 40 }}>
              Frequently Asked Questions
            </h2>
            <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FAQ.map(({ q, a }) => (
                <details key={q} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <summary style={{ padding: '18px 24px', fontWeight: 700, fontSize: 16, color: '#0f172a', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {q}
                    <span style={{ fontSize: 20, color: '#2563eb', flexShrink: 0, marginLeft: 12 }}>+</span>
                  </summary>
                  <div style={{ padding: '0 24px 18px', fontSize: 15, color: '#374151', lineHeight: 1.7 }}>{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
