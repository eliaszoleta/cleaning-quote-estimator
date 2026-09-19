import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Globe, Search, PhoneMissed } from 'lucide-react';
import { formatPhoneInput } from '../../utils/formatPhone';
import { postWebsiteRequest } from '../../utils/api';

const PRIMARY = '#2563eb';
const PRIMARY_GRADIENT = '#1d4ed8';
const MONTHLY_PRICE = 249;

// What the same stack costs bought piecemeal -- backs up the $249 price
// instead of just asserting it's a good deal.
const VALUE_BREAKDOWN = [
  { label: 'Cleaning website builder / hosting', cost: '$20-40/mo' },
  { label: 'AI chatbot software', cost: '$150-300/mo' },
  { label: 'Text-message lead notifications', cost: '$50-100/mo' },
  { label: 'Lead capture forms & CRM', cost: '$100+/mo' },
];

// Same 9 services offered elsewhere on the site (ServiceSelect.js,
// ServicesTab.js) -- kept as plain labels here since this form is just
// collecting what to put on the site, not tied to the calculator's
// configKey/pricing logic.
const SERVICES_OFFERED = [
  'House Cleaning', 'Apartment Cleaning', 'Commercial Cleaning', 'Carpet Cleaning',
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
    us: 'Ongoing updates and maintenance are included in your monthly rate — no extra invoices.',
  },
  {
    label: 'Capturing leads',
    them: "Most sites are just a digital brochure — no way to catch a visitor who doesn't call.",
    us: 'An AI chatbot engages visitors and captures their info the moment they land, day or night.',
  },
  {
    label: 'Replying to leads on the go',
    them: "New lead notifications go to an inbox you check when you remember to.",
    us: "A mobile app puts every quote-request and text conversation in your pocket — see it, reply to it, right from your phone.",
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
  const [form, setForm] = useState({
    name: '', business: '', email: '', phone: '', servicesOffered: [], otherServices: '',
    businessAddress: '', serviceAreas: '',
    hasDomain: false, domain1: '', domain2: '', domain3: '', currentWebsite: '', facebookPage: '', message: '',
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
    setSending(true);
    setError('');
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
        <title>Cleaning Website + AI Chatbot for Cleaning Companies | Clean Estimator</title>
        <meta name="description" content={`Get a professional cleaning website with an AI chatbot built, hosted, and maintained for your cleaning business — $${MONTHLY_PRICE}/month flat, no upfront cost.`} />
        <link rel="canonical" href="https://www.cleanestimator.com/website-for-cleaning-companies" />
      </Helmet>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(40px, 9vw, 96px) 20px clamp(48px, 9vw, 110px)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
            Cleaning Website + AI Chatbot
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, lineHeight: 1.3, marginBottom: 16, letterSpacing: '-0.5px' }}>
            A Professional Cleaning Website, Built and Hosted for You —<br />
            <span style={{ color: '#60a5fa', fontSize: '0.68em', fontWeight: 700 }}>With an AI Chatbot Capturing Leads 24/7</span>
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.55 }}>
            No cleaning website yet? We build it, host it, and hand you a chatbot that answers visitors and captures leads while you're out on a job — for one flat monthly rate, no big upfront cost.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
            <a href="#apply" className="ws-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
              Get My Free Website Build <span className="ws-arrow"><IconArrow size={16} color="white" /></span>
            </a>
          </div>
          <p style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
            We build your site first — you don't pay until you've seen and approved it.
          </p>
        </div>
      </div>

      <style>{`
        .ws-btn-primary, .ws-btn-secondary { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .ws-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(29,78,216,0.45); }
        .ws-btn-secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .ws-arrow { display: inline-flex; transition: transform 0.15s ease; }
        .ws-btn-primary:hover .ws-arrow { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .ws-btn-primary, .ws-btn-secondary, .ws-arrow { transition: none; }
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
                { Icon: PhoneMissed, text: "A chatbot catches leads while you're out on a job" },
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
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>What's Included</h2>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(20px, 5vw, 32px)' }}>
            <Check>A custom cleaning website built for your business — not a generic template</Check>
            <Check>A domain name of your choice</Check>
            <Check>Fast, secure hosting, fully managed — nothing for you to set up</Check>
            <Check>Mobile-friendly design, since most of your visitors are on their phone</Check>
            <Check>An AI chatbot that engages visitors and captures their contact info automatically</Check>
            <Check>A built-in lead capture form so visitors can request a free estimate right from your site</Check>
            <Check>A mobile app so you get a text the moment a new lead comes in from your quote form — and can reply right from your phone</Check>
            <Check>Ongoing updates and maintenance — no separate invoice every time something needs to change</Check>
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
                    <div className="ws-step-desc" style={{ fontSize: 14, color: '#dbeafe', lineHeight: 1.65 }}>Already own a domain? We'll use it. Starting fresh? We'll help you pick one. Billing only starts here.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>Your site and chatbot go fully live</div>
                    <div className="ws-step-desc" style={{ fontSize: 14, color: '#dbeafe', lineHeight: 1.65 }}>Live on your domain, chatbot active, capturing leads around the clock.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing -- a "ticket stub" card (price half torn from the details
          half) instead of the plain centered price card used elsewhere, so
          this reads as a distinct moment on the page rather than another
          bordered box. */}
      <div id="pricing" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Simple, Flat Pricing</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>No setup fee. No surprise invoices. Cancel anytime.</p>
          </div>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 40px rgba(15,23,42,0.14)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: 'clamp(24px, 6vw, 34px) clamp(24px, 6vw, 36px) 30px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#bfdbfe', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>
                Pay only after you approve
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
                <span style={{ fontSize: 'clamp(36px, 9vw, 52px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1 }}>${MONTHLY_PRICE}</span>
                <span style={{ fontSize: 15, color: '#bfdbfe', fontWeight: 500 }}>/month</span>
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
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginBottom: 22 }}>
                {['Cleaning website + hosting', 'AI chatbot', 'Lead capture forms', 'Mobile app for texts', 'Ongoing updates', 'Cancel anytime'].map(item => (
                  <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    <IconCheck size={13} /> {item}
                  </span>
                ))}
              </div>
              <a
                href="#apply"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '14px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 15.5, boxShadow: '0 8px 24px rgba(29,78,216,0.35)' }}
              >
                Get My Free Website Build →
              </a>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14, marginBottom: 0 }}>You won't be charged until you've seen and approved your build.</p>
            </div>
          </div>

          {/* Value breakdown -- backs up $249 with what the same pieces cost
              bought separately, instead of just asserting it's a good deal. */}
          <div style={{ marginTop: 22, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 'clamp(18px, 4vw, 24px)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Why ${MONTHLY_PRICE}/month is a deal</div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
              Piece this together yourself with separate tools and it adds up fast:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {VALUE_BREAKDOWN.map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                  <span>{row.label}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.cost}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Bought separately</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#94a3b8', textDecoration: 'line-through' }}>$320-540+/mo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d' }}>With Clean Estimator, all included</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d' }}>${MONTHLY_PRICE}/mo</span>
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
              { q: 'Do I own the cleaning website?', a: "Your site is built and hosted as part of your active subscription — similar to how a lot of small business tools work. As long as your subscription is active, it's live and it's yours to use and point customers to. We'll walk through the specifics with you when you apply." },
              { q: 'What happens if I cancel?', a: "Your cleaning website and chatbot come down when the subscription ends. There's no long-term contract, so you're free to cancel anytime — we'd just rather talk first and see if something can be fixed." },
              { q: 'How does the chatbot work?', a: "It sits on your cleaning website, ready to answer visitor questions and collect their name, contact info, and what they need — even when you're on a job or it's after hours. New leads land in your mobile app, so you can reply right away." },
              { q: 'Can I use a domain I already own?', a: "Yes. If you already have a domain, we'll use it. If not, we'll help you pick one and get it set up as part of onboarding." },
              { q: 'Is there a setup fee?', a: 'No. It\'s one flat monthly rate — no setup fee, no separate build cost.' },
              { q: 'How long until my website build is ready?', a: "It depends on what your business needs. We'll give you a clear timeline once we understand your business and review your application. Your site goes fully live on your domain once you approve the build and subscribe." },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', marginBottom: 2, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 8 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply form -- dark closing section with a "what to expect" sidebar
          next to the form instead of a lone centered card, so the risk-
          reversal pitch is visible right where someone decides to commit. */}
      <div id="apply" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'white', letterSpacing: '-0.4px', marginBottom: 12 }}>Get My Free Website Build</h2>
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
                'Only then do you pick a domain and subscribe',
              ].map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.55 }}>{line}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={{ flex: '2 1 380px', minWidth: 0, background: 'white', borderRadius: 16, padding: 'clamp(18px, 5vw, 40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                  <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
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
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                  <input type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 000-0000" />
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
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cleaning Business Address</label>
                  <input style={inputStyle} value={form.businessAddress} onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))} placeholder="123 Main St, Austin, TX 78701" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Areas</label>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>Cities or areas you actually serve, so we can list them on your site.</p>
                  <input style={inputStyle} value={form.serviceAreas} onChange={e => setForm(f => ({ ...f, serviceAreas: e.target.value }))} placeholder="e.g. Austin, Round Rock, Cedar Park" />
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

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Cleaning Website (if any)</label>
                  <input style={inputStyle} value={form.currentWebsite} onChange={e => setForm(f => ({ ...f, currentWebsite: e.target.value }))} placeholder="e.g. sparklecleanco.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facebook Page</label>
                  <input style={inputStyle} value={form.facebookPage} onChange={e => setForm(f => ({ ...f, facebookPage: e.target.value }))} placeholder="https://facebook.com/..." />
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
