import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

// Sample of the AI chatbot that's actually part of the website package --
// shown on every page of every demo site (not just Home) since it's a
// site-wide feature. Visual only, same front-end-only pattern as the quote
// forms: no real message actually goes anywhere.
export default function DemoChatWidget({ site }) {
  const [open, setOpen] = useState(false);
  const c = site.colors;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, fontFamily: site.fontBody }}>
      {open && (
        <div style={{ width: 'min(300px, calc(100vw - 40px))', background: 'white', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.25)', overflow: 'hidden', marginBottom: 12, border: `1px solid ${c.border}` }}>
          <div style={{ background: c.primary, color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{site.businessName}</div>
              <div style={{ fontSize: 11.5, opacity: 0.85 }}>Typically replies in a few minutes</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={16} /></button>
          </div>
          <div style={{ padding: 14, background: '#f8fafc', minHeight: 120 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px 14px 14px 14px', padding: '9px 12px', fontSize: 13, color: '#374151', maxWidth: '85%', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              Hi! 👋 Looking for a cleaning quote, or have a question about our services?
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', padding: 8, gap: 8 }}>
            <input readOnly placeholder="Type a message..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, fontFamily: site.fontBody }} />
            <button style={{ background: c.primary, border: 'none', borderRadius: 8, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><Send size={14} /></button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open chat"
        style={{ width: 58, height: 58, borderRadius: '50%', background: c.primary, border: 'none', boxShadow: `0 10px 26px ${c.primary}73`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 'auto' }}
      >
        {open ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>
    </div>
  );
}
