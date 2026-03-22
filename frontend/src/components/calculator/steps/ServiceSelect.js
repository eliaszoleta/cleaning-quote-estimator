import React from 'react';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets } from 'lucide-react';

const SERVICES = [
  { id: 'home_residential', Icon: Home,          label: 'House Cleaning',           desc: 'Standard, deep clean, move-in/out' },
  { id: 'apartment',        Icon: Building2,      label: 'Apartment Cleaning',       desc: 'Studio to 4+ bedrooms' },
  { id: 'commercial',       Icon: Building,       label: 'Commercial Cleaning',      desc: 'Offices, retail, warehouses' },
  { id: 'carpet',           Icon: Layers,         label: 'Carpet Cleaning',          desc: 'Steam, dry-clean, stain removal' },
  { id: 'air_duct',         Icon: Wind,           label: 'Air Duct Cleaning',        desc: 'HVAC duct cleaning & sanitizing' },
  { id: 'dryer_vent',       Icon: Flame,          label: 'Dryer Vent Cleaning',      desc: 'Fire prevention, efficiency' },
  { id: 'tile_grout',       Icon: Grid3x3,        label: 'Tile & Grout Cleaning',    desc: 'Deep clean, sealing, recoloring' },
  { id: 'mold_remediation', Icon: AlertTriangle,  label: 'Mold Remediation',         desc: 'Assessment, removal, prevention' },
  { id: 'water_damage',     Icon: Droplets,       label: 'Water Damage Restoration', desc: 'Emergency extraction & drying' },
];

export default function ServiceSelect({ onSelect, primaryColor, companyName }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.3px' }}>
        {companyName ? `${companyName} — Get Your Quote` : 'What service do you need?'}
      </h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        Select a service to get an accurate local estimate.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 10 }}>
        {SERVICES.map(({ id, Icon, label, desc }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              background: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              display: 'block',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 4px 20px rgba(37,99,235,0.10)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.querySelector('.svc-icon-wrap').style.background = primaryColor;
              e.currentTarget.querySelector('.svc-icon-wrap').style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.querySelector('.svc-icon-wrap').style.background = '#f1f5f9';
              e.currentTarget.querySelector('.svc-icon-wrap').style.color = '#475569';
            }}
          >
            <div
              className="svc-icon-wrap"
              style={{
                width: 38, height: 38, borderRadius: 9,
                background: '#f1f5f9', color: '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10, transition: 'all 0.15s',
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 3, lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
