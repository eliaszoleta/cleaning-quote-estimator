import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadPartnerLogo } from '../../utils/api';

const MAX_LOGO_BYTES = 3 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const PRIMARY = '#2563eb';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

// Shared by BuyCityPlacement.js (checkout), ClientDashboard.js (a partner
// editing their own listing later), and BrandingTab.js (a company editing
// their widget branding) -- same upload flow everywhere, so it only needs
// building and testing once. upload: async ({contentType, dataBase64}) =>
// {data: {url}} -- defaults to the public, no-auth partner-checkout
// endpoint (the first two callers' case); BrandingTab.js passes its own,
// bound to the company's auth token and account id.
export default function LogoField({ value, onChange, inputStyle, upload = uploadPartnerLogo }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const linkButtonStyle = { background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo must be under 3MB.');
      return;
    }
    setUploading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const { data } = await upload({ contentType: file.type, dataBase64 });
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Logo</label>

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <img
            src={value}
            alt="Logo preview"
            style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}
            onError={e => { e.target.style.visibility = 'hidden'; }}
          />
          <button type="button" onClick={() => onChange('')} style={{ ...linkButtonStyle, color: '#94a3b8' }}>Remove</button>
        </div>
      )}

      {!showUrlInput ? (
        <>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'white', border: '1.5px dashed #cbd5e1', color: '#334155', borderRadius: 9, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: uploading ? 'default' : 'pointer' }}
          >
            {uploading ? <><Loader2 size={15} className="spin" /> Uploading...</> : <><Upload size={15} /> {value ? 'Change logo' : 'Upload logo'}</>}
          </button>
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
            Optional, PNG/JPEG/WebP up to 3MB. Or <button type="button" onClick={() => setShowUrlInput(true)} style={linkButtonStyle}>paste an image URL</button> instead.
          </p>
        </>
      ) : (
        <>
          <input style={inputStyle} value={value} onChange={e => onChange(e.target.value)} placeholder="https://yourbusiness.com/logo.png" />
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
            Or <button type="button" onClick={() => setShowUrlInput(false)} style={linkButtonStyle}>upload a file</button> instead.
          </p>
        </>
      )}

      {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>{error}</p>}

      <style>{`
        .spin { animation: lf-spin 0.8s linear infinite; }
        @keyframes lf-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
