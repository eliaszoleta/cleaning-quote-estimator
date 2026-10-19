import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Search, RefreshCw, Users, TrendingUp, Inbox, Mail, Send, Eye, Trash2, Phone, Globe, Wrench, AlertTriangle } from 'lucide-react';
import {
  getAdminCompanies, getTrialEmailPreview, sendTrialEmails, sendTrialEmailPreview, deleteAdminCompanyForever,
  getIncompleteProfilePreview, backfillCompanyProfiles,
} from '../../utils/api';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { theme, cardStyle, inputStyle, secondaryBtnStyle, primaryBtnStyle, pill, avatarGradient, StatTile, PageHeader } from './adminTheme';

const STATUS_STYLE = {
  active:            { label: 'Active',        color: '#16a34a', bg: '#f0fdf4' },
  active_canceling:  { label: 'Canceling',      color: '#d97706', bg: '#fffbeb' },
  trialing:          { label: 'Trialing',       color: theme.accentSolid, bg: '#eef2ff' },
  past_due:          { label: 'Past due',       color: '#dc2626', bg: '#fef2f2' },
  canceled:          { label: 'Canceled',       color: '#64748b', bg: '#f1f5f9' },
  expired:           { label: 'Trial expired',  color: '#dc2626', bg: '#fef2f2' },
  requires_trial_setup: { label: 'Not started', color: '#94a3b8', bg: '#f1f5f9' },
};

function StatusBadge({ sub }) {
  const s = STATUS_STYLE[sub?.status] || STATUS_STYLE.requires_trial_setup;
  return (
    <span style={pill(s.color, s.bg)}>
      {s.label}{sub?.status === 'trialing' && sub.daysLeft != null ? ` · ${sub.daysLeft}d left` : ''}
    </span>
  );
}

