import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, X, ArrowRight, Loader2, Lock, Upload } from 'lucide-react';
import { formatPhoneInput } from '../../utils/formatPhone';
import { STATES_WITH_CITIES } from '../partners/CityTierBrowser';
import { postPartnerCheckout, getTakenCities, uploadPartnerLogo } from '../../utils/api';

const MAX_LOGO_BYTES = 3 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

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

// Matches the backend's own key format ({stateName}|{city}, both
// lowercased) so a city already covered by an active partner shows as
// unavailable here instead of only failing once checkout is submitted.
function cityKey(city, stateName) {
  return `${(stateName || '').trim().toLowerCase()}|${(city || '').trim().toLowerCase()}`;
}

function CityPicker({ selected, onAdd, takenKeys }) {
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
          {results.map(c => {
            const taken = takenKeys.has(cityKey(c.city, c.stateName));
            return (
              <button
                key={`${c.stateCode}|${c.city}`}
                type="button"
                onClick={() => { if (!taken) { onAdd(c); setSearch(''); } }}
                disabled={taken}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'none', border: 'none', borderTop: '1px solid #f1f5f9', padding: '10px 14px', cursor: taken ? 'default' : 'pointer', textAlign: 'left', opacity: taken ? 0.55 : 1 }}
              >
                <span style={{ fontSize: 13.5, color: '#0f172a' }}>{c.city}, {c.stateCode} <TierBadge tier={c.tier} /></span>
                {taken ? (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>Already taken</span>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.tier === 'major' ? PRIMARY : MINOR, flexShrink: 0 }}>${c.price}/mo</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LogoField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const linkButtonStyle = { background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo must be under 3MB.');
      return;
    }
    setUploading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const { data } = await uploadPartnerLogo({ contentType: file.type, dataBase64 });
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label style={labelStyle}>Logo</label>

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <img
            src={value}
            alt="Logo preview"
            style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}
            onError={e => { e.target.style.visibility = 'hidden'; }}
          />
          <button type="button" onClick={() => onChange('')} style={{ ...linkButtonStyle, color: '#94a3b8' }}>Remove</button>
        </div>
      )}

      {!showUrlInput ? (
        <>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'white', border: '1.5px dashed #cbd5e1', color: '#334155', borderRadius: 9, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: uploading ? 'default' : 'pointer' }}
          >
            {uploading ? <><Loader2 size={15} className="spin" /> Uploading...</> : <><Upload size={15} /> {value ? 'Change logo' : 'Upload logo'}</>}
          </button>
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
            Optional, PNG/JPEG/WebP up to 3MB. Or <button type="button" onClick={() => setShowUrlInput(true)} style={linkButtonStyle}>paste an image URL</button> instead.
          </p>
        </>
      ) : (
        <>
          <input style={inputStyle} value={value} onChange={e => onChange(e.target.value)} placeholder="https://yourbusiness.com/logo.png" />
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
            Or <button type="button" onClick={() => setShowUrlInput(false)} style={linkButtonStyle}>upload a file</button> instead.
          </p>
        </>
      )}

      {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

export default function BuyCityPlacement() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ business_name: '', email: '', phone: '', address: '', website: '', logo_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [takenKeys, setTakenKeys] = useState(() => new Set());

  useEffect(() => {
    getTakenCities()
      .then(({ data }) => setTakenKeys(new Set((data || []).map(r => cityKey(r.city, r.state)))))
      .catch(() => { /* picker just won't gray anything out client-side; /checkout still enforces it */ });
  }, []);

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
      const res = await postPartnerCheckout({
        ...form,
        cities: cities.map(c => ({ city: c.city, stateCode: c.stateCode })),
      });
      window.location.href = res.url;
    } catch (err) {
      const taken = err.responseData?.takenCities;
      if (Array.isArray(taken) && taken.length > 0) {
        // A city in the cart got claimed by someone else between when the
        // picker last checked and now -- drop it from the cart and mark it
        // taken so the buyer can immediately retry with what's left, rather
        // than hitting the same error again.
        setCities(prev => prev.filter(c => !taken.some(t => t.stateCode === c.stateCode && t.city === c.city)));
        setTakenKeys(prev => {
          const next = new Set(prev);
          taken.forEach(t => {
            const match = ALL_CITIES.find(c => c.stateCode === t.stateCode && c.city === t.city);
            if (match) next.add(cityKey(match.city, match.stateName));
          });
          return next;
        });
      }
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

            <CityPicker selected={cities} onAdd={addCity} takenKeys={takenKeys} />

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
              <input style={inputStyle} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 123-4567" required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={form.address} onChange={setField('address')} placeholder="123 Main St, Austin, TX" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={setField('website')} placeholder="https://yourbusiness.com" />
            </div>
            <LogoField value={form.logo_url} onChange={url => setForm(f => ({ ...f, logo_url: url }))} />
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: '11px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <Lock size={13} color="#16a34a" />
            <span style={{ fontSize: 12.5, color: '#475569' }}>
              Secure checkout powered by <span style={{ fontWeight: 800, color: '#635bff', letterSpacing: '-0.01em' }}>stripe</span> &middot; Cancel anytime
            </span>
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
