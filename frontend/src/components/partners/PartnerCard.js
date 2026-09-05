import React, { useEffect } from 'react';
import { Phone, Globe, Mail } from 'lucide-react';
import { logBannerEvent } from '../../utils/partnerLookup';

// This card -- shown to a visitor who already filled out the full estimate
// form -- is arguably higher-intent than the sitewide FloatingPartnerBanner,
// but it wasn't logging impressions or call taps at all, so the partner
// portal's numbers only ever reflected the floating banner. Logs the same
// event types so both placements roll up into one honest total.
export default function PartnerCard({ partner }) {
  useEffect(() => {
    logBannerEvent(partner.id, 'impression');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.id]);

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
          {partner.address && <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{partner.address}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {partner.phone && (
          <a
            href={`tel:${partner.phone}`}
            onClick={() => logBannerEvent(partner.id, 'call_click')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16a34a', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}
          >
            <Phone size={13} /> {partner.phone}
          </a>
        )}
        {partner.website && (
          <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}>
            <Globe size={13} /> Visit Website
          </a>
        )}
        {partner.business_email && (
          <a href={`mailto:${partner.business_email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid #cbd5e1', color: '#374151', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5, background: 'white' }}>
            <Mail size={13} /> Email
          </a>
        )}
      </div>
    </div>
  );
}
