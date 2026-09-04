import React, { useState, useEffect } from 'react';
import { LogOut, MapPin, Phone, Eye, PhoneCall, TrendingUp, ChevronDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Small hover/entrance touches that inline styles can't express (:hover,
// @keyframes) -- kept to a few rules so the dashboard feels alive without
// turning into a full animation pass.
const DASHBOARD_STYLES = `
  .cd-hover-lift { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .cd-hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,0.08); }
  .cd-period-btn { transition: background 0.15s ease, color 0.15s ease; }
  .cd-period-btn:hover:not(.active) { color: #0f172a; }
  .cd-howto-toggle:hover .cd-howto-title { color: #2563eb; }
  .cd-fade-in { animation: cdFadeIn 0.2s ease; }
  @keyframes cdFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
`;

// This month and last month's boundaries, computed once per mount --
// re-deriving off `new Date()` on every render would shift a visitor's
// "this month" bucket mid-session right as midnight on the 1st ticks over.
function getMonthRanges() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    thisMonth: { start: thisMonthStart, end: nextMonthStart, label: thisMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
    lastMonth: { start: lastMonthStart, end: thisMonthStart, label: lastMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
  };
}

function countsInRange(events, start, end) {
  const inRange = events.filter(e => {
    const t = new Date(e.created_at);
    return t >= start && t < end;
  });
  return {
    impressions: inRange.filter(e => e.event_type === 'impression').length,
    calls: inRange.filter(e => e.event_type === 'call_click').length,
  };
}

// Matches the logged-in partner to their `partners` row by email (the same
// email they signed up the account with), then shows their service areas
// and floating-banner KPIs (partner_banner_stats), filterable by All
// Time/This Month/Last Month. Read-only -- editing listing details is
// still done by the site owner via /admin/partners.
export default function ClientDashboard({ user, onLogout }) {
  const [state, setState] = useState('loading'); // loading | not_found | ready | error
  const [partner, setPartner] = useState(null);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const [period, setPeriod] = useState('all'); // 'all' | 'this_month' | 'last_month'
  const [ranges] = useState(getMonthRanges);
  const [howOpen, setHowOpen] = useState(false);

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

      const [{ data: locData }, { data: statsData }, { data: eventsData }] = await Promise.all([
        supabase.from('partner_locations').select('*').eq('partner_id', p.id).order('city'),
        supabase.from('partner_banner_stats').select('*').eq('partner_id', p.id).maybeSingle(),
        supabase.from('partner_banner_events').select('event_type, created_at').eq('partner_id', p.id).gte('created_at', ranges.lastMonth.start.toISOString()),
      ]);

      setLocations(locData || []);
      setStats(statsData || { impressions: 0, calls: 0 });
      setMonthlyEvents(eventsData || []);
      setState('ready');
    })();
  }, [user, ranges]);

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

  const allTime = { impressions: stats?.impressions || 0, calls: stats?.calls || 0 };
  const thisMonth = countsInRange(monthlyEvents, ranges.thisMonth.start, ranges.thisMonth.end);
  const lastMonth = countsInRange(monthlyEvents, ranges.lastMonth.start, ranges.lastMonth.end);
  const current = period === 'this_month' ? thisMonth : period === 'last_month' ? lastMonth : allTime;

  const { impressions, calls } = current;
  const ctr = impressions > 0 ? ((calls / impressions) * 100).toFixed(1) : '0.0';

  const showTrend = period === 'this_month';

  return (
    <div style={shellStyle}>
      <style>{DASHBOARD_STYLES}</style>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <PeriodPicker period={period} setPeriod={setPeriod} ranges={ranges} />
        </div>

        <div key={period} className="cd-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard
            icon={Eye} label="Banner Views" value={impressions.toLocaleString()} color="#2563eb" bg="#eff6ff"
            trend={showTrend && <TrendBadge current={thisMonth.impressions} previous={lastMonth.impressions} />}
          />
          <StatCard
            icon={PhoneCall} label="Call Button Taps" value={calls.toLocaleString()} color="#16a34a" bg="#f0fdf4"
            trend={showTrend && <TrendBadge current={thisMonth.calls} previous={lastMonth.calls} />}
          />
          <StatCard icon={TrendingUp} label="Click-Through Rate" value={`${ctr}%`} color="#7c3aed" bg="#f5f3ff" />
        </div>

        <div className="cd-hover-lift" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 24px', marginBottom: 24 }}>
          <button
            onClick={() => setHowOpen(o => !o)}
            className="cd-howto-toggle"
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}
          >
            <span className="cd-howto-title" style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', transition: 'color 0.15s ease' }}>How these numbers work</span>
            <ChevronDown size={16} color="#94a3b8" style={{ transform: howOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
          </button>
          {howOpen && (
            <div className="cd-fade-in" style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginTop: 14 }}>
              <p style={{ margin: '0 0 10px' }}>
                <strong style={{ color: '#0f172a' }}>Banner Views</strong> — how many times your listing appeared on cleanestimator.com to a visitor located in one of your service areas.
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong style={{ color: '#0f172a' }}>Call Button Taps</strong> — how many times a visitor tapped the "Call" button on your listing. That opens their phone's dialer with your number already filled in: it's someone actively choosing to call your business over every other cleaner they could have picked. We can't see whether the call itself connected or how long it lasted — that happens on their phone, off our site — so this counts the tap, not a confirmed call. Your number is also printed right on the listing, so some visitors call by dialing it themselves instead of tapping — meaning your actual call volume from cleanestimator.com is likely a bit higher than this number.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#0f172a' }}>Click-Through Rate</strong> — the share of banner views that turned into a call tap. It's the clearest read on how compelling your listing is once someone actually sees it, and a good number to watch as your service areas or listing details change.
              </p>
            </div>
          )}
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

const PERIOD_OPTIONS = [
  { key: 'all', label: 'All Time' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
];

function PeriodPicker({ period, setPeriod, ranges }) {
  return (
    <div style={{ display: 'inline-flex', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9, padding: 3, gap: 2 }}>
      {PERIOD_OPTIONS.map(opt => {
        const active = period === opt.key;
        const sublabel = opt.key === 'this_month' ? ranges.thisMonth.label : opt.key === 'last_month' ? ranges.lastMonth.label : null;
        return (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            title={sublabel || undefined}
            className={`cd-period-btn${active ? ' active' : ''}`}
            style={{
              border: 'none',
              borderRadius: 7,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? 'white' : 'transparent',
              color: active ? '#0f172a' : '#64748b',
              boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, trend }) {
  return (
    <div className="cd-hover-lift" style={{ background: 'white', border: '1px solid #e2e8f0', borderTop: `2.5px solid ${color}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>{label}</div>
      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
    </div>
  );
}

// Only meaningful next to a specific This Month/Last Month value -- an
// "all time" number has nothing to compare against.
function TrendBadge({ current, previous }) {
  const style = { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600 };

  if (previous === 0) {
    if (current === 0) return null;
    return <span style={{ ...style, color: '#16a34a' }}><ArrowUpRight size={12} /> New this month</span>;
  }

  const delta = ((current - previous) / previous) * 100;
  if (Math.round(delta) === 0) {
    return <span style={{ ...style, color: '#94a3b8' }}><Minus size={12} /> Same as last month</span>;
  }

  const up = delta > 0;
  return (
    <span style={{ ...style, color: up ? '#16a34a' : '#dc2626' }}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(delta).toFixed(0)}% vs last month
    </span>
  );
}
