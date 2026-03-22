import React, { useState, useEffect } from 'react';
import { getCompanyLeads, patchLead } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../../utils/formatters';

const SERVICE_COLORS = {
  home_residential: '#2563eb', apartment: '#7c3aed', commercial: '#0891b2',
  carpet: '#16a34a', air_duct: '#d97706', dryer_vent: '#dc2626',
  tile_grout: '#64748b', mold_remediation: '#991b1b', water_damage: '#0284c7',
};

export default function LeadsTab({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getCompanyLeads(token);
      setLeads(res.data || []);
    } catch (err) {
      console.error('Error loading leads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter(l => {
    if (l.deleted_at) return false;
    if (filter !== 'all' && l.service_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.zip || '').includes(q);
    }
    return true;
  });

  const serviceTypes = [...new Set(leads.filter(l => !l.deleted_at).map(l => l.service_type))];

  const openLead = (lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await patchLead(token, selectedLead.id, { notes });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes } : l));
      setSelectedLead(prev => ({ ...prev, notes }));
    } catch {} finally {
      setSavingNote(false);
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm('Archive this lead?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await patchLead(token, leadId, { deleted_at: new Date().toISOString() });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deleted_at: new Date().toISOString() } : l));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Service', 'State', 'ZIP', 'Estimate Low', 'Estimate High', 'Timeline', 'Date', 'Notes'];
    const rows = filtered.map(l => [
      l.name || '', l.email || '', l.phone || '', serviceTypeLabel(l.service_type),
      l.state || '', l.zip || '',
      l.estimated_price_low || '', l.estimated_price_high || '',
      l.timeline || '', new Date(l.created_at).toLocaleDateString(), l.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cleancalc-leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)' }}>
      {/* Lead list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Leads <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>({filtered.length})</span></h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={loadLeads} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>↻ Refresh</button>
              <button onClick={exportCSV} disabled={filtered.length === 0} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>⬇ Export CSV</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, ZIP…"
              style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: 'white', cursor: 'pointer', outline: 'none' }}>
              <option value="all">All services</option>
              {serviceTypes.map(t => <option key={t} value={t}>{serviceTypeLabel(t)}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{search || filter !== 'all' ? 'No matching leads' : 'No leads yet'}</div>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>{search || filter !== 'all' ? 'Try changing your search or filter.' : 'Embed your calculator to start capturing leads.'}</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {filtered.map((lead, i) => {
              const color = SERVICE_COLORS[lead.service_type] || '#64748b';
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div key={lead.id} onClick={() => openLead(lead)} style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                    {lead.name ? lead.name[0].toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{lead.name || '(No name)'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email || 'No email'} {lead.phone && `· ${lead.phone}`}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ background: `${color}20`, color, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'inline-block' }}>{serviceTypeLabel(lead.service_type)}</div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                      {lead.estimated_price_low ? `${formatPrice(lead.estimated_price_low)} – ${formatPrice(lead.estimated_price_high)}` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDateTime(lead.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead detail panel */}
      {selectedLead && (
        <div style={{ width: 360, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 2 }}>{selectedLead.name || '(No name)'}</h3>
              <div style={{ fontSize: 13, color: '#64748b' }}>{formatDateTime(selectedLead.created_at)}</div>
            </div>
            <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Email', selectedLead.email, `mailto:${selectedLead.email}`],
              ['Phone', selectedLead.phone, `tel:${selectedLead.phone}`],
              ['Service', serviceTypeLabel(selectedLead.service_type), null],
              ['Location', `${selectedLead.zip || ''}${selectedLead.zip && selectedLead.state ? ' · ' : ''}${selectedLead.state || ''}`, null],
              ['Estimate', selectedLead.estimated_price_low ? `${formatPrice(selectedLead.estimated_price_low)} – ${formatPrice(selectedLead.estimated_price_high)}` : '—', null],
              ['Timeline', selectedLead.timeline || '—', null],
              ['Preferred contact', selectedLead.preferred_contact || '—', null],
            ].filter(([, val]) => val && val !== '—' && val !== '').map(([label, val, href]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', minWidth: 80 }}>{label}</span>
                {href ? <a href={href} style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>{val}</a> : <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{val}</span>}
              </div>
            ))}
          </div>

          {/* Service details */}
          {selectedLead.service_details && Object.keys(selectedLead.service_details).length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Service details</div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                {Object.entries(selectedLead.service_details).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Internal notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead…"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a' }} />
            <button onClick={saveNote} disabled={savingNote} style={{ marginTop: 6, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            {selectedLead.email && <a href={`mailto:${selectedLead.email}`} style={{ flex: 1, padding: '10px 0', background: '#2563eb', color: 'white', textAlign: 'center', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>📧 Email</a>}
            {selectedLead.phone && <a href={`tel:${selectedLead.phone}`} style={{ flex: 1, padding: '10px 0', background: '#16a34a', color: 'white', textAlign: 'center', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>📞 Call</a>}
            <button onClick={() => deleteLead(selectedLead.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Archive</button>
          </div>
        </div>
      )}
    </div>
  );
}
