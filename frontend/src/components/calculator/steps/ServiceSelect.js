import React, { useState, useEffect } from 'react';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets } from 'lucide-react';

// "Most Requested" mirrors the verified tagline already shipped for this service in
// data/services.js ("...the most requested service on Clean Estimator") — not a new claim.
const SERVICES = [
  { id: 'home_residential', Icon: Home,          label: 'House Cleaning',           desc: 'Standard, deep clean, move-in/out', color: '#2563eb', bg: '#eff6ff', popular: true },
  { id: 'apartment',        Icon: Building2,      label: 'Apartment Cleaning',       desc: 'Studio to 4+ bedrooms',             color: '#4f46e5', bg: '#eef2ff' },
  { id: 'commercial',       Icon: Building,       label: 'Commercial Cleaning',      desc: 'Offices, retail, warehouses',        color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'carpet',           Icon: Layers,         label: 'Carpet Cleaning',          desc: 'Steam, dry-clean, stain removal',    color: '#059669', bg: '#ecfdf5' },
  { id: 'air_duct',         Icon: Wind,           label: 'Air Duct Cleaning',        desc: 'HVAC duct cleaning & sanitizing',    color: '#0891b2', bg: '#ecfeff' },
  { id: 'dryer_vent',       Icon: Flame,          label: 'Dryer Vent Cleaning',      desc: 'Fire prevention, efficiency',        color: '#ea580c', bg: '#fff7ed' },
  { id: 'tile_grout',       Icon: Grid3x3,        label: 'Tile & Grout Cleaning',    desc: 'Deep clean, sealing, recoloring',    color: '#0d9488', bg: '#f0fdfa' },
  { id: 'mold_remediation', Icon: AlertTriangle,  label: 'Mold Remediation',         desc: 'Assessment, removal, prevention',    color: '#d97706', bg: '#fffbeb' },
  { id: 'water_damage',     Icon: Droplets,       label: 'Water Damage Restoration', desc: 'Emergency extraction & drying',      color: '#0284c7', bg: '#f0f9ff' },
];

export default function ServiceSelect({ onSelect, primaryColor, companyName }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: '50%',
          background: primaryColor || '#2563eb', color: 'white',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>1</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Step 1 of 4 — Pick a service
        </span>
      </div>

      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.3px' }}>
        {companyName ? `${companyName} — Get Your Quote` : 'What service do you need?'}
      </h2>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 18 }}>
        Tap a service to get your free, instant estimate.
      </p>

      <div className="cc-svc-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(195px, 1fr))',
        gap: isMobile ? 8 : 10,
      }}>
        {SERVICES.map(({ id, Icon, label, desc, color, bg, popular }, i) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              position: 'relative',
              background: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: isMobile ? '12px 10px' : '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              display: 'block',
              width: '100%',
              boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
              animation: 'cc-card-in 0.35s ease backwards',
              animationDelay: `${i * 35}ms`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = `0 4px 20px ${color}22`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              const tile = e.currentTarget.querySelector('.svc-tile');
              tile.style.background = color;
              tile.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03)';
              e.currentTarget.style.transform = 'none';
              const tile = e.currentTarget.querySelector('.svc-tile');
              tile.style.background = bg;
              tile.style.color = color;
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          >
            {popular && (
              <span style={{
                position: 'absolute', top: -8, left: 14,
                background: primaryColor || '#2563eb', color: 'white', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.03em', textTransform: 'uppercase',
                padding: '2.5px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                Most Requested
              </span>
            )}
            <div
              className="svc-tile"
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: bg, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: '#0f172a', marginBottom: 2, lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{desc}</div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes cc-card-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
