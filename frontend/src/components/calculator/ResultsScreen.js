import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, AlertTriangle, Zap, Phone, Share2, Printer, Check, ArrowLeft } from 'lucide-react';
import { formatPrice, formatPriceRange, serviceTypeLabel, urgencyColor } from '../../utils/formatters';
import { getUserLocation, findPartner } from '../../utils/partnerLookup';
import PartnerCard from '../partners/PartnerCard';

export default function ResultsScreen({ result, serviceDetails, companyConfig, embedded, onReset }) {
  const [shared, setShared] = useState(false);
  const [partner, setPartner] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  useEffect(() => {
    if (embedded) return;
    // TEMPORARY TEST OVERRIDE — call findPartner unconditionally (not just
    // when loc resolves) so the mock partner still shows even if the
    // geolocation fetch fails. Revert alongside the rest of the override
    // in utils/partnerLookup.js.
    getUserLocation().then(loc => {
      findPartner(loc?.city, loc?.state).then(setPartner);
    });
  }, [embedded]);

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
          <title>{serviceTypeLabel(serviceType)} Cost Estimate — {stateName} | Clean Estimator</title>
          <meta name="description" content={`Your estimated cost for ${serviceTypeLabel(serviceType).toLowerCase()} in ${stateName}: ${formatPriceRange(totalLow, totalHigh)}.`} />
        </Helmet>
      )}

      <div style={{ padding: embedded ? '0' : '40px 16px', background: embedded ? 'white' : '#f8fafc', minHeight: embedded ? 'auto' : '100vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: embedded ? 'none' : '0 8px 40px rgba(0,0,0,0.10)', border: embedded ? 'none' : '1px solid #e2e8f0', marginBottom: 20 }}>

            <div style={{ background: headerBg, padding: '28px 32px', color: 'white' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {serviceTypeLabel(serviceType)} Estimate · {stateName}
              </div>
              <div style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 8, letterSpacing: '-1px' }}>
                {formatPrice(totalLow)} – {formatPrice(totalHigh)}
              </div>
              <div style={{ fontSize: 13.5, opacity: 0.85 }}>
                {unit === 'per_month' ? 'per month' : 'per visit'}
                {isHighState && ` · ${stateName} is a higher-cost market`}
                {isLowState && ` · ${stateName} is a lower-cost market`}
              </div>
              {recurringMonthlyLow && unit !== 'per_month' && (
                <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', display: 'inline-block' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>Recurring: {formatPrice(recurringMonthlyLow)} – {formatPrice(recurringMonthlyHigh)}/visit</span>
                  {recurringAnnualSavings && <span style={{ opacity: 0.9, fontSize: 13 }}> · Save ~{formatPrice(recurringAnnualSavings)}/year</span>}
                </div>
              )}
            </div>

            <div style={{ padding: '24px 28px' }}>
              {disclaimer && (
                <div style={{ background: urgencyLevel === 'critical' ? '#fef2f2' : '#fffbeb', border: `1px solid ${urgencyLevel === 'critical' ? '#fecaca' : '#fde68a'}`, borderRadius: 10, padding: '13px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {urgencyLevel === 'critical' ? <AlertTriangle size={16} color="#dc2626" /> : <Zap size={16} color="#d97706" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: urgColor, marginBottom: 3, fontSize: 13 }}>
                      {urgencyLevel === 'critical' ? 'Important Notice' : 'Heads Up'}
                    </div>
                    <p style={{ fontSize: 13, color: urgencyLevel === 'critical' ? '#7f1d1d' : '#78350f', lineHeight: 1.6, margin: 0 }}>{disclaimer}</p>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Price breakdown</div>
                <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  {adjustments.filter(adj => !adj.separate).map((adj, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none', fontSize: 13.5, background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <span style={{ color: '#374151', textTransform: 'capitalize' }}>{adj.label}</span>
                      <span style={{ fontWeight: 600, color: (adj.low < 0 || adj.high < 0) ? '#16a34a' : '#0f172a' }}>
                        {adj.low < 0
                          ? `−${formatPrice(Math.abs(adj.low))} – −${formatPrice(Math.abs(adj.high))}`
                          : (adj.low === 0 && adj.high === 0 ? 'Included' : formatPriceRange(adj.low, adj.high))}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 14px', background: '#f8fafc', borderTop: '1.5px solid #e2e8f0', fontWeight: 700, fontSize: 15 }}>
                    <span>Estimated total</span>
                    <span style={{ color: primaryColor }}>{formatPriceRange(totalLow, totalHigh)}</span>
                  </div>
                </div>
                {adjustments.filter(adj => adj.separate).map((adj, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginTop: 10, background: '#fffbeb', border: '1px dashed #fde68a', borderRadius: 10, fontSize: 13 }}>
                    <span style={{ color: '#78350f' }}>{adj.label}</span>
                    <span style={{ fontWeight: 600, color: '#78350f', whiteSpace: 'nowrap', marginLeft: 12 }}>{formatPriceRange(adj.low, adj.high)}</span>
                  </div>
                ))}
              </div>

              {keyFactors.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key factors in your estimate</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {keyFactors.map((f, i) => (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', fontSize: 12.5 }}>
                        <span style={{ color: '#64748b' }}>{f.label}: </span>
                        <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{f.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '13px 16px', marginBottom: 20, fontSize: 13, color: '#1e40af', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>{stateName} market: </strong>
                  {stateMultiplier > 1.05 && `Prices in ${stateName} run ${Math.round((stateMultiplier - 1) * 100)}% above the national average due to higher cost of living and labor.`}
                  {stateMultiplier < 0.95 && `Prices in ${stateName} run ${Math.round((1 - stateMultiplier) * 100)}% below the national average, making this a lower-cost market.`}
                  {stateMultiplier >= 0.95 && stateMultiplier <= 1.05 && `${stateName} is close to the national average for cleaning service costs.`}
                </span>
              </div>

              {partner && !embedded && <PartnerCard partner={partner} />}

              <div style={{ background: embedded && companyName ? `${primaryColor}08` : '#f8fafc', border: `1px solid ${embedded && companyName ? primaryColor + '28' : '#e2e8f0'}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
                  {companyName ? `Ready to book with ${companyName}?` : 'Ready to get real quotes?'}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, margin: '4px 0 14px' }}>
                  {companyName ? 'Contact us for a free, no-obligation on-site quote.' : 'Compare quotes from vetted local cleaning professionals.'}
                </p>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {ctaButtonUrl && (
                    <a href={ctaButtonUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: primaryColor, color: 'white', padding: '11px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      {ctaButtonText}
                    </a>
                  )}
                  {ctaPhone && (
                    <a href={`tel:${ctaPhone}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#16a34a', color: 'white', padding: '11px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      <Phone size={14} /> Call {ctaPhone}
                    </a>
                  )}
                  {!ctaButtonUrl && !ctaPhone && (
                    <a href="/" style={{ background: primaryColor, color: 'white', padding: '11px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      {ctaButtonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, color: '#374151' }}>
              <ArrowLeft size={14} /> New Estimate
            </button>
            {!embedded && (
              <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, color: '#374151' }}>
                {shared ? <><Check size={14} strokeLinecap="square" strokeLinejoin="miter" /> Copied!</> : <><Share2 size={14} /> Share Results</>}
              </button>
            )}
            {!embedded && (
              <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, color: '#374151' }}>
                <Printer size={14} /> Print
              </button>
            )}
          </div>

          {!embedded && (
            <p style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', marginTop: 16, maxWidth: 520, margin: '16px auto 0' }}>
              These estimates are for informational purposes only. Actual prices vary. Always get multiple quotes from licensed, insured professionals.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
