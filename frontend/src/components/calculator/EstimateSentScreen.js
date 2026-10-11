import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { MailCheck, RotateCcw } from 'lucide-react';
import { serviceTypeLabel } from '../../utils/formatters';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';

// Shown in place of the full on-screen breakdown once a lead has submitted
// their email -- the estimate email (sent by the backend's own
// sendEstimateEmail, fired the moment the lead's /api/calculate call
// returns) already contains the full breakdown, so revealing it here too
// made the email redundant and visitors never opened it. This screen's
// whole job is to make the email the one place to see the numbers.
export default function EstimateSentScreen({ name, email, serviceType, onReset }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const navbarHeight = 70;
    const top = rootRef.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const firstName = (name || '').trim().split(/\s+/)[0] || null;

  return (
    <>
      <Helmet>
        <title>Your Estimate Is On Its Way | Clean Estimator</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div ref={rootRef} style={{ padding: '40px 16px', background: COLORS.surfaceMuted, minHeight: '100vh' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden',
            boxShadow: SHADOWS.lg, border: `1px solid ${COLORS.border}`, textAlign: 'center',
          }}>
            <div style={{ padding: 'clamp(36px, 8vw, 52px) 32px 32px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <MailCheck size={30} color="#059669" />
              </div>

              <h1 style={{ fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>
                {firstName ? `Thanks, ${firstName}!` : 'Thank you!'}
              </h1>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 4 }}>
                Your {serviceTypeLabel(serviceType).toLowerCase()} estimate breakdown is on its way to:
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                {email}
              </p>

              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
                It should land within a couple of minutes — if you don't see it, check your spam or promotions folder.
              </p>

              <button
                type="button"
                onClick={onReset}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px',
                  borderRadius: 10, border: `1.5px solid ${COLORS.border}`, background: 'white',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#374151',
                }}
              >
                <RotateCcw size={15} /> Start Another Estimate
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
