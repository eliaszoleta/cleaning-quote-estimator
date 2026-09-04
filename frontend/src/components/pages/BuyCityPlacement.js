import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, X, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { STATES_WITH_CITIES } from '../partners/CityTierBrowser';
import { postPartnerCheckout } from '../../utils/api';

const PRIMARY = '#2563eb';
const MINOR = '#9333ea';
const MAX_CITIES = 10;

// Flat, searchable list of every city we have pricing for, built once from
// the same data the /partner-city-pricing browser uses -- keeps this page's
// pricing identical to what a prospect already saw before landing here.
const ALL_CITIES = STATES_WITH_CITIES.flatMap(s =>
  s.cities.map(c => ({ city: c.city, stateCode: s.code, stateName: s.name, tier: c.tier, price: c.price }))
);

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 14.5, outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white',
};
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 };

const TierBadge = ({ tier }) => (
  <span style={{
    display: 'inline-block', padding: '1.5px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
    background: tier === 'major' ? '#dbeafe' : '#f3e8ff', color: tier === 'major' ? PRIMARY : MINOR,
  }}>
    {tier === 'major' ? 'Major' : 'Minor'}
  </span>
);

function CityPicker({ selected, onAdd }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    const selectedKeys = new Set(selected.map(c => `${c.stateCode}|${c.city.toLowerCase()}`));
    return ALL_CITIES
      .filter(c => !selectedKeys.has(`${c.stateCode}|${c.city.toLowerCase()}`))
      .filter(c => c.city.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q) || c.stateCode.toLowerCase() === q)
      .slice(0, 8);
  }, [q, selected]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          style={{ ...inputStyle, paddingLeft: 38 }}
          placeholder="Search for a city to add (e.g. Austin, TX)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          disabled={selected.length >= MAX_CITIES}
        />
      </div>
      {q && (
        <div style={{ position: 'absolute', zIndex: 5, top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', maxHeight: 260, overflowY: 'auto' }}>
          {results.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
              No matches. We may not have pricing for this city yet &mdash; <a href="/partner-with-us#apply" style={{ color: PRIMARY }}>apply manually</a> instead and we'll confirm your rate.
            </div>
          )}
          {results.map(c => (
            <button
              key={`${c.stateCode}|${c.city}`}
              type="button"
              onClick={() => { onAdd(c); setSearch(''); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'none', border: 'none', borderTop: '1px solid #f1f5f9', padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 13.5, color: '#0f172a' }}>{c.city}, {c.stateCode} <TierBadge tier={c.tier} /></span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.tier === 'major' ? PRIMARY : MINOR, flexShrink: 0 }}>${c.price}/mo</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyCityPlacement() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ business_name: '', email: '', phone: '', address: '', website: '', logo_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = cities.reduce((sum, c) => sum + c.price, 0);

  const addCity = (c) => {
    if (cities.length >= MAX_CITIES) return;
    setCities(prev => [...prev, c]);
  };
  const removeCity = (c) => {
    setCities(prev => prev.filter(x => !(x.stateCode === c.stateCode && x.city === c.city)));
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const canSubmit = cities.length > 0 && form.business_name.trim() && form.email.trim() && form.phone.trim() && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await postPartnerCheckout({
        ...form,
        cities: cities.map(c => ({ city: c.city, stateCode: c.stateCode })),
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong starting checkout. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      <Helmet>
        <title>Buy City Placement | Clean Estimator Partner Program</title>
        <meta name="description" content="Instantly buy exclusive placement for your cleaning business in your city -- pick your cities, enter your business details, and check out securely." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(40px, 7vw, 64px) 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(24px, 4.5vw, 34px)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Buy City Placement
          </h1>
          <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
            Pick your city (or cities), enter your business details, and check out securely. You're live &mdash; on the results card, the floating banner, and the estimate email &mdash; as soon as payment goes through.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(28px, 5vw, 44px) 20px 64px' }}>
        <form onSubmit={handleSubmit}>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 'clamp(18px, 4vw, 26px)', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>1. Choose your cities</div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>Up to {MAX_CITIES} cities. Exclusive per city &mdash; only one partner per listing.</p>

            <CityPicker selected={cities} onAdd={addCity} />

            {cities.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cities.map(c => (
                  <div key={`${c.stateCode}|${c.city}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 12px' }}>
                    <span style={{ fontSize: 13.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.city}, {c.stateCode} <TierBadge tier={c.tier} />
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.tier === 'major' ? PRIMARY : MINOR }}>${c.price}/mo</span>
                      <button type="button" onClick={() => removeCity(c)} aria-label={`Remove ${c.city}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                        <X size={15} />
                      </button>
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #e2e8f0', marginTop: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>${total}/mo</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 'clamp(18px, 4vw, 26px)', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>2. Your business details</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Business name *</label>
              <input style={inputStyle} value={form.business_name} onChange={setField('business_name')} placeholder="Sparkle Clean Co." required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={setField('email')} placeholder="you@yourbusiness.com" required />
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '5px 0 0' }}>Use the email you'll sign in with at /client for your dashboard &mdash; it has to match exactly.</p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Phone *</label>
              <input style={inputStyle} type="tel" value={form.phone} onChange={setField('phone')} placeholder="(555) 123-4567" required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={form.address} onChange={setField('address')} placeholder="123 Main St, Austin, TX" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={setField('website')} placeholder="https://yourbusiness.com" />
            </div>
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input style={inputStyle} value={form.logo_url} onChange={setField('logo_url')} placeholder="https://yourbusiness.com/logo.png" />
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '5px 0 0' }}>Optional &mdash; a direct link to an image. You can skip this and add it later.</p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: canSubmit ? PRIMARY : '#cbd5e1', color: 'white', border: 'none', borderRadius: 12,
              padding: '15px 24px', fontWeight: 800, fontSize: 15.5, cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? (
              <><Loader2 size={17} className="spin" /> Starting checkout...</>
            ) : (
              <>Continue to Payment{cities.length > 0 ? ` — $${total}/mo` : ''} <ArrowRight size={16} /></>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
            <ShieldCheck size={13} /> Secure checkout via Stripe. Cancel anytime.
          </div>
        </form>
      </div>

      <style>{`
        .spin { animation: bcp-spin 0.8s linear infinite; }
        @keyframes bcp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
