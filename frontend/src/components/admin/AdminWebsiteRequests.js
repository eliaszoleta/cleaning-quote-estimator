import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Inbox, Mail, Phone, X, Copy, Check, ExternalLink, Ban, Trash2, Plus } from 'lucide-react';
import { getAdminWebsiteRequests, createAdminWebsiteRequest, patchAdminWebsiteRequest, cancelAdminWebsiteSubscription, deleteAdminWebsiteRequestForever } from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { theme, cardStyle, inputStyle, labelStyle, secondaryBtnStyle, primaryBtnStyle, dangerBtnStyle, pill, avatarGradient, PageHeader } from './adminTheme';

const STATUS_META = {
  submitted: { label: 'Submitted', color: '#64748b' },
  sample_ready: { label: 'Sample Ready', color: '#d97706' },
  approved: { label: 'Approved', color: theme.accentSolid },
  active: { label: 'Active', color: '#16a34a' },
  declined: { label: 'Declined', color: '#dc2626' },
  canceled: { label: 'Canceled', color: '#94a3b8' },
};

const EMPTY_ADD_FORM = { name: '', business: '', email: '', phone: '', business_address: '' };

// Site-owner queue for "Get a Website" applications (WebsiteSubscription.js's
// apply form) -- previously email-only (see routes/websiteRequest.js), now a
// real list so a sample build + a sample_url can be attached, which notifies
// the prospect with their /website-approval/:token link (the $5-setup/
// 2-months-free/$249-month-3 approve-and-pay flow). Mirrors
// AdminHomepageLeads.js's list/detail/key-gate pattern.
// adminKey comes from the shared login in AdminDashboard.js (the
// consolidated /admin shell) -- this component no longer manages its own
// auth state.
export default function AdminWebsiteRequests({ adminKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sampleUrlInput, setSampleUrlInput] = useState('');
  const [notes, setNotes] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [savingSample, setSavingSample] = useState(false);
  const [cancelingSub, setCancelingSub] = useState(false);
  const [deletingReq, setDeletingReq] = useState(false);
  const [subscriptionIdInput, setSubscriptionIdInput] = useState('');
  const [linkingSub, setLinkingSub] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const notesTimer = useRef(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const loadRequests = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await getAdminWebsiteRequests(key);
      const loaded = res.data || [];
      setRequests(loaded);
      setSelected(prev => prev || (loaded.length > 0 ? loaded[0] : null));
    } catch (err) {
      console.error('Error loading website requests:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) loadRequests(adminKey); }, [adminKey, loadRequests]);
  useEffect(() => () => { if (notesTimer.current) clearTimeout(notesTimer.current); }, []);
  useEffect(() => {
    if (selected) {
      setNotes(selected.admin_notes || '');
      setSampleUrlInput(selected.sample_url || '');
      setNoteStatus('');
      setSubscriptionIdInput('');
      setLinkError('');
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) || (r.business || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  const openRequest = (r) => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setSelected(r);
    setCopied(false);
  };

  const applyUpdate = (id, patch) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    setSelected(prev => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const saveNote = async (val, id) => {
    setNoteStatus('saving');
    try {
      await patchAdminWebsiteRequest(adminKey, id, { admin_notes: val });
      applyUpdate(id, { admin_notes: val });
      setNoteStatus('saved');
    } catch {
      setNoteStatus('');
    }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    setNoteStatus('');
    if (notesTimer.current) clearTimeout(notesTimer.current);
    const id = selected.id;
    notesTimer.current = setTimeout(() => saveNote(val, id), 900);
  };

  const flushNoteSave = () => {
    if (!notesTimer.current || !selected) return;
    clearTimeout(notesTimer.current);
    notesTimer.current = null;
    saveNote(notes, selected.id);
  };

  // Saving a sample_url on a still-'submitted' request implicitly marks it
  // 'sample_ready' server-side (see PATCH /api/admin/website-requests/:id),
  // which is what triggers the prospect's notification email -- so this one
  // button covers both "attach the link" and "notify them" in the common
  // case, instead of requiring a separate status change first.
  const saveSampleUrl = async () => {
    if (!selected || !sampleUrlInput.trim()) return;
    setSavingSample(true);
    try {
      const res = await patchAdminWebsiteRequest(adminKey, selected.id, { sample_url: sampleUrlInput.trim() });
      applyUpdate(selected.id, res.data);
    } catch (err) {
      console.error('Failed to save sample URL:', err.message);
    } finally {
      setSavingSample(false);
    }
  };

  // Manually adds a client (e.g. one who reached out outside the public
  // apply form) -- deliberately sends no email of any kind (see
  // createAdminWebsiteRequest/POST /api/admin/website-requests): neither the
  // internal "new application" notification nor the applicant's own "we got
  // your request, a sample is coming in a few days" confirmation, since an
  // admin entering someone by hand wasn't necessarily told that.
  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.business.trim() || !addForm.email.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await createAdminWebsiteRequest(adminKey, {
        name: addForm.name.trim(),
        business: addForm.business.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || undefined,
        business_address: addForm.business_address.trim() || undefined,
      });
      setRequests(prev => [res.data, ...prev]);
      setSelected(res.data);
      setShowAddForm(false);
      setAddForm(EMPTY_ADD_FORM);
    } catch (err) {
      setAddError(err.message || 'Failed to add client');
    } finally {
      setAdding(false);
    }
  };

  const declineRequest = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: 'Decline this request?',
      message: `${selected.business} won't be notified -- this just closes it out of your queue.`,
      confirmLabel: 'Decline',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await patchAdminWebsiteRequest(adminKey, selected.id, { status: 'declined' });
      applyUpdate(selected.id, res.data);
    } catch (err) {
      console.error('Failed to decline request:', err.message);
    }
  };

  // Links the $249/mo trial subscription an admin created by hand in the
  // Stripe Dashboard (see WEBSITE_TRIAL_DAYS/WEBSITE_MONTHLY_PRICE in
  // routes/admin.js) -- the backend verifies the id actually exists in
  // Stripe and belongs to this request's customer before trusting it, so a
  // typo or pasted-the-wrong-id mistake surfaces here instead of silently
  // linking the wrong client.
  const linkSubscription = async () => {
    if (!selected || !subscriptionIdInput.trim()) return;
    setLinkingSub(true);
    setLinkError('');
    try {
      const res = await patchAdminWebsiteRequest(adminKey, selected.id, { stripe_subscription_id: subscriptionIdInput.trim() });
      applyUpdate(selected.id, res.data);
      setSubscriptionIdInput('');
    } catch (err) {
      setLinkError(err.message || 'Failed to link subscription');
    } finally {
      setLinkingSub(false);
    }
  };

  const cancelSubscription = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: `Cancel ${selected.business}'s subscription?`,
      message: "This cancels it in Stripe immediately -- they'll lose access to their site right away, and this can't be undone from here.",
      confirmLabel: 'Cancel Subscription',
      danger: true,
    });
    if (!ok) return;
    setCancelingSub(true);
    try {
      const res = await cancelAdminWebsiteSubscription(adminKey, selected.id);
      applyUpdate(selected.id, res.data);
    } catch (err) {
      console.error('Failed to cancel subscription:', err.message);
    } finally {
      setCancelingSub(false);
    }
  };

  // Permanently removes the request -- cancels any still-active Stripe
  // subscription server-side first (see DELETE /api/admin/website-requests/:id)
  // so nothing keeps billing with no record left to trace it back to.
  const deleteRequest = async () => {
    if (!selected) return;
    const hasActiveSub = selected.status === 'active' && selected.stripe_subscription_id;
    const ok = await confirm({
      title: `Permanently delete ${selected.business}?`,
      message: hasActiveSub
        ? "This cancels their Stripe subscription and deletes this request completely -- there's no undo."
        : "This deletes this request completely -- there's no undo.",
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    setDeletingReq(true);
    try {
      await deleteAdminWebsiteRequestForever(adminKey, selected.id);
      setRequests(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
    } catch (err) {
      console.error('Failed to delete website request:', err.message);
    } finally {
      setDeletingReq(false);
    }
  };

  const copyApprovalLink = () => {
    if (!selected?.approvalUrl) return;
    navigator.clipboard?.writeText(selected.approvalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.contentBg, padding: '30px 32px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHeader
          icon={Inbox}
          title="Website Requests"
          subtitle={'"Get a Website" applications from /website-for-cleaning-companies.'}
          actions={
            <button onClick={() => { setAddForm(EMPTY_ADD_FORM); setAddError(null); setShowAddForm(true); }} style={primaryBtnStyle}>
              <Plus size={15} /> Add Client
            </button>
          }
        />

        {showAddForm && (
          <div style={{ ...cardStyle, border: '1.5px solid rgba(79,70,229,0.3)', padding: '22px 26px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary }}>Add Client Manually</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>For a client who reached out directly, not through the apply form -- no emails are sent for this.</div>
              </div>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={submitAddForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Contact Name *</label>
                  <input required style={inputStyle} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Business Name *</label>
                  <input required style={inputStyle} value={addForm.business} onChange={e => setAddForm(f => ({ ...f, business: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input required type="email" style={inputStyle} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" style={inputStyle} value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business Address</label>
                  <input style={inputStyle} value={addForm.business_address} onChange={e => setAddForm(f => ({ ...f, business_address: e.target.value }))} />
                </div>
              </div>
              {addError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{addError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={adding} style={{ ...primaryBtnStyle, padding: '10px 20px', fontSize: 13.5, opacity: adding ? 0.7 : 1 }}>
                  {adding ? 'Adding…' : 'Add Client'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ ...secondaryBtnStyle, padding: '10px 20px', fontSize: 13.5 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 170px)' }}>
          {/* Request list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.2px' }}>Requests</h2>
                <button onClick={() => loadRequests(adminKey)} style={secondaryBtnStyle}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              <div style={{ display: 'flex', background: 'rgba(15,23,42,0.05)', borderRadius: 10, padding: 3, marginBottom: 10, width: 'fit-content', flexWrap: 'wrap' }}>
                {[['all', `All (${requests.length})`], ...Object.entries(STATUS_META).map(([v, m]) => [v, `${m.label} (${statusCounts[v] || 0})`])].map(([v, label]) => (
                  <button
                    key={v} onClick={() => setStatusFilter(v)}
                    style={{
                      padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12,
                      background: statusFilter === v ? theme.cardBg : 'transparent',
                      color: statusFilter === v ? theme.textPrimary : theme.textMuted,
                      boxShadow: statusFilter === v ? theme.shadowSm : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, business, email…"
                style={inputStyle}
              />
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: 14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Inbox size={24} color={theme.accentSolid} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.textSecondary, marginBottom: 5 }}>
                  {search || statusFilter !== 'all' ? 'No matching requests' : 'No requests yet'}
                </div>
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', maxWidth: 300, margin: 0 }}>
                  {search || statusFilter !== 'all' ? 'Try changing your search or filter.' : 'Applications submitted through the website offer page will show up here.'}
                </p>
              </div>
            ) : (
              <div style={{ ...cardStyle, flex: 1, overflowY: 'auto' }}>
                {filtered.map((r, i) => {
                  const meta = STATUS_META[r.status] || STATUS_META.submitted;
                  const isSelected = selected?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => openRequest(r)}
                      style={{
                        padding: '13px 18px', borderBottom: i < filtered.length - 1 ? `1px solid ${theme.borderSoft}` : 'none',
                        cursor: 'pointer', background: isSelected ? '#eef2ff' : 'transparent',
                        display: 'flex', gap: 13, alignItems: 'center', transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: avatarGradient(r.business || r.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                        {r.business ? r.business[0].toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: theme.textPrimary, marginBottom: 2 }}>{r.business || '(No business name)'}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name}{r.email && ` · ${r.email}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ ...pill(meta.color, `${meta.color}18`), marginBottom: 3 }}>
                          {meta.label}
                        </div>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{formatDateTime(r.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Request detail panel */}
          {selected && (
            <div style={{ ...cardStyle, width: 360, padding: '20px 20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: avatarGradient(selected.business || selected.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>
                    {selected.business ? selected.business[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: theme.textPrimary, marginBottom: 2 }}>{selected.business}</h3>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{selected.name} · {formatDateTime(selected.created_at)}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  ['Email', selected.email, `mailto:${selected.email}`],
                  ['Phone', selected.phone, `tel:${selected.phone}`],
                  ['Services', selected.services_offered, null],
                  ['Address', selected.business_address, null],
                  ['Service areas', selected.service_areas, null],
                  ['Current site', selected.current_website, null],
                  ['Facebook', selected.facebook_page, null],
                ].filter(([, val]) => val).map(([label, val, href]) => (
                  <div key={label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted, minWidth: 88, paddingTop: 1 }}>{label}</span>
                    {href
                      ? <a href={href} style={{ fontSize: 13, color: theme.accentSolid, fontWeight: 600 }}>{val}</a>
                      : <span style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500 }}>{val}</span>
                    }
                  </div>
                ))}
                {!selected.has_domain && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted, minWidth: 88, paddingTop: 1 }}>Domain ideas</span>
                    <span style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500 }}>{[selected.domain1, selected.domain2, selected.domain3].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                )}
              </div>

              {selected.message && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Message</div>
                  <div style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '11px 13px', fontSize: 13, color: theme.textSecondary, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
                </div>
              )}

              {/* Billing status -- read-only summary of where this request
                  is in the $5-setup / 2-months-free / $249-month-3 flow.
                  Switches to the canceled styling once canceled_at is set,
                  rather than just appending a canceled line to an otherwise
                  still-green "active" box. */}
              {(selected.setup_fee_paid_at || selected.subscription_started_at) && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Billing</div>
                  <div style={{ background: selected.canceled_at ? theme.contentBg : '#f0fdf4', border: `1px solid ${selected.canceled_at ? theme.border : '#bbf7d0'}`, borderRadius: theme.radiusMd, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selected.setup_fee_paid_at && <div style={{ fontSize: 12.5, color: selected.canceled_at ? theme.textMuted : '#15803d', fontWeight: 600 }}>$5 setup fee paid {formatDateTime(selected.setup_fee_paid_at)}</div>}
                    {selected.subscription_started_at && <div style={{ fontSize: 12.5, color: selected.canceled_at ? theme.textMuted : '#15803d', fontWeight: 600 }}>Subscription {selected.canceled_at ? 'started' : 'active since'} {formatDateTime(selected.subscription_started_at)} (2 months free, then $249/mo)</div>}
                    {selected.canceled_at && <div style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600 }}>Canceled {formatDateTime(selected.canceled_at)}</div>}
                  </div>
                </div>
              )}

              {/* Shown once the $5 fee is paid but no subscription is linked
                  yet -- the $249/mo trial itself is created by hand in the
                  Stripe Dashboard (60-day trial, their saved card), then
                  pasted in here to activate the client and notify them. */}
              {selected.status === 'approved' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Link Subscription</div>
                  <p style={{ fontSize: 11.5, color: theme.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>
                    Create their $249/mo subscription in Stripe (60-day trial, using their saved card), then paste the subscription ID here to activate and notify them.
                  </p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input
                      value={subscriptionIdInput}
                      onChange={e => setSubscriptionIdInput(e.target.value)}
                      placeholder="sub_..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={linkSubscription}
                      disabled={linkingSub || !subscriptionIdInput.trim()}
                      style={{ padding: '9px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: theme.radiusSm, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, opacity: (linkingSub || !subscriptionIdInput.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                    >
                      {linkingSub ? 'Linking…' : 'Link & Activate'}
                    </button>
                  </div>
                  {linkError && <p style={{ fontSize: 11.5, color: '#dc2626', margin: '6px 0 0' }}>{linkError}</p>}
                </div>
              )}

              <div>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Sample Site URL</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <input
                    value={sampleUrlInput}
                    onChange={e => setSampleUrlInput(e.target.value)}
                    placeholder="https://..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={saveSampleUrl}
                    disabled={savingSample || !sampleUrlInput.trim() || sampleUrlInput.trim() === (selected.sample_url || '')}
                    style={{ padding: '9px 14px', background: theme.textPrimary, color: 'white', border: 'none', borderRadius: theme.radiusSm, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, opacity: (savingSample || !sampleUrlInput.trim() || sampleUrlInput.trim() === (selected.sample_url || '')) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >
                    {selected.status === 'submitted' ? 'Save & Notify' : 'Save'}
                  </button>
                </div>
                {selected.status === 'submitted' && (
                  <p style={{ fontSize: 11.5, color: theme.textMuted, margin: '6px 0 0' }}>Saving a link here marks it Sample Ready and emails {selected.name} their review link.</p>
                )}
              </div>

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
                  placeholder="Add notes about this request…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, borderTop: `1px solid ${theme.borderSoft}` }}>
                {selected.approvalUrl && selected.status !== 'submitted' && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <a href={selected.approvalUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#eef2ff', color: theme.accentSolid, border: '1px solid rgba(79,70,229,0.25)', textAlign: 'center', borderRadius: theme.radiusSm, textDecoration: 'none', fontWeight: 700, fontSize: 12.5 }}>
                      <ExternalLink size={13} /> Open Approval Link
                    </a>
                    <button onClick={copyApprovalLink} style={{ flex: 1, ...secondaryBtnStyle, padding: '9px 0', fontSize: 12.5 }}>
                      {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                )}
                {(selected.email || selected.phone) && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    {selected.email && (
                      <a href={`mailto:${selected.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: theme.accentGradient, color: 'white', textAlign: 'center', borderRadius: theme.radiusSm, textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: theme.shadowGlow }}>
                        <Mail size={13} /> Email
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#16a34a', color: 'white', textAlign: 'center', borderRadius: theme.radiusSm, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </div>
                )}
                {selected.status === 'active' && (
                  <button
                    onClick={cancelSubscription}
                    disabled={cancelingSub}
                    style={{ width: '100%', ...dangerBtnStyle, justifyContent: 'center', padding: '9px 0', opacity: cancelingSub ? 0.6 : 1, cursor: cancelingSub ? 'default' : 'pointer' }}
                  >
                    <Ban size={13} /> {cancelingSub ? 'Canceling…' : 'Cancel Subscription'}
                  </button>
                )}
                {selected.status !== 'declined' && selected.status !== 'active' && selected.status !== 'canceled' && (
                  <button onClick={declineRequest} style={{ width: '100%', ...dangerBtnStyle, justifyContent: 'center', padding: '9px 0' }}>
                    <X size={13} /> Decline
                  </button>
                )}
                <button
                  onClick={deleteRequest}
                  disabled={deletingReq}
                  style={{ width: '100%', ...dangerBtnStyle, justifyContent: 'center', padding: '9px 0', opacity: deletingReq ? 0.6 : 1, cursor: deletingReq ? 'default' : 'pointer' }}
                >
                  <Trash2 size={13} /> {deletingReq ? 'Deleting…' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}
