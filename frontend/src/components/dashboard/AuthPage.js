import React, { useState } from 'react';
import { Mail, Lock, Building2, CheckCircle2, BarChart3, Globe, SlidersHorizontal, Users, Zap, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PERKS = [
  { Icon: Globe,             text: 'Embeddable calculator widget — live on your site in minutes' },
  { Icon: Users,             text: 'Lead capture & CRM to follow up with every quote request' },
  { Icon: SlidersHorizontal, text: 'Custom pricing, branding, and markup per service' },
  { Icon: BarChart3,         text: 'Analytics and CSV export for all your leads' },
];

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!supabase) throw new Error('Authentication is not configured.');

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

  // ── Email sent confirmation screen ──────────────────────────────────────────
  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '52px 44px', maxWidth: 460, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
          {/* Animated icon */}
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={36} color="#2563eb" strokeWidth={1.5} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
              <CheckCircle2 size={14} color="white" strokeWidth={2.5} />
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>Check your inbox</h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
            We sent a confirmation link to
          </p>
          <div style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 8, padding: '7px 16px', fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
            {email}
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
            Click the link in the email to confirm your account.<br />
            You'll land directly in your dashboard, ready to go.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => { setEmailSent(false); setMode('login'); }}
              style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Go to Sign In
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Didn't receive it? Check spam or{' '}
              <button onClick={() => setEmailSent(false)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0 }}>try again</button>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main auth page ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex' }}>

      {/* Left panel — brand & perks */}
      <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
           className="auth-left-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 52 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>✦</div>
          <span style={{ fontWeight: 800, fontSize: 21, color: 'white', letterSpacing: '-0.3px' }}>Clean Estimator</span>
        </div>

        <div style={{ marginBottom: 44 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 16 }}>
            Turn website visitors<br />into booked clients.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.65 }}>
            Embed a branded cleaning cost calculator on your site. Capture leads automatically while you sleep.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {PERKS.map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="#60a5fa" strokeWidth={2} />
              </div>
              <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 52, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex' }}>
            {['#2563eb','#0ea5e9','#7c3aed','#16a34a'].map((c, i) => (
              <div key={c} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid #0f172a', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                {['A','B','C','D'][i]}
              </div>
            ))}
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Trusted by cleaning companies across the US</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#f8fafc' }}
           className="auth-right-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo (hidden on desktop) */}
          <div className="auth-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700 }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Clean Estimator</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {mode === 'login' ? 'Sign in to your company dashboard.' : '7-day free trial · Credit card required · Cancel anytime'}
            </p>
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 11, padding: 4, marginBottom: 28 }}>
            {[['login','Sign In'],['signup','Create Account']].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0f172a' : '#64748b', boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Company name</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="ABC Cleaning Services"
                    style={{ width: '100%', padding: '13px 16px 13px 42px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, outline: 'none', color: '#0f172a', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{ width: '100%', padding: '13px 16px 13px 42px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, outline: 'none', color: '#0f172a', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                {mode === 'login' && <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  style={{ width: '100%', padding: '13px 16px 13px 42px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, outline: 'none', color: '#0f172a', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ marginTop: 4, padding: '14px 0', borderRadius: 11, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.15s' }}>
              {loading ? 'Please wait…' : mode === 'login' ? <>Sign In <ArrowRight size={17} /></> : <>Start Free Trial <Zap size={16} /></>}
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

          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
            <a href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ← Back to calculator
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important; padding: 40px 24px !important; }
          .auth-right-panel > div { background: white; border-radius: 20px; padding: 36px 28px; box-shadow: 0 24px 60px rgba(0,0,0,0.3); }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
