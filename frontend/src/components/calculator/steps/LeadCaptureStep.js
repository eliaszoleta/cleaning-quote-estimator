import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LeadCaptureStep({ onBack, onNext, loading, primaryColor, customQuestions = [], companyConfig }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [timeline, setTimeline] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');
  const [customAnswers, setCustomAnswers] = useState({});

  const ctaHeadline = companyConfig?.ctaHeadline || 'Get Your Instant Estimate';
  const ctaSubtext = companyConfig?.ctaSubtext || "We'll email your results and connect you with local cleaning professionals.";
  const ctaButtonText = companyConfig?.ctaButtonText || 'See My Estimate';

  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = name.trim().length > 0;
  const canSubmit = !loading && emailValid && nameValid;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onNext({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, timeline, preferredContact, customAnswers });
  };

  const inputStyle = {
    width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, outline: 'none', color: '#0f172a', transition: 'border-color 0.15s', background: 'white',
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 5, letterSpacing: '-0.2px' }}>{ctaHeadline}</h2>
      <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 22 }}>{ctaSubtext}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>
              Name <span style={{ color: '#dc2626', fontWeight: 400 }}>*</span>
            </label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — we'll send your estimate)</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
              style={{ ...inputStyle, borderColor: email && !emailValid ? '#dc2626' : '#e2e8f0' }}
              onFocus={e => { e.target.style.borderColor = email && !emailValid ? '#dc2626' : primaryColor; }}
              onBlur={e => { e.target.style.borderColor = email && !emailValid ? '#dc2626' : '#e2e8f0'; }}
            />
            {email && !emailValid && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Please enter a valid email.</p>}
          </div>

          <div>
            <label style={labelStyle}>
              Phone <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>When do you need this done?</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {[['asap', 'ASAP'], ['week', 'This week'], ['month', 'This month'], ['planning', 'Just planning']].map(([id, label]) => (
                <button
                  key={id} type="button" onClick={() => setTimeline(id)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    border: `1.5px solid ${timeline === id ? primaryColor : '#e2e8f0'}`,
                    background: timeline === id ? primaryColor : 'white',
                    color: timeline === id ? 'white' : '#374151',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {customQuestions.map((q, i) => (
            <div key={i}>
              <label style={labelStyle}>{q.label}</label>
              {q.type === 'select' ? (
                <select value={customAnswers[q.id] || ''} onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select…</option>
                  {(q.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type="text" value={customAnswers[q.id] || ''} onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder={q.placeholder || ''} style={inputStyle} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button" onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b' }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 20px', borderRadius: 10, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, color: 'white', background: canSubmit ? primaryColor : '#cbd5e1', transition: 'all 0.15s' }}
          >
            {loading ? <><Loader2 size={15} className="spin" /> Calculating…</> : `${ctaButtonText} →`}
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
          No spam, ever. Your info is only shared with the cleaning company you contact.
        </p>
      </form>
    </div>
  );
}
