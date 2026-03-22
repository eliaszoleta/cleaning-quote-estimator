import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, DollarSign, Globe, Inbox, Paintbrush, Code2, CreditCard } from 'lucide-react';
import { getCompanyLeads } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../../utils/formatters';

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
    { label: 'Total Leads',    value: leads.length,                                              Icon: Users,       color: '#2563eb', bg: '#eff6ff' },
    { label: 'This Month',     value: thisMonth.length,                                          Icon: CalendarDays, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Avg Estimate',   value: avgEstimate > 0 ? formatPrice(avgEstimate) : '—',         Icon: DollarSign,  color: '#d97706', bg: '#fffbeb' },
    { label: 'Widget Status',  value: subStatus?.active ? 'Active' : config ? 'Inactive' : '—', Icon: Globe,       color: subStatus?.active ? '#16a34a' : '#dc2626', bg: subStatus?.active ? '#f0fdf4' : '#fef2f2' },
  ];

  const quickActions = [
    { label: 'Customize Branding', href: '?tab=branding',      Icon: Paintbrush  },
    { label: 'Get Embed Code',     href: '?tab=embed',         Icon: Code2       },
    { label: 'View All Leads',     href: '?tab=leads',         Icon: Users       },
    { label: 'Manage Billing',     href: '?tab=subscription',  Icon: CreditCard  },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>
          Dashboard Overview
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Welcome back{config?.companyName ? `, ${config.companyName}` : ''}.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-label">{label}</div>
              <div className="stat-icon" style={{ background: bg }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11.5, color: '#94a3b8' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickActions.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={`/company${href}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
                textDecoration: 'none', color: '#374151', fontWeight: 600, fontSize: 13,
                background: 'white', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent leads */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Leads</h3>
          <a href="/company?tab=leads" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
        </div>

        {loadingLeads ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading leads…</div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Inbox size={24} color="#94a3b8" />
            </div>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 15 }}>No leads yet</div>
            <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
              Embed your calculator on your website to start capturing leads automatically.
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
