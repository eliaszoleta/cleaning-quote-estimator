import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';

// Native window.confirm() looks like a browser warning, not part of the
// product, and can't be styled -- this is a drop-in replacement that
// matches the rest of the dashboard. Presentational piece; see useConfirm
// below for the part that actually replaces `if (!window.confirm(...)) return;`.
export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}) {
  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 14, padding: '26px 24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: danger ? '#fef2f2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {danger
              ? <AlertTriangle size={19} color="#dc2626" />
              : <HelpCircle size={19} color="#2563eb" />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{title}</div>
            {message && <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{message}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: danger ? '#dc2626' : '#2563eb', color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Promise-based drop-in for window.confirm(): `if (!(await confirm({...}))) return;`
// Render `dialog` once, anywhere, in the component using this hook.
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise(resolve => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleConfirm = () => { state?.resolve(true); setState(null); };
  const handleCancel = () => { state?.resolve(false); setState(null); };

  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
