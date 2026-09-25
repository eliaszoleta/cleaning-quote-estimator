import React, { useState, useEffect } from 'react';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets } from 'lucide-react';
import { COLORS, RADIUS } from '../../../styles/theme';

// "Most Requested" mirrors the verified tagline already shipped for this service in
// data/services.js ("...the most requested service on Clean Estimator") — not a new claim.
// configKey maps this step's serviceType (snake_case, what /api/calculate
// expects) to the camelCase key the dashboard's Services tab actually
// toggles on/off in companyConfig.services -- the two id conventions never
// matched directly, which is exactly why disabling a service there had no
// effect here.
const SERVICES = [
  { id: 'home_residential', configKey: 'homeResidential', Icon: Home,          label: 'House Cleaning',           desc: 'Standard, deep clean, move-in/out', color: '#2563eb', bg: '#eff6ff', popular: true },
  { id: 'apartment',        configKey: 'apartment',       Icon: Building2,      label: 'Apartment Cleaning',       desc: 'Studio to 4+ bedrooms',             color: '#4f46e5', bg: '#eef2ff' },
  { id: 'commercial',       configKey: 'commercial',      Icon: Building,       label: 'Commercial Cleaning',      desc: 'Offices, retail, warehouses',        color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'carpet',           configKey: 'carpet',          Icon: Layers,         label: 'Carpet Cleaning',          desc: 'Steam, dry-clean, stain removal',    color: '#059669', bg: '#ecfdf5' },
  { id: 'air_duct',         configKey: 'airDuct',         Icon: Wind,           label: 'Air Duct Cleaning',        desc: 'HVAC duct cleaning & sanitizing',    color: '#0891b2', bg: '#ecfeff' },
  { id: 'dryer_vent',       configKey: 'dryerVent',       Icon: Flame,          label: 'Dryer Vent Cleaning',      desc: 'Fire prevention, efficiency',        color: '#ea580c', bg: '#fff7ed' },
  { id: 'tile_grout',       configKey: 'tileGrout',       Icon: Grid3x3,        label: 'Tile & Grout Cleaning',    desc: 'Deep clean, sealing, recoloring',    color: '#0d9488', bg: '#f0fdfa' },
  { id: 'mold_remediation', configKey: 'moldRemediation', Icon: AlertTriangle,  label: 'Mold Remediation',         desc: 'Assessment, removal, prevention',    color: '#d97706', bg: '#fffbeb' },
  { id: 'water_damage',     configKey: 'waterDamage',     Icon: Droplets,       label: 'Water Damage Restoration', desc: 'Emergency extraction & drying',      color: '#0284c7', bg: '#f0f9ff' },
];

export default function ServiceSelect({ onSelect, primaryColor, companyName, services }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // No companyConfig (main cleanestimator.com site) or a service with no
  // explicit entry both default to shown -- only an explicit enabled:false
  // hides it, matching the same default used everywhere else (DEFAULT_SVC
  // in the dashboard's Services tab).
  const visibleServices = SERVICES.filter(s => services?.[s.configKey]?.enabled !== false);

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: COLORS.ink, marginBottom: 4, letterSpacing: '-0.3px' }}>
        {companyName ? `${companyName} — Get Your Quote` : 'What service do you need?'}
      </h2>
      <p style={{ color: COLORS.body, fontSize: 13, marginBottom: 18 }}>
        Tap a service to get your free, instant estimate.
      </p>

      <div className="cc-svc-grid" style={{
        display: 'grid',
        // 195px let a narrow row (like the dashboard's Branding preview, or
        // a widget embedded in a sidebar) fit 3 across whenever exactly 6-7
        // services were enabled -- an uneven "3 then 3" split instead of a
        // clean 2-per-row grid. 260px keeps the columns from ever squeezing
        // that tight; a genuinely wide full-page embed still gets 3-4.
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: isMobile ? 8 : 10,
      }}>
        {visibleServices.map(({ id, Icon, label, desc, color, bg, popular }, i) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              position: 'relative',
              background: COLORS.surface,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
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
              e.currentTarget.style.borderColor = COLORS.border;
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
                background: primaryColor || COLORS.primary, color: 'white', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.03em', textTransform: 'uppercase',
                padding: '2.5px 8px', borderRadius: RADIUS.pill, whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                Most Requested
              </span>
            )}
            <div
              className="svc-tile"
              style={{
                width: 34, height: 34, borderRadius: RADIUS.sm,
                background: bg, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: COLORS.ink, marginBottom: 2, lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.4 }}>{desc}</div>
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
