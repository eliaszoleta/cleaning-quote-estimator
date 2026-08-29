import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Database, MapPin, SlidersHorizontal, BookOpen, ShieldCheck, RefreshCw, Scale } from 'lucide-react';

const CROSS_CHECKS = [
  { service: 'House Cleaning (1,500–2,000 sq ft)', ours: '$158–$198', published: '$118–$238, avg ~$176', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-it-cost-hire-house-cleaner.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/hire-a-maid-service']] },
  { service: 'Carpet Cleaning (per room)', ours: '$44–$100', published: '$25–$125 per room', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-carpet-cleaning-cost.htm'], ['HomeGuide', 'https://homeguide.com/costs/carpet-cleaning-prices']] },
  { service: 'Office Cleaning (per sq ft, per visit)', ours: '$0.088–$0.107', published: '$0.07–$0.20', sources: [['Housecall Pro', 'https://www.housecallpro.com/resources/how-to-price-commercial-cleaning-jobs/']] },
  { service: 'Air Duct Cleaning (base system)', ours: '$330–$420', published: '$268–$509, avg ~$379–$389', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-air-duct-cleaning-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/clean-ducts-and-vents']] },
  { service: 'Mold Remediation (10–100 sq ft)', ours: '$1,950–$2,700', published: '~$1,000–$2,500 for 100 sq ft, avg $2,368', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-mold-remediation-service-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/environmental-safety/remove-mold-and-toxic-materials/']] },
  { service: 'Dryer Vent Cleaning', ours: '$105–$253', published: '$104–$250+ depending on vent length', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-dryer-vent-cleaning-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/clean-dryer-vents/']] },
];

const SECTIONS = [
  {
    Icon: Database,
    title: 'Our Base Pricing',
    body: "Every price tier in our calculator — for house cleaning, carpet cleaning, commercial cleaning, and every other service — starts from aggregated market research across residential and commercial cleaning providers nationwide: published rate surveys, provider pricing pages, and industry cost data. We don't invent a number and work backward; we build each tier from what providers are actually charging, then keep it current as the market shifts. Below, we show exactly how our numbers stack up against published guides from Angi, HomeAdvisor, and other industry sources.",
  },
  {
    Icon: Scale,
    title: 'How Our Numbers Compare to Published Industry Guides',
    body: null, // rendered specially below
  },
  {
    Icon: MapPin,
    title: 'State Cost-of-Living Adjustments',
    body: "The same house cleaning job costs more in California than in Arkansas, and our numbers reflect that. Each state carries a multiplier — California sits around 1.40× the national baseline, Arkansas around 0.80× — built from regional labor cost and cost-of-living differences. That multiplier is applied directly to the national base price for whichever service you're pricing, not estimated separately per state.",
  },
  {
    Icon: MapPin,
    title: 'City and ZIP Code Pricing',
    body: "For city-level pages, we intentionally reuse the parent state's pricing data rather than inventing separate city-specific numbers. Reliable, verifiable cost data doesn't exist at neighborhood granularity for most markets — and we'd rather show you a number we can stand behind than a more precise-looking one we made up. If that changes for a given metro area, we'll update it.",
  },
  {
    Icon: SlidersHorizontal,
    title: 'How Service Type Changes Your Price',
    body: "Deep cleans, move-in/move-out cleans, recurring-service discounts, and add-ons (inside oven, interior windows, and similar) are all priced as a percentage adjustment off the base tier, derived from how cleaning companies actually structure their own rate cards — for example, deep cleaning consistently runs 68-85% above a standard clean across the providers we've reviewed, so that's the range we show.",
  },
  {
    Icon: BookOpen,
    title: 'External Sources We Reference',
    body: null, // rendered specially below
  },
  {
    Icon: ShieldCheck,
    title: "What Our Estimates Are — and Aren't",
    body: "Every number on Clean Estimator is a starting point, not a quote. Actual pricing depends on the specific condition of a property, local competition, and each company's own pricing — factors that are only ever fully visible in person. Use our numbers to negotiate confidently and spot outliers, then always get multiple quotes from licensed, insured professionals before booking.",
  },
  {
    Icon: RefreshCw,
    title: 'How Often We Update Pricing',
    body: "We review and adjust our pricing models as national and regional market conditions change, rather than on a fixed calendar schedule. If you ever see a number that looks out of step with what you're being quoted locally, we want to know — contact us and we'll take a look.",
  },
];

const CITATIONS = [
  { name: 'U.S. Environmental Protection Agency (EPA)', use: 'Air duct cleaning frequency guidance, and EPA-registered disinfectant lists (List N, List K) referenced in our medical and healthcare cleaning content.', href: 'https://www.epa.gov' },
  { name: 'U.S. Fire Administration', use: 'Dryer vent fire statistics cited in our dryer vent cleaning guides.', href: 'https://www.usfa.fema.gov' },
  { name: 'IICRC (Institute of Inspection, Cleaning and Restoration Certification)', use: 'Recommended carpet cleaning frequency and industry certification standards referenced across our carpet and restoration content.', href: 'https://www.iicrc.org' },
  { name: 'OSHA (Occupational Safety and Health Administration)', use: 'Bloodborne Pathogen Standard and workplace safety requirements referenced in our medical and healthcare facility cleaning content.', href: 'https://www.osha.gov' },
];

export default function MethodologyPage() {
  const title = 'How We Calculate Cleaning Prices | Clean Estimator';
  const description = "See exactly how Clean Estimator builds its pricing: base rate research, state cost-of-living adjustments, city pricing methodology, and the external sources we cite. Full transparency on where our numbers come from.";

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'How We Calculate Prices', item: 'https://www.cleanestimator.com/how-we-calculate-prices' },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://www.cleanestimator.com/how-we-calculate-prices" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20, flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a><span>&rsaquo;</span>
          <span style={{ color: '#0f172a' }}>How We Calculate Prices</span>
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.01em' }}>How We Calculate Cleaning Prices</h1>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.7 }}>
          Every estimate on Clean Estimator comes from a real methodology, not a guess. Here's exactly how the numbers behind the calculator — and every cost guide on this site — actually get built.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS.map(({ Icon, title: t, body }) => (
            <div key={t} style={{ background: 'white', borderRadius: 16, padding: '26px 28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 16px rgba(15,23,42,0.05)', display: 'flex', gap: 18 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{t}</h2>
                {body && <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>{body}</p>}
                {t === 'How Our Numbers Compare to Published Industry Guides' && (
                  <>
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: '0 0 14px' }}>
                      We don't just claim our numbers are researched — here's where they land next to current, publicly published cost guides from Angi, HomeAdvisor, HomeGuide, and Housecall Pro (checked August 2026). We're not claiming these sites as our original data source; this is an independent cross-check showing our ranges are in the same ballpark as what's publicly reported elsewhere.
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, color: '#374151' }}>Service</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, color: '#374151' }}>Our Estimate</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, color: '#374151' }}>Published Range</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, color: '#374151' }}>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CROSS_CHECKS.map(row => (
                            <tr key={row.service} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', color: '#0f172a' }}>{row.service}</td>
                              <td style={{ padding: '8px 10px', color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>{row.ours}</td>
                              <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{row.published}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>
                                {row.sources.map(([name, href], i) => (
                                  <React.Fragment key={name}>
                                    {i > 0 && ', '}
                                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{name}</a>
                                  </React.Fragment>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {t === 'External Sources We Reference' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: '0 0 4px' }}>
                      Where our content relies on safety guidance, industry standards, or regulatory requirements rather than our own pricing data, we cite the source directly:
                    </p>
                    {CITATIONS.map(c => (
                      <div key={c.name} style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, paddingLeft: 14, borderLeft: '2px solid #e2e8f0' }}>
                        <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>{c.name}</a> — {c.use}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 44, background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '32px 36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>See the Methodology in Action</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 15 }}>Run a real, ZIP-code accurate estimate using the pricing engine described above.</p>
          <a href="/cleaning-cost-calculator" style={{ background: '#2563eb', color: 'white', padding: '13px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'inline-block' }}>Try the Calculator &rarr;</a>
        </div>
      </div>
    </>
  );
}
