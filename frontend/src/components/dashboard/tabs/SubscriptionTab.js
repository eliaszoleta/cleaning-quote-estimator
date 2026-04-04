import React, { useState } from 'react';
import { CheckCircle2, Zap, AlertTriangle, Globe, Paintbrush, Users, SlidersHorizontal, KeyRound, BarChart3, Phone, Infinity, Loader2, Shield, CreditCard } from 'lucide-react';
import { postCheckout, postPortal } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

const FEATURES = [
  { text: 'Embeddable calculator widget on your website' },
  { text: 'Custom branding — colors, logo, CTA text' },
  { text: 'Your logo & contact info on results' },
  { text: 'Lead capture (name, email, phone)' },
  { text: 'Lead management dashboard' },
  { text: 'Instant email notifications' },
  { text: 'Unlimited calculator sessions per month' },
  { text: 'Priority support' },
];

export default function SubscriptionTab({ subStatus, onSubRefresh }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const handleCheckout = async () => {
    setLoading('checkout'); setError('');
    try {
      const token = await getToken();
      const res = await postCheckout(token);
      window.location.href = res.url;
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal'); setError('');
    try {
      const token = await getToken();
      const res = await postPortal(token);
      window.location.href = res.url;
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  const isActive = subStatus?.active;
  const status = subStatus?.status;

  // ── Status badge config (same logic as before) ──
  const statusConfig = {
    trialing:         { label: '● Free Trial',         color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    active:           { label: '● Active',             color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    active_canceling: { label: '● Active (Canceling)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    past_due:         { label: '● Payment Past Due',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    expired:          { label: '● Trial Expired',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    canceled:         { label: '● Canceled',           color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };
  const sc = statusConfig[status] || { label: '● No Active Plan', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' };

  // ── Status detail text (same logic as before, untouched) ──
  const statusDetail = (() => {
    if (status === 'trialing' && subStatus?.daysLeft > 0)
      return <span>Trial ends in <strong>{subStatus.daysLeft} day{subStatus.daysLeft !== 1 ? 's' : ''}</strong>. Add a payment method to keep access.</span>;
    if (status === 'trialing')
      return 'Your trial ends today. Add a payment method to keep access.';
    if (status === 'active' && subStatus?.currentPeriodEnd)
      return <span>Renews on <strong>{new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</span>;
    if (status === 'active_canceling' && subStatus?.currentPeriodEnd)
      return <span>Active until <strong>{new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>. Will not renew.</span>;
    if (status === 'past_due')
      return 'Your payment failed. Update your payment method to keep your widget active.';
    if (status === 'expired' || status === 'canceled')
      return 'Your widget is currently paused. Subscribe to reactivate it.';
    return '';
  })();

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Subscription</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Manage your plan and billing.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Plan card ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '22px 24px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          {/* Left: badges + price + status detail */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {/* Plan name badge */}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '3px 10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Pro Plan
              </span>
              {/* Dynamic status badge */}
              <span style={{ fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 10px' }}>
                {sc.label}
              </span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-2px' }}>$49</span>
              <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/mo</span>
            </div>

            {/* Dynamic status detail */}
            <p style={{ fontSize: 13.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>{statusDetail}</p>
          </div>

          {/* Right: CTA button — same conditions as before */}
          <div style={{ alignSelf: 'center' }}>
            {(!isActive || status === 'trialing') && (
              <button onClick={handleCheckout} disabled={loading === 'checkout'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: loading === 'checkout' ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {loading === 'checkout'
                  ? <><Loader2 size={14} /> Redirecting…</>
                  : <><CreditCard size={15} /> {status === 'trialing' ? 'Add Payment Method' : 'Reactivate →'}</>}
              </button>
            )}
            {(status === 'active' || status === 'active_canceling' || status === 'past_due') && (
              <button onClick={handlePortal} disabled={loading === 'portal'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: loading === 'portal' ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading === 'portal' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {loading === 'portal' ? <><Loader2 size={14} /> Loading…</> : 'Manage Billing →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── What's included card ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '22px 24px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>What's included</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px 24px' }}>
          {FEATURES.map(({ text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.45 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust badges row ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '4px 4px 16px', color: '#64748b', fontSize: 13 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} color="#94a3b8" /> No long-term contract</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} color="#94a3b8" /> Cancel anytime</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={14} color="#94a3b8" /> Secure billing via Stripe</span>
      </div>

      {/* ── Cancel section — only shown when actively subscribed (not trialing, not already canceling) ── */}
      {status === 'active' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>Need to cancel?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>You'll retain access until the end of your current period.</div>
          </div>
          <button onClick={handlePortal} disabled={loading === 'portal'}
            style={{ padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: loading === 'portal' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {loading === 'portal' ? 'Loading…' : 'Cancel Subscription'}
          </button>
        </div>
      )}

    </div>
  );
}
