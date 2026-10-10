import React from 'react';

// Shared design tokens + style builders for the whole /admin dashboard --
// one place that defines what "premium" looks like here (soft shadows,
// generous radius, an indigo->violet accent gradient instead of flat
// system blue, a dark sidebar) so every tab shares one visual language
// instead of six components that each invented their own button/input/card
// look over time. Import from here instead of redefining inputStyle/
// btnStyle locally.

export const theme = {
  sidebarBg: 'linear-gradient(180deg, #0f172a 0%, #0b1120 60%, #0a0f1c 100%)',
  contentBg: '#f4f5fa',
  cardBg: '#ffffff',
  border: 'rgba(15,23,42,0.09)',
  borderSoft: 'rgba(15,23,42,0.06)',
  shadowCard: '0 1px 2px rgba(15,23,42,0.04), 0 16px 32px -18px rgba(15,23,42,0.18)',
  shadowSm: '0 1px 3px rgba(15,23,42,0.08)',
  shadowGlow: '0 8px 20px -8px rgba(79,70,229,0.45)',
  radiusLg: 18,
  radiusMd: 12,
  radiusSm: 9,
  accentFrom: '#4f46e5',
  accentTo: '#7c3aed',
  accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  accentSolid: '#4f46e5',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
};

export const cardStyle = {
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusLg,
  boxShadow: theme.shadowCard,
};

export const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: `1.5px solid ${theme.border}`,
  borderRadius: theme.radiusSm,
  fontSize: 13.5,
  outline: 'none',
  color: theme.textPrimary,
  background: '#fff',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export const labelStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: theme.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 6,
};

// Primary = the one gradient action per view (Send, Create, Save, Log In).
// Secondary = everything else (Refresh, Export, Back, filters-adjacent
// actions) -- a white card-colored button with a crisp border, never
// competing with the gradient for attention.
export const primaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  padding: '10px 18px', borderRadius: theme.radiusSm, border: 'none',
  background: theme.accentGradient, color: 'white', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', boxShadow: theme.shadowGlow, transition: 'transform 0.1s, box-shadow 0.15s',
};

export const secondaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '9px 15px', borderRadius: theme.radiusSm, border: `1.5px solid ${theme.border}`,
  background: '#fff', color: theme.textSecondary, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
};

export const dangerBtnStyle = {
  ...secondaryBtnStyle, color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)', background: '#fef2f2',
};

// Soft, desaturated pill -- e.g. pill('#4f46e5', '#eef2ff') for an
// info/active badge, pill('#16a34a', '#ecfdf5') for success.
export const pill = (color, bg) => ({
  fontSize: 11, fontWeight: 700, color, background: bg,
  padding: '3px 10px', borderRadius: 999, display: 'inline-block', whiteSpace: 'nowrap',
});

// Deterministic gradient per name (hash -> hue) so the same person's
// avatar initial is always the same color across sessions/reloads, same
// idea as the old flat-tint avatars but with a richer, consistent-feeling
// gradient instead of six components each picking their own single color.
const AVATAR_GRADIENTS = [
  ['#4f46e5', '#7c3aed'], ['#0891b2', '#2563eb'], ['#db2777', '#9333ea'],
  ['#16a34a', '#0d9488'], ['#d97706', '#dc2626'], ['#7c3aed', '#c026d3'],
];
export function avatarGradient(seed) {
  const s = String(seed || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const [from, to] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

// A stat tile with an icon in a tinted rounded-square badge -- the
// "dashboard with real numbers up top" look every premium SaaS admin uses,
// replacing the old plain bordered box of bare numbers.
export function StatTile({ icon: Icon, label, value, color = theme.accentSolid, tint = '#eef2ff' }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, flex: 1, minWidth: 150 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} strokeWidth={2.25} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: theme.textMuted, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      </div>
    </div>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {Icon && (
            <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: theme.shadowGlow }}>
              <Icon size={17} color="white" strokeWidth={2.25} />
            </div>
          )}
          <div style={{ fontWeight: 800, fontSize: 23, color: theme.textPrimary, letterSpacing: '-0.3px' }}>{title}</div>
        </div>
        {subtitle && <div style={{ fontSize: 13, color: theme.textSecondary, maxWidth: 640 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
