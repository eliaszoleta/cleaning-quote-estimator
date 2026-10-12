import React, { useState } from 'react';
import { CheckCircle2, Zap, AlertTriangle, Globe, Users, SlidersHorizontal, KeyRound, Send, ClipboardList, Infinity, Loader2, Lock } from 'lucide-react';
import { postCheckout, postPortal } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

// Mirrors CompanyLanding.js's PLAN_FEATURES -- one plan, pitched primarily
// as an internal pricing tool, with the calculator widget for your
// website included rather than a separate, pricier upsell.
const FEATURES = [
  { Icon: Infinity,          text: 'Unlimited internal price calculations' },
  { Icon: Lock,              text: 'Instant result on screen — never a public price range' },
  { Icon: Send,              text: 'Email a result to a coworker in one click' },
  { Icon: SlidersHorizontal, text: 'ZIP-code accurate pricing & per-service markup control' },
  { Icon: ClipboardList,     text: 'All 9 service calculators' },
  { Icon: Globe,             text: 'Calculator widget for your website, included whenever you want public lead capture' },
  { Icon: Users,             text: "Automatic lead capture + instant email alerts once it's on your site" },
  { Icon: KeyRound,          text: 'API access for CRM sync' },
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
    requires_trial_setup: { Icon: Zap,           iconColor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Start Your Free Trial' },
    trialing:             { Icon: Zap,           iconColor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Free Trial' },
    active:               { Icon: CheckCircle2,  iconColor: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: 'Active Subscription' },
    active_canceling:     { Icon: AlertTriangle, iconColor: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Active (Canceling)' },
    past_due:             { Icon: AlertTriangle, iconColor: '#dc2626', bg: '#fff1f2', border: '#fecdd3', title: 'Payment Past Due' },
    expired:              { Icon: AlertTriangle, iconColor: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Trial Expired' },
    canceled:             { Icon: AlertTriangle, iconColor: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Subscription Canceled' },
  };
  const sc = statusConfig[status] || { Icon: AlertTriangle, iconColor: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', title: 'No Active Plan' };

  const statusDetail = (() => {
    if (status === 'requires_trial_setup') return 'Activate your calculator to start your 30-day free trial.';
    if (status === 'trialing' && subStatus?.daysLeft > 0) return `${subStatus.daysLeft} days remaining in your free trial — subscribe anytime to keep your widget running after it ends.`;
    if (status === 'trialing') return 'Your trial ends today. Subscribe now to keep your widget from pausing.';
    if (status === 'active' && subStatus?.currentPeriodEnd) return `Renews on ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
    if (status === 'active_canceling' && subStatus?.currentPeriodEnd) return `Active until ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Will not renew.`;
    if (status === 'past_due') return 'Your payment failed. Update your payment method to keep your widget active.';
    if (status === 'expired' || status === 'canceled') return 'Your widget is currently paused. Subscribe to reactivate it.';
    return '';
  })();

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: '-0.3px' }}>Subscription</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Manage your Clean Estimator plan and billing.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '11px 14px', marginBottom: 18, color: '#dc2626', fontSize: 14 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Status card */}
      <div style={{ borderRadius: 7, padding: '20px 22px', marginBottom: 18, background: sc.bg, border: `1px solid ${sc.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 7, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: loading === 'checkout' ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer' }}>
                {loading === 'checkout' ? <><Loader2 size={14} className="spin" /> Redirecting…</> : status === 'requires_trial_setup' ? 'Get Started →' : status === 'trialing' ? 'Subscribe Now →' : 'Reactivate →'}
              </button>
            )}
            {(status === 'active' || status === 'active_canceling' || status === 'past_due') && (
              <button onClick={handlePortal} disabled={loading === 'portal'}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: loading === 'portal' ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: loading === 'portal' ? 'not-allowed' : 'pointer' }}>
                {loading === 'portal' ? <><Loader2 size={14} className="spin" /> Loading…</> : 'Manage Billing →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)', border: '1px solid #bfdbfe', borderRadius: 7, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>$25</span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/month</span>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>Cancel anytime. &nbsp;·&nbsp; <Lock size={12} color="#64748b" /> Secure billing via Stripe</div>
      </div>
    </div>
  );
}
