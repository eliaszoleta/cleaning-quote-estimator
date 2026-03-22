import React from 'react';

const SERVICES = [
  { id: 'home_residential', icon: '🏠', label: 'House Cleaning', desc: 'Standard, deep clean, move-in/out' },
  { id: 'apartment', icon: '🏢', label: 'Apartment Cleaning', desc: 'Studio to 4+ bedrooms' },
  { id: 'commercial', icon: '🏬', label: 'Commercial Cleaning', desc: 'Offices, retail, warehouses' },
  { id: 'carpet', icon: '🪣', label: 'Carpet Cleaning', desc: 'Steam, dry-clean, stain removal' },
  { id: 'air_duct', icon: '💨', label: 'Air Duct Cleaning', desc: 'HVAC duct cleaning & sanitizing' },
  { id: 'dryer_vent', icon: '🔥', label: 'Dryer Vent Cleaning', desc: 'Fire prevention, efficiency' },
  { id: 'tile_grout', icon: '🔲', label: 'Tile & Grout Cleaning', desc: 'Deep clean, sealing, recoloring' },
  { id: 'mold_remediation', icon: '⚠️', label: 'Mold Remediation', desc: 'Assessment, removal, prevention' },
  { id: 'water_damage', icon: '💧', label: 'Water Damage Restoration', desc: 'Emergency extraction & drying' },
];

export default function ServiceSelect({ onSelect, primaryColor, companyName }) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
        {companyName ? `${companyName} — Get Your Quote` : 'What service do you need?'}
      </h2>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>
        Select a service to get an accurate local estimate.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {SERVICES.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              padding: '18px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              display: 'block',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(37,99,235,0.12)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
