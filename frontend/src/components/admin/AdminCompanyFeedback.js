import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, MessageSquare, Mail } from 'lucide-react';
import { getAdminCompanyFeedback } from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';
import { theme, cardStyle, inputStyle, secondaryBtnStyle, avatarGradient, PageHeader } from './adminTheme';

// Read-only list of every "Send Feedback" submission from the Clean
// Estimator dashboard header (CompanyDashboard.js) -- unlike most other
// admin tabs, there's no status/workflow here, just a record to read and
// reply to directly. Each row already carries the submitter's business
// name and email, snapshotted at submission time (see
// 030_company_feedback.sql), so no second lookup is needed to know who
// said it or how to reach them.
export default function AdminCompanyFeedback({ adminKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await getAdminCompanyFeedback(key);
      setRows(res.data || []);
    } catch (err) {
      console.error('Error loading company feedback:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) load(adminKey); }, [adminKey, load]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.business || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q) || (r.message || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: theme.contentBg }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <PageHeader
          icon={MessageSquare}
          title="Feedback"
          subtitle={`${rows.length} submission${rows.length === 1 ? '' : 's'} from the "Send Feedback" button in the Clean Estimator dashboard.`}
          actions={
            <button onClick={() => load(adminKey)} style={secondaryBtnStyle}>
              <RefreshCw size={13} /> Refresh
            </button>
          }
        />

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by business, email, or message…"
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: theme.textMuted, fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...cardStyle, padding: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <MessageSquare size={24} color={theme.accentSolid} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: theme.textSecondary, marginBottom: 5 }}>
              {search ? 'No matching feedback' : 'No feedback yet'}
            </div>
            <p style={{ fontSize: 13, color: theme.textMuted, maxWidth: 320, margin: 0 }}>
              {search ? 'Try a different search.' : 'Submissions from the dashboard\'s Send Feedback button will show up here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ ...cardStyle, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: avatarGradient(r.business || r.email || r.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>
                      {(r.business || r.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.textPrimary }}>{r.business || '(No business name)'}</div>
                      {r.email && (
                        <a href={`mailto:${r.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.accentSolid, fontWeight: 600, textDecoration: 'none' }}>
                          <Mail size={11} /> {r.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.textMuted, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDateTime(r.created_at)}</div>
                </div>
                <div style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
