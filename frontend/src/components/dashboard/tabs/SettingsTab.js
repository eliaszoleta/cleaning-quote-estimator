import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function SettingsTab({ user, config, refetchConfig }) {
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [scheduledFor, setScheduledFor] = useState(config?.pendingDeletion?.scheduledFor || null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (pwNew.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      setPwMsg({ type: 'success', text: 'Password updated successfully.' });
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  // Schedules deletion 30 days out instead of deleting immediately -- the
  // account stays fully logged-in and functional (minus the paused widget)
  // for the whole grace period, so we deliberately do NOT sign out here.
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/company/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setScheduledFor(data.scheduledFor);
      setDeleteConfirm('');
      if (refetchConfig) refetchConfig();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelLoading(true);
    setCancelError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/company/account/cancel-deletion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel deletion');
      setScheduledFor(null);
      if (refetchConfig) refetchConfig();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel deletion. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Settings</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Manage your account settings.</p>
      </div>

      {/* Account info + password */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Account</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email</label>
          <input
            readOnly
            value={user?.email || ''}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }}
          />
        </div>

        <form onSubmit={handleChangePassword}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Change Password</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>New Password</label>
            <input
              type="password"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              placeholder="Min. 8 characters"
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Confirm New Password</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          {pwMsg && (
            <div style={{ marginBottom: 12, fontSize: 13, padding: '8px 12px', borderRadius: 7, color: pwMsg.type === 'success' ? '#16a34a' : '#dc2626', background: pwMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${pwMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {pwMsg.text}
            </div>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            style={{ padding: '8px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: pwLoading ? 'not-allowed' : 'pointer', opacity: pwLoading ? 0.7 : 1 }}
          >
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <AlertTriangle size={15} color="#dc2626" />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Danger Zone</div>
        </div>
        {scheduledFor ? (
          <>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
              Your account is scheduled to be permanently deleted on{' '}
              <strong>{new Date(scheduledFor).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              Your embedded widget is paused until then. Changed your mind? You can cancel any time before that date and keep your account.
            </p>
            {cancelError && (
              <div style={{ marginBottom: 12, fontSize: 13, padding: '8px 12px', borderRadius: 7, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                {cancelError}
              </div>
            )}
            <button
              onClick={handleCancelDeletion}
              disabled={cancelLoading}
              style={{
                padding: '9px 20px',
                background: cancelLoading ? '#f1f5f9' : '#16a34a',
                color: cancelLoading ? '#94a3b8' : 'white',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: cancelLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {cancelLoading ? 'Canceling…' : 'Cancel Deletion'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
              Schedules your account for deletion in <strong>30 days</strong>. Your embedded widget pauses right away, but nothing is deleted immediately — you can log back in and cancel any time before then.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            {deleteError && (
              <div style={{ marginBottom: 12, fontSize: 13, padding: '8px 12px', borderRadius: 7, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                {deleteError}
              </div>
            )}
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleteLoading}
              style={{
                padding: '9px 20px',
                background: deleteConfirm === 'DELETE' && !deleteLoading ? '#dc2626' : '#f1f5f9',
                color: deleteConfirm === 'DELETE' && !deleteLoading ? 'white' : '#94a3b8',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: deleteConfirm === 'DELETE' && !deleteLoading ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {deleteLoading ? 'Scheduling…' : 'Delete My Account'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
