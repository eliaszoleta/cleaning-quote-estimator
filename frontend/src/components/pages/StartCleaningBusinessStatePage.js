import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, MapPin, CheckCircle2, DollarSign } from 'lucide-react';
import { getStateBySlug, getAllStates } from '../../data/statePricing';
import { getStateBusinessStartupByCode } from '../../data/stateBusinessStartup';
import './PageHero.css';

function formatPrice(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// States with a full, genuinely state-specific deep-dive post (not just this
// templated page) -- see blogPosts.js's 'starting-out' category. Linked
// prominently when one exists for the state being viewed.
const DEEP_POST_BY_CODE = {
  CA: 'how-to-start-a-cleaning-business-in-california',
  TX: 'how-to-start-a-cleaning-business-in-texas',
  FL: 'how-to-start-a-cleaning-business-in-florida',
  NY: 'how-to-start-a-cleaning-business-in-new-york',
  IL: 'how-to-start-a-cleaning-business-in-illinois',
  GA: 'how-to-start-a-cleaning-business-in-georgia',
  PA: 'how-to-start-a-cleaning-business-in-pennsylvania',
  AZ: 'how-to-start-a-cleaning-business-in-arizona',
};

const STEPS = [
  { title: 'Choose a business structure', body: 'Most cleaning businesses should form an LLC rather than operate as a sole proprietor, for the liability protection.', href: '/blog/llc-vs-sole-proprietorship-cleaning-business', linkText: 'LLC vs. sole proprietorship' },
  { title: 'Get licensed locally', body: 'A general business license from your city or county, on top of state registration.', href: '/blog/cleaning-business-license-permits-guide', linkText: 'Full licensing guide' },
  { title: 'Get insured and bonded', body: 'General liability insurance and bonding, before your first paid job.', href: '/blog/cleaning-business-insurance-bonding-guide', linkText: 'Insurance & bonding guide' },
  { title: 'Buy your equipment', body: 'Start lean: a vacuum, mop system, microfiber cloths, and basic supplies.', href: '/blog/cleaning-business-equipment-supplies-checklist', linkText: 'Equipment checklist' },
  { title: 'Set your pricing', body: 'Base your price on your actual time/supply costs plus your local market rate.', href: '/blog/how-to-price-cleaning-services-new-business', linkText: 'Pricing guide' },
  { title: 'Get online', body: 'A real website with an instant estimate calculator converts visitors into booked jobs.', href: '/website-for-cleaning-companies', linkText: 'Get a free website' },
];

const FAQS = (stateName) => [
  { q: `How much does it cost to form an LLC in ${stateName}?`, a: `See the exact filing fee and agency above. Total realistic startup cost for a solo cleaning business in ${stateName} -- including registration, insurance, and basic equipment -- typically runs $500-$2,000. See our full startup budget breakdown for the itemized version.` },
  { q: `Do I need a special cleaning license in ${stateName}?`, a: `Most states, including ${stateName}, don't require a cleaning-specific license for standard residential or commercial cleaning -- what you need is a general business license (local) plus state business registration. Specialized services like mold remediation can have their own requirements. See our full licensing guide for the complete breakdown.` },
  { q: `What's the fastest way to get my first clients in ${stateName}?`, a: `Your personal network almost always provides your first few jobs. From there, a free Google Business Profile, asking every client for a review, and getting a real website online are the highest-leverage next steps.` },
  { q: `Should I start with residential or commercial cleaning in ${stateName}?`, a: `Most new businesses start residential (lower barrier, faster first clients) and add commercial contracts once they have the track record and insurance to win them. See our full comparison for the detailed tradeoffs.` },
];

export default function StartCleaningBusinessStatePage({ slug }) {
  const [openIndex, setOpenIndex] = useState(0);

  const state = getStateBySlug(slug);
  const biz = state ? getStateBusinessStartupByCode(state.code) : null;

  if (!state || !biz) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ color: '#0f172a' }}>State not found</h2>
      <a href="/start-a-cleaning-business" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to all states</a>
    </div>
  );

  const otherStates = getAllStates().filter(s => s.slug !== state.slug);
  const faqs = FAQS(state.name);
  const deepPostSlug = DEEP_POST_BY_CODE[state.code];

  const title = `How to Start a Cleaning Business in ${state.name} (2026): Costs, LLC Fees & Licensing | Clean Estimator`;
  const description = `Everything you need to start a cleaning business in ${state.name}: LLC filing fee (${formatPrice(biz.llcFee)}), licensing, insurance, pricing, and getting your first clients.`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'Start a Cleaning Business', item: 'https://www.cleanestimator.com/start-a-cleaning-business' },
      { '@type': 'ListItem', position: 3, name: `Start a Cleaning Business in ${state.name}`, item: `https://www.cleanestimator.com/start-a-cleaning-business/${state.slug}` },
    ],
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.cleanestimator.com/start-a-cleaning-business/${state.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-hero-band" style={{ paddingBottom: 88 }}>
          <div className="page-hero-glow" aria-hidden="true" />
          <div className="page-hero-inner" style={{ maxWidth: 780, textAlign: 'left' }}>
            <div className="page-hero-breadcrumb">
              <a href="/">Home</a><span>›</span><a href="/start-a-cleaning-business">Start a Cleaning Business</a><span>›</span><span>{state.name}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 780, margin: '-64px auto 0', padding: '0 20px clamp(36px, 7vw, 64px)', position: 'relative' }}>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(18px, 5vw, 32px) clamp(16px, 4.5vw, 36px)', marginBottom: 24, boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MapPin size={18} color="#ea580c" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{state.name}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: 10 }}>How to Start a Cleaning Business in {state.name}</h1>
            <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.7 }}>
              What it costs to register, license, and insure a cleaning business in {state.name}, plus the full step-by-step checklist to get your first client.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(18px, 5vw, 32px) clamp(16px, 4.5vw, 36px)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{state.name} LLC Filing Quick Facts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>LLC Filing Fee</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatPrice(biz.llcFee)}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Filing Agency</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{biz.agency}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>State Income Tax</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{biz.noIncomeTax ? 'None' : 'Applies'}</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>{biz.note}</p>
            <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, marginTop: 12, margin: '12px 0 0' }}>
              Filing fees change periodically — confirm the current fee directly with the {biz.agency} before filing. This is general informational content, not legal or tax advice.
            </p>
          </div>

          {deepPostSlug && (
            <a href={`/blog/${deepPostSlug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textDecoration: 'none', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Read the full {state.name}-specific guide — market details, climate factors, and more →</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', whiteSpace: 'nowrap' }}>Read guide</span>
            </a>
          )}

          <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', borderRadius: 12, padding: '18px 24px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Get your {state.name} cleaning business online</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>$5 setup · 2 months free · then $249/mo</div>
            </div>
            <a href="/website-for-cleaning-companies" style={{ background: 'white', color: '#c2410c', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              Get a Free Website →
            </a>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(18px, 5vw, 32px) clamp(16px, 4.5vw, 36px)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Startup Checklist for {state.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}><CheckCircle2 size={18} color="#ea580c" /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', marginBottom: 2 }}>{i + 1}. {step.title}</div>
                    <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{step.body} <a href={step.href} style={{ color: '#ea580c', fontWeight: 600 }}>{step.linkText} →</a></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(18px, 5vw, 32px) clamp(16px, 4.5vw, 36px)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <DollarSign size={18} color="#16a34a" />
              <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: 0 }}>What Cleaners in {state.name} Charge</h2>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.7 }}>
              A standard house cleaning in {state.name} typically runs <strong style={{ color: '#0f172a' }}>{formatPrice(state.low)}–{formatPrice(state.high)}</strong> for a 2,000 sq ft home — a useful benchmark when you're setting your own starting prices. See the <a href={`/cleaning-cost/${state.slug}`} style={{ color: '#ea580c', fontWeight: 600 }}>full {state.name} pricing breakdown</a> by service type, or our <a href="/blog/how-to-price-cleaning-services-new-business" style={{ color: '#ea580c', fontWeight: 600 }}>complete pricing guide</a> for how to build your own rates from there.
            </p>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginTop: 32, marginBottom: 14 }}>FAQs</h2>
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
          </div>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '24px 28px', marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>Not ready to build your own marketing yet?</div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Clean Estimator's Local Partner Program gives one cleaning business per city exclusive, guaranteed lead visibility — no website required to start.</p>
            <a href="/partner-with-us" style={{ background: '#ea580c', color: 'white', padding: '12px 28px', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              See If Your City Is Available →
            </a>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>The Full Starting-Out Guide</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a href="/blog/new-cleaning-business-startup-checklist" style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>Full Startup Checklist</a>
              <a href="/blog/cost-to-start-a-cleaning-business-budget-breakdown" style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>Full Budget Breakdown</a>
              <a href="/blog/cleaning-business-equipment-supplies-checklist" style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>Equipment Checklist</a>
              <a href="/blog/category/starting-out" style={{ fontSize: 12.5, color: '#ea580c', fontWeight: 700, textDecoration: 'none', background: 'white', border: '1px solid #fed7aa', borderRadius: 20, padding: '6px 12px' }}>See All Starting-Out Guides →</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Start a Cleaning Business in Other States</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {otherStates.map(s => (
                <a key={s.code} href={`/start-a-cleaning-business/${s.slug}`} style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
