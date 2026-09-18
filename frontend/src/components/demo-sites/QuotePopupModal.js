import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

// Every "Get a Free Quote" button across a demo site opens this. It's
// front-end only -- no network call -- since these are fictional demo
// businesses; the point is to show visitors of the SAMPLE how the real
// lead-capture flow feels, not to actually collect data from them.
export default function QuotePopupModal({ open, onClose, businessName, accent, font }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle = {
    width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9,
    fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: font || 'inherit',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div
      onClick={() => { onClose(); setSent(false); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 18, padding: 'clamp(22px, 5vw, 32px)', maxWidth: 440, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', position: 'relative', fontFamily: font || 'inherit' }}
      >
        <button
          onClick={() => { onClose(); setSent(false); }}
          aria-label="Close"
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}
        >
          <X size={20} />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={26} color={accent} strokeWidth={2.5} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 19, color: '#0f172a', marginBottom: 8 }}>Request received!</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              This is a sample site, so nothing was actually sent — on your real site, {businessName} would get a text and email the moment this comes in.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 4 }}>Get a Free Quote</div>
            <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Tell us a bit about the job — {businessName} will follow up shortly.</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input required type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>What do you need cleaned?</label>
                <input style={inputStyle} value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="e.g. 3-bedroom home, move-out clean" />
              </div>
              <div>
                <label style={labelStyle}>Anything else?</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Preferred date, special requests, etc." />
              </div>
              <button type="submit" style={{ marginTop: 4, background: accent, color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: font || 'inherit' }}>
                Request My Free Quote
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
