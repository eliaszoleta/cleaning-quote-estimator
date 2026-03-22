import React, { useState, useEffect } from 'react';
import { getCompanyLeads } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../../utils/formatters';

export default function OverviewTab({ config, subStatus, user }) {
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

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
    { label: 'Total Leads', value: leads.length, icon: '👥', color: '#2563eb' },
    { label: 'This Month', value: thisMonth.length, icon: '📅', color: '#16a34a' },
    { label: 'Avg Estimate', value: avgEstimate > 0 ? formatPrice(avgEstimate) : '—', icon: '💰', color: '#d97706' },
    { label: 'Widget Status', value: config ? 'Active' : 'Not configured', icon: '🔗', color: subStatus?.active ? '#16a34a' : '#dc2626' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Dashboard Overview</h2>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Welcome back{config?.companyName ? `, ${config.companyName}` : ''}.</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '🎨 Customize Branding', href: '?tab=branding' },
            { label: '🔗 Get Embed Code', href: '?tab=embed' },
            { label: '📋 View All Leads', href: '?tab=leads' },
            { label: '💳 Manage Subscription', href: '?tab=subscription' },
          ].map(a => (
            <a key={a.label} href={`/company${a.href}`} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', color: '#374151', fontWeight: 600, fontSize: 14, background: 'white', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = '#2563eb'; e.target.style.color = '#2563eb'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#374151'; }}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent leads */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Recent Leads</h3>
          <a href="/company?tab=leads" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>View all →</a>
        </div>
        {loadingLeads ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading leads…</div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No leads yet</div>
            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 320, margin: '0 auto' }}>Embed your calculator on your website to start capturing leads automatically.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Service', 'Estimate', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.name || '(No name)'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{l.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{serviceTypeLabel(l.service_type)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                    {l.estimated_price_low && l.estimated_price_high ? `${formatPrice(l.estimated_price_low)} – ${formatPrice(l.estimated_price_high)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
