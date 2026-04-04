import React, { useState } from 'react';
import { CheckCircle2, Zap, AlertTriangle, Globe, Paintbrush, Users, SlidersHorizontal, KeyRound, BarChart3, Phone, Infinity, Check, Loader2 } from 'lucide-react';
import { postCheckout, postPortal } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

const FEATURES = [
  { Icon: Globe,             text: 'Embeddable calculator widget on your website' },
  { Icon: Paintbrush,        text: 'Custom branding — colors, logo, CTA text' },
  { Icon: Users,             text: 'Lead capture & CRM dashboard' },
  { Icon: SlidersHorizontal, text: 'Per-service enable/disable and markup control' },
  { Icon: KeyRound,          text: 'API access for CRM integration' },
  { Icon: BarChart3,         text: 'Lead analytics and CSV export' },
  { Icon: Phone,             text: 'Priority support' },
  { Icon: Infinity,          text: 'Unlimited calculator sessions per month' },
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

  // Status display config
  const statusConfig = {
    trialing:          { Icon: Zap,           iconColor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Free Trial' },
    active:            { Icon: CheckCircle2,   iconColor: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: 'Active Subscription' },
    active_canceling:  { Icon: AlertTriangle,  iconColor: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Active (Canceling)' },
    past_due:          { Icon: AlertTriangle,  iconColor: '#dc2626', bg: '#fff1f2', border: '#fecdd3', title: 'Payment Past Due' },
    expired:           { Icon: AlertTriangle,  iconColor: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Trial Expired' },
    canceled:          { Icon: AlertTriangle,  iconColor: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Subscription Canceled' },
  };
  const sc = statusConfig[status] || { Icon: AlertTriangle, iconColor: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', title: 'No Active Plan' };

  const statusDetail = (() => {
    if (status === 'trialing' && subStatus?.daysLeft > 0) return `${subStatus.daysLeft} days remaining in your trial.`;
    if (status === 'trialing') return 'Your trial ends today.';
    if (status === 'active' && subStatus?.currentPeriodEnd) return `Renews on ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
    if (status === 'active_canceling' && subStatus?.currentPeriodEnd) return `Active until ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Will not renew.`;
    if (status === 'past_due') return 'Your payment failed. Update your payment method to keep your widget active.';
    if (status === 'expired' || status === 'canceled') return 'Your widget is currently paused. Subscribe to reactivate it.';
    return '';
  })();

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Subscription</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Manage your Clean Estimator plan and billing.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', marginBottom: 18, color: '#dc2626', fontSize: 14 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Status card */}
      <div style={{ borderRadius: 12, padding: '20px 22px', marginBottom: 18, background: sc.bg, border: `1px solid ${sc.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <sc.Icon size={22} color={sc.iconColor} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.3px' }}>{sc.title}</div>
              <div style={{ fontSize: 13.5, color: '#374151' }}>{statusDetail}</div>
            </div>
          </div>
          <div>
            {(!isActive || status === 'trialing') && (
              <button onClick={handleCheckout} disabled={loading === 'checkout'}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: loading === 'checkout' ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer' }}>
                {loading === 'checkout' ? <><Loader2 size={14} className="spin" /> Redirecting…</> : status === 'trialing' ? 'Subscribe Now →' : 'Reactivate →'}
              </button>
            )}
            {(status === 'active' || status === 'active_canceling' || status === 'past_due') && (
              <button onClick={handlePortal} disabled={loading === 'portal'}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: loading === 'portal' ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading === 'portal' ? 'not-allowed' : 'pointer' }}>
                {loading === 'portal' ? <><Loader2 size={14} className="spin" /> Loading…</> : 'Manage Billing →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>What's included</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="#2563eb" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13.5, color: '#374151' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>$149</span>
          <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/month</span>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: !isActive && status !== 'trialing' ? 16 : 0 }}>Includes a 30-day free trial. Cancel anytime. &nbsp;·&nbsp; 🔒 Secure billing via Stripe</div>
        {(!isActive && status !== 'trialing') && (
          <button onClick={handleCheckout} disabled={loading === 'checkout'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', marginTop: 16, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer' }}>
            {loading === 'checkout' ? <><Loader2 size={14} className="spin" /> Redirecting…</> : 'Start Free Trial →'}
          </button>
        )}
      </div>
    </div>
  );
}
