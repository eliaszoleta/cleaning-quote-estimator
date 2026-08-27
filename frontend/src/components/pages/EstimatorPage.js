import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, BarChart3, ListChecks, Lock, Repeat } from 'lucide-react';
import CleaningCalculator from '../calculator/CleaningCalculator';

const WHY_POINTS = [
  { Icon: BarChart3, title: 'Real Market Pricing', body: 'This cleaning cost estimator pulls from actual state-by-state pricing data, not a generic industry average.' },
  { Icon: ListChecks, title: 'Covers Every Room & Service', body: 'Estimate house cleaning, apartment cleaning, commercial spaces, carpets, air ducts, dryer vents, tile & grout, mold remediation, and water damage restoration.' },
  { Icon: Repeat, title: 'No Waiting on Quotes', body: "Skip the back-and-forth with cleaning companies — get your price estimate the moment you finish answering a few questions." },
  { Icon: Lock, title: 'Always Free', body: "There's no cost to use this estimator, no account required, and no limit on how many times you can run it." },
];

const ESTIMATOR_FAQS = [
  { q: 'What is a cleaning cost estimator?', a: 'A cleaning cost estimator is a tool that calculates an expected price range for a cleaning service based on inputs like your location, home size, and service type — instead of requiring an in-person quote.' },
  { q: 'How is a cleaning cost estimator different from a fixed price?', a: 'An estimator gives you a realistic price range based on typical market rates in your area. The exact price a cleaning company charges can vary slightly based on the specific condition of your space and their own pricing policies.' },
  { q: 'Can I use this cleaning cost estimator for commercial properties?', a: 'Yes — select Commercial Cleaning as your service type and enter your square footage to get an estimate for offices, retail spaces, or warehouses.' },
  { q: 'Is my information saved when I use the estimator?', a: "No. Your estimate is calculated instantly and isn't stored unless you choose to submit your contact information at the end." },
  { q: 'How often should I re-check my cleaning cost estimate?', a: "Cleaning prices can shift with inflation and local labor rates, so it's worth re-running your estimate once or twice a year, especially before renewing a recurring cleaning contract." },
];

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

export default function EstimatorPage() {
  const title = 'Cleaning Cost Estimator - Free Instant Estimate (2026)';
  const description = 'Free cleaning cost estimator with ZIP-code accurate pricing. Instantly estimate house cleaning, carpet cleaning, commercial cleaning, mold remediation, and more. No signup required.';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'Cleaning Cost Estimator', item: 'https://www.cleanestimator.com/cleaning-cost-estimator' },
    ],
  };
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cleaning Cost Estimator',
    url: 'https://www.cleanestimator.com/cleaning-cost-estimator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ESTIMATOR_FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://www.cleanestimator.com/cleaning-cost-estimator" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20, flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a><span>&rsaquo;</span>
          <span style={{ color: '#0f172a' }}>Cleaning Cost Estimator</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: 14 }}>Cleaning Cost Estimator</h1>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            Get a free cleaning cost estimator for house cleaning, carpet cleaning, commercial cleaning, and 6 other services — enter your ZIP code and property details to see a real price range in under a minute. This standalone estimator works the same whether you're comparing quotes or budgeting ahead, with no signup and no obligation.
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <CleaningCalculator embedded />
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20, textAlign: 'center' }}>Why Use This Cleaning Cost Estimator</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {WHY_POINTS.map(({ Icon, title: t, body }) => (
              <div key={t} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={19} strokeWidth={2.1} />
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{t}</h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px 36px' }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Cleaning Cost Estimator FAQs</h2>
          <FaqAccordion faqs={ESTIMATOR_FAQS} />
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 14 }}>Want cost breakdowns by state or service instead? Browse our <a href="/blog" style={{ color: '#2563eb', fontWeight: 600 }}>cleaning cost guides</a>.</p>
        </div>
      </div>
    </>
  );
}
