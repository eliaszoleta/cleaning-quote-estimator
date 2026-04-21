import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production: POST to /api/contact or use a form service like Formspree
    setSubmitted(true);
  };

  const inp = { width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', color: '#0f172a', marginTop: 6 };

  return (
    <>
      <Helmet>
        <title>Contact Us | Clean Estimator</title>
        <meta name="description" content="Get in touch with the Clean Estimator team for support, partnerships, or general questions." />
        <link rel="canonical" href="https://www.cleanestimator.com/contact" />
      </Helmet>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Contact Us</h1>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36 }}>Questions, feedback, or partnership inquiries — we'd love to hear from you.</p>

        {submitted ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: '#15803d', marginBottom: 8 }}>Message sent!</h2>
            <p style={{ color: '#166534' }}>We typically respond within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Your name</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Email address</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Subject</label>
              <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ ...inp, background: 'white', cursor: 'pointer' }}>
                <option value="general">General question</option>
                <option value="pricing">Pricing accuracy</option>
                <option value="company">Company / widget inquiry</option>
                <option value="bug">Bug report</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Message</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help…" style={{ ...inp, resize: 'vertical' }} />
            </div>
            <button type="submit" style={{ padding: '14px 0', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Send Message →
            </button>
          </form>
        )}
      </div>
    </>
  );
}
