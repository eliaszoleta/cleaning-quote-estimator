import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, ExternalLink, Clock, XCircle, Loader2 } from 'lucide-react';
import {
  getWebsiteRequestByToken,
  postWebsiteRequestCheckout,
  postWebsiteRequestVerifySetup,
  postWebsiteRequestVerifySubscription,
} from '../../utils/api';

const PRIMARY_GRADIENT = '#1d4ed8';
const SETUP_FEE = 5;
const FREE_MONTHS = 2;
const MONTHLY_PRICE = 249;

// The "Get a Website" approval + payment page -- /website-approval/:token,
// linked from the sample-ready email (see services/email.js's
// buildWebsiteSampleReadyHtml) and AdminWebsiteRequests.js's copyable link.
// No login of its own: the random token in the URL is the auth (see
// routes/websiteRequest.js's by-token routes). Walks a prospect through
// reviewing their free sample, then a two-step Stripe Checkout redirect --
// a $5 one-time setup fee first, then a $249/mo subscription with a 60-day
// trial -- landing back on this same page between and after each step via
// the ?step= query param.
export default function WebsiteApproval({ token }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  // 'idle' | 'verifying_setup' | 'verifying_subscription' -- drives the
  // full-page processing state while a return-from-Stripe redirect resolves
  // server-side before this page can show the real status.
  const [resolving, setResolving] = useState('idle');

  const load = useCallback(async () => {
    try {
      const res = await getWebsiteRequestByToken(token);
      setRequest(res.data);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Resolves the two Stripe redirect hops. Runs once per page load (the
  // session_id in the URL is single-use on Stripe's side anyway), then
  // scrubs the query string so a refresh doesn't attempt to re-verify an
  // already-consumed session.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    const sessionId = params.get('session_id');
    if (!step || !sessionId) return;

    const cleanUrl = () => window.history.replaceState({}, '', window.location.pathname);

    if (step === 'setup') {
      setResolving('verifying_setup');
      postWebsiteRequestVerifySetup(token, sessionId)
        .then(res => {
          cleanUrl();
          if (res.url) {
            window.location.href = res.url;
            return;
          }
          setResolving('idle');
          load();
        })
        .catch(err => {
          cleanUrl();
          setResolving('idle');
          setError(err.message || 'Failed to verify your payment. Please try again.');
        });
    } else if (step === 'subscribed') {
      setResolving('verifying_subscription');
      postWebsiteRequestVerifySubscription(token, sessionId)
        .then(() => {
          cleanUrl();
          setResolving('idle');
          load();
        })
        .catch(err => {
          cleanUrl();
          setResolving('idle');
          setError(err.message || 'Failed to confirm your subscription. Please try again.');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startCheckout = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await postWebsiteRequestCheckout(token);
      window.location.href = res.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStarting(false);
    }
  };

  const shellStyle = { minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: '#f8fafc' };
  const cardStyle = { maxWidth: 480, width: '100%', background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(15,23,42,0.08)', padding: 'clamp(28px, 6vw, 40px)', textAlign: 'center' };

  if (loading || resolving !== 'idle') {
    return (
      <div style={shellStyle}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={28} className="wa-spin" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>
            {resolving === 'verifying_setup' ? 'Confirming your payment…' : resolving === 'verifying_subscription' ? 'Setting up your subscription…' : 'Loading…'}
          </div>
          <style>{`.wa-spin { animation: wa-spin 0.9s linear infinite; } @keyframes wa-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <XCircle size={40} color="#94a3b8" style={{ marginBottom: 14 }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Link not found</h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>This approval link isn't valid. If you think that's a mistake, reply to the email you received and we'll sort it out.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Review Your Website Sample | Clean Estimator</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={shellStyle}>
        <div style={cardStyle}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20, textAlign: 'left' }}>{error}</div>
          )}

          {request.status === 'submitted' && (
            <>
              <Clock size={40} color="#d97706" style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Your sample is being built</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Hang tight, {request.name.split(' ')[0]} — we're building your free sample for {request.business}, and we'll email you the moment it's ready to review.
              </p>
            </>
          )}

          {request.status === 'declined' && (
            <>
              <XCircle size={40} color="#94a3b8" style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>This request is closed</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Changed your mind, or think this is a mistake? Just reply to any email from us and we'll help.
              </p>
            </>
          )}

          {(request.status === 'sample_ready' || request.status === 'approved') && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.3px' }}>
                {request.setupFeePaidAt ? 'Almost there!' : `Your sample is ready, ${request.name.split(' ')[0]}`}
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 22 }}>
                {request.setupFeePaidAt
                  ? "You've paid the setup fee — just one more step to start your free trial."
                  : `Take a look at the free sample we built for ${request.business}`}
              </p>

              {!request.setupFeePaidAt && request.sampleUrl && (
                <a
                  href={request.sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', color: '#0f172a', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14.5, marginBottom: 24 }}
                >
                  View Your Sample Site <ExternalLink size={15} />
                </a>
              )}

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>What happens when you approve</div>
                {[
                  { label: 'Today', desc: `$${SETUP_FEE} one-time setup fee` },
                  { label: `Months 1-${FREE_MONTHS}`, desc: 'Completely free' },
                  { label: `Month ${FREE_MONTHS + 1}+`, desc: `$${MONTHLY_PRICE}/mo flat, cancel anytime` },
                ].map((step, i) => (
                  <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>{step.label}:</strong> {step.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={startCheckout}
                disabled={starting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '14px 0', borderRadius: 10, border: 'none', cursor: starting ? 'default' : 'pointer', fontWeight: 800, fontSize: 15.5, opacity: starting ? 0.7 : 1 }}
              >
                {starting ? 'Loading…' : request.setupFeePaidAt ? 'Continue to Start My Free Trial →' : `Approve & Pay $${SETUP_FEE} →`}
              </button>
              <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>Secure checkout powered by Stripe.</p>
            </>
          )}

          {request.status === 'active' && (
            <>
              <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>You're all set!</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Your subscription for {request.business} is active. Your first {FREE_MONTHS} months are completely free — after that it's a flat ${MONTHLY_PRICE}/month, cancel anytime. We'll be in touch shortly to finish setting up your live site and domain.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
