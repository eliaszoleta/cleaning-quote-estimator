import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Paintbrush, SlidersHorizontal, Code2,
  Users, CreditCard, KeyRound, Settings, Loader2, Check, LogOut, AlertCircle, Save,
} from 'lucide-react';
import { useCompanyConfig } from '../../hooks/useCompanyConfig';
import { getSubscriptionStatus, verifyCheckout } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import OverviewTab from './tabs/OverviewTab';
import BrandingTab from './tabs/BrandingTab';
import ServicesTab from './tabs/ServicesTab';
import EmbedTab from './tabs/EmbedTab';
import LeadsTab from './tabs/LeadsTab';
import SubscriptionTab from './tabs/SubscriptionTab';
import APIKeysTab from './tabs/APIKeysTab';
import SettingsTab from './tabs/SettingsTab';

const NAV = [
  { id: 'overview',      Icon: LayoutDashboard,   label: 'Overview' },
  { id: 'branding',      Icon: Paintbrush,         label: 'Branding' },
  { id: 'services',      Icon: SlidersHorizontal,  label: 'Services' },
  { id: 'embed',         Icon: Code2,              label: 'Embed Widget' },
  { id: 'leads',         Icon: Users,              label: 'Leads' },
  { id: 'subscription',  Icon: CreditCard,         label: 'Subscription' },
  { id: 'api',           Icon: KeyRound,           label: 'API Keys' },
  { id: 'settings',      Icon: Settings,           label: 'Settings' },
];

export default function CompanyDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [subStatus, setSubStatus] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);
  const { config, loading, saving, saved, error, saveConfig } = useCompanyConfig(user.id);

  const localConfigReady = useRef(false);
  useEffect(() => {
    if (config && !localConfigReady.current) {
      localConfigReady.current = true;
      setLocalConfig({ ...config });
    }
  }, [config]);

  const update = useCallback((partial) => {
    setLocalConfig(prev => prev ? { ...prev, ...partial } : { ...partial });
  }, []);

  const handleGlobalSave = () => {
    if (localConfig) saveConfig(localConfig);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && NAV.find(n => n.id === tab)) setActiveTab(tab);

    const sessionId = params.get('session_id');
    const subscribed = params.get('subscribed');
    if (sessionId && subscribed === 'true') {
      setActiveTab('subscription');
      verifyCheckoutSession(sessionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSubStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const loadSubStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getSubscriptionStatus(token);
      setSubStatus(res.data);
    } catch (err) {
      console.warn('Could not load subscription status:', err.message);
    }
  };

  const verifyCheckoutSession = async (sessionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await verifyCheckout(token, sessionId);
      setSubStatus(res.data);
      window.history.replaceState({}, '', '/company?tab=subscription');
    } catch (err) {
      console.warn('Checkout verification failed:', err.message);
    }
  };

  const isPaused = subStatus && !subStatus.active;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading your dashboard…</div>
      </div>
    </div>
  );

  const tabProps = { config, saveConfig, saving, saved, error, user, subStatus, onSubRefresh: loadSubStatus };

  const TABS = {
    overview:     <OverviewTab {...tabProps} />,
    branding:     <BrandingTab config={localConfig} update={update} />,
    services:     <ServicesTab config={localConfig} update={update} />,
    embed:        <EmbedTab {...tabProps} />,
    leads:        <LeadsTab {...tabProps} />,
    subscription: <SubscriptionTab {...tabProps} />,
    api:          <APIKeysTab {...tabProps} />,
    settings:     <SettingsTab user={user} onLogout={onLogout} />,
  };

  const subBadge = subStatus ? (() => {
    if (subStatus.status === 'requires_trial_setup') return { label: 'Start Trial', bg: '#1e3a8a', color: '#bfdbfe' };
    if (subStatus.status === 'trialing') return { label: `Trial · ${subStatus.daysLeft}d`, bg: '#1e3a8a', color: '#bfdbfe' };
    if (subStatus.status === 'active') return { label: 'Active', bg: '#14532d', color: '#bbf7d0' };
    if (subStatus.status === 'active_canceling') return { label: 'Canceling', bg: '#78350f', color: '#fde68a' };
    if (subStatus.status === 'past_due') return { label: 'Past Due', bg: '#7f1d1d', color: '#fecaca' };
    return { label: 'Expired', bg: '#7f1d1d', color: '#fecaca' };
  })() : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <header style={{
        background: '#0f172a', color: 'white', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #1e293b',
        boxShadow: '0 1px 0 #1e293b, 0 4px 20px rgba(0,0,0,0.35)',
      }}>
        {/* Left: logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
            }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 900 }}>✦</span>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>Clean Estimator</span>
          </a>
          <span style={{ color: '#334155', fontSize: 13 }}>/</span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Dashboard</span>
        </div>

        {/* Right: badge, save, user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {subBadge && (
            <div style={{
              fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
              background: subBadge.bg, color: subBadge.color, letterSpacing: '0.02em',
            }}>
              {subBadge.label}
            </div>
          )}

          <button
            onClick={handleGlobalSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              background: saving ? '#334155' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 7,
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 13, transition: 'background 0.15s',
            }}
          >
            {saving
              ? <><Loader2 size={13} className="spin" /> Saving…</>
              : <><Save size={13} /> Save Changes</>
            }
          </button>

          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
              <Check size={14} strokeLinecap="square" strokeLinejoin="miter" /> Saved
            </div>
          )}

          <div style={{ width: 1, height: 20, background: '#1e293b', margin: '0 2px' }} />

          <span style={{ color: '#64748b', fontSize: 12 }}>{user.email}</span>

          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: '#64748b', border: '1px solid #1e293b',
              padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* Subscription expired banner */}
      {isPaused && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
            <AlertCircle size={15} />
            Your widget is currently paused — {subStatus.status === 'requires_trial_setup' ? 'start your 7-day free trial to activate' : subStatus.status === 'expired' ? 'your trial has expired' : 'subscription issue'}.
          </div>
          <button onClick={() => setActiveTab('subscription')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {subStatus.status === 'requires_trial_setup' ? 'Start Trial →' : 'Reactivate →'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar nav */}
        <nav className="dash-nav">
          <div className="dash-nav-section">Menu</div>
          {NAV.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`dash-nav-item${activeTab === id ? ' active' : ''}`}
            >
              <Icon size={16} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === 'leads' && config?.leadsCount > 0 && (
                <span style={{
                  background: activeTab === 'leads' ? '#2563eb' : '#e2e8f0',
                  color: activeTab === 'leads' ? 'white' : '#64748b',
                  borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {config.leadsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: 'calc(100vw - 216px)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
          {Object.entries(TABS).map(([id, tab]) => (
            <div key={id} style={{ display: id === activeTab ? 'block' : 'none' }}>
              {tab}
            </div>
          ))}

          <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', marginTop: 32 }}>
            Need help? Email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb' }}>info@cleanestimator.com</a>
          </p>
        </main>
      </div>
    </div>
  );
}
