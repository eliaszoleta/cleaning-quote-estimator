import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Inbox, Mail, Phone, X, Copy, Check, ExternalLink, Ban, Trash2 } from 'lucide-react';
import { getAdminWebsiteRequests, patchAdminWebsiteRequest, cancelAdminWebsiteSubscription, deleteAdminWebsiteRequestForever } from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';
import { useConfirm } from '../dashboard/ConfirmDialog';

const STORAGE_KEY = 'admin_website_requests_key';

const STATUS_META = {
  submitted: { label: 'Submitted', color: '#64748b' },
  sample_ready: { label: 'Sample Ready', color: '#d97706' },
  approved: { label: 'Approved', color: '#2563eb' },
  active: { label: 'Active', color: '#16a34a' },
  declined: { label: 'Declined', color: '#dc2626' },
  canceled: { label: 'Canceled', color: '#94a3b8' },
};

// Site-owner queue for "Get a Website" applications (WebsiteSubscription.js's
// apply form) -- previously email-only (see routes/websiteRequest.js), now a
// real list so a sample build + a sample_url can be attached, which notifies
// the prospect with their /website-approval/:token link (the $5-setup/
// 2-months-free/$249-month-3 approve-and-pay flow). Mirrors
// AdminHomepageLeads.js's list/detail/key-gate pattern.
export default function AdminWebsiteRequests() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(STORAGE_KEY));
  const [keyInput, setKeyInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

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

  useEffect(() => { if (authed && adminKey) loadRequests(adminKey); }, [authed, adminKey, loadRequests]);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      await getAdminWebsiteRequests(keyInput);
      sessionStorage.setItem(STORAGE_KEY, keyInput);
      setAdminKey(keyInput);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.message || 'Incorrect admin key');
    } finally {
      setLoggingIn(false);
    }
  };

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

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', border: '1px solid #e2e8f0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#374151' };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Website Requests</div>
        <input type="password" placeholder="Admin key" value={keyInput} onChange={e => { setKeyInput(e.target.value); setLoginError(null); }} style={{ ...inputStyle, marginBottom: 12, borderColor: loginError ? '#ef4444' : '#e2e8f0' }} autoFocus />
        {loginError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{loginError}</div>}
        <button type="submit" disabled={loggingIn} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loggingIn ? 0.7 : 1 }}>
          {loggingIn ? 'Checking...' : 'Log In'}
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a' }}>Website Requests</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>"Get a Website" applications from /website-for-cleaning-companies.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 180px)' }}>
          {/* Request list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Requests</h2>
                <button onClick={() => loadRequests(adminKey)} style={btnStyle}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 10, width: 'fit-content', flexWrap: 'wrap' }}>
                {[['all', `All (${requests.length})`], ...Object.entries(STATUS_META).map(([v, m]) => [v, `${m.label} (${statusCounts[v] || 0})`])].map(([v, label]) => (
                  <button
                    key={v} onClick={() => setStatusFilter(v)}
                    style={{
                      padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12,
                      background: statusFilter === v ? 'white' : 'transparent',
                      color: statusFilter === v ? '#0f172a' : '#64748b',
                      boxShadow: statusFilter === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13.5, outline: 'none', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Inbox size={24} color="#94a3b8" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 5 }}>
                  {search || statusFilter !== 'all' ? 'No matching requests' : 'No requests yet'}
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 300, margin: 0 }}>
                  {search || statusFilter !== 'all' ? 'Try changing your search or filter.' : 'Applications submitted through the website offer page will show up here.'}
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                {filtered.map((r, i) => {
                  const meta = STATUS_META[r.status] || STATUS_META.submitted;
                  const isSelected = selected?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => openRequest(r)}
                      style={{
                        padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                        cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white',
                        display: 'flex', gap: 13, alignItems: 'center', transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: meta.color }}>
                        {r.business ? r.business[0].toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a', marginBottom: 2 }}>{r.business || '(No business name)'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name}{r.email && ` · ${r.email}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ background: `${meta.color}18`, color: meta.color, padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, marginBottom: 3, display: 'inline-block' }}>
                          {meta.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDateTime(r.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Request detail panel */}
          {selected && (
            <div style={{ width: 360, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 2 }}>{selected.business}</h3>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{selected.name} · {formatDateTime(selected.created_at)}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 9, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', minWidth: 88, paddingTop: 1 }}>{label}</span>
                    {href
                      ? <a href={href} style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>{val}</a>
                      : <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{val}</span>
                    }
                  </div>
                ))}
                {!selected.has_domain && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', minWidth: 88, paddingTop: 1 }}>Domain ideas</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{[selected.domain1, selected.domain2, selected.domain3].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                )}
              </div>

              {selected.message && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Message</div>
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '11px 13px', fontSize: 13, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
                </div>
              )}

              {/* Billing status -- read-only summary of where this request
                  is in the $5-setup / 2-months-free / $249-month-3 flow.
                  Switches to the canceled styling once canceled_at is set,
                  rather than just appending a canceled line to an otherwise
                  still-green "active" box. */}
              {(selected.setup_fee_paid_at || selected.subscription_started_at) && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Billing</div>
                  <div style={{ background: selected.canceled_at ? '#f8fafc' : '#f0fdf4', border: `1px solid ${selected.canceled_at ? '#e2e8f0' : '#bbf7d0'}`, borderRadius: 8, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selected.setup_fee_paid_at && <div style={{ fontSize: 12.5, color: selected.canceled_at ? '#64748b' : '#15803d', fontWeight: 600 }}>$5 setup fee paid {formatDateTime(selected.setup_fee_paid_at)}</div>}
                    {selected.subscription_started_at && <div style={{ fontSize: 12.5, color: selected.canceled_at ? '#64748b' : '#15803d', fontWeight: 600 }}>Subscription {selected.canceled_at ? 'started' : 'active since'} {formatDateTime(selected.subscription_started_at)} (2 months free, then $249/mo)</div>}
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
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Link Subscription</div>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>
                    Create their $249/mo subscription in Stripe (60-day trial, using their saved card), then paste the subscription ID here to activate and notify them.
                  </p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input
                      value={subscriptionIdInput}
                      onChange={e => setSubscriptionIdInput(e.target.value)}
                      placeholder="sub_..."
                      style={{ flex: 1, padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#0f172a' }}
                    />
                    <button
                      onClick={linkSubscription}
                      disabled={linkingSub || !subscriptionIdInput.trim()}
                      style={{ padding: '9px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, opacity: (linkingSub || !subscriptionIdInput.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                    >
                      {linkingSub ? 'Linking…' : 'Link & Activate'}
                    </button>
                  </div>
                  {linkError && <p style={{ fontSize: 11.5, color: '#dc2626', margin: '6px 0 0' }}>{linkError}</p>}
                </div>
              )}

              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Sample Site URL</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <input
                    value={sampleUrlInput}
                    onChange={e => setSampleUrlInput(e.target.value)}
                    placeholder="https://..."
                    style={{ flex: 1, padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#0f172a' }}
                  />
                  <button
                    onClick={saveSampleUrl}
                    disabled={savingSample || !sampleUrlInput.trim() || sampleUrlInput.trim() === (selected.sample_url || '')}
                    style={{ padding: '9px 14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, opacity: (savingSample || !sampleUrlInput.trim() || sampleUrlInput.trim() === (selected.sample_url || '')) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >
                    {selected.status === 'submitted' ? 'Save & Notify' : 'Save'}
                  </button>
                </div>
                {selected.status === 'submitted' && (
                  <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>Saving a link here marks it Sample Ready and emails {selected.name} their review link.</p>
                )}
              </div>

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
                  placeholder="Add notes about this request…"
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, resize: 'vertical', minHeight: 70, outline: 'none', color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                {selected.approvalUrl && selected.status !== 'submitted' && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <a href={selected.approvalUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textAlign: 'center', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 12.5 }}>
                      <ExternalLink size={13} /> Open Approval Link
                    </a>
                    <button onClick={copyApprovalLink} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12.5 }}>
                      {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                )}
                {(selected.email || selected.phone) && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    {selected.email && (
                      <a href={`mailto:${selected.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#2563eb', color: 'white', textAlign: 'center', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                        <Mail size={13} /> Email
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#16a34a', color: 'white', textAlign: 'center', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </div>
                )}
                {selected.status === 'active' && (
                  <button
                    onClick={cancelSubscription}
                    disabled={cancelingSub}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: cancelingSub ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: cancelingSub ? 0.6 : 1 }}
                  >
                    <Ban size={13} /> {cancelingSub ? 'Canceling…' : 'Cancel Subscription'}
                  </button>
                )}
                {selected.status !== 'declined' && selected.status !== 'active' && selected.status !== 'canceled' && (
                  <button
                    onClick={declineRequest}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    <X size={13} /> Decline
                  </button>
                )}
                <button
                  onClick={deleteRequest}
                  disabled={deletingReq}
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: deletingReq ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: deletingReq ? 0.6 : 1 }}
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
