import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Check } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';

export default function DemoContact() {
  const { site } = useDemoSite();
  const c = site.colors;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const inputStyle = { width: '100%', padding: '11px 13px', border: `1.5px solid ${c.border}`, borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: c.ink, fontFamily: site.fontBody };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: c.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 72px) 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Contact</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: c.ink, letterSpacing: '-0.5px' }}>Get In Touch</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={16} color={c.primary} /></div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Phone</div>
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ fontSize: 15, fontWeight: 700, color: c.ink, textDecoration: 'none' }}>{site.phone}</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={16} color={c.primary} /></div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Email</div>
                  <a href={`mailto:${site.email}`} style={{ fontSize: 15, fontWeight: 700, color: c.ink, textDecoration: 'none' }}>{site.email}</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MapPin size={16} color={c.primary} /></div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Address</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>{site.address}, {site.city}, {site.state} {site.zip}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Clock size={16} color={c.primary} /></div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Hours</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>Mon–Sat, 8am–6pm</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: c.card, borderRadius: 16, padding: 'clamp(22px, 5vw, 30px)', border: `1px solid ${c.border}` }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${c.primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={26} color={c.primary} strokeWidth={2.5} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: c.ink, marginBottom: 8 }}>Message received!</div>
                <div style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.6 }}>This is a sample site, so nothing was actually sent.</div>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input required type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
                </div>
                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="What do you need cleaned?" />
                </div>
                <button type="submit" style={{ background: c.primary, color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: site.fontBody }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
