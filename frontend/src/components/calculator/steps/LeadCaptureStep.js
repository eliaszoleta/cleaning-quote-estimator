import React, { useState } from 'react';

export default function LeadCaptureStep({ onBack, onNext, loading, primaryColor, customQuestions = [], companyConfig }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [timeline, setTimeline] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');
  const [customAnswers, setCustomAnswers] = useState({});
  const [skipClicked, setSkipClicked] = useState(false);

  const ctaHeadline = companyConfig?.ctaHeadline || 'Get Your Instant Estimate';
  const ctaSubtext = companyConfig?.ctaSubtext || 'Optional — we\'ll email your results and connect you with local cleaning professionals.';
  const ctaButtonText = companyConfig?.ctaButtonText || 'See My Estimate →';

  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = !loading;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onNext({ name: name.trim() || null, email: email.trim() || null, phone: phone.trim() || null, timeline, preferredContact, customAnswers });
  };

  const handleSkip = () => {
    setSkipClicked(true);
    onNext({});
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8,
    fontSize: 15, outline: 'none', color: '#0f172a', transition: 'border-color 0.15s',
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{ctaHeadline}</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>{ctaSubtext}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Your name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Email address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — for your estimate copy)</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
              style={{ ...inputStyle, borderColor: email && !emailValid ? '#dc2626' : '#e2e8f0' }}
              onFocus={e => { e.target.style.borderColor = email && !emailValid ? '#dc2626' : primaryColor; }}
              onBlur={e => { e.target.style.borderColor = email && !emailValid ? '#dc2626' : '#e2e8f0'; }}
            />
            {email && !emailValid && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Please enter a valid email address.</p>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Phone number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              When do you need this done?
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['asap','ASAP'],['week','This week'],['month','This month'],['planning','Just planning']].map(([id,label]) => (
                <button key={id} type="button" onClick={() => setTimeline(id)} style={{ padding: '9px 16px', borderRadius: 8, border: `2px solid ${timeline === id ? primaryColor : '#e2e8f0'}`, background: timeline === id ? primaryColor : 'white', color: timeline === id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Custom questions from company config */}
          {customQuestions.map((q, i) => (
            <div key={i}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{q.label}</label>
              {q.type === 'select' ? (
                <select value={customAnswers[q.id] || ''} onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
                  <option value="">Select…</option>
                  {(q.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type="text" value={customAnswers[q.id] || ''} onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder={q.placeholder || ''} style={inputStyle} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button type="button" onClick={onBack} style={{ padding: '14px 24px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#64748b' }}>
            ← Back
          </button>
          <button
            type="submit"
            disabled={!canSubmit || (email && !emailValid)}
            style={{ flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 700, color: 'white', background: canSubmit ? primaryColor : '#94a3b8', transition: 'all 0.15s' }}
          >
            {loading ? 'Calculating…' : ctaButtonText}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button type="button" onClick={handleSkip} disabled={loading} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Skip and see estimate anyway
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
          No spam, ever. Your info is only shared with the cleaning company you choose to contact.
        </p>
      </form>
    </div>
  );
}
