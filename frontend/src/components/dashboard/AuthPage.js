import React, { useState } from 'react';
import { Mail, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Authentication is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');

      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { company_name: company },
            emailRedirectTo: `${window.location.origin}/company`,
          },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setEmailSent(true);
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

  const inputStyle = {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 5,
    fontSize: 15, outline: 'none', color: '#0f172a', background: '#fafafa',
    transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
  };
  const passwordInputStyle = { ...inputStyle, paddingRight: 44 };
  const eyeButtonStyle = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  // ── Email confirmation screen ───────────────────────────────────────────────
  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 11, padding: '52px 44px', maxWidth: 420, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto 28px' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={32} color="#2563eb" strokeWidth={1.5} />
            </div>
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 24, height: 24, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid white' }}>
              <CheckCircle2 size={13} color="white" strokeWidth={2.5} />
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>Check your inbox</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>We sent a confirmation link to</p>
          <div style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 4, padding: '6px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>{email}</div>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
            Click the link in the email to confirm your account.<br />You'll land directly in your dashboard.
          </p>
          <button onClick={() => { setEmailSent(false); setMode('login'); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 5.5, border: 'none', background: '#1d4ed8', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            Go to Sign In
          </button>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Didn't get it? Check spam or{' '}
            <button onClick={() => setEmailSent(false)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0 }}>try again</button>.
          </p>
        </div>
      </div>
    );
  }

  // ── Main auth card ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 11, padding: '48px 44px', maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, boxShadow: '0 4px 12px rgba(37,99,235,0.35)', flexShrink: 0 }}>✦</div>
          <span style={{ fontWeight: 800, fontSize: 19, color: '#0f172a', letterSpacing: '-0.2px' }}>Clean Estimator</span>
          <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '3px 9px', borderRadius: 10, fontWeight: 700, marginLeft: 2, letterSpacing: '0.02em' }}>Company Portal</span>
        </div>

        <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', marginBottom: 5, letterSpacing: '-0.3px' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          {mode === 'login' ? 'Sign in to manage your widget, leads, and billing.' : '7-day free trial · Credit card required · Cancel anytime'}
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 5.5, padding: 4, marginBottom: 26 }}>
          {[['login', 'Sign In'], ['signup', 'Create Account']].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0f172a' : '#64748b', boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 13.5, fontWeight: 500 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Company name</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="ABC Cleaning Services" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@yourcompany.com" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
              {mode === 'login' && <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>}
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} style={passwordInputStyle}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={eyeButtonStyle} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password" style={{ ...passwordInputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#dc2626' : '#e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== password ? '#dc2626' : '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
                  onBlur={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== password ? '#dc2626' : '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
                <button type="button" onClick={() => setShowConfirmPassword(s => !s)} style={eyeButtonStyle} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Passwords do not match.</p>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: '14px 0', borderRadius: 5.5, border: 'none', background: loading ? '#94a3b8' : '#1d4ed8', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.15s', letterSpacing: '0.01em' }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Start Free Trial →'}
          </button>
        </form>

        {mode === 'signup' && (
          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <a href="/terms-of-service" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy-policy" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>.
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 22, borderTop: '1px solid #f1f5f9' }}>
          <a href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← Back to calculator</a>
        </div>
      </div>
    </div>
  );
}
