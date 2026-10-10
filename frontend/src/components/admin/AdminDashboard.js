import React, { useState, lazy, Suspense } from 'react';
import { Inbox, Users, Building2, HeartHandshake, Mail, LogOut } from 'lucide-react';
import { getAdminCompanies } from '../../utils/api';

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
// key and login screen. This is the single login + tab bar that replaces
// all four, plus the new Email Marketing tab -- so checking leads, then
// companies, then sending a campaign is tab clicks, not four separate login
// screens at four separate URLs.
const TABS = [
  { slug: 'website-requests', label: 'Website Requests', Icon: Inbox,         Component: AdminWebsiteRequests },
  { slug: 'leads',            label: 'Leads',             Icon: Users,         Component: AdminHomepageLeads },
  { slug: 'companies',        label: 'Companies',         Icon: Building2,     Component: AdminCompanies },
  { slug: 'partners',         label: 'Partners',          Icon: HeartHandshake, Component: AdminPartners },
  { slug: 'email-marketing',  label: 'Email Marketing',   Icon: Mail,          Component: AdminEmailMarketing },
];

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
      // request and treats a 401 as a wrong key. Same pattern every admin
      // page used individually before this shell existed.
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

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Clean Estimator Admin Dashboard</div>
        <input type="password" placeholder="Admin key" value={keyInput} onChange={e => { setKeyInput(e.target.value); setLoginError(null); }} style={{ ...inputStyle, marginBottom: 12, borderColor: loginError ? '#ef4444' : '#e2e8f0' }} autoFocus />
        {loginError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{loginError}</div>}
        <button type="submit" disabled={loggingIn} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loggingIn ? 0.7 : 1 }}>
          {loggingIn ? 'Checking...' : 'Log In'}
        </button>
      </form>
    </div>
  );

  const Active = TABS.find(t => t.slug === activeTab) || TABS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>Admin</div>
          {TABS.map(({ slug, label, Icon }) => (
            <button
              key={slug}
              onClick={() => selectTab(slug)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 14px', whiteSpace: 'nowrap',
                border: 'none', borderBottom: `2.5px solid ${activeTab === slug ? '#2563eb' : 'transparent'}`,
                background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                color: activeTab === slug ? '#2563eb' : '#64748b', transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            title="Log out"
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#64748b', flexShrink: 0 }}
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </div>

      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>}>
        <Active.Component adminKey={adminKey} />
      </Suspense>
    </div>
  );
}
