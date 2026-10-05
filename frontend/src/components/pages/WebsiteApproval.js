import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, ExternalLink, Clock, XCircle, Loader2, Lock } from 'lucide-react';
import {
  getWebsiteRequestByToken,
  postWebsiteRequestCheckout,
  postWebsiteRequestVerifySetup,
  postWebsiteRequestConfirmPayment,
} from '../../utils/api';

const PRIMARY_GRADIENT = '#1d4ed8';
const SETUP_FEE = 5;
const FREE_MONTHS = 2;
const MONTHLY_PRICE = 249;
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

let stripeJsPromise = null;
// Loads Stripe.js lazily -- only the rare case where a bank requires 3D
// Secure on the $5 charge needs it at all, so it's never fetched on the
// common path where verify-setup finishes the whole approval in one go.
function loadStripeJs() {
  if (window.Stripe) return Promise.resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY));
  if (!stripeJsPromise) {
    stripeJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY));
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }
  return stripeJsPromise;
}

// The "Get a Website" approval + payment page -- /website-approval/:token,
// linked from the sample-ready email (see services/email.js's
// buildWebsiteSampleReadyHtml) and AdminWebsiteRequests.js's copyable link.
// No login of its own: the random token in the URL is the auth (see
// routes/websiteRequest.js's by-token routes). Walks a prospect through
// reviewing their free sample, then ONE Stripe Checkout redirect that only
// collects a card (see routes/websiteRequest.js's mode='setup' session) --
// the backend charges the $5 setup fee right after that, with no second
// card-entry step. The only time this page needs anything further from the
// customer is the rare case where their bank requires a 3D Secure challenge
// on that charge, shown inline via Stripe.js rather than another redirect.
// The $249/mo trial subscription itself isn't created here at all -- an
// admin sets it up by hand in Stripe once the fee is paid (see
// routes/admin.js), so 'approved' is a real, if temporary, end state from
// this page's point of view, not something a button on this page advances.
export default function WebsiteApproval({ token }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  // 'idle' | 'verifying_setup' | 'completing_3ds' -- drives the full-page
  // processing state while a return-from-Stripe redirect resolves
  // server-side (or a 3D Secure challenge completes) before this page can
  // show the real status.
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

  // Resolves the redirect back from Stripe's card-collection step. Runs
  // once per page load (the session_id is single-use on Stripe's side
  // anyway), then scrubs the query string so a refresh doesn't attempt to
  // re-verify an already-consumed session.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    const sessionId = params.get('session_id');
    if (step !== 'setup' || !sessionId) return;

    const cleanUrl = () => window.history.replaceState({}, '', window.location.pathname);

    setResolving('verifying_setup');
    postWebsiteRequestVerifySetup(token, sessionId)
      .then(async res => {
        cleanUrl();
        const data = res.data || {};

        if (data.requiresAction && data.clientSecret) {
          // The bank wants extra verification on the $5 charge -- handled
          // inline via Stripe.js instead of another redirect/checkout page.
          setResolving('completing_3ds');
          const stripe = await loadStripeJs();
          const result = await stripe.confirmCardPayment(data.clientSecret);
          if (result.error) {
            setResolving('idle');
            setError(result.error.message || 'Your card could not be verified. Please try again.');
            return;
          }
          await postWebsiteRequestConfirmPayment(token, result.paymentIntent.id);
          setResolving('idle');
          load();
          return;
        }

        if (data.declined) {
          setResolving('idle');
          setError(data.error || 'Your card was declined. Please try again.');
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
            {resolving === 'verifying_setup' ? 'Confirming your payment…' : resolving === 'completing_3ds' ? 'Verifying your card…' : 'Loading…'}
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
        <title>Review Your Website | Clean Estimator</title>
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
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Your website is being built</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Hang tight, {request.name.split(' ')[0]} — we're building your free website for {request.business}, and we'll email you the moment it's ready to review.
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

          {request.status === 'canceled' && (
            <>
              <XCircle size={40} color="#94a3b8" style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Subscription canceled</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Your subscription for {request.business} has been canceled. Want to start it back up? Just reply to any email from us.
              </p>
            </>
          )}

          {request.status === 'sample_ready' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.3px' }}>
                Your website is ready, {request.name.split(' ')[0]}
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 22 }}>
                Take a look at the free website we built for {request.business}
              </p>

              {request.sampleUrl && (
                <a
                  href={request.sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', color: '#0f172a', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14.5, marginBottom: 24 }}
                >
                  View Your Website <ExternalLink size={15} />
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
                {starting ? 'Loading…' : `Approve & Pay $${SETUP_FEE} →`}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 }}>
                <Lock size={11} color="#16a34a" />
                <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                  Secure checkout powered by <strong style={{ color: '#635bff', fontWeight: 700 }}>Stripe</strong>
                </span>
              </div>
            </>
          )}

          {request.status === 'approved' && (
            <>
              <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 14 }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>You're approved!</h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Your $5 setup fee for {request.business} is paid. We'll have your {FREE_MONTHS} months free trial up and running shortly — you won't be charged again until month 3 (${MONTHLY_PRICE}/mo), and we'll email you once it's live.
              </p>
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
