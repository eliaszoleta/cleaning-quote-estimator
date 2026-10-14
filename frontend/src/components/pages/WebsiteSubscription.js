import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Globe, Search, PhoneMissed, Sparkles, ChevronDown, Smartphone, Bell } from 'lucide-react';
import { formatPhoneInput } from '../../utils/formatPhone';
import { postWebsiteRequest } from '../../utils/api';
import { WEBSITE_PLAN_TIERS, getTierById } from '../../data/websitePricingTiers';

const PRIMARY = '#2563eb';
const PRIMARY_GRADIENT = '#1d4ed8';
const SETUP_FEE = 5;
const FREE_MONTHS = 2;
const LOWEST_PRICE = WEBSITE_PLAN_TIERS[0].price;
const DEFAULT_TIER_ID = 'growth';

// What the same stack costs bought piecemeal, per tier -- backs up each
// plan's price instead of just asserting it's a good deal. Only includes
// the pieces that tier actually replaces (Starter doesn't claim to replace
// chatbot software it doesn't include).
const VALUE_BREAKDOWN_BY_TIER = {
  starter: [
    { label: 'Cleaning website builder / hosting', cost: '$20-40/mo' },
    { label: 'Lead capture form & instant-alert tool', cost: '$30-60/mo' },
  ],
  growth: [
    { label: 'Cleaning website builder / hosting', cost: '$20-40/mo' },
    { label: 'AI chatbot software', cost: '$150-300/mo' },
    { label: 'Lead capture form & instant-alert tool', cost: '$30-60/mo' },
  ],
  pro: [
    { label: 'Cleaning website builder / hosting', cost: '$20-40/mo' },
    { label: 'AI chatbot software', cost: '$150-300/mo' },
    { label: 'Business phone line', cost: '$20-30/mo' },
    { label: 'Text-message lead notifications & CRM', cost: '$50-100/mo' },
  ],
};

// Shown as a 3-step money timeline on the pricing card instead of a bare
// "$X/month" -- the offer only kicks in once a prospect has already seen
// and approved their free sample build (see the apply-form copy further
// down), so this describes what happens after that approval, not the
// sample build itself. Takes the selected tier's price as an argument since
// it's rebuilt per-render based on which plan is selected.
function pricingTimeline(monthlyPrice) {
  return [
    { label: 'On Approval', amount: `$${SETUP_FEE}`, desc: 'One-time setup fee, charged the day you approve your build' },
    { label: `Months 1-${FREE_MONTHS}`, amount: 'Free', desc: 'Your full plan, zero charge' },
    { label: `Month ${FREE_MONTHS + 1}+`, amount: `$${monthlyPrice}/mo`, desc: 'Flat rate from here on, cancel anytime' },
  ];
}

// Same 10 services offered elsewhere on the site (ServiceSelect.js,
// ServicesTab.js) -- kept as plain labels here since this form is just
// collecting what to put on the site, not tied to the calculator's
// configKey/pricing logic.
const SERVICES_OFFERED = [
  'House Cleaning', 'Apartment Cleaning', 'Commercial Cleaning', 'Carpet Cleaning', 'Upholstery Cleaning',
  'Air Duct Cleaning', 'Dryer Vent Cleaning', 'Tile & Grout Cleaning', 'Mold Remediation', 'Water Damage Restoration',
];

