import React, { useState, useEffect } from 'react';
import { Pause } from 'lucide-react';
import CleaningCalculator from './calculator/CleaningCalculator';
import { getCompanyPublic } from '../utils/api';

export default function EmbedWrapper({ companyId }) {
  const [companyConfig, setCompanyConfig] = useState(null);
  const [loading, setLoading] = useState(!!companyId);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
    getCompanyPublic(companyId)
      .then(res => {
        setCompanyConfig({ ...res.data, companyId });
        setPaused(res.data.paused || false);
      })
      .catch(() => { /* use no branding */ })
      .finally(() => setLoading(false));
  }, [companyId]);

  // Keep parent iframe height synced -- measured off document.body rather
  // than document.documentElement, since a root html element's scrollHeight
  // is clamped to be at least the layout viewport height (i.e. the iframe's
  // OWN currently-applied height), so it can only ever report growth, never
  // shrink back down once the parent has sized the iframe taller for a
  // previous step. body has no such floor as long as nothing gives it an
  // explicit height/min-height (it doesn't here), so its scrollHeight
  // tracks the calculator's actual rendered content in both directions.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      window.parent?.postMessage({ type: 'cleancalc-resize', height: h }, '*');
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
  );

  if (paused) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: 12 }}>
      <div style={{ width: 56, height: 56, background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Pause size={24} color="#d97706" strokeWidth={2.5} fill="#d97706" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Calculator Paused</div>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>This cleaning cost calculator is currently paused due to an inactive subscription. If you're the site owner, log in to your dashboard to reactivate it.</p>
      <a
        href="https://cleanestimator.com/company"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 8 }}
      >
        Go to Dashboard →
      </a>
      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
        Or email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb' }}>info@cleanestimator.com</a>
      </p>
    </div>
  );

  return <CleaningCalculator companyConfig={companyConfig} embedded={true} />;
}
