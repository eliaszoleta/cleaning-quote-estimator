import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Download, Inbox, Mail, Phone, X, Trash2, RotateCcw, Target, Users } from 'lucide-react';
import { getAdminHomepageLeads, patchAdminHomepageLead, deleteAdminHomepageLeadForever } from '../../utils/api';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../utils/formatters';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { theme, cardStyle, inputStyle, secondaryBtnStyle, dangerBtnStyle, pill, avatarGradient, PageHeader } from './adminTheme';

const SERVICE_COLORS = {
  home_residential: '#2563eb', apartment: '#7c3aed', commercial: '#0891b2',
  carpet: '#16a34a', air_duct: '#d97706', dryer_vent: '#dc2626',
  tile_grout: '#64748b', mold_remediation: '#991b1b', water_damage: '#0284c7',
};

// 'this_month' / 'last_month' compare against the viewer's local calendar
// month, not a rolling 30-day window -- matches how "this month" reads to
// a person glancing at a calendar. 'this_week' is the one rolling window
// here (last 7 days), since "calendar week" has no single obvious start
// day and a rolling window is what "leads this week" usually means day to
// day.
function matchesDateFilter(createdAt, dateFilter) {
  if (dateFilter === 'all') return true;
  const d = new Date(createdAt);
  const now = new Date();
  if (dateFilter === 'this_week') {
    const ms = now.getTime() - d.getTime();
    return ms >= 0 && ms <= 7 * 24 * 60 * 60 * 1000;
  }
  const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return dateFilter === 'this_month' ? monthsAgo === 0 : monthsAgo === 1;
}

