import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Search, RefreshCw, Users, TrendingUp, Inbox, Mail, Send, Eye } from 'lucide-react';
import { getAdminCompanies, getTrialEmailPreview, sendTrialEmails, sendTrialEmailPreview } from '../../utils/api';

const STORAGE_KEY = 'admin_companies_key';

const STATUS_STYLE = {
  active:            { label: 'Active',        color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  active_canceling:  { label: 'Canceling',      color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  trialing:          { label: 'Trialing',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  past_due:          { label: 'Past due',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  canceled:          { label: 'Canceled',       color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  expired:           { label: 'Trial expired',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  requires_trial_setup: { label: 'Not started', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
};

function StatusBadge({ sub }) {
  const s = STATUS_STYLE[sub?.status] || STATUS_STYLE.requires_trial_setup;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {s.label}{sub?.status === 'trialing' && sub.daysLeft != null ? ` · ${sub.daysLeft}d left` : ''}
    </span>
  );
}

export default function AdminCompanies() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(STORAGE_KEY));
  const [keyInput, setKeyInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState({ count: 0, activeCount: 0, totalLeads: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Trial-activation broadcast email -- preview (read-only) must be loaded
  // before Send becomes clickable, and Send still needs an explicit
  // window.confirm on top of that. Nothing here fires on page load.
  const [trialPreview, setTrialPreview] = useState(null);
  const [trialPreviewLoading, setTrialPreviewLoading] = useState(false);
  const [trialPreviewError, setTrialPreviewError] = useState(null);
  const [trialSending, setTrialSending] = useState(false);
  const [trialSendResult, setTrialSendResult] = useState(null);

  const [previewToEmail, setPreviewToEmail] = useState('');
  const [previewSending, setPreviewSending] = useState(false);
  const [previewSendResult, setPreviewSendResult] = useState(null);
  const [previewSendError, setPreviewSendError] = useState(null);

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

  useEffect(() => { if (authed && adminKey) load(adminKey); }, [authed, adminKey, load]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      // The login form doubles as the credential check -- there's no
      // separate "verify password" endpoint, this just tries the real
      // request and treats a 401 as a wrong key.
      await getAdminCompanies(keyInput);
      sessionStorage.setItem(STORAGE_KEY, keyInput);
      setAdminKey(keyInput);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.message || 'Incorrect admin key');
    } finally {
      setLoggingIn(false);
    }
  };

  const loadTrialPreview = async () => {
    setTrialPreviewLoading(true);
    setTrialPreviewError(null);
    setTrialSendResult(null);
    try {
      const res = await getTrialEmailPreview(adminKey);
      setTrialPreview(res);
    } catch (err) {
      setTrialPreviewError(err.message);
    } finally {
      setTrialPreviewLoading(false);
    }
  };

  const handleSendTrialEmails = async () => {
    if (!trialPreview) return;
    const ok = window.confirm(`Send the trial-activation email to ${trialPreview.recipientCount} compan${trialPreview.recipientCount === 1 ? 'y' : 'ies'}? This cannot be undone.`);
    if (!ok) return;
    setTrialSending(true);
    try {
      const res = await sendTrialEmails(adminKey);
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

  const filtered = companies.filter(c => {
    if (statusFilter !== 'all' && c.subscription?.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.companyName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Clean Estimator Company Accounts</div>
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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a' }}>Company Accounts</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Every business subscribed to the embeddable calculator.</div>
          </div>
          <button onClick={() => load(adminKey)} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total companies', value: summary.count, Icon: Building2, color: '#2563eb' },
            { label: 'Active subscriptions', value: summary.activeCount, Icon: TrendingUp, color: '#16a34a' },
            { label: 'Total leads captured', value: summary.totalLeads, Icon: Inbox, color: '#d97706' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                <Icon size={14} color={color} /> {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{loading ? '—' : value}</div>
            </div>
          ))}
        </div>

        {/* Trial-activation broadcast email */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            <Mail size={15} color="#2563eb" /> Trial Activation Email
          </div>
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 14 }}>
            Sends every company with an email on file their embed code + a pointer to the Help &amp; Docs tab. Nothing sends until you click Send below, and only after you've loaded the preview.
          </div>

          <form onSubmit={handleSendPreview} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="email" required placeholder="you@example.com"
              value={previewToEmail} onChange={e => { setPreviewToEmail(e.target.value); setPreviewSendResult(null); setPreviewSendError(null); }}
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <button type="submit" disabled={previewSending} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 9, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              <Send size={13} /> {previewSending ? 'Sending…' : 'Email me a preview'}
            </button>
          </form>
          {previewSendResult && <div style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600, marginTop: -10, marginBottom: 14 }}>Sent to {previewSendResult} — check your inbox.</div>}
          {previewSendError && <div style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600, marginTop: -10, marginBottom: 14 }}>{previewSendError}</div>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: trialPreview ? 14 : 0 }}>
            <button onClick={loadTrialPreview} disabled={trialPreviewLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
              <Eye size={14} /> {trialPreviewLoading ? 'Loading preview…' : 'Preview recipients & copy'}
            </button>
            {trialPreview && (
              <button onClick={handleSendTrialEmails} disabled={trialSending || trialSendResult} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: trialSendResult ? '#94a3b8' : '#16a34a', border: 'none', borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: (trialSending || trialSendResult) ? 'not-allowed' : 'pointer', color: 'white' }}>
                <Send size={14} /> {trialSending ? 'Sending…' : trialSendResult ? 'Sent' : `Send to ${trialPreview.recipientCount} compan${trialPreview.recipientCount === 1 ? 'y' : 'ies'}`}
              </button>
            )}
          </div>

          {trialPreviewError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 12.5, marginTop: 6 }}>{trialPreviewError}</div>}

          {trialSendResult && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', color: '#15803d', fontSize: 13, fontWeight: 600 }}>
              Sent to {trialSendResult.sentCount} compan{trialSendResult.sentCount === 1 ? 'y' : 'ies'}.
              {trialSendResult.failedCount > 0 && <span style={{ color: '#dc2626' }}> {trialSendResult.failedCount} failed.</span>}
              {trialSendResult.skippedCount > 0 && <span style={{ color: '#94a3b8' }}> {trialSendResult.skippedCount} skipped (no email on file).</span>}
            </div>
          )}

          {trialPreview && !trialSendResult && (
            <div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                <strong>Subject:</strong> {trialPreview.subject}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                {trialPreview.recipientCount} recipient{trialPreview.recipientCount === 1 ? '' : 's'}{trialPreview.skippedCount > 0 ? ` · ${trialPreview.skippedCount} skipped (no email on file)` : ''}
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
                {trialPreview.recipients.map(r => (
                  <div key={r.companyId} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f8fafc', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.companyName}</span>
                    <span style={{ color: '#64748b' }}>{r.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              placeholder="Search by company name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_STYLE).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            {companies.length === 0 ? 'No companies yet.' : 'No companies match your filters.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => (
              <div key={c.companyId} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.companyName}</span>
                    <StatusBadge sub={c.subscription} />
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>{c.email || '(no email on file)'}</div>
                  {c.serviceStates?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                      {c.serviceStates.map(st => (
                        <span key={st} style={{ fontSize: 10.5, color: '#475569', background: '#f1f5f9', borderRadius: 5, padding: '2px 7px' }}>{st}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 22, flexShrink: 0, fontSize: 12.5, color: '#374151' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.servicesEnabled}/{c.servicesTotal}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>services on</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.leadCount}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>leads</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 78 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{c.signedUpAt ? new Date(c.signedUpAt).toLocaleDateString() : '—'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>signed up</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
          <Users size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
          Read-only view. To pause, cancel, or delete a subscriber's account, use Stripe or Supabase directly for now.
        </div>
      </div>
    </div>
  );
}
