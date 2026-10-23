import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Database, MapPin, SlidersHorizontal, BookOpen, ShieldCheck, RefreshCw, Scale } from 'lucide-react';
import CountryFlag from '../dashboard/CountryFlag';
import { getAllServices } from '../../data/services';
import './PageHero.css';

// Derived from the real service list, not typed out as a number -- a
// hardcoded count goes stale the moment a new service is added.
const SERVICE_COUNT = getAllServices().length;

// Four tabs -- US, Canada, UK, Australia -- the same four countries the
// calculator itself prices (see defaults.js's COUNTRIES). US is first and
// opens by default: it's both the original/primary market and the only
// one most visitors and search engines will ever see server-rendered,
// since the other three only appear after a client-side tab click.
const TABS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
];

// ─── Cross-check tables: "our estimate" vs. real published cost guides ────
// Every "Ours" figure below is the actual US baseline shown in the US
// table (or the specific baseline named in defaults.js's own per-service
// research comments) multiplied by that country's researched CAD/GBP/AUD
// cost factor -- not a separate number invented for this page. Every
// "Published" figure and source link was checked (or re-checked) while
// building this page. A service with no row here means the research
// found Canadian/UK/Australian data too thin or inconsistent to respon-
// sibly cross-check (see each tab's own intro paragraph) -- we'd rather
// leave a gap than fill it with an unverified guess.
const CROSS_CHECKS_US = [
  { service: 'House Cleaning (1,500–2,000 sq ft)', ours: '$158–$198', published: '$118–$238, avg ~$176', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-it-cost-hire-house-cleaner.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/hire-a-maid-service']] },
  { service: 'Carpet Cleaning (per room)', ours: '$48–$62', published: '$25–$125 per room', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-carpet-cleaning-cost.htm'], ['HomeGuide', 'https://homeguide.com/costs/carpet-cleaning-prices']] },
  { service: 'Office Cleaning (per sq ft, per visit)', ours: '$0.088–$0.107', published: '$0.07–$0.20', sources: [['Housecall Pro', 'https://www.housecallpro.com/resources/how-to-price-commercial-cleaning-jobs/']] },
  { service: 'Air Duct Cleaning (base system)', ours: '$330–$420', published: '$268–$509, avg ~$379–$389', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-air-duct-cleaning-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/clean-ducts-and-vents']] },
  { service: 'Mold Remediation (10–100 sq ft)', ours: '$1,950–$2,700', published: '~$1,000–$2,500 for 100 sq ft, avg $2,368', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-mold-remediation-service-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/environmental-safety/remove-mold-and-toxic-materials/']] },
  { service: 'Dryer Vent Cleaning (standard wall vent)', ours: '$118–$155', published: '$104–$250+ depending on vent length', sources: [['Angi', 'https://www.angi.com/articles/how-much-does-dryer-vent-cleaning-cost.htm'], ['HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/clean-dryer-vents/']] },
  { service: 'Upholstery Cleaning (sofa)', ours: '$130–$195', published: '$120–$250, national avg ~$173', sources: [['Angi/HomeAdvisor', 'https://www.homeadvisor.com/cost/cleaning-services/clean-furniture/']] },
];

const CROSS_CHECKS_CA = [
  { service: 'House Cleaning (1,500–2,000 sq ft, 3-bed/2-bath, standard)', ours: 'C$223–C$263', published: 'C$160–C$320, avg C$230', sources: [['HomeStars', 'https://homestars.com/cost-guides/house-apartment-cleaning-cost/']] },
  { service: 'Commercial Cleaning (2,000 sq ft office, weekly, monthly)', ours: 'C$876–C$1,128/mo', published: '≈C$866–C$2,165/mo ($0.10–$0.25/sq ft)', sources: [['HomeStars', 'https://homestars.com/cost-guides/house-apartment-cleaning-cost/']] },
  { service: 'Air Duct Cleaning (11–20 vents, 1 system)', ours: 'C$420–C$535', published: 'C$375–C$650, avg C$500', sources: [['HomeStars', 'https://homestars.com/cost-guides/house-apartment-cleaning-cost/']] },
  { service: 'Dryer Vent Cleaning (standard, under 15 ft)', ours: 'C$140–C$193', published: 'C$150–C$200', sources: [['HomeStars', 'https://homestars.com/cost-guides/house-apartment-cleaning-cost/']] },
  { service: 'Water Damage Restoration (500 sq ft, clean water)', ours: 'C$1,450–C$1,950 (~C$3.40/sq ft)', published: 'C$3–C$7.50/sq ft industry avg', sources: [['Central Alberta DKI', 'https://centralab.dki.ca/the-true-cost-of-water-damage-restoration-in-canada-in-2025/']] },
];

const CROSS_CHECKS_GB = [
  { service: 'Carpet Cleaning (per room)', ours: '£24–£31', published: '£30–£70 per room', sources: [['Bark', 'https://www.bark.com/en/gb/home-improvement-hub/how-much-does-carpet-cleaning-cost-in-the-uk/']] },
  { service: 'Upholstery Cleaning (3-seat sofa)', ours: '£52–£78', published: '£50–£90 for a 3-seat sofa', sources: [['Housekeep', 'https://housekeep.com/cost-guide/cleaner/sofa-cleaning/']] },
  { service: 'Air Duct Cleaning (11–20 vents, 1 system)', ours: '£168–£214', published: '£100–£400, avg £250', sources: [['MyBuilder', 'https://www.mybuilder.com/plumbing/price-guides/cost-of-air-duct-cleaning']] },
  { service: 'Mould Remediation (single room)', ours: '£683–£945', published: '£500–£1,000, avg £700', sources: [['MyJobQuote', 'https://myjobquote.co.uk/costs/mould-removal']] },
  { service: 'Commercial Cleaning (per cleaner-hour)', ours: '£12–£30/hr', published: '£18–£25/hr (London £20–£35)', sources: [['MyJobQuote', 'https://www.myjobquote.co.uk/costs/office-cleaning']] },
  { service: 'Apartment Cleaning (2-bed, end-of-tenancy)', ours: '£176–£221', published: '£120–£180 for a 2-bed', sources: [['MyJobQuote', 'https://myjobquote.co.uk/costs/end-of-tenancy-cleaning-costs']] },
];

const CROSS_CHECKS_AU = [
  { service: 'Carpet Cleaning (per room)', ours: 'A$31–A$40', published: 'A$75–A$200 (Sydney/Melbourne/Brisbane)', sources: [['Airtasker', 'https://www.airtasker.com/au/costs/carpet-cleaning/carpet-cleaning-cost/']] },
  { service: 'Upholstery Cleaning (3-seat sofa)', ours: 'A$111–A$166', published: 'A$80–A$180, Sydney 3-seater', sources: [['Clean Group', 'https://www.clean-group.com.au/sofa-couch-cleaning-cost-sydney-price-guide']] },
  { service: 'Air Duct Cleaning (whole-home, single-source)', ours: 'A$336–A$428', published: 'A$300–A$500', sources: [['HomeStars', 'https://www.homestars.com/cleaning/air-duct-cleaning-service-pros/sydney']] },
  { service: 'Dryer Vent Cleaning (single-source)', ours: 'A$118–A$155', published: 'A$100–A$175', sources: [['HomeStars', 'https://www.homestars.com/cleaning/air-duct-cleaning-service-pros/sydney']] },
  { service: 'Commercial Cleaning (per cleaner-hour)', ours: 'A$26–A$64/hr', published: 'A$35–A$65/hr, national avg ~A$50/hr', sources: [['Clean Group', 'https://www.clean-group.com.au/how-much-does-workplace-cleaning-cost-in-australia']] },
  { service: 'Mould Remediation (single room, incl. kitchen/bath)', ours: 'A$1,853–A$2,565', published: 'A$500–A$4,000/room, mid ~A$2,250', sources: [['Oneflare', 'https://oneflare.com.au/costs/mould-removal']] },
];

// ─── External regulatory / standards sources ──────────────────────────────
// IICRC is a shared global certifying body (carpet/restoration standards),
// so it appears on every tab unchanged. The other three entries per tab
// are the country's own safety regulator or wage authority -- not a US
// body awkwardly relabeled.
const IICRC_CITATION = { name: 'IICRC (Institute of Inspection, Cleaning and Restoration Certification)', use: 'Recommended carpet cleaning frequency and industry certification standards referenced across our carpet and restoration content.', href: 'https://www.iicrc.org' };

const CITATIONS_US = [
  { name: 'U.S. Environmental Protection Agency (EPA)', use: 'Air duct cleaning frequency guidance, and EPA-registered disinfectant lists (List N, List K) referenced in our medical and healthcare cleaning content.', href: 'https://www.epa.gov' },
  { name: 'U.S. Fire Administration', use: 'Dryer vent fire statistics cited in our dryer vent cleaning guides.', href: 'https://www.usfa.fema.gov' },
  IICRC_CITATION,
  { name: 'OSHA (Occupational Safety and Health Administration)', use: 'Bloodborne Pathogen Standard and workplace safety requirements referenced in our medical and healthcare facility cleaning content.', href: 'https://www.osha.gov' },
];

const CITATIONS_CA = [
  { name: 'CCOHS (Canadian Centre for Occupational Health and Safety)', use: 'Workplace health and safety guidance for cleaning and custodial staff, referenced in our Canada-specific safety content.', href: 'https://www.ccohs.ca' },
  { name: 'Health Canada', use: "The Guide to Addressing Moisture and Mould Indoors, referenced in our mold remediation content for Canadian readers.", href: 'https://www.canada.ca/en/health-canada/services/publications/healthy-living/addressing-moisture-mould-your-home.html' },
  IICRC_CITATION,
];

const CITATIONS_GB = [
  { name: 'HSE (Health and Safety Executive)', use: 'Cleaning industry guidance, including COSHH chemical-safety sheets and musculoskeletal-risk guidance, referenced in our UK safety content.', href: 'https://www.hse.gov.uk/cleaning/index.htm' },
  { name: 'BICSc (British Institute of Cleaning Science)', use: 'UK cleaning industry standards and accredited training, referenced where our UK content discusses professional certification.', href: 'https://bics.org.uk' },
  IICRC_CITATION,
];

const CITATIONS_AU = [
  { name: 'Safe Work Australia', use: 'National work health and safety guidance for the cleaning industry, referenced in our Australia-specific safety content.', href: 'https://www.safeworkaustralia.gov.au' },
  { name: 'Fair Work Ombudsman', use: 'Cleaning Services Award (MA000022) wage rates, the basis for our AUD-vs-USD cost factor below.', href: 'https://fairwork.gov.au/employment-conditions/awards/awards-summary/ma000022-summary' },
  IICRC_CITATION,
];

// ─── Per-country section copy ──────────────────────────────────────────────
// "How Service Type Changes Your Price" and "What Our Estimates Are -- and
// Aren't" are deliberately identical across every tab: the deep-clean/
// recurring-discount percentages are a single global rule applied the same
// way regardless of country (see CLEANING_TYPE_MULTIPLIERS in defaults.js
// -- there's no separate US/CA/UK/AU version of it), and the "this is a
// starting point, not a quote" disclaimer is just as true everywhere.
const SERVICE_TYPE_BODY = "Deep cleans, move-in/move-out cleans, recurring-service discounts, and add-ons (inside oven, interior windows, and similar) are all priced as a percentage adjustment off the base tier, derived from how cleaning companies actually structure their own rate cards -- for example, deep cleaning consistently runs 68-85% above a standard clean across the providers we've reviewed. That percentage is the same in every country we support; it's a rule about how cleaning jobs are priced relative to each other, not a currency or regional cost-of-living figure.";
const ESTIMATES_ARENT_BODY = "Every number on Clean Estimator is a starting point, not a quote. Actual pricing depends on the specific condition of a property, local competition, and each company's own pricing -- factors that are only ever fully visible in person. Use our numbers to negotiate confidently and spot outliers, then always get multiple quotes from licensed, insured professionals before booking.";

const COPY = {
  US: {
    basePricing: "Every price tier in our calculator — for house cleaning, carpet cleaning, commercial cleaning, and every other service — starts from aggregated market research across residential and commercial cleaning providers nationwide: published rate surveys, provider pricing pages, and industry cost data. We don't invent a number and work backward; we build each tier from what providers are actually charging, then keep it current as the market shifts. Below, we show exactly how our numbers stack up against published guides from Angi, HomeAdvisor, and other industry sources.",
    crossCheckIntro: "We don't just claim our numbers are researched — here's where they land next to current, publicly published cost guides from Angi, HomeAdvisor, HomeGuide, and Housecall Pro (checked October 2026). We're not claiming these sites as our original data source; this is an independent cross-check showing our ranges are in the same ballpark as what's publicly reported elsewhere.",
    regionTitle: 'State Cost-of-Living Adjustments',
    regionBody: "The same house cleaning job costs more in California than in Arkansas, and our numbers reflect that. Each state carries a multiplier — California sits around 1.40× the national baseline, Arkansas around 0.80× — built from regional labor cost and cost-of-living differences. That multiplier is applied directly to the national base price for whichever service you're pricing, not estimated separately per state.",
    cityTitle: 'City and ZIP Code Pricing',
    cityBody: "For city-level pages, we intentionally reuse the parent state's pricing data rather than inventing separate city-specific numbers. Reliable, verifiable cost data doesn't exist at neighborhood granularity for most markets — and we'd rather show you a number we can stand behind than a more precise-looking one we made up. If that changes for a given metro area, we'll update it.",
    updateBody: `We review and adjust our pricing models as national and regional market conditions change, rather than on a fixed calendar schedule. Most recently, in October 2026, we re-verified every one of our ${SERVICE_COUNT} services against current published cost guides and BLS labor-wage data, state by state — several tables (carpet, upholstery, dryer vent, water damage restoration, apartment cleaning, and Airbnb turnover pricing) were adjusted as a result. If you ever see a number that looks out of step with what you're being quoted locally, we want to know — contact us and we'll take a look.`,
    crossChecks: CROSS_CHECKS_US,
    citations: CITATIONS_US,
  },
  CA: {
    basePricing: "Every price tier in our Canadian pricing — for house cleaning, carpet cleaning, commercial cleaning, and every other service — starts the same way the US pricing does: real market research, not an invented number. The core wage data comes from the Government of Canada's Job Bank wage reports for light duty cleaners (NOC 65310, updated November 2025), cross-checked service by service against real Canadian cost guides — HomeStars, RenoQuotes, and Canadian restoration contractors among them. Where that research gave a clear, comparable Canadian anchor, we tightened the number to match it; where it didn't (thin data, a single vendor's marketing page, or conflicting sources), we say so directly and fall back to the wage-based estimate instead of presenting a guess as research.",
    crossCheckIntro: "Here's where our Canadian-dollar estimates land next to real, current Canadian cost guides (checked October–November 2026). Several services — carpet, upholstery, tile & grout, mold remediation, and a few others — are intentionally left on our general CAD cost-factor rather than individually tightened, because the Canada-specific data we found for them was too thin or inconsistent to trust over a wage-based estimate. That's a deliberate choice, not an oversight.",
    regionTitle: 'Province Cost-of-Living Adjustments',
    regionBody: "The same house cleaning job costs more in Yukon than in Manitoba, and our numbers reflect that. Each province and territory carries a multiplier relative to Canada's own national median cleaner wage — $19.74/hour, per the Government of Canada's Job Bank wage report for light duty cleaners (NOC 65310, updated November 2025). Yukon and the Northwest Territories sit highest (around 1.21–1.25×, reflecting the north's genuinely higher labour costs and cost of living), while Manitoba and Nova Scotia sit lowest (around 0.86×). That multiplier applies directly to the national base price, the same way California's or Arkansas's does in the US model.",
    cityTitle: 'City and Postal Code Pricing',
    cityBody: "For city-level pages, we reuse the parent province's pricing data rather than inventing separate city-specific numbers, for the same reason as the US model: reliable, verifiable cost data doesn't exist at neighbourhood granularity for most Canadian markets, and we'd rather show a number we can stand behind than a more precise-looking one we made up.",
    updateBody: "We added Canada as a pilot country in October 2026, starting from the wage-based provincial multipliers above, then went back service by service to tighten the numbers against real Canadian cost guides where the data supported it. As with the US model, we review and adjust as market conditions change rather than on a fixed schedule.",
    crossChecks: CROSS_CHECKS_CA,
    citations: CITATIONS_CA,
  },
  GB: {
    basePricing: "Every price tier in our UK pricing starts from the same real-research approach as the US and Canadian models. Because this research pass couldn't find an authoritative ONS wage breakdown specifically for the cleaning occupation (SOC 9223) by region, the regional multiplier below is built from ONS's broader Regional Gross Disposable Household Income data instead, and the overall GBP-vs-USD cost factor comes from comparing ONS's cleaner wage figure (SOC 9223, ASHE) against the equivalent US figure. From there, we cross-checked service by service against real UK cost guides — Bark, MyBuilder, MyJobQuote, Fantastic Services, and Housekeep among them — and tightened individual services wherever the UK data clearly supported a different number than the general wage-ratio estimate.",
    crossCheckIntro: "Here's where our GBP estimates land next to real, current UK cost guides (checked October–November 2026). One pattern shows up clearly: commoditised, marketplace-driven jobs (carpet, upholstery, air duct, mould) price noticeably below what the wage ratio alone predicts, while end-of-tenancy cleaning — a distinct, higher-stakes job tied to deposit disputes and letting-agent requirements — actually prices above it.",
    regionTitle: 'Region Cost-of-Living Adjustments',
    regionBody: "The same house cleaning job costs more in London than in the North East, and our numbers reflect that. Each of the UK's 12 ITL1 statistical regions carries a multiplier built from ONS's Regional Gross Disposable Household Income per head (2024 bulletin) — London sits highest at 1.40×, directly sourced from that bulletin, while the North East sits lowest at 0.79×, also directly sourced. The remaining regions (South East, East of England, the Midlands, Yorkshire, Scotland, North West) weren't individually confirmed in ONS's regional cleaning-wage data, so their multipliers are estimated from well-established UK regional economic geography — flagged here rather than presented as independently confirmed.",
    cityTitle: 'City and Postcode Pricing',
    cityBody: "For city-level pages, we reuse the parent region's pricing data rather than inventing separate city-specific numbers, for the same reason as the US and Canadian models: reliable, verifiable cost data doesn't exist at neighbourhood granularity for most UK markets.",
    updateBody: "We added the UK as a pilot country in October 2026, then went back twice (October and November 2026) to re-research commercial and air duct cleaning specifically, after a wider search surfaced more current, better-corroborated UK sources than the original pass had found.",
    crossChecks: CROSS_CHECKS_GB,
    citations: CITATIONS_GB,
  },
  AU: {
    basePricing: "Every price tier in our Australian pricing starts the same way: real market research, not an invented number. The overall AUD-vs-USD cost factor comes from comparing Australia's Cleaning Services Award (MA000022) Level 1 minimum wage — $27.08/hour effective 1 July 2026 — against the equivalent US figure, cross-checked against a separate industry guide's average Australian house cleaner wage to confirm cleaning runs near the award floor there. From there, we cross-checked service by service against real Australian cost guides — Airtasker, Clean Group, Oneflare, HomeStars, and others — and tightened individual services wherever the data clearly supported a different number.",
    crossCheckIntro: "Here's where our AUD estimates land next to real, current Australian cost guides (checked November 2026). A couple of figures below are flagged single-source, where only one Australian cost guide covered that specific service — still real data, just not independently corroborated the way the others are.",
    regionTitle: 'State/Territory Cost-of-Living Adjustments',
    regionBody: "The same house cleaning job costs more in Western Australia than in South Australia, and our numbers reflect that. Each state and territory carries a multiplier relative to the national average weekly ordinary-time earnings ($2,083.70/week nationally, per the ABS's May 2026 Average Weekly Earnings release) — WA and the ACT sit highest (around 1.10–1.11×, sourced from a secondary ABS digest), South Australia lowest (around 0.90×, estimated from well-known regional wage patterns). The Northern Territory sits at the national average by design — a deliberate middle-of-the-road call, not a confident estimate, since it shows conflicting signals (high nominal remote-area wages against the lowest disposable income of any state or territory).",
    cityTitle: 'City and Postcode Pricing',
    cityBody: "For city-level pages, we reuse the parent state or territory's pricing data rather than inventing separate city-specific numbers, for the same reason as every other country we support: reliable, verifiable cost data doesn't exist at suburb-level granularity for most Australian markets.",
    updateBody: "We added Australia as our fourth pilot country in November 2026, researching regional multipliers and per-service pricing from the start rather than launching on a single blanket factor. One service (mold remediation) was revisited a second time after an implausible 7–10x gap turned up against the US baseline — the original source turned out to be the wrong anchor, a basic wipe-down price rather than a comparable remediation job.",
    crossChecks: CROSS_CHECKS_AU,
    citations: CITATIONS_AU,
  },
};

function buildSections(code) {
  const c = COPY[code];
  return [
    { Icon: Database, title: 'Our Base Pricing', body: c.basePricing },
    { Icon: Scale, title: 'How Our Numbers Compare to Published Industry Guides', body: null },
    { Icon: MapPin, title: c.regionTitle, body: c.regionBody },
    { Icon: MapPin, title: c.cityTitle, body: c.cityBody },
    { Icon: SlidersHorizontal, title: 'How Service Type Changes Your Price', body: SERVICE_TYPE_BODY },
    { Icon: BookOpen, title: 'External Sources We Reference', body: null },
    { Icon: ShieldCheck, title: "What Our Estimates Are — and Aren't", body: ESTIMATES_ARENT_BODY },
    { Icon: RefreshCw, title: 'How Often We Update Pricing', body: c.updateBody },
  ];
}

export default function MethodologyPage() {
  const [country, setCountry] = useState('US');
  const mobileQuery = () => window.matchMedia('(max-width: 480px)');
  const [isMobile, setIsMobile] = useState(() => mobileQuery().matches);
  useEffect(() => {
    const mq = mobileQuery();
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const sections = buildSections(country);
  const { crossCheckIntro, crossChecks, citations } = COPY[country];

  const title = 'How We Calculate Cleaning Prices | Clean Estimator';
  const description = "See exactly how Clean Estimator builds its pricing in the US, Canada, UK, and Australia: base rate research, regional cost-of-living adjustments, city pricing methodology, and the external sources we cite. Full transparency on where our numbers come from.";

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

      {/* The comparison table has 4 columns (Service, Our Estimate,
          Published Range, Source) -- too many to fit a phone's width even
          with overflow-x scrolling, which just left the last column or two
          silently clipped at the screen edge with no visual hint there was
          more to scroll to. Below 640px, swap it for a stacked card per
          row instead -- CSS-only (no JS breakpoint state) so there's no
          flash of the wrong layout on load. */}
      <style>{`
        .mp-table-wrap { display: block; }
        .mp-cards { display: none; }
        @media (max-width: 640px) {
          .mp-table-wrap { display: none; }
          .mp-cards { display: flex; }
        }
        .mp-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px; border: none; cursor: pointer;
          font-weight: 700; font-size: 13.5px; white-space: nowrap;
          background: transparent; color: #cbd5e1;
          transition: background 0.15s, color 0.15s;
        }
        .mp-tab:hover { background: rgba(255,255,255,0.08); color: white; }
        .mp-tab.active { background: white; color: #0f172a; }
        @media (max-width: 480px) {
          .mp-tab { padding: 8px 12px; font-size: 12.5px; }
        }
      `}</style>

      <div className="page-hero-band" style={{ paddingBottom: 56 }}>
        <div className="page-hero-glow" aria-hidden="true" />
        <div className="page-hero-inner" style={{ maxWidth: 780, textAlign: 'left' }}>
          <div className="page-hero-breadcrumb">
            <a href="/">Home</a><span>&rsaquo;</span><span>How We Calculate Prices</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 900, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>How We Calculate Cleaning Prices</h1>
          <p style={{ fontSize: 'clamp(15px, 3.8vw, 18px)', color: '#cbd5e1', lineHeight: 1.55, maxWidth: 640, marginBottom: 24 }}>
            Every estimate on Clean Estimator comes from a real methodology, not a guess. We price four countries — pick one below to see exactly how its numbers get built.
          </p>

          {/* Country tabs -- US opens by default (the primary market, and
              the only tab search engines see server-rendered). Styled as a
              segmented control, same visual language as the Widget/
              Calculator Mode switch in the dashboard header, so this reads
              as a deliberate product pattern rather than a one-off. Flag +
              full name at normal widths; flag + 2-letter code under 480px
              so all four tabs stay on one row without wrapping. */}
          <div
            role="tablist"
            aria-label="Select a country"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 4 }}
          >
            {TABS.map(({ code, name }) => (
              <button
                key={code}
                role="tab"
                aria-selected={country === code}
                onClick={() => setCountry(code)}
                className={`mp-tab${country === code ? ' active' : ''}`}
              >
                <CountryFlag country={code} size={14} />
                {isMobile ? code : name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(24px, 6vw, 40px) 20px clamp(24px, 6vw, 40px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map(({ Icon, title: t, body }) => (
            <div key={t} style={{ background: 'white', borderRadius: 16, padding: 'clamp(16px, 4.5vw, 26px) clamp(14px, 4.5vw, 28px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 16px rgba(15,23,42,0.05)' }}>
              {/* Icon sits in its own row above the title instead of
                  beside the paragraph -- freeing up the card's full width
                  for text instead of permanently reserving an icon+gap's
                  worth of space next to every line. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>{t}</h2>
              </div>
              <div style={{ minWidth: 0 }}>
                {body && <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>{body}</p>}
                {t === 'How Our Numbers Compare to Published Industry Guides' && (
                  <>
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: '0 0 14px' }}>
                      {crossCheckIntro}
                    </p>
                    <div className="mp-table-wrap" style={{ overflowX: 'auto' }}>
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
                          {crossChecks.map(row => (
                            <tr key={row.service} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', color: '#0f172a' }}>{row.service}</td>
                              <td style={{ padding: '8px 10px', color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>{row.ours}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{row.published}</td>
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

                    <div className="mp-cards" style={{ flexDirection: 'column', gap: 12 }}>
                      {crossChecks.map(row => (
                        <div key={row.service} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', background: '#f8fafc' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>{row.service}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13.5 }}>
                            <div><span style={{ color: '#64748b' }}>Our Estimate: </span><span style={{ color: '#1d4ed8', fontWeight: 700 }}>{row.ours}</span></div>
                            <div><span style={{ color: '#64748b' }}>Published Range: </span><span style={{ color: '#475569' }}>{row.published}</span></div>
                            <div>
                              <span style={{ color: '#64748b' }}>Source: </span>
                              {row.sources.map(([name, href], i) => (
                                <React.Fragment key={name}>
                                  {i > 0 && ', '}
                                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{name}</a>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {t === 'External Sources We Reference' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: '0 0 4px' }}>
                      Where our content relies on safety guidance, industry standards, or regulatory requirements rather than our own pricing data, we cite the source directly:
                    </p>
                    {citations.map(c => (
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
