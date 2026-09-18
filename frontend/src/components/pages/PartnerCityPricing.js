import React from 'react';
import { Helmet } from 'react-helmet-async';
import { POPULATION_THRESHOLD, MAJOR_CITY_PRICE, MINOR_CITY_PRICE } from '../../data/partnerCityTiers';
import CityTierBrowser from '../partners/CityTierBrowser';

const PRIMARY = '#2563eb';

export default function PartnerCityPricing() {
  return (
    <>
      <Helmet>
        <title>Local Partner Program Pricing by City | Clean Estimator</title>
        <meta name="description" content={`See exactly what Clean Estimator's Local Partner Program costs in your city -- $${MAJOR_CITY_PRICE}/month for major metros, $${MINOR_CITY_PRICE}/month for smaller cities, across every state we cover.`} />
        <link rel="canonical" href="https://www.cleanestimator.com/partner-city-pricing" />
      </Helmet>

      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Local Partner Program Pricing, by City
          </h1>
          <p style={{ fontSize: 16.5, color: '#cbd5e1', lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
            Cities with roughly {POPULATION_THRESHOLD.toLocaleString()}+ residents are billed at <strong style={{ color: 'white' }}>${MAJOR_CITY_PRICE}/month</strong>; smaller cities are half that, at <strong style={{ color: 'white' }}>${MINOR_CITY_PRICE}/month</strong>. Find your city below to see your exact rate.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(32px, 6vw, 56px) 24px 80px' }}>
        <CityTierBrowser alwaysOpen />

        <div style={{ marginTop: 40, textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(24px, 4vw, 36px)' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Ready to apply for your city?</div>
          <p style={{ fontSize: 14.5, color: '#64748b', marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
            Exclusive placement, no lead fees, and a free performance dashboard &mdash; only one partner per city.
          </p>
          <a
            href="/partner-with-us#apply"
            style={{ display: 'inline-flex', alignItems: 'center', background: PRIMARY, color: 'white', padding: '13px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5 }}
          >
            Apply for Your City →
          </a>
        </div>
      </div>
    </>
  );
}
