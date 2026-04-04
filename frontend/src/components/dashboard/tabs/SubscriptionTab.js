import React, { useState } from 'react';
import { CreditCard, Loader2, AlertTriangle, Shield, Zap } from 'lucide-react';
import { postCheckout, postPortal } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

const FEATURES = [
  'Embeddable estimator widget',
  'Custom branding & colors',
  'Your logo & contact info on results',
  'Lead capture (name, email, phone)',
  'Lead management dashboard',
  'Instant email notifications',
  'Unlimited estimates',
  'Priority support',
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
  const isCanceling = status === 'active_canceling';
  const isPastDue = status === 'past_due';
  const isTrialing = status === 'trialing';
  const isExpiredOrCanceled = status === 'expired' || status === 'canceled';

  const periodEnd = subStatus?.currentPeriodEnd
    ? new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const trialEnd = subStatus?.trialEnd
    ? new Date(subStatus.trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : periodEnd;

  // Status badge label & color
  const statusBadge = (() => {
    if (isTrialing)         return { label: '● Free Trial',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    if (status === 'active' && !isCanceling) return { label: '● Active', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    if (isCanceling)        return { label: '● Canceling',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    if (isPastDue)          return { label: '● Past Due',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    if (isExpiredOrCanceled)return { label: '● Inactive',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    return                         { label: '● No Plan',     color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' };
  })();

  // Sub-text under price
  const statusDetail = (() => {
    if (isTrialing && trialEnd)   return <>Trial ends <strong>{trialEnd}</strong>. Add a payment method to keep access.</>;
    if (isTrialing)               return 'Your trial ends today. Add a payment method to keep access.';
    if (status === 'active' && !isCanceling && periodEnd) return <>Renews on <strong>{periodEnd}</strong>.</>;
    if (isCanceling && periodEnd) return <>You'll retain access until <strong>{periodEnd}</strong>. Will not renew.</>;
    if (isPastDue)                return 'Your last payment failed. Update your payment method to keep access.';
    if (isExpiredOrCanceled)      return 'Your plan is inactive. Subscribe to reactivate your widget.';
    return 'Start your free trial today.';
  })();

  // Primary CTA
  const cta = (() => {
    if (isTrialing || isExpiredOrCanceled || !isActive) return { label: 'Add Payment Method', Icon: CreditCard, action: handleCheckout, key: 'checkout', orange: true };
    if (isPastDue)  return { label: 'Update Payment',    Icon: CreditCard, action: handlePortal,  key: 'portal',   orange: true };
    return               { label: 'Manage Billing',      Icon: CreditCard, action: handlePortal,  key: 'portal',   orange: false };
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

          {/* Left: badges + price + detail */}
          <div>
            {/* Badges row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '3px 10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Pro Plan
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusBadge.color, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, borderRadius: 6, padding: '3px 10px' }}>
                {statusBadge.label}
              </span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-2px' }}>$49</span>
              <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/mo</span>
            </div>

            {/* Status detail */}
            <p style={{ fontSize: 13.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>{statusDetail}</p>
          </div>

          {/* Right: CTA button */}
          <button
            onClick={cta.action}
            disabled={loading === cta.key}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px',
              background: loading === cta.key ? '#94a3b8' : cta.orange ? '#ea580c' : '#0f172a',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 14,
              cursor: loading === cta.key ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center',
              transition: 'background 0.15s',
            }}
          >
            {loading === cta.key
              ? <><Loader2 size={14} /> Loading…</>
              : <><cta.Icon size={15} /> {cta.label}</>
            }
          </button>
        </div>
      </div>

      {/* ── What's included card ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '22px 24px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>What's included</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 24px' }}>
          {FEATURES.map(text => (
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={14} color="#94a3b8" /> No long-term contract
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} color="#94a3b8" /> Cancel anytime
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={14} color="#94a3b8" /> Secure billing via Stripe
        </span>
      </div>

      {/* ── Cancel section (only when active/trialing) ── */}
      {(isActive || isTrialing) && !isCanceling && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>Need to cancel?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>You'll retain access until the end of your current period.</div>
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            style={{ padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: loading === 'portal' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {loading === 'portal' ? 'Loading…' : 'Cancel Subscription'}
          </button>
        </div>
      )}

    </div>
  );
}
