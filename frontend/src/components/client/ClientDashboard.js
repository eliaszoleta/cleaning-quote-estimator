import React, { useState, useEffect } from 'react';
import { LogOut, MapPin, Phone, Eye, PhoneCall, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Matches the logged-in partner to their `partners` row by email (the same
// email they signed up the account with), then shows their service areas
// and floating-banner KPIs (partner_banner_stats). Read-only -- editing
// listing details is still done by the site owner via /admin/partners.
export default function ClientDashboard({ user, onLogout }) {
  const [state, setState] = useState('loading'); // loading | not_found | ready | error
  const [partner, setPartner] = useState(null);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!supabase || !user?.email) { setState('error'); return; }

    (async () => {
      const { data: partnerRows, error: pErr } = await supabase
        .from('partners')
        .select('*')
        .ilike('email', user.email)
        .limit(1);

      if (pErr || !partnerRows || partnerRows.length === 0) {
        setState('not_found');
        return;
      }
      const p = partnerRows[0];
      setPartner(p);

      const [{ data: locData }, { data: statsData }] = await Promise.all([
        supabase.from('partner_locations').select('*').eq('partner_id', p.id).order('city'),
        supabase.from('partner_banner_stats').select('*').eq('partner_id', p.id).maybeSingle(),
      ]);

      setLocations(locData || []);
      setStats(statsData || { impressions: 0, calls: 0 });
      setState('ready');
    })();
  }, [user]);

  const shellStyle = { minHeight: '100vh', background: '#f8fafc' };
  const headerStyle = { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  const Header = () => (
    <div style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 700 }}>✦</div>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Partner Portal</span>
      </div>
      <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151' }}>
        <LogOut size={14} /> Log Out
      </button>
    </div>
  );

  if (state === 'loading') {
    return <div style={shellStyle}><Header /><div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading your dashboard…</div></div>;
  }

  if (state === 'error') {
    return <div style={shellStyle}><Header /><div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Something went wrong loading your account.</div></div>;
  }

  if (state === 'not_found') {
    return (
      <div style={shellStyle}>
        <Header />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 10 }}>No listing found for {user.email}</div>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
            We couldn't find a partner listing using this email address. Make sure you signed up with the exact email your listing was set up with, or email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb', fontWeight: 600 }}>info@cleanestimator.com</a> if you think this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  const impressions = stats?.impressions || 0;
  const calls = stats?.calls || 0;
  const ctr = impressions > 0 ? ((calls / impressions) * 100).toFixed(1) : '0.0';

  return (
    <div style={shellStyle}>
      <Header />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '36px 24px 64px' }}>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          {partner.logo_url && <img src={partner.logo_url} alt={partner.business_name} style={{ height: 52, width: 52, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: '#0f172a' }}>{partner.business_name}</div>
            {partner.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b', marginTop: 4 }}>
                <MapPin size={12} color="#94a3b8" /> {partner.address}
              </div>
            )}
            {partner.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b', marginTop: 2 }}>
                <Phone size={12} color="#94a3b8" /> {partner.phone}
              </div>
            )}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: partner.active ? '#16a34a' : '#94a3b8', background: partner.active ? '#f0fdf4' : '#f8fafc', border: `1px solid ${partner.active ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 6, padding: '4px 10px', flexShrink: 0 }}>
            {partner.active ? 'Live' : 'Inactive'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard icon={Eye} label="Banner Views" value={impressions.toLocaleString()} color="#2563eb" bg="#eff6ff" />
          <StatCard icon={PhoneCall} label="Call Button Taps" value={calls.toLocaleString()} color="#16a34a" bg="#f0fdf4" />
          <StatCard icon={TrendingUp} label="Click-Through Rate" value={`${ctr}%`} color="#7c3aed" bg="#f5f3ff" />
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10 }}>How these numbers work</div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong style={{ color: '#0f172a' }}>Banner Views</strong> — how many times your listing appeared on cleanestimator.com to a visitor located in one of your service areas.
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong style={{ color: '#0f172a' }}>Call Button Taps</strong> — how many times a visitor tapped the "Call" button on your listing. That opens their phone's dialer with your number already filled in: it's someone actively choosing to call your business over every other cleaner they could have picked. We can't see whether the call itself connected or how long it lasted — that happens on their phone, off our site — so this counts the tap, not a confirmed call.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Click-Through Rate</strong> — the share of banner views that turned into a call tap. It's the clearest read on how compelling your listing is once someone actually sees it, and a good number to watch as your service areas or listing details change.
            </p>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 28px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12 }}>Your Service Areas</div>
          {locations.length === 0 ? (
            <p style={{ fontSize: 13.5, color: '#94a3b8' }}>No cities on file yet.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {locations.map((loc, i) => (
                <span key={i} style={{ fontSize: 13, color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px' }}>
                  {loc.city}, {loc.state}
                </span>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', marginTop: 24 }}>
          Questions about your listing or these numbers? Email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb' }}>info@cleanestimator.com</a>.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>{label}</div>
    </div>
  );
}
