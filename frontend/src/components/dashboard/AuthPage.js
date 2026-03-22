import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!supabase) throw new Error('Authentication is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');

      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { company_name: company } },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setSuccess('Account created! Check your email to confirm, then log in.');
        } else if (data.session) {
          onAuth(data.user);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth(data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const input = {
    width: '100%', padding: '13px 16px', border: '2px solid #e2e8f0', borderRadius: 10,
    fontSize: 15, outline: 'none', color: '#0f172a', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700 }}>✦</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>CleanCalc</span>
          <span style={{ fontSize: 12, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 20, fontWeight: 600, marginLeft: 4 }}>Company Portal</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          {mode === 'login' ? 'Sign in to your dashboard' : 'Create your account'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          {mode === 'login' ? 'Manage your widget, leads, and subscription.' : 'Start your free 30-day trial — no credit card required.'}
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[['login','Sign In'],['signup','Create Account']].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0f172a' : '#64748b', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14, fontWeight: 500 }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Company name</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="ABC Cleaning Services" style={input}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourcompany.com" style={input}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} style={input}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '14px 0', borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Start Free Trial →'}
          </button>
        </form>

        {mode === 'signup' && (
          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
            By creating an account you agree to our <a href="/terms-of-service" style={{ color: '#2563eb' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#2563eb' }}>Privacy Policy</a>.
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <a href="/" style={{ color: '#64748b', fontSize: 13 }}>← Back to calculator</a>
        </div>
      </div>
    </div>
  );
}
