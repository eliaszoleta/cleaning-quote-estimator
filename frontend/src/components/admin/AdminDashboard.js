import React, { useState, lazy, Suspense } from 'react';
import { Inbox, Users, Building2, HeartHandshake, Mail, LogOut, Sparkles } from 'lucide-react';
import { getAdminCompanies } from '../../utils/api';
import { theme } from './adminTheme';

const AdminWebsiteRequests = lazy(() => import('./AdminWebsiteRequests'));
const AdminHomepageLeads = lazy(() => import('./AdminHomepageLeads'));
const AdminCompanies = lazy(() => import('./AdminCompanies'));
const AdminPartners = lazy(() => import('./AdminPartners'));
const AdminEmailMarketing = lazy(() => import('./AdminEmailMarketing'));

const STORAGE_KEY = 'admin_dashboard_key';

// One admin key unlocks every tab -- all five already share the exact same
// backend gate (requireAdminKey / ADMIN_API_KEY), so there was never a real
// reason for AdminCompanies.js, AdminPartners.js, AdminHomepageLeads.js, and
// AdminWebsiteRequests.js to each keep their own separate sessionStorage
// key and login screen. This is the single login + sidebar that replaces
// all four, plus the Email Marketing tab -- so checking leads, then
// companies, then sending a campaign is sidebar clicks, not four separate
// login screens at four separate URLs.
const TABS = [
  { slug: 'website-requests', label: 'Website Requests', Icon: Inbox,          Component: AdminWebsiteRequests },
  { slug: 'leads',            label: 'Leads',             Icon: Users,         Component: AdminHomepageLeads },
  { slug: 'companies',        label: 'Companies',         Icon: Building2,     Component: AdminCompanies },
  { slug: 'partners',         label: 'Partners',          Icon: HeartHandshake, Component: AdminPartners },
  { slug: 'email-marketing',  label: 'Email Marketing',   Icon: Mail,          Component: AdminEmailMarketing },
];

const SIDEBAR_WIDTH = 236;

export default function AdminDashboard({ initialTab }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(STORAGE_KEY));
  const [keyInput, setKeyInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState(() => (TABS.some(t => t.slug === initialTab) ? initialTab : TABS[0].slug));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      // The login form doubles as the credential check -- there's no
      // separate "verify key" endpoint, this just tries a real admin
      // request and treats a 401 as a wrong key.
      await getAdminCompanies(keyInput);
      sessionStorage.setItem(STORAGE_KEY, keyInput);
      setAdminKey(keyInput);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.message || 'Incorrect admin key');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey('');
    setAuthed(false);
  };

  const selectTab = (slug) => {
    setActiveTab(slug);
    window.history.replaceState(null, '', `/admin/${slug}`);
  };

  if (!authed) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme.sidebarBg, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
        top: -160, right: -120, filter: 'blur(10px)',
      }} />
      <div style={{
        position: 'absolute', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)',
        bottom: -140, left: -100, filter: 'blur(10px)',
      }} />
      <form onSubmit={handleLogin} style={{
        position: 'relative', background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, width: 360,
        boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, background: theme.accentGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          boxShadow: theme.shadowGlow,
        }}>
          <Sparkles size={21} color="white" strokeWidth={2.25} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'white', marginBottom: 6, letterSpacing: '-0.3px' }}>Admin Dashboard</div>
        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 26 }}>Clean Estimator</div>
        <input
          type="password" placeholder="Admin key" value={keyInput}
          onChange={e => { setKeyInput(e.target.value); setLoginError(null); }}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 11, marginBottom: 14, boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${loginError ? '#f87171' : 'rgba(255,255,255,0.12)'}`,
            color: 'white', fontSize: 14, outline: 'none',
          }}
          autoFocus
        />
        {loginError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{loginError}</div>}
        <button type="submit" disabled={loggingIn} style={{
          width: '100%', background: theme.accentGradient, color: 'white', border: 'none', borderRadius: 11,
          padding: '12px 0', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', opacity: loggingIn ? 0.7 : 1,
          boxShadow: theme.shadowGlow,
        }}>
          {loggingIn ? 'Checking…' : 'Log In'}
        </button>
      </form>
    </div>
  );

  const Active = TABS.find(t => t.slug === activeTab) || TABS[0];

  return (
    <div style={{ minHeight: '100vh', background: theme.contentBg, display: 'flex' }}>
      <div style={{
        width: SIDEBAR_WIDTH, flexShrink: 0, background: theme.sidebarBg,
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: theme.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: theme.shadowGlow,
          }}>
            <Sparkles size={16} color="white" strokeWidth={2.25} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: 'white', letterSpacing: '-0.2px' }}>Admin</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Clean Estimator</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(({ slug, label, Icon }) => {
            const active = activeTab === slug;
            return (
              <button
                key={slug}
                onClick={() => selectTab(slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, textAlign: 'left',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.55)',
                  transition: 'background 0.15s, color 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {active && (
                  <span style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: theme.accentGradient }} />
                )}
                <Icon size={16} strokeWidth={2} style={{ flexShrink: 0, color: active ? '#a5b4fc' : 'currentColor' }} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: theme.textMuted, fontSize: 14 }}>Loading…</div>}>
          <Active.Component adminKey={adminKey} />
        </Suspense>
      </div>
    </div>
  );
}
