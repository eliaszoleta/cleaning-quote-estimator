import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

const WEB3FORMS_ACCESS_KEY = 'b0da3f48-9982-4a5a-9195-4200a80ba8c6';
const PRIMARY_GRADIENT = '#1d4ed8';

function Icon({ children, size = 20, linecap = 'round', linejoin = 'round' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap={linecap} strokeLinejoin={linejoin} aria-hidden="true">
      {children}
    </svg>
  );
}
const ClockIcon = p => <Icon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>;
const ShieldIcon = p => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>;
const SparklesIcon = p => <Icon {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></Icon>;
const CheckCircleIcon = p => <Icon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>;
const AlertTriangleIcon = p => <Icon {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const honeypotRef = useRef(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const subjectLabels = {
    general: 'General question',
    pricing: 'Pricing accuracy',
    company: 'Company / widget inquiry',
    bug: 'Bug report',
    partnership: 'Partnership',
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (honeypotRef.current && honeypotRef.current.value) {
      setStatus('success');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New Clean Estimator message: ${subjectLabels[form.subject] || form.subject}`,
          from_name: 'Clean Estimator Contact Form',
          name: form.name,
          email: form.email,
          topic: subjectLabels[form.subject] || form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setForm({ name: '', email: '', subject: 'general', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Poppins', 'Poppins Fallback', Arial, sans-serif" }}>
      <Helmet>
        <title>Contact Us | Clean Estimator</title>
        <meta name="description" content="Get in touch with the Clean Estimator team for support, partnerships, or general questions." />
        <link rel="canonical" href="https://www.cleanestimator.com/contact" />
      </Helmet>

      <style>{`
        .ce-contact-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
        .ce-contact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 780px) {
          .ce-contact-grid { grid-template-columns: 1fr; }
          .ce-contact-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
        padding: '60px 24px 92px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(96,165,250,0.14)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(147,197,253,0.12)', filter: 'blur(50px)' }} />
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(147,197,253,0.14)', border: '1px solid rgba(147,197,253,0.3)', borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Get in Touch</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.02em' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: 16, color: '#bfdbfe', lineHeight: 1.65, maxWidth: 420, margin: '0 auto' }}>
            Questions, feedback, or partnership inquiries — we'd love to hear from you.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-56px auto 0', padding: '0 24px 80px', position: 'relative' }}>
        <div className="ce-contact-grid">

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SideCard icon={<ClockIcon size={20} />} title="Fast response" body="We typically respond within 1 business day." color="#2563eb" bg="#dbeafe" />
            <SideCard icon={<ShieldIcon size={20} />} title="Pricing accuracy" body="Spot an estimate that looks off? Let us know and we'll take a look." color="#16a34a" bg="#dcfce7" />
            <SideCard icon={<SparklesIcon size={20} />} title="For cleaning companies" body="Want to embed our estimator on your site? Mention it in your message." color="#7c3aed" bg="#ede9fe" />

            <div style={{ padding: '18px 20px', background: '#eff6ff', borderRadius: 14, border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700, marginBottom: 6 }}>Looking for quick answers?</p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>
                Browse the <a href="/blog" style={{ color: '#2563eb', fontWeight: 600 }}>Clean Estimator Blog</a> for guides on cleaning costs and pricing by service type.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Send Us a Message</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Fields marked * are required.</p>
            </div>

            <div style={{ padding: '26px 30px 30px' }}>
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <div style={{ marginBottom: 14, color: '#16a34a', display: 'flex', justifyContent: 'center' }}><CheckCircleIcon size={44} linecap="square" linejoin="miter" /></div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Message sent!</p>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 22 }}>Thanks for reaching out — we typically respond within 1 business day.</p>
                  <button onClick={() => setStatus('idle')} style={{ padding: '10px 22px', background: PRIMARY_GRADIENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <input ref={honeypotRef} type="text" name="botcheck" tabIndex="-1" autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

                  <div className="ce-contact-row">
                    <div>
                      <label style={labelStyle} htmlFor="contact-name">Your name *</label>
                      <input id="contact-name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Jane Smith" style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="contact-email">Email address *</label>
                      <input id="contact-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@example.com" style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle} htmlFor="contact-subject">Subject</label>
                    <select id="contact-subject" name="subject" value={form.subject} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="general">General question</option>
                      <option value="pricing">Pricing accuracy</option>
                      <option value="company">Company / widget inquiry</option>
                      <option value="bug">Bug report</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle} htmlFor="contact-message">Message *</label>
                    <textarea id="contact-message" name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Tell us how we can help…" style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>

                  {status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c' }}>
                      <AlertTriangleIcon size={18} />
                      <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>Something went wrong sending your message. Please try again in a moment.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    style={{
                      padding: '13px 28px',
                      background: PRIMARY_GRADIENT,
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                      opacity: status === 'sending' ? 0.7 : 1,
                      alignSelf: 'flex-start',
                      transition: 'opacity 0.15s',
                      fontFamily: 'inherit',
                      boxShadow: '0 8px 22px rgba(29,78,216,0.35)',
                    }}
                    onMouseEnter={e => { if (status !== 'sending') e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = status === 'sending' ? '0.7' : '1'; }}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideCard({ icon, title, body, color, bg }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '16px 18px', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#0f172a', background: '#fafafa', boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit' };
