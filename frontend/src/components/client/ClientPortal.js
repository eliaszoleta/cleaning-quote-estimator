import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ClientAuthPage from './ClientAuthPage';
import ClientDashboard from './ClientDashboard';

// Self-contained auth-gated portal for /client -- mirrors how App.js wires
// up the /company portal (AuthPage + CompanyDashboard), just bundled into
// one component instead of hoisting more state into App.js.
export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 3000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => { clearTimeout(timeout); setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: 'white', fontSize: 16 }}>Loading...</div>
    </div>
  );

  if (!supabase) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 40, textAlign: 'center' }}>
      <div>
        <h2>Supabase not configured</h2>
        <p style={{ color: '#64748b', marginTop: 8 }}>Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable the partner portal.</p>
      </div>
    </div>
  );

  if (!user) return <ClientAuthPage onAuth={setUser} />;

  return <ClientDashboard user={user} onLogout={handleLogout} />;
}
