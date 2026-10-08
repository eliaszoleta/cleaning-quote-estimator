import React from 'react';
import { ImageIcon } from 'lucide-react';

// Stands in for a real photo a demo site slot doesn't have yet. Pass `src`
// (and `alt`) once a real photo is available for that slot and this renders
// it directly instead of the dashed placeholder box -- `note` then becomes
// unused for that slot. Slots with no `src` still fall back to the
// placeholder, with `note` describing exactly what to source for it.
export default function ImagePlaceholder({ src, alt, note, height = 320, radius = 16, accent = '#94a3b8' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || note || ''}
        loading="lazy"
        style={{ width: '100%', height, borderRadius: radius, objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: '100%', height, borderRadius: radius,
      border: `1.5px dashed ${accent}`, background: `${accent}14`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '20px 28px', boxSizing: 'border-box',
    }}>
      <ImageIcon size={26} color={accent} strokeWidth={1.6} style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 12.5, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Image needed
      </div>
      <div style={{ fontSize: 13, color: accent, lineHeight: 1.55, maxWidth: 380, opacity: 0.9 }}>{note}</div>
    </div>
  );
}
