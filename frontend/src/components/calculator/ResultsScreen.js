import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatPriceRange, serviceTypeLabel, urgencyColor } from '../../utils/formatters';

export default function ResultsScreen({ result, serviceDetails, companyConfig, embedded, onReset }) {
  const [shared, setShared] = useState(false);

  if (!result) return null;

  const {
    totalLow, totalHigh, stateName, stateMultiplier,
    recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
    adjustments = [], keyFactors = [], disclaimer, urgencyLevel,
    serviceType, unit,
  } = result;

  const primaryColor = companyConfig?.primaryColor || '#2563eb';
  const ctaPhone = companyConfig?.ctaPhone || null;
  const ctaButtonText = companyConfig?.ctaButtonText || 'Get Free Quotes from Local Pros →';
  const ctaButtonUrl = companyConfig?.ctaButtonUrl || null;
  const companyName = companyConfig?.companyName || null;

  const urgColor = urgencyColor(urgencyLevel);
  const isRecurring = unit === 'per_month' || recurringMonthlyLow;
  const isHighState = stateMultiplier >= 1.15;
  const isLowState = stateMultiplier <= 0.85;

  const handleShare = async () => {
    const payload = { r: result, d: serviceDetails };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}/results#${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const headerBg = urgencyLevel === 'critical'
    ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
    : urgencyLevel === 'high'
    ? 'linear-gradient(135deg, #78350f, #d97706)'
    : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`;

  return (
    <>
      {!embedded && (
        <Helmet>
          <title>{serviceTypeLabel(serviceType)} Cost Estimate — {stateName} | CleanCalc</title>
          <meta name="description" content={`Your estimated cost for ${serviceTypeLabel(serviceType).toLowerCase()} in ${stateName}: ${formatPriceRange(totalLow, totalHigh)}.`} />
        </Helmet>
      )}

      <div style={{ padding: embedded ? '0' : '40px 16px', background: embedded ? 'white' : '#f8fafc', minHeight: embedded ? 'auto' : '100vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Result card */}
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: embedded ? 'none' : '0 8px 40px rgba(0,0,0,0.10)', border: embedded ? 'none' : '1px solid #e2e8f0', marginBottom: 24 }}>

            {/* Header */}
            <div style={{ background: headerBg, padding: '32px 40px', color: 'white' }}>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {serviceTypeLabel(serviceType)} Estimate • {stateName}
              </div>
              <div style={{ fontSize: 'clamp(36px, 8vw, 52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 8 }}>
                {formatPrice(totalLow)} – {formatPrice(totalHigh)}
              </div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>
                {unit === 'per_month' ? 'per month' : 'per visit'}
                {isHighState && ` · ${stateName} is a higher-cost market`}
                {isLowState && ` · ${stateName} is a lower-cost market`}
              </div>

              {/* Recurring savings callout */}
              {recurringMonthlyLow && unit !== 'per_month' && (
                <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 16px', display: 'inline-block' }}>
                  <span style={{ fontWeight: 700 }}>Recurring: {formatPrice(recurringMonthlyLow)} – {formatPrice(recurringMonthlyHigh)}/visit</span>
                  {recurringAnnualSavings && <span style={{ opacity: 0.9 }}> · Save ~{formatPrice(recurringAnnualSavings)}/year</span>}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '28px 32px' }}>

              {/* Disclaimer (critical/high) */}
              {disclaimer && (
                <div style={{ background: urgencyLevel === 'critical' ? '#fef2f2' : '#fffbeb', border: `1px solid ${urgencyLevel === 'critical' ? '#fecaca' : '#fde68a'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, color: urgColor, marginBottom: 4, fontSize: 14 }}>
                    {urgencyLevel === 'critical' ? '⚠ Important Notice' : '⚡ Heads Up'}
                  </div>
                  <p style={{ fontSize: 13, color: urgencyLevel === 'critical' ? '#7f1d1d' : '#78350f', lineHeight: 1.6 }}>{disclaimer}</p>
                </div>
              )}

              {/* Price breakdown */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Price breakdown</h3>
                <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  {adjustments.map((adj, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < adjustments.length - 1 ? '1px solid #f8fafc' : 'none', fontSize: 14, background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <span style={{ color: '#374151', textTransform: 'capitalize' }}>{adj.label}</span>
                      <span style={{ fontWeight: 600, color: (adj.low < 0 || adj.high < 0) ? '#16a34a' : '#0f172a' }}>
                        {adj.low < 0 ? `−${formatPrice(Math.abs(adj.low))} – −${formatPrice(Math.abs(adj.high))}` : (adj.low === 0 && adj.high === 0 ? 'Included' : formatPriceRange(adj.low, adj.high))}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700, fontSize: 16 }}>
                    <span>Estimated total</span>
                    <span style={{ color: primaryColor }}>{formatPriceRange(totalLow, totalHigh)}</span>
                  </div>
                </div>
              </div>

              {/* Key factors */}
              {keyFactors.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Key factors in your estimate</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {keyFactors.map((f, i) => (
                      <div key={i} style={{ background: '#f1f5f9', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>{f.label}: </span>
                        <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{f.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* State cost context */}
              <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#1e40af' }}>
                <span style={{ fontWeight: 700 }}>📍 {stateName} market info: </span>
                {stateMultiplier > 1.05 && `Prices in ${stateName} run ${Math.round((stateMultiplier - 1) * 100)}% above the national average due to higher cost of living and labor.`}
                {stateMultiplier < 0.95 && `Prices in ${stateName} run ${Math.round((1 - stateMultiplier) * 100)}% below the national average, making this a lower-cost market.`}
                {stateMultiplier >= 0.95 && stateMultiplier <= 1.05 && `${stateName} is close to the national average for cleaning service costs.`}
              </div>

              {/* CTA */}
              <div style={{ background: embedded && companyName ? `${primaryColor}08` : '#f8fafc', border: `1px solid ${embedded && companyName ? primaryColor + '30' : '#e2e8f0'}`, borderRadius: 12, padding: '20px 24px' }}>
                {companyName && <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>Ready to book with {companyName}?</div>}
                {!companyName && <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>Ready to get real quotes?</div>}
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  {companyName ? 'Contact us for a free, no-obligation on-site quote.' : 'Compare quotes from vetted local cleaning professionals.'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ctaButtonUrl && (
                    <a href={ctaButtonUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: primaryColor, color: 'white', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                      {ctaButtonText}
                    </a>
                  )}
                  {ctaPhone && (
                    <a href={`tel:${ctaPhone}`}
                      style={{ background: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                      📞 Call {ctaPhone}
                    </a>
                  )}
                  {!ctaButtonUrl && !ctaPhone && (
                    <a href="/" style={{ background: primaryColor, color: 'white', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                      {ctaButtonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onReset} style={{ padding: '11px 22px', border: '2px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}>
              ← New Estimate
            </button>
            {!embedded && (
              <button onClick={handleShare} style={{ padding: '11px 22px', border: '2px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}>
                {shared ? '✓ Copied!' : '🔗 Share Results'}
              </button>
            )}
            {!embedded && (
              <button onClick={() => window.print()} style={{ padding: '11px 22px', border: '2px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}>
                🖨 Print
              </button>
            )}
          </div>

          {!embedded && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20, maxWidth: 560, margin: '20px auto 0' }}>
              These estimates are for informational purposes only. Actual prices vary. Always get multiple quotes from licensed, insured professionals.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
