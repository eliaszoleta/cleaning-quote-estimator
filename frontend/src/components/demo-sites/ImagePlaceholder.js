import React from 'react';
import { ImageIcon } from 'lucide-react';

// Stands in for a real photo the demo sites don't have yet -- this
// environment can't generate images. Swap it for a real <img> once photos
// are uploaded (e.g. to GitHub) and pointed to; the `note` is exactly what
// to generate or source for that slot.
export default function ImagePlaceholder({ note, height = 320, radius = 16, accent = '#94a3b8' }) {
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
