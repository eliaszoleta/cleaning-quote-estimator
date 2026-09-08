import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Paintbrush, SlidersHorizontal, Code2,
  Users, CreditCard, KeyRound, Settings, Loader2, Check, LogOut, AlertCircle, Save, HelpCircle, Percent,
} from 'lucide-react';
import { useCompanyConfig } from '../../hooks/useCompanyConfig';
import { getSubscriptionStatus, verifyCheckout } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import OverviewTab from './tabs/OverviewTab';
import BrandingTab from './tabs/BrandingTab';
import ServicesTab from './tabs/ServicesTab';
import DiscountTab from './tabs/DiscountTab';
import EmbedTab from './tabs/EmbedTab';
import LeadsTab from './tabs/LeadsTab';
import SubscriptionTab from './tabs/SubscriptionTab';
import APIKeysTab from './tabs/APIKeysTab';
import SettingsTab from './tabs/SettingsTab';
import HelpTab from './tabs/HelpTab';

const NAV = [
  { id: 'overview',      Icon: LayoutDashboard,   label: 'Overview' },
  { id: 'leads',         Icon: Users,              label: 'Leads' },
  { id: 'services',      Icon: SlidersHorizontal,  label: 'Services' },
  { id: 'branding',      Icon: Paintbrush,         label: 'Branding' },
  { id: 'discount',      Icon: Percent,            label: 'Discount' },
  { id: 'embed',         Icon: Code2,              label: 'Embed Widget' },
  { id: 'help',          Icon: HelpCircle,         label: 'Help & Docs' },
  { id: 'subscription',  Icon: CreditCard,         label: 'Subscription' },
  { id: 'settings',      Icon: Settings,           label: 'Settings' },
  { id: 'api',           Icon: KeyRound,           label: 'API Keys' },
];

export default function CompanyDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [subStatus, setSubStatus] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const { config, loading, saving, saved, error, saveConfig, patchServices, refetch, justCreated } = useCompanyConfig(user.id);

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

  // Every auto-save (service toggles, Service Area states/cities) chains
  // onto this one queue. Both PATCH /:id/services and PUT /:id do their own
  // read-existing-then-merge-then-write server-side, so firing several of
  // these back to back -- toggling a service, removing two cities, adding
  // four more, all within a few seconds -- lets a later request read the
  // row before an earlier request's write has landed, then save from that
  // stale snapshot and silently revert it. Chaining every auto-save (across
  // both kinds) onto one promise makes each fully complete, round trip
  // included, before the next is even sent, so a rapid sequence of edits
  // always lands in the order made instead of racing each other.
  const autoSaveQueue = useRef(Promise.resolve());

  // Wraps the hook's patchServices so localConfig (what the header's Save
  // Changes button submits) reflects the just-persisted toggle too --
  // otherwise a later global save would overwrite the auto-saved change
  // with whatever stale services value localConfig still had from before
  // the toggle.
  const patchServiceToggle = useCallback((services) => {
    autoSaveQueue.current = autoSaveQueue.current.then(async () => {
      const data = await patchServices(services);
      if (data) update({ services: data.services });
    });
  }, [patchServices, update]);

  // Same immediate-save treatment as service toggles, for Service Area
  // (states + cities) -- adding a city or state via plain update() only
  // staged it in localConfig until the header's Save Changes was clicked,
  // which is exactly the "did it actually take effect?" confusion the
  // service-toggle auto-save already fixed once. saveConfig's PUT merges
  // just the given field into whatever's already saved server-side, so
  // this is safe to fire alongside the same optimistic local update().
  const autoSave = useCallback((partial) => {
    update(partial);
    autoSaveQueue.current = autoSaveQueue.current.then(() => saveConfig(partial));
  }, [update, saveConfig]);

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
  const deletionPending = config?.pendingDeletion;
  const showWelcome = justCreated && !welcomeDismissed;

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
    help:         <HelpTab />,
    branding:     <BrandingTab config={localConfig} update={update} onSave={handleGlobalSave} saving={saving} saved={saved} />,
    services:     <ServicesTab config={localConfig} update={update} patchServices={patchServiceToggle} autoSave={autoSave} />,
    discount:     <DiscountTab config={localConfig} update={update} />,
    embed:        <EmbedTab {...tabProps} />,
    leads:        <LeadsTab {...tabProps} />,
    subscription: <SubscriptionTab {...tabProps} />,
    api:          <APIKeysTab {...tabProps} />,
    settings:     <SettingsTab user={user} config={config} refetchConfig={refetch} onLogout={onLogout} />,
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #16213b 100%)', color: 'white', height: 60,
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

      {/* Pending account deletion banner */}
      {deletionPending && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
            <AlertCircle size={15} />
            Your account is scheduled for deletion on {new Date(deletionPending.scheduledFor).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Your widget is paused in the meantime.
          </div>
          <button onClick={() => setActiveTab('settings')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            Cancel Deletion →
          </button>
        </div>
      )}

      {/* Subscription expired banner */}
      {!deletionPending && isPaused && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
            <AlertCircle size={15} />
            Your widget is currently paused — {subStatus.status === 'requires_trial_setup' ? 'reload the page or reach out if this doesn\'t clear on its own' : subStatus.status === 'expired' ? 'your 30-day free trial has ended' : 'subscription issue'}.
          </div>
          <button onClick={() => setActiveTab('subscription')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {subStatus.status === 'requires_trial_setup' ? 'Get Started →' : 'Reactivate →'}
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
                  background: activeTab === 'leads' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
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

      {/* First-time welcome pointer -- shown exactly once, on the very
          first login after signup (see the `created` comment on
          GET /api/company/:id and useCompanyConfig.js's justCreated).
          Points straight at Help & Docs rather than dumping onboarding
          content in a modal, since that tab already covers how pricing
          works and how to set everything up -- no need to duplicate it. */}
      {showWelcome && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
          onClick={() => setWelcomeDismissed(true)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: '32px 30px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <HelpCircle size={26} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Welcome to Clean Estimator!</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              New here? Start with <strong>Help &amp; Docs</strong> — it walks you through how pricing works and how to set up your branding, service area, and embed code before you dive in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { setActiveTab('help'); setWelcomeDismissed(true); }}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13.5 }}
              >
                Go to Help &amp; Docs →
              </button>
              <button
                onClick={() => setWelcomeDismissed(true)}
                style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