// adminKey comes from the shared login in AdminDashboard.js (the
// consolidated /admin shell) -- this component no longer manages its own
// auth state.
export default function AdminCompanies({ adminKey }) {
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState({ count: 0, activeCount: 0, totalLeads: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Trial-activation broadcast email -- preview (read-only) must be loaded
  // before Send becomes clickable, and Send still needs an explicit
  // confirm dialog on top of that. Nothing here fires on page load.
  const [trialPreview, setTrialPreview] = useState(null);
  const [trialPreviewLoading, setTrialPreviewLoading] = useState(false);
  const [trialPreviewError, setTrialPreviewError] = useState(null);
  const [trialSending, setTrialSending] = useState(false);
  const [trialSendResult, setTrialSendResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [previewToEmail, setPreviewToEmail] = useState('');
  const [previewSending, setPreviewSending] = useState(false);
  const [previewSendResult, setPreviewSendResult] = useState(null);
  const [previewSendError, setPreviewSendError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  // Incomplete-profile recovery -- see the comment on subscription.js's GET
  // /status for the race this is cleaning up after. Same preview-then-fix
  // shape as the trial-activation email above: nothing is written until
  // Fix is clicked, and only after the preview has loaded.
  const [profilePreview, setProfilePreview] = useState(null);
  const [profilePreviewLoading, setProfilePreviewLoading] = useState(false);
  const [profilePreviewError, setProfilePreviewError] = useState(null);
  const [profileSelectedIds, setProfileSelectedIds] = useState(new Set());
  const [profileFixing, setProfileFixing] = useState(false);
  const [profileFixResult, setProfileFixResult] = useState(null);

  const load = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCompanies(key);
      setCompanies(res.data || []);
      setSummary({ count: res.count || 0, activeCount: res.activeCount || 0, totalLeads: res.totalLeads || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) load(adminKey); }, [adminKey, load]);

  const loadTrialPreview = async () => {
    setTrialPreviewLoading(true);
    setTrialPreviewError(null);
    setTrialSendResult(null);
    try {
      const res = await getTrialEmailPreview(adminKey);
      setTrialPreview(res);
      // Default to everyone selected -- the list mixes real subscribers
      // with what look like personal test accounts, so this still needs a
      // deliberate uncheck, not a deliberate opt-in, to keep "send to
      // everyone" a one-click action when that's actually what's wanted.
      setSelectedIds(new Set((res.recipients || []).map(r => r.companyId)));
    } catch (err) {
      setTrialPreviewError(err.message);
    } finally {
      setTrialPreviewLoading(false);
    }
  };

  const toggleSelected = (companyId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId); else next.add(companyId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!trialPreview) return;
    setSelectedIds(prev =>
      prev.size === trialPreview.recipients.length ? new Set() : new Set(trialPreview.recipients.map(r => r.companyId))
    );
  };

  const handleSendTrialEmails = async () => {
    if (!trialPreview || selectedIds.size === 0) return;
    const ok = await confirm({
      title: `Send the trial-activation email to ${selectedIds.size} compan${selectedIds.size === 1 ? 'y' : 'ies'}?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Send',
      danger: true,
    });
    if (!ok) return;
    setTrialSending(true);
    try {
      const res = await sendTrialEmails(adminKey, Array.from(selectedIds));
      setTrialSendResult(res);
    } catch (err) {
      setTrialPreviewError(err.message);
    } finally {
      setTrialSending(false);
    }
  };

  const handleSendPreview = async (e) => {
    e.preventDefault();
    setPreviewSending(true);
    setPreviewSendError(null);
    setPreviewSendResult(null);
    try {
      const res = await sendTrialEmailPreview(adminKey, previewToEmail);
      setPreviewSendResult(res.to);
    } catch (err) {
      setPreviewSendError(err.message);
    } finally {
      setPreviewSending(false);
    }
  };

  const loadProfilePreview = async () => {
    setProfilePreviewLoading(true);
    setProfilePreviewError(null);
    setProfileFixResult(null);
    try {
      const res = await getIncompleteProfilePreview(adminKey);
      setProfilePreview(res);
      // Default to every recoverable account selected, same reasoning as
      // the trial-email preview above -- a deliberate uncheck, not a
      // deliberate opt-in, keeps "fix everyone recoverable" one click.
      setProfileSelectedIds(new Set((res.recoverable || []).map(r => r.companyId)));
    } catch (err) {
      setProfilePreviewError(err.message);
    } finally {
      setProfilePreviewLoading(false);
    }
  };

  const toggleProfileSelected = (companyId) => {
    setProfileSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId); else next.add(companyId);
      return next;
    });
  };

  const toggleProfileSelectAll = () => {
    if (!profilePreview) return;
    setProfileSelectedIds(prev =>
      prev.size === profilePreview.recoverable.length ? new Set() : new Set(profilePreview.recoverable.map(r => r.companyId))
    );
  };

  const handleFixProfiles = async () => {
    if (!profilePreview || profileSelectedIds.size === 0) return;
    const ok = await confirm({
      title: `Fill in missing company name/phone/website for ${profileSelectedIds.size} account${profileSelectedIds.size === 1 ? '' : 's'}?`,
      message: 'Only fills in fields that are currently blank, using what each account typed at signup. Never overwrites a value that\'s already there.',
      confirmLabel: 'Fix',
    });
    if (!ok) return;
    setProfileFixing(true);
    try {
      const res = await backfillCompanyProfiles(adminKey, Array.from(profileSelectedIds));
      setProfileFixResult(res);
      load(adminKey); // refresh the list below so the fixed names/phones/websites show immediately
    } catch (err) {
      setProfilePreviewError(err.message);
    } finally {
      setProfileFixing(false);
    }
  };

  // Permanent, immediate delete -- cancels their Stripe subscription and
  // wipes their leads, config, and login. No grace period like the
  // company's own self-service account deletion, so the confirm dialog
  // spells out exactly what's about to happen rather than a generic "are
  // you sure?".
  const handleDeleteCompany = async (c) => {
    const ok = await confirm({
      title: `Permanently delete ${c.companyName}?`,
      message: `This cancels their Stripe subscription, deletes all ${c.leadCount} lead${c.leadCount === 1 ? '' : 's'} they've captured, their account settings, and their login. There is no undo.`,
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(c.companyId);
    setError(null);
    try {
      await deleteAdminCompanyForever(adminKey, c.companyId);
      setCompanies(prev => prev.filter(x => x.companyId !== c.companyId));
      setSummary(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
    } catch (err) {
      setError(err.message || 'Failed to delete company');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = companies.filter(c => {
    if (statusFilter !== 'all' && c.subscription?.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.companyName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const selectStyle = { ...inputStyle, width: 'auto', cursor: 'pointer', color: theme.textSecondary };

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: theme.contentBg }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <PageHeader
          icon={Building2}
          title="Company Accounts"
          subtitle="Every business subscribed to the embeddable estimator."
          actions={
            <button onClick={() => load(adminKey)} disabled={loading} style={secondaryBtnStyle}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          }
        />

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Summary stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <StatTile icon={Building2} label="Total companies" value={loading ? '—' : summary.count} color="#4f46e5" tint="#eef2ff" />
          <StatTile icon={TrendingUp} label="Active subscriptions" value={loading ? '—' : summary.activeCount} color="#16a34a" tint="#f0fdf4" />
          <StatTile icon={Inbox} label="Total leads captured" value={loading ? '—' : summary.totalLeads} color="#d97706" tint="#fffbeb" />
        </div>

        {/* Trial-activation broadcast email */}
        <div style={{ ...cardStyle, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 14.5, marginBottom: 4, color: theme.textPrimary }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={13} color={theme.accentSolid} />
            </div>
            Trial Activation Email
          </div>
          <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 16 }}>
            Sends the selected companies their embed code + a pointer to the Help &amp; Docs tab. Nothing sends until you click Send below, and only after you've loaded the preview and picked who gets it.
          </div>

          <form onSubmit={handleSendPreview} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${theme.borderSoft}` }}>
            <input
              type="email" required placeholder="you@example.com"
              value={previewToEmail} onChange={e => { setPreviewToEmail(e.target.value); setPreviewSendResult(null); setPreviewSendError(null); }}
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <button type="submit" disabled={previewSending} style={{ ...secondaryBtnStyle, background: '#eef2ff', borderColor: 'rgba(79,70,229,0.2)', color: theme.accentSolid, whiteSpace: 'nowrap' }}>
              <Send size={13} /> {previewSending ? 'Sending…' : 'Email me a preview'}
            </button>
          </form>
          {previewSendResult && <div style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600, marginTop: -10, marginBottom: 14 }}>Sent to {previewSendResult} — check your inbox.</div>}
          {previewSendError && <div style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600, marginTop: -10, marginBottom: 14 }}>{previewSendError}</div>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: trialPreview ? 14 : 0 }}>
            <button onClick={loadTrialPreview} disabled={trialPreviewLoading} style={secondaryBtnStyle}>
              <Eye size={14} /> {trialPreviewLoading ? 'Loading preview…' : 'Preview recipients & copy'}
            </button>
            {trialPreview && (
              <button
                onClick={handleSendTrialEmails}
                disabled={trialSending || trialSendResult || selectedIds.size === 0}
                style={{
                  ...primaryBtnStyle,
                  background: trialSendResult ? '#94a3b8' : selectedIds.size === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
                  boxShadow: (trialSendResult || selectedIds.size === 0) ? 'none' : '0 8px 20px -8px rgba(22,163,74,0.45)',
                  cursor: (trialSending || trialSendResult || selectedIds.size === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={14} /> {trialSending ? 'Sending…' : trialSendResult ? 'Sent' : `Send to ${selectedIds.size} selected compan${selectedIds.size === 1 ? 'y' : 'ies'}`}
              </button>
            )}
          </div>

          {trialPreviewError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '10px 14px', color: '#dc2626', fontSize: 12.5, marginTop: 6 }}>{trialPreviewError}</div>}

          {trialSendResult && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: theme.radiusMd, padding: '12px 14px', color: '#15803d', fontSize: 13, fontWeight: 600 }}>
              Sent to {trialSendResult.sentCount} compan{trialSendResult.sentCount === 1 ? 'y' : 'ies'}.
              {trialSendResult.failedCount > 0 && <span style={{ color: '#dc2626' }}> {trialSendResult.failedCount} failed.</span>}
              {trialSendResult.skippedCount > 0 && <span style={{ color: '#94a3b8' }}> {trialSendResult.skippedCount} skipped (no email on file).</span>}
            </div>
          )}

          {trialPreview && !trialSendResult && (
            <div>
              <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
                <strong>Subject:</strong> {trialPreview.subject}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.textMuted }}>
                  {selectedIds.size} of {trialPreview.recipientCount} selected{trialPreview.skippedCount > 0 ? ` · ${trialPreview.skippedCount} skipped (no email on file)` : ''}
                </div>
                <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: theme.accentSolid, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                  {selectedIds.size === trialPreview.recipients.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusSm }}>
                {trialPreview.recipients.map(r => (
                  <label key={r.companyId} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', padding: '7px 12px', borderBottom: `1px solid ${theme.borderSoft}`, fontSize: 12.5, cursor: 'pointer', background: selectedIds.has(r.companyId) ? 'white' : '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <input type="checkbox" checked={selectedIds.has(r.companyId)} onChange={() => toggleSelected(r.companyId)} style={{ cursor: 'pointer', flexShrink: 0, accentColor: theme.accentSolid }} />
                      <span style={{ fontWeight: 600, color: selectedIds.has(r.companyId) ? theme.textPrimary : theme.textMuted }}>{r.companyName}</span>
                    </div>
                    <span style={{ color: selectedIds.has(r.companyId) ? theme.textMuted : '#cbd5e1' }}>{r.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Incomplete-profile recovery */}
        <div style={{ ...cardStyle, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 14.5, marginBottom: 4, color: theme.textPrimary }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={13} color="#d97706" />
            </div>
            Fix Incomplete Signups
          </div>
          <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 16 }}>
            A timing bug (now fixed) could leave a brand-new account's company name, phone, and/or website blank even though the owner typed them in at signup. This recovers those values from Supabase's own signup record and fills in only what's missing -- it never overwrites a value that's already there.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: profilePreview ? 14 : 0 }}>
            <button onClick={loadProfilePreview} disabled={profilePreviewLoading} style={secondaryBtnStyle}>
              <Eye size={14} /> {profilePreviewLoading ? 'Loading preview…' : 'Preview affected accounts'}
            </button>
            {profilePreview && profilePreview.recoverable.length > 0 && (
              <button
                onClick={handleFixProfiles}
                disabled={profileFixing || profileFixResult || profileSelectedIds.size === 0}
                style={{
                  ...primaryBtnStyle,
                  background: profileFixResult ? '#94a3b8' : profileSelectedIds.size === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
                  boxShadow: (profileFixResult || profileSelectedIds.size === 0) ? 'none' : '0 8px 20px -8px rgba(22,163,74,0.45)',
                  cursor: (profileFixing || profileFixResult || profileSelectedIds.size === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                <Wrench size={14} /> {profileFixing ? 'Fixing…' : profileFixResult ? 'Fixed' : `Fix ${profileSelectedIds.size} selected account${profileSelectedIds.size === 1 ? '' : 's'}`}
              </button>
            )}
          </div>

          {profilePreviewError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '10px 14px', color: '#dc2626', fontSize: 12.5, marginTop: 6 }}>{profilePreviewError}</div>}

          {profileFixResult && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: theme.radiusMd, padding: '12px 14px', color: '#15803d', fontSize: 13, fontWeight: 600 }}>
              Fixed {profileFixResult.updatedCount} account{profileFixResult.updatedCount === 1 ? '' : 's'}.
            </div>
          )}

          {profilePreview && !profileFixResult && profilePreview.affectedCount === 0 && (
            <div style={{ fontSize: 12.5, color: theme.textMuted }}>No accounts are missing a company name, phone, or website right now.</div>
          )}

          {profilePreview && !profileFixResult && profilePreview.recoverable.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.textMuted }}>
                  {profileSelectedIds.size} of {profilePreview.recoverableCount} selected
                </div>
                <button onClick={toggleProfileSelectAll} style={{ background: 'none', border: 'none', color: theme.accentSolid, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                  {profileSelectedIds.size === profilePreview.recoverable.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto', border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusSm }}>
                {profilePreview.recoverable.map(r => (
                  <label key={r.companyId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderBottom: `1px solid ${theme.borderSoft}`, fontSize: 12.5, cursor: 'pointer', background: profileSelectedIds.has(r.companyId) ? 'white' : '#fafafa' }}>
                    <input type="checkbox" checked={profileSelectedIds.has(r.companyId)} onChange={() => toggleProfileSelected(r.companyId)} style={{ cursor: 'pointer', flexShrink: 0, marginTop: 2, accentColor: theme.accentSolid }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: profileSelectedIds.has(r.companyId) ? theme.textMuted : '#cbd5e1' }}>{r.email || '(no email on file)'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {r.recoveredCompanyName && <span style={pill(theme.accentSolid, '#eef2ff')}>Name → {r.recoveredCompanyName}</span>}
                        {r.recoveredPhone && <span style={pill(theme.accentSolid, '#eef2ff')}>Phone → {r.recoveredPhone}</span>}
                        {r.recoveredWebsite && <span style={pill(theme.accentSolid, '#eef2ff')}>Website → {r.recoveredWebsite}</span>}
                        {r.stillMissing?.length > 0 && (
                          <span style={pill('#dc2626', '#fef2f2')}>{r.stillMissing.join(', ')} still unrecoverable</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {profilePreview && !profileFixResult && profilePreview.unrecoverableCount > 0 && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: theme.textMuted }}>
              <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {profilePreview.unrecoverableCount} account{profilePreview.unrecoverableCount === 1 ? '' : 's'} {profilePreview.unrecoverableCount === 1 ? 'has' : 'have'} nothing to recover from (the signup metadata is blank too) -- these would need the owner to just fill in Settings themselves.
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} color={theme.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              placeholder="Search by company name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_STYLE).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: theme.textMuted }}>
            {companies.length === 0 ? 'No companies yet.' : 'No companies match your filters.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => (
              <div key={c.companyId} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: avatarGradient(c.companyName || c.companyId), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                  {c.companyName ? c.companyName[0].toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>{c.companyName}</span>
                    <StatusBadge sub={c.subscription} />
                  </div>
                  <div style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 3 }}>{c.email || '(no email on file)'}</div>
                  {(c.phone || c.website) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 3 }}>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: theme.textMuted, textDecoration: 'none' }}>
                          <Phone size={11} /> {c.phone}
                        </a>
                      )}
                      {c.website && (
                        <a
                          href={/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: theme.textMuted, textDecoration: 'none' }}
                        >
                          <Globe size={11} /> {c.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </div>
                  )}
                  {c.serviceStates?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                      {c.serviceStates.map(st => (
                        <span key={st} style={pill(theme.textSecondary, theme.contentBg)}>{st}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 22, flexShrink: 0, fontSize: 12.5, color: theme.textSecondary }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>{c.servicesEnabled}/{c.servicesTotal}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>services on</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>{c.leadCount}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>leads</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 78 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: theme.textPrimary }}>{c.signedUpAt ? new Date(c.signedUpAt).toLocaleDateString() : '—'}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>signed up</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCompany(c)}
                  disabled={deletingId === c.companyId}
                  title="Permanently delete this account"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, flexShrink: 0, borderRadius: theme.radiusSm,
                    border: '1px solid rgba(220,38,38,0.25)', background: '#fef2f2', color: '#dc2626',
                    cursor: deletingId === c.companyId ? 'not-allowed' : 'pointer',
                    opacity: deletingId === c.companyId ? 0.5 : 1,
                  }}
                >
                  {deletingId === c.companyId ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: theme.textMuted }}>
          <Users size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
          To pause or change a subscriber's billing without deleting their account, use Stripe directly for now.
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}
