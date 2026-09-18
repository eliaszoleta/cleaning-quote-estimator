import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';
import ClientAuthPage from './ClientAuthPage';
import ClientDashboard from './ClientDashboard';
import ResetPasswordPage from '../dashboard/ResetPasswordPage';

// Self-contained auth-gated portal for /client -- mirrors how App.js wires
// up the /company portal (AuthPage + CompanyDashboard), just bundled into
// one component instead of hoisting more state into App.js.
export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Clicking a password-reset link logs the partner in with a real
  // (temporary) session -- same PASSWORD_RECOVERY event App.js watches for
  // on the /company side, needed here too so a reset link drops them into a
  // "set new password" screen instead of straight into the dashboard on
  // whatever temporary session the link itself established.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 3000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => { clearTimeout(timeout); setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  // No page-specific <title> existed here before -- every state (loading,
  // login, dashboard) fell back to index.html's generic site-wide title,
  // which left Google guessing at a label for this page in search results.
  // It picked up "Back to Clean Estimator" (a real link on the default
  // login view) and showed it as a sitelink titled "Back". noindex since a
  // login gate has no content value to a searcher -- same reasoning as
  // PartnerDemoPage.js's noindex, just a different kind of non-content page.
  const helmet = (
    <Helmet>
      <title>Partner Login | Clean Estimator</title>
      <meta name="description" content="Log in to your Clean Estimator partner portal to see your listing's views, calls, and leads." />
      <meta name="robots" content="noindex, follow" />
    </Helmet>
  );

  if (loading) return (
    <>
      {helmet}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'white', fontSize: 16 }}>Loading...</div>
      </div>
    </>
  );

  if (!supabase) return (
    <>
      {helmet}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 40, textAlign: 'center' }}>
        <div>
          <h2>Supabase not configured</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable the partner portal.</p>
        </div>
      </div>
    </>
  );

  if (passwordRecovery) return <>{helmet}<ResetPasswordPage onDone={() => setPasswordRecovery(false)} /></>;

  if (!user) return <>{helmet}<ClientAuthPage onAuth={setUser} /></>;

  return <>{helmet}<ClientDashboard user={user} onLogout={handleLogout} /></>;
}
