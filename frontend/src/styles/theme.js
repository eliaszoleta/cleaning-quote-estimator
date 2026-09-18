// Shared design tokens -- single source of truth for colors, radius, shadow,
// and type scale, consumed by inline `style={{}}` objects across the app
// (this codebase has no CSS-in-JS/Tailwind, so tokens are plain JS values
// spread into existing style objects rather than theme-provider classes).
//
// Values mirror App.css's :root custom properties where they already exist
// (COLORS.primary === --primary-light, COLORS.primaryDark === --primary-dark,
// etc.) so there's one set of true values expressed in two forms -- CSS
// variables for the dashboard-shell classes in App.css, these constants for
// everywhere else -- instead of two competing systems.

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e3a8a',
  primaryHover: '#1d4ed8',
  primaryMuted: '#eff6ff',
  primaryMutedBorder: '#bfdbfe',
  ink: '#0f172a',
  body: '#64748b',
  muted: '#94a3b8',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  success: '#16a34a',
  successMuted: '#f0fdf4',
  successBorder: '#bbf7d0',
  danger: '#dc2626',
  dangerMuted: '#fef2f2',
  dangerBorder: '#fecaca',
  warning: '#d97706',
  warningMuted: '#fffbeb',
  warningBorder: '#fde68a',
  heroGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
};

// A real 5-step scale replacing the 4/5/6/7/8/9/10/11/12/14/20px values
// found scattered across the codebase.
export const RADIUS = {
  sm: 8,   // inputs, small buttons, chips
  md: 12,  // standard cards/buttons
  lg: 16,  // larger content cards, modals
  xl: 22,  // hero cards, prominent feature cards
  pill: 999,
};

export const SHADOWS = {
  sm: '0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.04)',
  md: '0 4px 16px rgba(15,23,42,0.08), 0 16px 32px rgba(15,23,42,0.08)',
  lg: '0 12px 32px rgba(15,23,42,0.12), 0 24px 60px rgba(15,23,42,0.14)',
  primary: '0 4px 16px rgba(30,64,175,0.20), 0 2px 6px rgba(30,64,175,0.14)',
};

export const TYPE = {
  h1: { fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 },
  h2: { fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 },
  h3: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 },
  body: { fontSize: 15.5, fontWeight: 400, lineHeight: 1.6 },
  bodySm: { fontSize: 13.5, fontWeight: 400, lineHeight: 1.55 },
  label: { fontSize: 12.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' },
};

// Reusable style-object helpers -- imported and spread into an existing
// inline style, e.g. `style={{ ...cardStyle(), marginBottom: 16 }}`, so
// adopting these doesn't require restructuring any component's JSX.

export const cardStyle = ({ padding = 24, radius = RADIUS.lg, shadow = SHADOWS.sm } = {}) => ({
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: radius,
  boxShadow: shadow,
  padding,
});

export const primaryButtonStyle = ({ size = 'md', disabled = false } = {}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: disabled ? '#93c5fd' : COLORS.primary,
  color: '#ffffff',
  border: 'none',
  borderRadius: RADIUS.sm,
  padding: size === 'lg' ? '14px 30px' : size === 'sm' ? '9px 16px' : '13px 22px',
  fontWeight: 700,
  fontSize: size === 'lg' ? 15.5 : size === 'sm' ? 13 : 14.5,
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : SHADOWS.primary,
  transition: 'background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
});

export const secondaryButtonStyle = ({ size = 'md' } = {}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: COLORS.surface,
  color: COLORS.body,
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  padding: size === 'lg' ? '14px 30px' : size === 'sm' ? '9px 16px' : '13px 22px',
  fontWeight: 600,
  fontSize: size === 'lg' ? 15.5 : size === 'sm' ? 13 : 14.5,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, color 0.15s ease',
});

export const inputStyle = ({ focused = false, error = false } = {}) => ({
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
  border: `1.5px solid ${error ? COLORS.danger : focused ? COLORS.primary : COLORS.border}`,
  borderRadius: RADIUS.sm,
  outline: 'none',
  boxSizing: 'border-box',
  color: COLORS.ink,
  background: COLORS.surface,
  boxShadow: focused && !error ? `0 0 0 3px rgba(37,99,235,0.12)` : 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
});
