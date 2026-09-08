import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Inbox, Mail, Phone, X, Trash2, RotateCcw } from 'lucide-react';
import { getCompanyLeads, patchLead, deleteLeadForever } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, serviceTypeLabel, formatDateTime } from '../../../utils/formatters';
import { useConfirm } from '../ConfirmDialog';

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
  // '' | 'saving' | 'saved' -- drives the small inline status text next to
  // the Internal Notes label, replacing the old explicit Save Note button.
  const [noteStatus, setNoteStatus] = useState('');
  const notesTimer = useRef(null);
  // "Archive" only ever soft-deletes (sets deleted_at) -- the lead was never
  // actually gone, but with no way to see or restore it, that's exactly how
  // it looked. This view toggle plus the Restore/Delete Forever actions
  // below are what a soft-delete needs to actually behave like one.
  const [view, setView] = useState('active');
  // Bulk selection -- ids of currently-checked leads within whatever view/
  // filter is active. Cleared on view switch since Active and Trash offer
  // different bulk actions and the ids selected in one view are never
  // visible (or actionable) in the other.
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => { loadLeads(); }, []);
  useEffect(() => () => { if (notesTimer.current) clearTimeout(notesTimer.current); }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getCompanyLeads(token, true);
      const loaded = res.data || [];
      setLeads(loaded);
      // Auto-open the most recent active lead instead of making someone
      // click into an empty-looking panel to discover the details are even
      // there -- only on load/refresh when nothing's already open, so a
      // manual Refresh never yanks the panel away from whatever they were
      // looking at.
      const activeLoaded = loaded.filter(l => !l.deleted_at);
      if (!selectedLead && activeLoaded.length > 0) {
        setSelectedLead(activeLoaded[0]);
        setNotes(activeLoaded[0].notes || '');
      }
    } catch (err) {
      console.error('Error loading leads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const baseLeads = leads.filter(l => (view === 'trash' ? !!l.deleted_at : !l.deleted_at));
  const activeCount = leads.filter(l => !l.deleted_at).length;
  const trashCount = leads.filter(l => l.deleted_at).length;

  const filtered = baseLeads.filter(l => {
    if (filter !== 'all' && l.service_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.zip || '').includes(q);
    }
    return true;
  });

  const serviceTypes = [...new Set(baseLeads.map(l => l.service_type))];

  const switchView = (v) => { setView(v); setFilter('all'); setSelectedLead(null); setSelectedIds(new Set()); };

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
    // Switching leads with a pending debounce still in flight would otherwise
    // save the previous lead's notes value onto the newly selected one a
    // moment later -- clear it first.
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setSelectedLead(lead);
    setNotes(lead.notes || '');
    setNoteStatus('');
  };

  const saveNote = async (val, leadId) => {
    setNoteStatus('saving');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await patchLead(token, leadId, { notes: val });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: val } : l));
      setSelectedLead(prev => (prev?.id === leadId ? { ...prev, notes: val } : prev));
      setNoteStatus('saved');
    } catch {
      setNoteStatus('');
    }
  };

  // Auto-save, replacing the old explicit Save Note button -- debounced so
  // it doesn't fire a request on every keystroke, and flushed immediately
  // on blur so clicking away doesn't leave a pending save hanging.
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const deletedAt = new Date().toISOString();
      await patchLead(token, leadId, { deleted_at: deletedAt });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deleted_at: deletedAt } : l));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  const restoreLead = async (leadId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await patchLead(token, leadId, { deleted_at: null });
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await deleteLeadForever(token, leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch {}
  };

  // Bulk actions -- fire the same per-lead PATCH/DELETE the single-lead
  // actions above use, in parallel, then reconcile local state once. Lead
  // counts here are small enough (dozens, not thousands) that this is
  // simpler and just as reliable as adding dedicated bulk endpoints.
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const deletedAt = new Date().toISOString();
    await Promise.all(ids.map(id => patchLead(token, id, { deleted_at: deletedAt }).catch(() => {})));
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, deleted_at: deletedAt } : l));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedIds(new Set());
  };

  const bulkRestore = async () => {
    const ids = [...selectedIds];
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await Promise.all(ids.map(id => patchLead(token, id, { deleted_at: null }).catch(() => {})));
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await Promise.all(ids.map(id => deleteLeadForever(token, id).catch(() => {})));
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedIds(new Set());
  };

  // Every lead field here (name, notes, etc.) is attacker-reachable -- it
  // came straight from a public form submission. A cell starting with
  // =, +, -, or @ opens as a formula in Excel/Sheets instead of text, so a
  // lead submitted with a name like "=cmd|'/c calc'!A1" could execute when
  // the export is later opened. Prefixing with a leading apostrophe forces
  // spreadsheet apps to treat it as literal text.
  const sanitizeCsvCell = (value) => {
    const str = String(value);
    return /^[=+\-@]/.test(str) ? `'${str}` : str;
  };

  const toCSV = (rowsSource) => {
    // City only ever comes from a company-scoped calculator's dropdown (see
    // CleaningCalculator.js), so it lives in service_details, not its own
    // lead column -- pulled out here so it's an actual CSV column instead of
    // something only visible by opening each lead's Service Details panel.
    const headers = ['Name', 'Email', 'Phone', 'Service', 'City', 'State', 'ZIP', 'Estimate Low', 'Estimate High', 'Timeline', 'Date', 'Notes'];
    const rows = rowsSource.map(l => [
      l.name || '', l.email || '', l.phone || '', serviceTypeLabel(l.service_type),
      l.service_details?.city || '', l.state || '', l.zip || '',
      l.estimated_price_low || '', l.estimated_price_high || '',
      l.timeline || '', new Date(l.created_at).toLocaleDateString(), l.notes || '',
    ]);
    return [headers, ...rows].map(r => r.map(c => `"${sanitizeCsvCell(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  // Exports the current selection if anything is checked, otherwise every
  // lead matching the current search/filter -- one button that adapts
  // instead of a separate "export selected" control.
  const exportCSV = () => {
    const rowsSource = selectedIds.size > 0 ? filtered.filter(l => selectedIds.has(l.id)) : filtered;
    const csv = toCSV(rowsSource);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cleanestimator-leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', border: '1px solid #e2e8f0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#374151' };

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 140px)' }}>
      {/* Lead list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Leads <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>({filtered.length})</span>
            </h2>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={loadLeads} style={btnStyle}>
                <RefreshCw size={13} /> Refresh
              </button>
              <button onClick={exportCSV} disabled={filtered.length === 0} style={{ ...btnStyle, opacity: filtered.length === 0 ? 0.5 : 1 }}>
                <Download size={13} /> {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export CSV'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 10, width: 'fit-content' }}>
            {[['active', `Active (${activeCount})`], ['trash', `Trash (${trashCount})`]].map(([v, label]) => (
              <button
                key={v} onClick={() => switchView(v)}
                style={{
                  padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12.5,
                  background: view === v ? 'white' : 'transparent',
                  color: view === v ? '#0f172a' : '#64748b',
                  boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
              placeholder="Search by name, email, ZIP…"
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13.5, outline: 'none', color: '#0f172a' }}
            />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13.5, background: 'white', cursor: 'pointer', outline: 'none', color: '#374151' }}
            >
              <option value="all">All services</option>
              {serviceTypes.map(t => <option key={t} value={t}>{serviceTypeLabel(t)}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk selection bar -- select-all checkbox always visible once
            there's something to select; the action buttons only appear
            once at least one lead is actually checked, so the toolbar
            doesn't sit there half-active with nothing to do. */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', marginBottom: 10, background: selectedIds.size > 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${selectedIds.size > 0 ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8, transition: 'background 0.15s, border-color 0.15s' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ width: 15, height: 15, cursor: 'pointer' }} />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </label>
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
                {view === 'trash' ? (
                  <>
                    <button onClick={bulkRestore} style={{ ...btnStyle, background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                      <RotateCcw size={13} /> Restore
                    </button>
                    <button onClick={bulkDeleteForever} style={{ ...btnStyle, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                      <Trash2 size={13} /> Delete Forever
                    </button>
                  </>
                ) : (
                  <button onClick={bulkMoveToTrash} style={{ ...btnStyle, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                    <Trash2 size={13} /> Move to Trash
                  </button>
                )}
                <button onClick={() => setSelectedIds(new Set())} style={btnStyle}>
                  <X size={13} /> Clear
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Inbox size={24} color="#94a3b8" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 5 }}>
              {search || filter !== 'all' ? 'No matching leads' : view === 'trash' ? 'Trash is empty' : 'No leads yet'}
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 280, margin: 0 }}>
              {search || filter !== 'all'
                ? 'Try changing your search or filter.'
                : view === 'trash'
                  ? "Leads you archive show up here, and can be restored."
                  : 'Embed your estimator to start capturing leads.'}
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {filtered.map((lead, i) => {
              const color = SERVICE_COLORS[lead.service_type] || '#64748b';
              const isSelected = selectedLead?.id === lead.id;
              const isChecked = selectedIds.has(lead.id);
              return (
                <div
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  style={{
                    padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                    cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white',
                    display: 'flex', gap: 13, alignItems: 'center', transition: 'background 0.1s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleSelect(lead.id)}
                    style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color }}>
                    {lead.name ? lead.name[0].toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a', marginBottom: 2 }}>{lead.name || '(No name)'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.email || 'No email'}{lead.phone && ` · ${lead.phone}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ background: `${color}18`, color, padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, marginBottom: 3, display: 'inline-block' }}>
                      {serviceTypeLabel(lead.service_type)}
                    </div>
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
        <div style={{ width: 340, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 2 }}>{selectedLead.name || '(No name)'}</h3>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDateTime(selectedLead.created_at)}</div>
            </div>
            <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 9, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              ['Email',    selectedLead.email,  `mailto:${selectedLead.email}`],
              ['Phone',    selectedLead.phone,  `tel:${selectedLead.phone}`],
              ['Service',  serviceTypeLabel(selectedLead.service_type), null],
              ['Location', [selectedLead.service_details?.city, selectedLead.zip, selectedLead.state].filter(Boolean).join(' · '), null],
              ['Estimate', selectedLead.estimated_price_low ? `${formatPrice(selectedLead.estimated_price_low)} – ${formatPrice(selectedLead.estimated_price_high)}` : '—', null],
              ['Timeline', selectedLead.timeline || '—', null],
            ].filter(([, val]) => val && val !== '—' && val !== '').map(([label, val, href]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', minWidth: 72, paddingTop: 1 }}>{label}</span>
                {href
                  ? <a href={href} style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>{val}</a>
                  : <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{val}</span>
                }
              </div>
            ))}
          </div>

          {selectedLead.service_details && Object.keys(selectedLead.service_details).filter(k => k !== 'city').length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Service Details</div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '11px 13px' }}>
                {/* city is already shown above in Location -- skip it here so it's not listed twice */}
                {Object.entries(selectedLead.service_details).filter(([k]) => k !== 'city').map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes -- auto-saves (debounced + flushed on blur), no explicit
              Save button. */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Internal Notes</div>
              {noteStatus === 'saving' && <span style={{ fontSize: 11, color: '#94a3b8' }}>Saving…</span>}
              {noteStatus === 'saved' && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Saved</span>}
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              onBlur={flushNoteSave}
              placeholder="Add notes about this lead…"
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' }}
            />
          </div>

          {/* Actions -- two stacked rows instead of cramming everything into
              one, which broke down to 4 buttons squeezed into a 340px panel
              on a trashed lead (Email/Call/Restore/Delete Forever all in a
              row). Contact actions on their own row, the
              archive/restore/delete action(s) on their own row below. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            {(selectedLead.email || selectedLead.phone) && (
              <div style={{ display: 'flex', gap: 7 }}>
                {selectedLead.email && (
                  <a href={`mailto:${selectedLead.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#2563eb', color: 'white', textAlign: 'center', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                    <Mail size={13} /> Email
                  </a>
                )}
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#16a34a', color: 'white', textAlign: 'center', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                    <Phone size={13} /> Call
                  </a>
                )}
              </div>
            )}
            {selectedLead.deleted_at ? (
              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  onClick={() => restoreLead(selectedLead.id)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  <RotateCcw size={13} /> Restore
                </button>
                <button
                  onClick={() => hardDeleteLead(selectedLead.id)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  <Trash2 size={13} /> Delete Forever
                </button>
              </div>
            ) : (
              <button
                onClick={() => archiveLead(selectedLead.id)}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                <Trash2 size={13} /> Move to Trash
              </button>
            )}
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
