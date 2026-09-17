import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, DollarSign, Globe, Inbox, Paintbrush, Code2, CreditCard } from 'lucide-react';
import { getCompanyLeads } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../../utils/formatters';
import { COLORS, RADIUS, SHADOWS } from '../../../styles/theme';

export default function OverviewTab({ config, subStatus, user }) {
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getCompanyLeads(token);
      setLeads(res.data || []);
    } catch {} finally {
      setLoadingLeads(false);
    }
  };

  const recentLeads = leads.slice(0, 5);
  const thisMonth = leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 86400000));
  const avgEstimate = leads.length > 0
    ? leads.reduce((s, l) => s + ((l.estimated_price_low || 0) + (l.estimated_price_high || 0)) / 2, 0) / leads.length
    : 0;

  const stats = [
    { label: 'Total Leads',    value: leads.length,                                              Icon: Users,       color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'This Month',     value: thisMonth.length,                                          Icon: CalendarDays, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Avg Estimate',   value: avgEstimate > 0 ? formatPrice(avgEstimate) : '—',         Icon: DollarSign,  color: '#d97706', bg: '#fffbeb' },
    { label: 'Widget Status',  value: subStatus?.active ? 'Active' : config ? 'Inactive' : '—', Icon: Globe,       color: subStatus?.active ? '#16a34a' : '#dc2626', bg: subStatus?.active ? '#f0fdf4' : '#fef2f2' },
  ];

  const quickActions = [
    { label: 'Customize Branding', href: '?tab=branding',      Icon: Paintbrush  },
    { label: 'Get Embed Code',     href: '?tab=embed',         Icon: Code2       },
    { label: 'View All Leads',     href: '?tab=leads',         Icon: Users       },
    { label: 'Manage Billing',     href: '?tab=settings&section=subscription',  Icon: CreditCard  },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, marginBottom: 2, letterSpacing: '-0.3px' }}>
          Dashboard Overview
        </h2>
        <p style={{ color: COLORS.body, fontSize: 14 }}>
          Welcome back{config?.companyName ? `, ${config.companyName}` : ''}.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.sm, padding: '18px 20px', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = SHADOWS.md; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOWS.sm; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 7, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={18} strokeWidth={2.1} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, color: COLORS.ink, marginBottom: 8 }}>{value}</div>
            <div style={{ fontSize: 12, color: COLORS.body, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, padding: '20px 22px', marginBottom: 20, boxShadow: SHADOWS.sm }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: COLORS.ink }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {quickActions.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={`/company${href}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', border: `1.5px solid ${COLORS.border}`, borderRadius: 7,
                textDecoration: 'none', color: COLORS.ink, fontWeight: 600, fontSize: 13.5,
                background: COLORS.surface, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.background = COLORS.primaryMuted; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; }}
            >
              <span style={{ width: 30, height: 30, borderRadius: 7, background: COLORS.primaryMuted, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} strokeWidth={2.1} />
              </span>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent leads */}
      <div style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: SHADOWS.sm }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${COLORS.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Recent Leads</h3>
          <a href="/company?tab=leads" style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}>View all →</a>
        </div>

        {loadingLeads ? (
          <div style={{ padding: 32, textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>Loading leads…</div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 7, background: COLORS.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Inbox size={24} color={COLORS.muted} />
            </div>
            <div style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 6, fontSize: 15 }}>No leads yet</div>
            <p style={{ color: COLORS.muted, fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
              Embed your estimator on your website to start capturing leads automatically.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Service', 'Estimate', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{l.name || '(No name)'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{serviceTypeLabel(l.service_type)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                    {l.estimated_price_low && l.estimated_price_high
                      ? `${formatPrice(l.estimated_price_low)} – ${formatPrice(l.estimated_price_high)}`
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8' }}>{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
