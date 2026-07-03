import React from 'react';
import { Phone, Globe, Mail } from 'lucide-react';

export default function PartnerCard({ partner }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #eff6ff, #ffffff)',
      border: '2px solid #2563eb',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        ⭐ Recommended Cleaner Near You
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        {partner.logo_url && (
          <img
            src={partner.logo_url}
            alt={partner.business_name}
            style={{ height: 52, width: 52, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', padding: 4 }}
          />
        )}
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', lineHeight: 1.2 }}>{partner.business_name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{partner.city}, {partner.state}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {partner.phone && (
          <a href={`tel:${partner.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16a34a', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}>
            <Phone size={13} /> {partner.phone}
          </a>
        )}
        {partner.website && (
          <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}>
            <Globe size={13} /> Visit Website
          </a>
        )}
        {partner.email && (
          <a href={`mailto:${partner.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid #cbd5e1', color: '#374151', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5, background: 'white' }}>
            <Mail size={13} /> Email
          </a>
        )}
      </div>
    </div>
  );
}
