import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { verifyPartnerCheckout } from '../../utils/api';

const PRIMARY = '#2563eb';

export default function PartnerCheckoutSuccess() {
  const [state, setState] = useState('verifying'); // verifying | success | pending | error
  const [businessName, setBusinessName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) { setState('error'); setErrorMsg('Missing checkout session.'); return; }

    verifyPartnerCheckout(sessionId)
      .then(({ data }) => {
        if (data.paid) {
          setBusinessName(data.businessName || '');
          setState('success');
        } else {
          setState('pending');
        }
      })
      .catch(err => {
        setErrorMsg(err.message || 'Something went wrong confirming your payment.');
        setState('error');
      });
  }, []);

  return (
    <div style={{ background: '#f1f5f9', minHeight: '70vh', display: 'flex', alignItems: 'center', padding: '48px 20px' }}>
      <Helmet>
        <title>Welcome, Partner! | Clean Estimator</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div style={{ maxWidth: 480, margin: '0 auto', background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: 'clamp(28px, 6vw, 44px)', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>

        {state === 'verifying' && (
          <>
            <Loader2 size={40} color={PRIMARY} className="pcs-spin" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Confirming your payment...</div>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>This only takes a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <CheckCircle2 size={30} color="#16a34a" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>
              Congratulations{businessName ? `, ${businessName}` : ''}!
            </div>
            <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
              You're officially a Clean Estimator partner. Your listing is live now &mdash; on the results card, the floating banner, and the estimate email in every city you bought.
            </p>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 18px', textAlign: 'left', marginBottom: 22 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>Next: set up your dashboard</div>
              <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
                Head to <strong>cleanestimator.com/client</strong> and sign up with the same email you just checked out with to unlock your KPI dashboard &mdash; impressions, calls, and click-through-rate for every city.
              </p>
            </div>
            <a
              href="/client"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: 'white', padding: '13px 26px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
            >
              Set Up My Dashboard <ArrowRight size={16} />
            </a>
          </>
        )}

        {state === 'pending' && (
          <>
            <Loader2 size={40} color="#f59e0b" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Payment still processing</div>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
              We haven't received confirmation from Stripe yet. Refresh this page in a minute, or check your email for a receipt.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <XCircle size={30} color="#dc2626" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>We couldn't confirm that payment</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 6 }}>{errorMsg}</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>If you were charged, contact us and we'll get it sorted right away &mdash; no need to pay twice.</p>
            <a href="/contact" style={{ display: 'inline-block', marginTop: 14, color: PRIMARY, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Contact Support →
            </a>
          </>
        )}

      </div>

      <style>{`
        .pcs-spin { animation: pcs-spin-kf 0.9s linear infinite; }
        @keyframes pcs-spin-kf { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
