import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Rendered instead of the normal dashboard whenever App.js sees Supabase's
// PASSWORD_RECOVERY auth event -- clicking the emailed reset link logs the
// visitor in with a real (temporary) session, but they should be made to
// set a new password before landing in the dashboard, not dropped straight
// into it on a link anyone with access to that inbox could have clicked.
export default function ResetPasswordPage({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inputStyle = {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 5,
    fontSize: 15, outline: 'none', color: '#0f172a', background: '#fafafa',
    transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box', paddingRight: 44,
  };
  const eyeButtonStyle = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 11, padding: '52px 44px', maxWidth: 420, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <CheckCircle2 size={32} color="#16a34a" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>Password updated</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>You're all set — continue to your dashboard.</p>
          <button onClick={onDone}
            style={{ width: '100%', padding: '13px 0', borderRadius: 5.5, border: 'none', background: '#1d4ed8', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 11, padding: '48px 44px', maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, boxShadow: '0 4px 12px rgba(37,99,235,0.35)', flexShrink: 0 }}>✦</div>
          <span style={{ fontWeight: 800, fontSize: 19, color: '#0f172a', letterSpacing: '-0.2px' }}>Clean Estimator</span>
        </div>

        <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', marginBottom: 5, letterSpacing: '-0.3px' }}>Set a new password</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>Choose a new password for your account.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 13.5, fontWeight: 500 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>New password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={eyeButtonStyle} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Confirm new password</label>
            <input type={showPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password" style={{ ...inputStyle, paddingRight: 16, borderColor: confirmPassword && confirmPassword !== password ? '#dc2626' : '#e2e8f0' }}
              onFocus={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== password ? '#dc2626' : '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== password ? '#dc2626' : '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }} />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Passwords do not match.</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: '14px 0', borderRadius: 5.5, border: 'none', background: loading ? '#94a3b8' : '#1d4ed8', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.15s', letterSpacing: '0.01em' }}>
            {loading ? 'Updating…' : 'Update Password →'}
          </button>
        </form>
      </div>
    </div>
  );
}