const IconCheck = ({ size = 18, color = '#16a34a', bg = '#dcfce7' }) => (
  <div style={{ width: size + 4, height: size + 4, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={size - 4} height={size - 4} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="1.5,6 4.5,9 10.5,3" />
    </svg>
  </div>
);

const IconX = ({ size = 15, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrow = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13,6 19,12 13,18" />
  </svg>
);

const IconSuccess = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <circle cx="12" cy="12" r="10" />
    <polyline points="7,12 10,15 17,9" />
  </svg>
);

// Pops up right after a successful application -- separate from the inline
// "Application Sent!" card below the form so the 48-hour timeline is the
// first thing seen, not something someone has to scroll back up to notice.
function ThankYouModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 18, padding: 'clamp(28px, 6vw, 40px)', maxWidth: 440, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', textAlign: 'center', position: 'relative' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><IconSuccess /></div>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 10 }}>Application Received!</div>
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, marginBottom: 4 }}>
          We're building your free cleaning website now — it'll be ready for you to review within <strong>48 hours</strong>.
        </p>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 22 }}>
          No payment required until you've seen it and decide to keep it.
        </p>
        <button
          onClick={onClose}
          style={{ background: PRIMARY_GRADIENT, color: 'white', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function Check({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{ marginTop: 1 }}><IconCheck /></div>
      <span style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

// Row-by-row contrast for the comparison table -- pulled from claims
// already made elsewhere on this page (flat pricing, no upfront cost,
// chatbot included) so it doesn't introduce anything the rest of the
// page doesn't already back up.
const COMPARISON = [
  {
    label: 'Before you pay',
    them: 'You commit and pay upfront before seeing the finished site.',
    us: 'We build your live cleaning website first — you only subscribe once you\'ve seen and approved it.',
  },
  {
    label: 'Upfront cost',
    them: 'Freelancers and agencies typically charge $2,000-$5,000+ before you see a single page.',
    us: '$0 upfront. One flat monthly rate covers the build, hosting, and everything after.',
  },
  {
    label: 'Timeline',
    them: 'Custom builds commonly take 4-8 weeks of back-and-forth before launch.',
    us: "We handle the build for you and give you a clear timeline once we know what you need.",
  },
  {
    label: 'Updates after launch',
    them: 'Want a change later? That\'s usually a new invoice.',
    us: 'Priority support included — update text, info, or photos, or add pages, with no extra invoices.',
  },
  {
    label: 'Capturing leads',
    them: "Most sites are just a digital brochure — no way to catch a visitor who doesn't call.",
    us: 'Every plan has a lead capture form that emails you instantly. Go Growth or Pro and add an AI chat widget that catches visitors who\'d rather ask a question than fill out a form.',
  },
  {
    label: 'Replying to leads on the go',
    them: "New lead notifications go to an inbox you check when you remember to.",
    us: "Quote-form leads land in your email on every plan. On Pro, a lead app puts every chat, text, and call in your pocket too — see it, reply to it, right from your phone.",
  },
];

function StepCard({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: PRIMARY_GRADIENT, color: 'white', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(29,78,216,0.3)' }}>{number}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{title}</div>
        <div className="ws-step-desc" style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function WebsiteSubscription() {
  const [sent, setSent] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedTierId, setSelectedTierId] = useState(DEFAULT_TIER_ID);
  const selectedTier = getTierById(selectedTierId) || getTierById(DEFAULT_TIER_ID);
  const [openFaqIndex, setOpenFaqIndex] = useState(-1);
  const [form, setForm] = useState({
    name: '', business: '', email: '', phone: '', servicesOffered: [], otherServices: '',
    businessAddress: '', serviceAreas: '',
    hasDomain: false, domain1: '', domain2: '', domain3: '', currentWebsite: '', facebookPage: '', message: '',
    // Honeypot: real visitors never see or fill this field; bots that
    // auto-fill every input on the page usually do. Checked server-side.
    website2: '',
  });

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white' };

  const toggleService = (label) => {
    setForm(f => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(label)
        ? f.servicesOffered.filter(s => s !== label)
        : [...f.servicesOffered, label],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Current website and Facebook page/profile aren't individually marked
    // required (HTML5 required can't express "at least one of these two"),
    // so this cross-field check is the only thing enforcing it -- either one
    // satisfies the requirement, both is fine too, neither is not.
    if (!form.currentWebsite.trim() && !form.facebookPage.trim()) {
      setError('Please provide your current website or Facebook page/profile -- at least one is required.');
      return;
    }
    setSending(true);
    try {
      await postWebsiteRequest({
        name: form.name,
        business: form.business,
        email: form.email,
        phone: form.phone || '',
        servicesOffered: form.servicesOffered.length ? form.servicesOffered.join(', ') : '',
        otherServices: form.otherServices || '',
        businessAddress: form.businessAddress || '',
        serviceAreas: form.serviceAreas || '',
        hasDomain: form.hasDomain,
        domain1: form.domain1 || '',
        domain2: form.domain2 || '',
        domain3: form.domain3 || '',
        currentWebsite: form.currentWebsite || '',
        facebookPage: form.facebookPage || '',
        message: form.message || '',
        planTier: selectedTierId,
        website2: form.website2,
      });
      setSent(true);
      setShowThankYou(true);
    } catch {
      setError('Something went wrong. Please try again or email us directly at info@cleanestimator.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cleaning Website + Chatbot + Lead App for Cleaning Companies | Clean Estimator</title>
        <meta name="description" content={`Get a professional cleaning website built free to preview. Approve it for just $${SETUP_FEE}, get ${FREE_MONTHS} months free, then from $${LOWEST_PRICE}/month — 3 plans, from a quote form with instant email alerts up to an AI chatbot and a full lead app.`} />
        <link rel="canonical" href="https://www.cleanestimator.com/website-for-cleaning-companies" />
      </Helmet>

      {/* Hero -- was a single centered text column on a flat gradient, which
          read as dull for a page that's literally selling website design.
          Now: glow blobs for depth, a two-column layout on desktop that
          actually shows a (synthetic, no real screenshot needed) website
          mockup instead of just describing one, and a floating "new lead"
          chip overlapping its corner to make "every lead lands in your
          pocket" something you see, not just read. */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(40px, 9vw, 88px) 20px clamp(48px, 9vw, 110px)' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: -120, right: '4%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, rgba(96,165,250,0) 70%)', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -140, left: '0%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} />

        <div className="ws-hero-grid" style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', display: 'grid', gap: 48, alignItems: 'center' }}>
          <div className="ws-hero-copy">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
              Cleaning Website + Lead App
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4.2vw,42px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
              A Professional Cleaning Website,<br />Built and Hosted for You
              <span style={{ display: 'block', marginTop: 10, backgroundImage: 'linear-gradient(90deg, #60a5fa, #93c5fd)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontSize: '0.64em', fontWeight: 700 }}>
                With Every Lead Landing Right In Your Pocket
              </span>
            </h1>
            <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 480, marginBottom: 28, lineHeight: 1.55 }}>
              No cleaning website yet? We build it, host it, and connect every quote request, text, and call to a mobile app you carry with you — for one flat monthly rate, no big upfront cost.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <a href="#apply" className="ws-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
                Build My Free Sample Site <span className="ws-arrow"><IconArrow size={16} color="white" /></span>
              </a>
            </div>
            <p style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
              We build your site first — you don't pay until you've seen and approved it.
            </p>
          </div>

          <div className="ws-hero-visual" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="ws-float" style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
              {/* Synthetic browser-chrome mockup -- no real screenshot
                  needed, and it keeps the live demo link below (which
                  already shows a real site) as the thing that actually
                  earns the click. */}
              <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 70px -18px rgba(2,6,23,0.55), 0 8px 24px rgba(2,6,23,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fca5a5' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fde68a' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#bbf7d0' }} />
                  <span style={{ marginLeft: 10, fontSize: 11, color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 10px' }}>yourcleaningco.com</span>
                </div>
                <div style={{ padding: '20px 20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: PRIMARY_GRADIENT, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={11} color="white" />
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Sparkle Clean Co.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[34, 26, 40].map((w, i) => <span key={i} style={{ width: w, height: 6, borderRadius: 3, background: '#e2e8f0' }} />)}
                    </div>
                  </div>
                  <div style={{ height: 9, width: '78%', borderRadius: 4, background: '#0f172a', marginBottom: 9 }} />
                  <div style={{ height: 9, width: '55%', borderRadius: 4, background: '#0f172a', opacity: 0.85, marginBottom: 16 }} />
                  <div style={{ height: 6, width: '92%', borderRadius: 3, background: '#e2e8f0', marginBottom: 7 }} />
                  <div style={{ height: 6, width: '70%', borderRadius: 3, background: '#e2e8f0', marginBottom: 18 }} />
                  <span style={{ display: 'inline-block', background: PRIMARY_GRADIENT, color: 'white', fontSize: 11.5, fontWeight: 700, padding: '8px 18px', borderRadius: 7 }}>Get a Free Quote</span>
                </div>
              </div>

              {/* Floating "new lead" chip -- the visual payoff for the
                  headline's "lands right in your pocket" line. */}
              <div style={{
                position: 'absolute', left: -14, bottom: -18, display: 'flex', alignItems: 'center', gap: 10,
                background: 'white', borderRadius: 12, padding: '10px 15px 10px 11px',
                boxShadow: '0 14px 32px -8px rgba(2,6,23,0.4)', border: '1px solid #f1f5f9', maxWidth: 230,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={14} color={PRIMARY} strokeWidth={2.3} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>New lead: Sarah M.</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94a3b8' }}>
                    <span className="ws-pulse-dot" /> Deep clean request &middot; just now
                  </div>
                </div>
              </div>

              <div style={{
                position: 'absolute', right: -16, top: -16, display: 'flex', alignItems: 'center', gap: 6,
                background: '#0f172a', color: 'white', borderRadius: 999, padding: '7px 13px 7px 10px',
                boxShadow: '0 10px 26px -6px rgba(2,6,23,0.5)', fontSize: 11, fontWeight: 700,
              }}>
                <Smartphone size={12} /> To your phone
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ws-btn-primary, .ws-btn-secondary { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .ws-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(29,78,216,0.45); }
        .ws-btn-secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .ws-arrow { display: inline-flex; transition: transform 0.15s ease; }
        .ws-btn-primary:hover .ws-arrow { transform: translateX(3px); }
        .ws-hero-grid { grid-template-columns: minmax(280px, 1fr); justify-items: center; text-align: center; }
        .ws-hero-copy { display: flex; flex-direction: column; align-items: center; }
        @media (min-width: 860px) {
          .ws-hero-grid { grid-template-columns: minmax(360px, 1fr) minmax(360px, 420px); justify-items: stretch; text-align: left; }
          .ws-hero-copy { align-items: flex-start; }
        }
        @keyframes ws-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .ws-float { animation: ws-float 5.5s ease-in-out infinite; }
        @keyframes ws-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 70%, 100% { transform: scale(2.2); opacity: 0; } }
        .ws-pulse-dot { position: relative; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
        .ws-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #22c55e; animation: ws-pulse-ring 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ws-btn-primary, .ws-btn-secondary, .ws-arrow, .ws-float, .ws-pulse-dot::after { transition: none; animation: none; }
        }
        @media (min-width: 768px) {
          .ws-step-desc { text-align: justify; }
        }
        .ws-sample-callout { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .ws-sample-callout:hover { transform: translateY(-2px); box-shadow: 0 18px 46px rgba(15,23,42,0.22); }
        @media (prefers-reduced-motion: reduce) {
          .ws-sample-callout { transition: none; }
        }
      `}</style>

      {/* Sample design callout -- links to a real, live demo site instead of
          a screenshot, right after the hero where it gets seen. */}
      <div style={{ padding: '0 20px', marginTop: -28, position: 'relative', zIndex: 2 }}>
        <a
          href="/website-example"
          target="_blank"
          rel="noopener noreferrer"
          className="ws-sample-callout"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
            maxWidth: 780, margin: '0 auto', background: 'white', borderRadius: 14,
            padding: '18px 24px', textDecoration: 'none', boxShadow: '0 14px 40px rgba(15,23,42,0.16)', border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>See what your cleaning website could actually look like</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>A real, live example design — not just a mockup screenshot.</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: PRIMARY_GRADIENT, color: 'white', padding: '10px 18px', borderRadius: 9, fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>
            View Example Design <IconArrow size={14} color="white" />
          </span>
        </a>
      </div>

      {/* Why this matters -- a before/after split instead of another icon
          card grid (used everywhere else on the site), so the contrast
          itself does the persuading instead of three interchangeable cards. */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Why This Actually Matters</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>A Facebook page or Google listing alone isn't a cleaning website — and it's costing you jobs.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 0, borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}>
            <div style={{ background: '#f1f5f9', padding: 'clamp(24px, 5vw, 40px)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Without a cleaning website</div>
              {[
                'Homeowners can\'t find you when they search',
                'Missed calls become missed jobs',
                'Your only presence can vanish with one algorithm change',
              ].map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                  <span style={{ marginTop: 1 }}><IconX size={18} color="#94a3b8" /></span>
                  <span style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.55 }}>{line}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: 'clamp(24px, 5vw, 40px)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>With your own cleaning website</div>
              {[
                { Icon: Search, text: 'You show up like the established business you are' },
                { Icon: PhoneMissed, text: "Leads still reach you, even while you're out on a job" },
                { Icon: Globe, text: 'Something that\'s permanently yours — not rented from an algorithm' },
              ].map(({ Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={12} color="white" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 14.5, color: 'white', lineHeight: 1.55, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What's included */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Every Plan Includes</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>The foundation on all 3 plans. The chatbot, phone number, and lead app are add-ons on Growth and Pro — see pricing below.</p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(20px, 5vw, 32px)' }}>
            <Check>A custom cleaning website built for your business — designed to get you found on Google and bring in leads</Check>
            <Check>A domain name of your choice</Check>
            <Check>Fast, secure hosting, fully managed — nothing for you to set up</Check>
            <Check>Mobile-friendly design, since most of your visitors are on their phone</Check>
            <Check>A built-in lead capture form so visitors can request a free estimate right from your site</Check>
            <Check>Instant email alert every time that form is submitted — no lead sits unseen</Check>
            <Check>Priority support for ongoing changes — update text, info, or photos, or add pages, included in your plan</Check>
            <Check>No long-term contract — cancel anytime</Check>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Why This Beats Hiring a Web Designer</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.65 }}>A freelancer or agency hands you a finished site and disappears. This is built, hosted, and kept up to date for you, every month.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COMPARISON.map((row, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', fontWeight: 800, fontSize: 13.5, color: '#0f172a', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{row.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Freelancer / Agency</div>
                    <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ marginTop: 2, flexShrink: 0 }}><IconX /></span>{row.them}
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', background: '#eff6ff' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Clean Estimator</div>
                    <div style={{ fontSize: 13.5, color: '#1e3a8a', lineHeight: 1.65, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ marginTop: 2, flexShrink: 0 }}><IconCheck size={14} /></span>{row.us}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works -- grouped into two color-blocked stages (free preview,
          then paid) instead of one flat numbered list, so the "you don't pay
          until step 3" pitch is visible in the layout itself, not just the copy. */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 20, alignItems: 'stretch' }}>
            <div style={{ background: 'white', border: '2px solid #bbf7d0', borderRadius: 16, padding: 'clamp(20px, 5vw, 30px)', position: 'relative' }}>
              <div style={{ display: 'inline-block', background: '#dcfce7', color: '#15803d', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
                Stage 1 &middot; Free, no payment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <StepCard number="1" title="Apply and tell us about your business" desc="Fill out the form below with a few details about your cleaning business and what you'd want on your site." />
                <StepCard number="2" title="We build your cleaning website for you to review" desc="A live, working build of your site — built for you to look at, no payment involved." />
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', borderRadius: 16, padding: 'clamp(20px, 5vw, 30px)', boxShadow: '0 10px 30px rgba(37,99,235,0.25)' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
                Stage 2 &middot; Only if you approve
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>Like it? Pick your domain and subscribe</div>
                    <div className="ws-step-desc" style={{ fontSize: 14, color: '#dbeafe', lineHeight: 1.65 }}>Already own a domain? We'll use it. Starting fresh? We'll help you pick one. Just ${SETUP_FEE} here to approve — your first {FREE_MONTHS} months are free, and real billing doesn't start until month {FREE_MONTHS + 1}.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>Your site goes fully live</div>
                    <div className="ws-step-desc" style={{ fontSize: 14, color: '#dbeafe', lineHeight: 1.65 }}>Live on your domain, with every quote form lead emailed to you instantly — plus chat replies and call routing to your lead app if you picked Growth or Pro.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing -- 3 selectable tier cards (clicking one carries the
          selection down into the timeline card, value breakdown, and the
          apply form's own tier selector below) instead of one flat price. */}
      <div id="pricing" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>3 Plans, Zero Risk, 2 Months FREE</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>We build your site first — if you like it, you can approve it to go live for just ${SETUP_FEE}. You get {FREE_MONTHS} months free on any plan, and your first real charge isn't until month {FREE_MONTHS + 1}.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 18, marginBottom: 32 }}>
            {WEBSITE_PLAN_TIERS.map(tier => {
              const active = tier.id === selectedTierId;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', position: 'relative',
                    background: active ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' : 'white',
                    border: active ? '2px solid #1d4ed8' : '1.5px solid #e2e8f0',
                    borderRadius: 18, padding: 'clamp(18px, 4vw, 26px)',
                    boxShadow: active ? '0 14px 34px rgba(29,78,216,0.3)' : '0 2px 10px rgba(15,23,42,0.05)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {tier.recommended && (
                    <div style={{ position: 'absolute', top: -11, left: 20, background: active ? 'white' : PRIMARY_GRADIENT, color: active ? PRIMARY : 'white', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 11px', borderRadius: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: active ? '#bfdbfe' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{tier.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: active ? '#86efac' : '#16a34a', background: active ? 'rgba(74,222,128,0.18)' : '#dcfce7', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>2 Months FREE</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 'clamp(30px, 6vw, 38px)', fontWeight: 900, color: active ? 'white' : '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>${tier.price}</span>
                    <span style={{ fontSize: 13.5, color: active ? '#bfdbfe' : '#64748b', fontWeight: 600 }}>/mo</span>
                  </div>
                  <p style={{ fontSize: 13, color: active ? '#dbeafe' : '#64748b', lineHeight: 1.55, margin: '0 0 16px', minHeight: 40 }}>{tier.tagline}</p>
                  {tier.includesLabel && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: active ? '#93c5fd' : PRIMARY, marginBottom: 8 }}>{tier.includesLabel}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tier.addedFeatures.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ marginTop: 1 }}><IconCheck size={14} color={active ? '#4ade80' : '#16a34a'} bg={active ? 'rgba(74,222,128,0.2)' : '#dcfce7'} /></span>
                        <span style={{ fontSize: 12.5, color: active ? 'white' : '#374151', fontWeight: 500, lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, textAlign: 'center', padding: '9px 0', borderRadius: 9, fontSize: 12.5, fontWeight: 800, background: active ? 'rgba(255,255,255,0.15)' : '#f1f5f9', color: active ? 'white' : '#64748b' }}>
                    {active ? 'Selected' : 'Select This Plan'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ticket stub for the selected plan -- price half torn from the
              details half, so the chosen plan's timeline reads as a
              distinct moment on the page rather than another bordered box. */}
          <div style={{ maxWidth: 440, margin: '0 auto' }}>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 40px rgba(15,23,42,0.14)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: 'clamp(22px, 6vw, 30px) clamp(24px, 6vw, 36px) 26px' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#bfdbfe', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 20 }}>
                    <Sparkles size={12} /> {selectedTier.name} Plan &middot; {FREE_MONTHS} Months Free To Start
                  </div>
                </div>
                <div>
                  {pricingTimeline(selectedTier.price).map((step, i) => (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: 'white', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'white' }}>{step.label}</div>
                        <div style={{ fontSize: 11.5, color: '#bfdbfe' }}>{step.desc}</div>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>{step.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket-notch seam -- two circles matching the page background,
                  half-overlapping the card edges at the fold. */}
              <div style={{ position: 'relative', height: 0 }}>
                <div style={{ position: 'absolute', top: -10, left: -10, width: 20, height: 20, borderRadius: '50%', background: '#f8fafc' }} />
                <div style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, borderRadius: '50%', background: '#f8fafc' }} />
              </div>
              <div style={{ borderTop: '2px dashed #cbd5e1' }} />

              <div style={{ background: 'white', padding: 'clamp(22px, 5vw, 30px) clamp(24px, 6vw, 36px)', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22, textAlign: 'left' }}>
                  {selectedTier.features.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#374151', fontWeight: 600 }}>
                      <span style={{ marginTop: 1, flexShrink: 0 }}><IconCheck size={13} /></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="#apply"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '14px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 15.5, boxShadow: '0 8px 24px rgba(29,78,216,0.35)' }}
                >
                  Build My Free Sample Site →
                </a>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14, marginBottom: 0 }}>Free to see. Nothing to pay until you approve it.</p>
              </div>
            </div>

            {/* Value breakdown -- backs up the selected plan's price with
                what the same pieces cost bought separately, instead of just
                asserting it's a good deal. */}
            <div style={{ marginTop: 22, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Why ${selectedTier.price}/month is a deal</div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
                Piece the {selectedTier.name} plan together yourself with separate tools and it adds up fast:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {VALUE_BREAKDOWN_BY_TIER[selectedTierId].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                    <span>{row.label}</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.cost}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d' }}>Your {FREE_MONTHS} free months are worth</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#15803d', whiteSpace: 'nowrap' }}>${selectedTier.price * FREE_MONTHS}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d' }}>With Clean Estimator, all included</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d' }}>${selectedTier.price}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 36, textAlign: 'center' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { q: 'Do I have to pay before I see anything?', a: "No. After you apply, we build your actual cleaning website first, so you can see exactly what you'd be getting. You only subscribe and start paying once you've reviewed it and you're happy with it." },
              { q: "What's the difference between the 3 plans?", a: `Starter ($${getTierById('starter').price}/mo) gets you the website and a quote form that emails you instantly on every submission. Growth ($${getTierById('growth').price}/mo) adds an AI chatbot that can support visitors and emails you a summary of every conversation. Pro ($${getTierById('pro').price}/mo) adds a dedicated business phone number and a lead app where every chat, text, and inquiry lives — reply or call back right from it, and calls route straight there. You can pick any plan when you apply, and switch later.` },
              { q: 'Do I own the cleaning website?', a: "Your site is built and hosted as part of your active subscription — similar to how a lot of small business tools work. As long as your subscription is active, it's live and it's yours to use and point customers to. We'll walk through the specifics with you when you apply." },
              { q: 'Can I make changes to my website after it\'s live?', a: "Yes. Update your text, business info, or photos, or ask us to add a new page or section — it's included in your plan, with priority support so changes don't sit in a queue for weeks. Just send us what you'd like changed and we'll take care of it." },
              { q: 'What happens if I cancel?', a: "Your site (and the chatbot or lead app, if your plan included them) come down when the subscription ends — but if you'd rather manage things yourself after that, we'll help you move your website files to hosting of your choice. Just know the chatbot, lead app, and automatic quote-to-phone routing are part of the subscription, not the website files themselves, so recreating that on your own means piecing together separate hosting, chatbot software, and a CRM — the same cost breakdown we show above — plus someone to keep it all running if you're not planning to do that yourself. Most owners find it's simpler and cheaper to stay with us, but there's no long-term contract, so you're free to cancel anytime — we'd just rather talk first and see if something can be fixed." },
              { q: 'How does the AI chatbot work?', a: "On the Growth and Pro plans, your site gets a chat widget that uses AI to answer visitor questions and collect their name, contact info, and what they need — even when you're on a job or it's after hours. On Growth, you get an email summarizing each conversation. On Pro, every conversation also lands in your lead app, the same place you get texts and calls, so you can reply right from your phone. The Starter plan doesn't include the chatbot — just the quote form with instant email alerts." },
              { q: 'Can I use a domain I already own?', a: "Yes. If you already have a domain, we'll use it. If not, we'll help you pick one and get it set up as part of onboarding." },
              { q: 'Is there a setup fee?', a: `Just a $${SETUP_FEE} one-time setup fee once you approve your build — that's it, on any plan. Your first ${FREE_MONTHS} months are completely free, and you're only billed starting month ${FREE_MONTHS + 1} (${WEBSITE_PLAN_TIERS.map(t => `$${t.price}/mo on ${t.name}`).join(', ')}).` },
              { q: 'How long until my website build is ready?', a: "It depends on what your business needs. We'll give you a clear timeline once we understand your business and review your application. Your site goes fully live on your domain once you approve the build and subscribe." },
            ].map((item, i) => {
              const open = openFaqIndex === i;
              return (
                <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 2, boxShadow: '0 1px 4px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaqIndex(open ? -1 : i)}
                    aria-expanded={open}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.q}</span>
                    <ChevronDown size={18} color="#94a3b8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>
                  {open && (
                    <div style={{ padding: '0 22px 18px' }}>
                      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{item.a}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply form -- dark closing section with a "what to expect" sidebar
          next to the form instead of a lone centered card, so the risk-
          reversal pitch is visible right where someone decides to commit. */}
      <div id="apply" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'white', letterSpacing: '-0.4px', marginBottom: 12 }}>Get Your Free Sample Site</h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>Tell us a bit about your business and we'll build your website for you to review — no payment required until you approve it.</p>
          </div>
          {sent ? (
            <div style={{ maxWidth: 520, margin: '0 auto', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><IconSuccess /></div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#15803d', marginBottom: 8 }}>Application Sent!</div>
              <div style={{ fontSize: 15, color: '#166534' }}>We're building your cleaning website now — it'll be ready for you to review within 48 hours. No payment required until you approve it.</div>
            </div>
          ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 280px', maxWidth: 340, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 'clamp(22px, 5vw, 28px)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>What to expect</div>
              {[
                'No payment today — just fill out the form',
                'We review it and build your live website',
                'You review the build before deciding anything',
                `Like it? Approve it for just $${SETUP_FEE}`,
                `Then get ${FREE_MONTHS} months free`,
              ].map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.55 }}>{line}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={{ flex: '2 1 380px', minWidth: 0, background: 'white', borderRadius: 16, padding: 'clamp(18px, 5vw, 40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.25)' }}>
              {/* Honeypot -- off-screen, not display:none (some bots skip
                  display:none fields), never seen or reached by a real user. */}
              <input
                type="text"
                name="website2"
                value={form.website2}
                onChange={e => setForm(f => ({ ...f, website2: e.target.value }))}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                  <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="King David" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Name *</label>
                  <input required style={inputStyle} value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} placeholder="Sparkle Clean Co." />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email *</label>
                  <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@yourbusiness.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number *</label>
                  <input required type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 000-0000" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services You Offer</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {SERVICES_OFFERED.map(label => {
                      const active = form.servicesOffered.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleService(label)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px 7px 12px', borderRadius: 20,
                            background: active ? PRIMARY : 'white',
                            border: active ? 'none' : '1.5px solid #e2e8f0',
                            color: active ? 'white' : '#374151',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {active && <IconCheck size={12} color="white" bg="rgba(255,255,255,0.25)" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <input style={inputStyle} value={form.otherServices} onChange={e => setForm(f => ({ ...f, otherServices: e.target.value }))} placeholder="Offer something not listed? Add it here (e.g. Pressure Washing, Window Cleaning)" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cleaning Business Address *</label>
                  <input required style={inputStyle} value={form.businessAddress} onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))} placeholder="123 Main St, Austin, TX 78701" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Areas *</label>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>Cities or areas you actually serve, so we can list them on your site.</p>
                  <input required style={inputStyle} value={form.serviceAreas} onChange={e => setForm(f => ({ ...f, serviceAreas: e.target.value }))} placeholder="e.g. Austin, Round Rock, Cedar Park" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Domain Names</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasDomain} onChange={e => setForm(f => ({ ...f, hasDomain: e.target.checked }))} style={{ width: 16, height: 16 }} />
                    I already have a domain
                  </label>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{form.hasDomain ? 'Add it below under Current Cleaning Website.' : 'Give us at least 3 ideas in case your first choice is taken — #1 is your priority.'}</p>
                  {!form.hasDomain && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input style={inputStyle} value={form.domain1} onChange={e => setForm(f => ({ ...f, domain1: e.target.value }))} placeholder="1st choice (priority) — e.g. sparklecleanco.com" />
                      <input style={inputStyle} value={form.domain2} onChange={e => setForm(f => ({ ...f, domain2: e.target.value }))} placeholder="2nd choice" />
                      <input style={inputStyle} value={form.domain3} onChange={e => setForm(f => ({ ...f, domain3: e.target.value }))} placeholder="3rd choice" />
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 2px' }}>At least one of the two below is required -- if you have a website, your Facebook page/profile is optional, and vice versa.</p>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Cleaning Website</label>
                  <input style={inputStyle} value={form.currentWebsite} onChange={e => setForm(f => ({ ...f, currentWebsite: e.target.value }))} placeholder="e.g. sparklecleanco.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facebook Page/Profile</label>
                  <input style={inputStyle} value={form.facebookPage} onChange={e => setForm(f => ({ ...f, facebookPage: e.target.value }))} placeholder="https://facebook.com/yourpage or your profile URL" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tell Us About Your Business</label>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>Your story, how you got started, who founded it — anything you'd want visitors to know about you.</p>
                  <textarea rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="e.g. Founded in 2019 by... We started because... What makes us different is..." />
                </div>
              </div>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#dc2626', marginBottom: 14 }}>{error}</div>
              )}
              <button type="submit" disabled={sending} style={{ width: '100%', background: sending ? '#93c5fd' : PRIMARY_GRADIENT, color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s', boxShadow: sending ? 'none' : '0 8px 22px rgba(29,78,216,0.35)' }}>
                {sending ? 'Sending...' : <> Request Cleaning Website <IconArrow size={18} color="white" /> </>}
              </button>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 14, marginBottom: 0 }}>We'll follow up within 48 hours with your live website build — you won't be charged until you approve it.</p>
            </form>
          </div>
          )}
        </div>
      </div>

      <ThankYouModal open={showThankYou} onClose={() => setShowThankYou(false)} />
    </>
  );
}
