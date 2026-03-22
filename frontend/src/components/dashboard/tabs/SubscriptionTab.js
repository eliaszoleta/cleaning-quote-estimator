import React, { useState } from 'react';
import { postCheckout, postPortal } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

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

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Subscription</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Manage your CleanCalc plan and billing.</p>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      {/* Status card */}
      <div style={{
        borderRadius: 12, padding: '24px 28px', marginBottom: 24,
        background: isActive ? (status === 'trialing' ? '#eff6ff' : '#f0fdf4') : '#fef2f2',
        border: `1px solid ${isActive ? (status === 'trialing' ? '#bfdbfe' : '#bbf7d0') : '#fecaca'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>
              {isActive ? (status === 'trialing' ? '🎯' : '✅') : '⚠️'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 4 }}>
              {status === 'trialing' ? 'Free Trial' :
               status === 'active' ? 'Active Subscription' :
               status === 'active_canceling' ? 'Active (Canceling)' :
               status === 'past_due' ? 'Payment Past Due' :
               status === 'expired' ? 'Trial Expired' :
               status === 'canceled' ? 'Subscription Canceled' : 'No Active Plan'}
            </div>
            <div style={{ fontSize: 14, color: '#374151' }}>
              {status === 'trialing' && subStatus.daysLeft > 0 && `${subStatus.daysLeft} days remaining in your trial.`}
              {status === 'trialing' && subStatus.daysLeft === 0 && 'Your trial ends today.'}
              {status === 'active' && subStatus.currentPeriodEnd && `Renews on ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`}
              {status === 'active_canceling' && subStatus.currentPeriodEnd && `Active until ${new Date(subStatus.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Will not renew.`}
              {status === 'past_due' && 'Your payment failed. Update your payment method to keep your widget active.'}
              {(status === 'expired' || status === 'canceled') && 'Your widget is currently paused. Subscribe to reactivate it.'}
            </div>
          </div>
          <div>
            {(!isActive || status === 'trialing') && (
              <button onClick={handleCheckout} disabled={loading === 'checkout'}
                style={{ padding: '12px 28px', background: loading === 'checkout' ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer' }}>
                {loading === 'checkout' ? 'Redirecting…' : status === 'trialing' ? 'Subscribe Now →' : 'Reactivate →'}
              </button>
            )}
            {(status === 'active' || status === 'active_canceling' || status === 'past_due') && (
              <button onClick={handlePortal} disabled={loading === 'portal'}
                style={{ padding: '12px 28px', background: loading === 'portal' ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading === 'portal' ? 'not-allowed' : 'pointer' }}>
                {loading === 'portal' ? 'Loading…' : 'Manage Billing →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan features */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>What's included</h3>
        {[
          ['🔗', 'Embeddable calculator widget on your website'],
          ['🎨', 'Custom branding — colors, logo, CTA text'],
          ['📋', 'Lead capture & CRM dashboard'],
          ['⚙️', 'Per-service enable/disable and markup control'],
          ['🔑', 'API access for CRM integration'],
          ['📊', 'Lead analytics and CSV export'],
          ['📞', 'Priority support'],
          ['🔄', 'Unlimited calculator sessions per month'],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 14, color: '#374151' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ background: 'linear-gradient(135deg, #f0f7ff, #f8fafc)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: '#0f172a' }}>$49</span>
          <span style={{ fontSize: 16, color: '#64748b' }}>/month</span>
        </div>
        <div style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>Includes a 30-day free trial. Cancel anytime.</div>
        {(!isActive || status === 'trialing') && (
          <button onClick={handleCheckout} disabled={loading === 'checkout'}
            style={{ padding: '12px 28px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading === 'checkout' ? 'not-allowed' : 'pointer' }}>
            {loading === 'checkout' ? 'Redirecting…' : 'Start Free Trial →'}
          </button>
        )}
      </div>
    </div>
  );
}