// Site-owner view of every lead the main public calculator has ever
// captured -- same `leads` table every embedded subscriber's leads live in
// (see backend/src/routes/leads.js's saveLead), just the rows where
// company_id is null because the homepage never sends a companyId to
// /api/calculate. Mirrors LeadsTab.js's list/detail/trash UI (the company
// dashboard's equivalent for a single subscriber's own leads), driven by
// the x-admin-key admin API instead of a Supabase Auth session token.
// adminKey comes from the shared login in AdminDashboard.js (the
// consolidated /admin shell) -- this component no longer manages its own
// auth state.
export default function AdminHomepageLeads({ adminKey }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const notesTimer = useRef(null);
  const [view, setView] = useState('active');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { confirm, dialog: confirmDialog } = useConfirm();

  const loadLeads = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await getAdminHomepageLeads(key, true);
      const loaded = res.data || [];
      setLeads(loaded);
      const activeLoaded = loaded.filter(l => !l.deleted_at);
      setSelectedLead(prev => prev || (activeLoaded.length > 0 ? activeLoaded[0] : null));
    } catch (err) {
      console.error('Error loading homepage leads:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) loadLeads(adminKey); }, [adminKey, loadLeads]);
  useEffect(() => () => { if (notesTimer.current) clearTimeout(notesTimer.current); }, []);
  useEffect(() => {
    if (selectedLead) setNotes(selectedLead.notes || '');
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Date filter narrows the whole pool first -- the Active/Trash tab counts
  // and the list itself should agree on what "this month" includes, not
  // just the visible list while the tab counts stay stuck at the total.
  const dateFilteredLeads = leads.filter(l => matchesDateFilter(l.created_at, dateFilter));
  const baseLeads = dateFilteredLeads.filter(l => (view === 'trash' ? !!l.deleted_at : !l.deleted_at));
  const activeCount = dateFilteredLeads.filter(l => !l.deleted_at).length;
  const trashCount = dateFilteredLeads.filter(l => l.deleted_at).length;

  const filtered = baseLeads.filter(l => {
    if (filter !== 'all' && l.service_type !== filter) return false;
    if (stateFilter !== 'all' && l.state !== stateFilter) return false;
    if (cityFilter !== 'all' && l.city !== cityFilter) return false;
    if (userTypeFilter !== 'all' && l.user_type !== userTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.zip || '').includes(q) || (l.city || '').toLowerCase().includes(q);
    }
    return true;
  });

  const serviceTypes = [...new Set(baseLeads.map(l => l.service_type))];
  const states = [...new Set(baseLeads.map(l => l.state).filter(Boolean))].sort();
  // Scoped to the selected state (like LocationStep.js's own citiesForState)
  // -- three leads from three different Texas cities only add three city
  // options while "TX" is selected, not every city across every state mixed
  // into one list. Each option's count is how many of those leads came from
  // that city, so it updates as new leads come in same as everything else
  // here -- never a stored/cached number.
  const cityCounts = baseLeads
    .filter(l => stateFilter === 'all' || l.state === stateFilter)
    .reduce((acc, l) => {
      if (!l.city) return acc;
      acc[l.city] = (acc[l.city] || 0) + 1;
      return acc;
    }, {});
  const cities = Object.keys(cityCounts).sort((a, b) => cityCounts[b] - cityCounts[a]);

  const selectStateFilter = (v) => { setStateFilter(v); setCityFilter('all'); };

  const switchView = (v) => { setView(v); setFilter('all'); setStateFilter('all'); setCityFilter('all'); setDateFilter('all'); setUserTypeFilter('all'); setSelectedLead(null); setSelectedIds(new Set()); };

  const userTypeLabel = (t) => t === 'homeowner' ? 'Homeowner' : t === 'business' ? 'Cleaning business' : null;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selectedIds.has(l.id));
  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map(l => l.id)));
  };

  const openLead = (lead) => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setSelectedLead(lead);
    setNoteStatus('');
  };

  const saveNote = async (val, leadId) => {
    setNoteStatus('saving');
    try {
      await patchAdminHomepageLead(adminKey, leadId, { notes: val });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: val } : l));
      setSelectedLead(prev => (prev?.id === leadId ? { ...prev, notes: val } : prev));
      setNoteStatus('saved');
    } catch {
      setNoteStatus('');
    }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    setNoteStatus('');
    if (notesTimer.current) clearTimeout(notesTimer.current);
    const leadId = selectedLead.id;
    notesTimer.current = setTimeout(() => saveNote(val, leadId), 900);
  };

  const flushNoteSave = () => {
    if (!notesTimer.current || !selectedLead) return;
    clearTimeout(notesTimer.current);
    notesTimer.current = null;
    saveNote(notes, selectedLead.id);
  };

  const archiveLead = async (leadId) => {
    const ok = await confirm({
      title: 'Move this lead to Trash?',
      message: 'You can restore it later from the Trash tab.',
      confirmLabel: 'Move to Trash',
      danger: true,
    });
    if (!ok) return;
    try {
      const deletedAt = new Date().toISOString();
      await patchAdminHomepageLead(adminKey, leadId, { deleted_at: deletedAt });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deleted_at: deletedAt } : l));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  const restoreLead = async (leadId) => {
    try {
      await patchAdminHomepageLead(adminKey, leadId, { deleted_at: null });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deleted_at: null } : l));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  const hardDeleteLead = async (leadId) => {
    const ok = await confirm({
      title: 'Permanently delete this lead?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAdminHomepageLeadForever(adminKey, leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  const bulkMoveToTrash = async () => {
    const n = selectedIds.size;
    const ok = await confirm({
      title: `Move ${n} lead${n === 1 ? '' : 's'} to Trash?`,
      message: `You can restore ${n === 1 ? 'it' : 'them'} later from the Trash tab.`,
      confirmLabel: 'Move to Trash',
      danger: true,
    });
    if (!ok) return;
    const ids = [...selectedIds];
    const deletedAt = new Date().toISOString();
    await Promise.all(ids.map(id => patchAdminHomepageLead(adminKey, id, { deleted_at: deletedAt }).catch(() => {})));
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, deleted_at: deletedAt } : l));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedIds(new Set());
  };

  const bulkRestore = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => patchAdminHomepageLead(adminKey, id, { deleted_at: null }).catch(() => {})));
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, deleted_at: null } : l));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedIds(new Set());
  };

  const bulkDeleteForever = async () => {
    const n = selectedIds.size;
    const ok = await confirm({
      title: `Permanently delete ${n} lead${n === 1 ? '' : 's'}?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => deleteAdminHomepageLeadForever(adminKey, id).catch(() => {})));
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedIds(new Set());
  };

  // Every lead field here is attacker-reachable -- it came straight from a
  // public form submission. A cell starting with =, +, -, or @ opens as a
  // formula in Excel/Sheets instead of text, so a lead submitted with a name
  // like "=cmd|'/c calc'!A1" could execute when the export is later opened.
  // Prefixing with a leading apostrophe forces spreadsheet apps to treat it
  // as literal text.
  const sanitizeCsvCell = (value) => {
    const str = String(value);
    return /^[=+\-@]/.test(str) ? `'${str}` : str;
  };

  const toCSV = (rowsSource) => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Service', 'City', 'State', 'ZIP', 'Estimate Low', 'Estimate High', 'Timeline', 'Date', 'Notes'];
    const rows = rowsSource.map(l => [
      l.name || '', l.email || '', l.phone || '', userTypeLabel(l.user_type) || '', serviceTypeLabel(l.service_type),
      l.city || '', l.state || '', l.zip || '',
      l.estimated_price_low || '', l.estimated_price_high || '',
      l.timeline || '', new Date(l.created_at).toLocaleDateString(), l.notes || '',
    ]);
    return [headers, ...rows].map(r => r.map(c => `"${sanitizeCsvCell(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportCSV = () => {
    const rowsSource = selectedIds.size > 0 ? filtered.filter(l => selectedIds.has(l.id)) : filtered;
    const csv = toCSV(rowsSource);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cleanestimator-homepage-leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Meta's Customer List upload (Ads Manager > Audiences > Create Custom
  // Audience > Customer List) auto-maps columns by these exact lowercase
  // header names -- email/phone/fn/ln/ct/st/zip/country -- so a file built
  // this way uploads with zero manual field-mapping on their end. Meta
  // hashes everything itself on upload; the normalization here (lowercase,
  // digits-only phone, split name) just improves match rate, same as their
  // own documented guidance for pre-hash formatting. Only identity/location
  // fields go out -- price, timeline, and notes have no matching value and
  // no reason to leave this system.
  const toFacebookCSV = (rowsSource) => {
    const headers = ['email', 'phone', 'fn', 'ln', 'ct', 'st', 'zip', 'country'];
    const rows = rowsSource.map(l => {
      const [fn, ...lnParts] = (l.name || '').trim().split(/\s+/).filter(Boolean);
      return [
        (l.email || '').toLowerCase().trim(),
        (l.phone || '').replace(/\D/g, ''),
        (fn || '').toLowerCase(),
        lnParts.join(' ').toLowerCase(),
        (l.city || '').toLowerCase().replace(/\s+/g, ''),
        (l.state || '').toLowerCase(),
        (l.zip || '').trim(),
        'us',
      ];
    });
    return [headers, ...rows].map(r => r.map(c => `"${sanitizeCsvCell(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportFacebookCSV = () => {
    const rowsSource = selectedIds.size > 0 ? filtered.filter(l => selectedIds.has(l.id)) : filtered;
    const csv = toFacebookCSV(rowsSource);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cleanestimator-leads-facebook-custom-audience.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const selectStyle = { ...inputStyle, padding: '9px 12px', width: 'auto', cursor: 'pointer', color: theme.textSecondary };

  return (
    <div style={{ minHeight: '100vh', background: theme.contentBg, padding: '30px 32px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHeader
          icon={Users}
          title="Homepage Leads"
          subtitle="Everyone who opted in for their estimate by email through the main estimator on cleanestimator.com — not tied to any subscriber account."
        />

        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 170px)' }}>
          {/* Lead list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.2px' }}>
                  Leads
                </h2>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => loadLeads(adminKey)} style={secondaryBtnStyle}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <button onClick={exportCSV} disabled={filtered.length === 0} style={{ ...secondaryBtnStyle, opacity: filtered.length === 0 ? 0.5 : 1 }}>
                    <Download size={13} /> {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export CSV'}
                  </button>
                  <button onClick={exportFacebookCSV} disabled={filtered.length === 0} title="Formatted for Meta Ads Manager > Audiences > Custom Audience > Customer List" style={{ ...secondaryBtnStyle, opacity: filtered.length === 0 ? 0.5 : 1 }}>
                    <Target size={13} /> Export for Facebook
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', background: 'rgba(15,23,42,0.05)', borderRadius: 10, padding: 3, marginBottom: 12, width: 'fit-content' }}>
                {[['active', `Active (${activeCount})`], ['trash', `Trash (${trashCount})`]].map(([v, label]) => (
                  <button
                    key={v} onClick={() => switchView(v)}
                    style={{
                      padding: '7px 15px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12.5,
                      background: view === v ? theme.cardBg : 'transparent',
                      color: view === v ? theme.textPrimary : theme.textMuted,
                      boxShadow: view === v ? theme.shadowSm : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, city, ZIP…"
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                />
                <select value={filter} onChange={e => setFilter(e.target.value)} style={selectStyle}>
                  <option value="all">All services</option>
                  {serviceTypes.map(t => <option key={t} value={t}>{serviceTypeLabel(t)}</option>)}
                </select>
                <select value={stateFilter} onChange={e => selectStateFilter(e.target.value)} style={selectStyle}>
                  <option value="all">All states</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {cities.length > 0 && (
                  <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All cities</option>
                    {cities.map(c => <option key={c} value={c}>{c} ({cityCounts[c]})</option>)}
                  </select>
                )}
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={selectStyle}>
                  <option value="all">All time</option>
                  <option value="this_week">This week</option>
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                </select>
                <select value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value)} style={selectStyle}>
                  <option value="all">Homeowner & business</option>
                  <option value="homeowner">Homeowner only</option>
                  <option value="business">Cleaning business only</option>
                </select>
              </div>
            </div>

            {filtered.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', marginBottom: 10,
                background: selectedIds.size > 0 ? '#eef2ff' : theme.cardBg,
                border: `1px solid ${selectedIds.size > 0 ? 'rgba(79,70,229,0.25)' : theme.border}`,
                borderRadius: theme.radiusMd, transition: 'background 0.15s, border-color 0.15s',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: theme.textSecondary }}>
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: theme.accentSolid }} />
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                </label>
                {selectedIds.size > 0 && (
                  <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
                    {view === 'trash' ? (
                      <>
                        <button onClick={bulkRestore} style={{ ...secondaryBtnStyle, background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                          <RotateCcw size={13} /> Restore
                        </button>
                        <button onClick={bulkDeleteForever} style={dangerBtnStyle}>
                          <Trash2 size={13} /> Delete Forever
                        </button>
                      </>
                    ) : (
                      <button onClick={bulkMoveToTrash} style={dangerBtnStyle}>
                        <Trash2 size={13} /> Move to Trash
                      </button>
                    )}
                    <button onClick={() => setSelectedIds(new Set())} style={secondaryBtnStyle}>
                      <X size={13} /> Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: 14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Inbox size={24} color={theme.accentSolid} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.textSecondary, marginBottom: 5 }}>
                  {search || filter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all' || dateFilter !== 'all' || userTypeFilter !== 'all' ? 'No matching leads' : view === 'trash' ? 'Trash is empty' : 'No leads yet'}
                </div>
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', maxWidth: 300, margin: 0 }}>
                  {search || filter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all' || dateFilter !== 'all' || userTypeFilter !== 'all'
                    ? 'Try changing your search or filter.'
                    : view === 'trash'
                      ? 'Leads you archive show up here, and can be restored.'
                      : 'Leads submitted through the main estimator on cleanestimator.com will show up here.'}
                </p>
              </div>
            ) : (
              <div style={{ ...cardStyle, flex: 1, overflowY: 'auto' }}>
                {filtered.map((lead, i) => {
                  const color = SERVICE_COLORS[lead.service_type] || '#64748b';
                  const isSelected = selectedLead?.id === lead.id;
                  const isChecked = selectedIds.has(lead.id);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      style={{
                        padding: '13px 18px', borderBottom: i < filtered.length - 1 ? `1px solid ${theme.borderSoft}` : 'none',
                        cursor: 'pointer', background: isSelected ? '#eef2ff' : 'transparent',
                        display: 'flex', gap: 13, alignItems: 'center', transition: 'background 0.1s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleSelect(lead.id)}
                        style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0, accentColor: theme.accentSolid }}
                      />
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: avatarGradient(lead.name || lead.email), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                        {lead.name ? lead.name[0].toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: theme.textPrimary }}>{lead.name || '(No name)'}</div>
                          {userTypeLabel(lead.user_type) && (
                            <span style={pill(lead.user_type === 'business' ? '#7c3aed' : '#059669', lead.user_type === 'business' ? '#f5f3ff' : '#ecfdf5')}>
                              {userTypeLabel(lead.user_type)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.email || 'No email'}{lead.phone && ` · ${lead.phone}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ ...pill(color, `${color}18`), marginBottom: 3 }}>
                          {serviceTypeLabel(lead.service_type)}
                        </div>
                        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                          {lead.estimated_price_low ? `${formatPrice(lead.estimated_price_low)} – ${formatPrice(lead.estimated_price_high)}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{formatDateTime(lead.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lead detail panel */}
          {selectedLead && (
            <div style={{ ...cardStyle, width: 340, padding: '20px 20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: avatarGradient(selectedLead.name || selectedLead.email), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>
                    {selectedLead.name ? selectedLead.name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: theme.textPrimary, marginBottom: 2 }}>{selectedLead.name || '(No name)'}</h3>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{formatDateTime(selectedLead.created_at)}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  ['Email',    selectedLead.email,  `mailto:${selectedLead.email}`],
                  ['Phone',    selectedLead.phone,  `tel:${selectedLead.phone}`],
                  ['Type',     userTypeLabel(selectedLead.user_type), null],
                  ['Service',  serviceTypeLabel(selectedLead.service_type), null],
                  ['Location', [selectedLead.city, selectedLead.state, selectedLead.zip].filter(Boolean).join(' · '), null],
                  ['Estimate', selectedLead.estimated_price_low ? `${formatPrice(selectedLead.estimated_price_low)} – ${formatPrice(selectedLead.estimated_price_high)}` : '—', null],
                  ['Timeline', selectedLead.timeline || '—', null],
                ].filter(([, val]) => val && val !== '—' && val !== '').map(([label, val, href]) => (
                  <div key={label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted, minWidth: 72, paddingTop: 1 }}>{label}</span>
                    {href
                      ? <a href={href} style={{ fontSize: 13, color: theme.accentSolid, fontWeight: 600 }}>{val}</a>
                      : <span style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500 }}>{val}</span>
                    }
                  </div>
                ))}
              </div>

              {selectedLead.service_details && Object.keys(selectedLead.service_details).filter(k => k !== 'city').length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Service Details</div>
                  <div style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '11px 13px' }}>
                    {Object.entries(selectedLead.service_details).filter(([k]) => k !== 'city').map(([k, v]) => (
                      <div key={k} style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: theme.textMuted, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Internal Notes</div>
                  {noteStatus === 'saving' && <span style={{ fontSize: 11, color: theme.textMuted }}>Saving…</span>}
                  {noteStatus === 'saved' && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Saved</span>}
                </div>
                <textarea
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  onBlur={flushNoteSave}
                  placeholder="Add notes about this lead…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, borderTop: `1px solid ${theme.borderSoft}` }}>
                {(selectedLead.email || selectedLead.phone) && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    {selectedLead.email && (
                      <a href={`mailto:${selectedLead.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: theme.accentGradient, color: 'white', textAlign: 'center', borderRadius: theme.radiusSm, textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: theme.shadowGlow }}>
                        <Mail size={13} /> Email
                      </a>
                    )}
                    {selectedLead.phone && (
                      <a href={`tel:${selectedLead.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#16a34a', color: 'white', textAlign: 'center', borderRadius: theme.radiusSm, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </div>
                )}
                {selectedLead.deleted_at ? (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      onClick={() => restoreLead(selectedLead.id)}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: theme.radiusSm, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                    <button
                      onClick={() => hardDeleteLead(selectedLead.id)}
                      style={{ flex: 1, ...dangerBtnStyle, justifyContent: 'center' }}
                    >
                      <Trash2 size={13} /> Delete Forever
                    </button>
                  </div>
                ) : (
                  <button onClick={() => archiveLead(selectedLead.id)} style={{ width: '100%', ...dangerBtnStyle, justifyContent: 'center' }}>
                    <Trash2 size={13} /> Move to Trash
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}
