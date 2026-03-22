import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const NAV = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'branding', icon: '🎨', label: 'Branding' },
  { id: 'services', icon: '⚙️', label: 'Services' },
  { id: 'embed', icon: '🔗', label: 'Embed Widget' },
  { id: 'leads', icon: '📋', label: 'Leads' },
  { id: 'subscription', icon: '💳', label: 'Subscription' },
  { id: 'api', icon: '🔑', label: 'API Keys' },
];

export default function CompanyDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [subStatus, setSubStatus] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);
  const { config, loading, saving, saved, error, saveConfig } = useCompanyConfig(user.id);

  // Initialize localConfig once from the fetched config (never reinitialize after that)
  const localConfigReady = useRef(false);
  useEffect(() => {
    if (config && !localConfigReady.current) {
      localConfigReady.current = true;
      setLocalConfig({ ...config });
    }
  }, [config]);

  // Tabs call this to update any slice of localConfig
  const update = useCallback((partial) => {
    setLocalConfig(prev => prev ? { ...prev, ...partial } : { ...partial });
  }, []);

  const handleGlobalSave = () => {
    if (localConfig) saveConfig(localConfig);
  };

  // Parse tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && NAV.find(n => n.id === tab)) setActiveTab(tab);

    // Verify checkout if returning from Stripe
    const sessionId = params.get('session_id');
    const subscribed = params.get('subscribed');
    if (sessionId && subscribed === 'true') {
      setActiveTab('subscription');
      verifyCheckoutSession(sessionId);
    }
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
      // Clean URL
      window.history.replaceState({}, '', '/company?tab=subscription');
    } catch (err) {
      console.warn('Checkout verification failed:', err.message);
    }
  };

  const isPaused = subStatus && !subStatus.active;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Loading your dashboard…</div>
      </div>
    </div>
  );

  const tabProps = { config, saveConfig, saving, saved, error, user, subStatus, onSubRefresh: loadSubStatus };

  const TABS = {
    overview: <OverviewTab {...tabProps} />,
    branding: <BrandingTab config={localConfig} update={update} />,
    services: <ServicesTab config={localConfig} companyId={user.id} update={update} />,
    embed: <EmbedTab {...tabProps} />,
    leads: <LeadsTab {...tabProps} />,
    subscription: <SubscriptionTab {...tabProps} />,
    api: <APIKeysTab {...tabProps} />,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', color: 'white', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15 }}>✦</div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>CleanCalc</span>
          </a>
          <span style={{ color: '#475569', fontSize: 14 }}>/ Company Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {subStatus && (
            <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
              background: subStatus.active ? (subStatus.status === 'trialing' ? '#1e40af' : '#15803d') : '#991b1b',
              color: 'white',
            }}>
              {subStatus.status === 'trialing' ? `Trial: ${subStatus.daysLeft}d left` :
               subStatus.status === 'active' ? 'Active' :
               subStatus.status === 'active_canceling' ? 'Canceling' :
               subStatus.status === 'past_due' ? '⚠ Past Due' : 'Expired'}
            </div>
          )}
          <button onClick={handleGlobalSave} disabled={saving} style={{ padding: '8px 18px', background: saving ? '#475569' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
          <span style={{ color: '#64748b', fontSize: 13 }}>{user.email}</span>
          <button onClick={onLogout} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Subscription expired banner */}
      {isPaused && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#dc2626', fontWeight: 600, fontSize: 14 }}>
            ⚠ Your widget is currently paused — {subStatus.status === 'expired' ? 'your trial has expired' : 'subscription issue'}. Visitors will see a placeholder instead of your calculator.
          </div>
          <button onClick={() => setActiveTab('subscription')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            Reactivate →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar nav */}
        <nav style={{ width: 220, background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto', flexShrink: 0 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none',
                background: activeTab === n.id ? '#eff6ff' : 'transparent',
                color: activeTab === n.id ? '#2563eb' : '#64748b',
                cursor: 'pointer', fontSize: 14, fontWeight: activeTab === n.id ? 700 : 500,
                textAlign: 'left', width: '100%', transition: 'all 0.15s',
              }}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.id === 'leads' && config?.leadsCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {config.leadsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto', maxWidth: 'calc(100vw - 220px)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}
          {Object.entries(TABS).map(([id, tab]) => (
            <div key={id} style={{ display: id === activeTab ? 'block' : 'none' }}>
              {tab}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
