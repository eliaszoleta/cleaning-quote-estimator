import React, { useState, useEffect } from 'react';
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

  // Keep parent iframe height synced
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
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
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Widget Temporarily Unavailable</div>
      <p style={{ color: '#64748b', fontSize: 14 }}>This cleaning cost calculator is temporarily unavailable. Please contact the company directly for a quote.</p>
    </div>
  );

  return <CleaningCalculator companyConfig={companyConfig} embedded={true} />;
}
