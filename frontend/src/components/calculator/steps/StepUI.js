import React from 'react';
import { COLORS, RADIUS } from '../../../styles/theme';

// Shared building blocks for the calculator step files (AirDuctStep,
// ApartmentStep, CarpetStep, CommercialStep, DryerVentStep, HomeStep,
// MoldStep, TileGroutStep, WaterDamageStep) -- each of these used to
// locally re-declare near-identical copies of these four patterns.
// Consolidated here on theme tokens so every step now visually matches
// and picks up token updates automatically.

export function StepSection({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

// Single-select pill: solid fill when selected.
export function StepChip({ selected, onClick, primaryColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 18px', borderRadius: RADIUS.sm,
        border: `2px solid ${selected ? primaryColor : COLORS.border}`,
        background: selected ? primaryColor : COLORS.surface,
        color: selected ? '#ffffff' : COLORS.ink,
        cursor: 'pointer', fontWeight: 600, fontSize: 14,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// Two-line card (title + sub/desc), tinted background when selected.
export function StepOptionCard({ selected, onClick, primaryColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: RADIUS.md, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${selected ? primaryColor : COLORS.border}`,
        background: selected ? `${primaryColor}10` : COLORS.surface,
        transition: 'all 0.15s', width: '100%',
      }}
    >
      {children}
    </button>
  );
}

// Multi-select rounded-pill toggle (add-ons / extras lists): tinted
// background + colored text when active, instead of a solid fill.
export function StepPillToggle({ selected, onClick, primaryColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 16px', borderRadius: RADIUS.pill,
        border: `2px solid ${selected ? primaryColor : COLORS.border}`,
        background: selected ? `${primaryColor}15` : COLORS.surface,
        color: selected ? primaryColor : COLORS.ink,
        cursor: 'pointer', fontWeight: 600, fontSize: 13,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
