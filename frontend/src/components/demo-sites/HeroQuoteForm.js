import React, { useState } from 'react';
import { Check } from 'lucide-react';

// Compact inline quote form that sits directly in the hero (replacing the
// image slot in the split-hero layout) instead of a popup -- getting the
// form in front of a visitor immediately, the way the Zerorez reference
// site does, tends to convert better than making them click a button first.
// Front-end only, same as the popup/contact-page forms.
export default function HeroQuoteForm({ site }) {
  const c = site.colors;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', service: '' });

  const inputStyle = { width: '100%', padding: '11px 13px', border: `1.5px solid ${c.border}`, borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: c.ink, fontFamily: site.fontBody };
  const labelStyle = { fontSize: 11.5, fontWeight: 700, color: c.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ background: c.card, borderRadius: 16, padding: 'clamp(22px, 4vw, 28px)', border: `1px solid ${c.border}`, boxShadow: '0 16px 40px rgba(15,23,42,0.1)' }}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '24px 8px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${c.primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Check size={24} color={c.primary} strokeWidth={2.5} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 16.5, color: c.ink, marginBottom: 6 }}>Request received!</div>
          <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>Sample site — nothing was actually sent. {site.businessName} would follow up shortly on a real site.</div>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); setSent(true); }}>
          <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 18, color: c.ink, marginBottom: 4 }}>Get a Free Quote</div>
          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 18 }}>No obligation. We'll text or call you back shortly.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input required type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
            </div>
            <div>
              <label style={labelStyle}>What do you need cleaned?</label>
              <input style={inputStyle} value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="e.g. 3-bedroom home" />
            </div>
            <button type="submit" style={{ marginTop: 4, background: c.primary, color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: site.fontBody }}>
              Get My Free Quote
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
