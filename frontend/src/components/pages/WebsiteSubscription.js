import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Globe, Search, PhoneMissed } from 'lucide-react';
import { formatPhoneInput } from '../../utils/formatPhone';

const PRIMARY = '#2563eb';
const PRIMARY_GRADIENT = '#1d4ed8';
const WEB3FORMS_KEY = 'b0da3f48-9982-4a5a-9195-4200a80ba8c6';
const MONTHLY_PRICE = 197;

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
    us: 'An AI chatbot (powered by GoHighLevel) engages visitors and captures their info the moment they land, day or night.',
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', business: '', email: '', phone: '', servicesOffered: [],
    domain1: '', domain2: '', domain3: '', currentWebsite: '', message: '',
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
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Website + Chatbot Subscription Inquiry - Clean Estimator',
          from_name: form.name,
          name: form.name,
          business: form.business,
          email: form.email,
          phone: form.phone || 'Not provided',
          services_offered: form.servicesOffered.length ? form.servicesOffered.join(', ') : 'Not specified',
          domain_1st_choice: form.domain1 || 'Not provided',
          domain_2nd_choice: form.domain2 || 'Not provided',
          domain_3rd_choice: form.domain3 || 'Not provided',
          current_website: form.currentWebsite || 'None',
          message: form.message || 'No additional message',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError('Something went wrong. Please try again or email us directly at info@cleanestimator.com');
      }
    } catch {
      setError('Network error. Please try again or email us directly at info@cleanestimator.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Website + AI Chatbot for Cleaning Companies | Clean Estimator</title>
        <meta name="description" content={`Get a professional website with an AI chatbot built, hosted, and maintained for your cleaning business — $${MONTHLY_PRICE}/month flat, no upfront cost. Powered by GoHighLevel.`} />
        <link rel="canonical" href="https://www.cleanestimator.com/website-for-cleaning-companies" />
      </Helmet>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(40px, 9vw, 96px) 20px clamp(48px, 9vw, 110px)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 44, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #818cf8)', margin: '0 auto 22px' }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
            Website + AI Chatbot
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4.6vw,46px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-1px' }}>
            A Professional Website, Built and Hosted for You —<br />
            <span style={{ color: '#60a5fa' }}>With an AI Chatbot Capturing Leads 24/7</span>
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.5 }}>
            No website yet? We build it, host it, and hand you a chatbot that answers visitors and captures leads while you're out on a job — for one flat monthly rate, no big upfront cost.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#apply" className="ws-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
              Apply Now <span className="ws-arrow"><IconArrow size={16} color="white" /></span>
            </a>
            <a href="#pricing" className="ws-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15.5, border: '1px solid rgba(255,255,255,0.15)' }}>
              See Pricing
            </a>
          </div>
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
      `}</style>

      {/* Why this matters */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Why This Actually Matters</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>A Facebook page or Google listing alone isn't a website — and it's costing you jobs.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(12px, 3vw, 20px)' }}>
            {[
              { Icon: Search, title: 'People search before they call', body: 'Homeowners look a business up before hiring — no website (or an outdated one) reads as less established than a competitor who has one.' },
              { Icon: PhoneMissed, title: 'Missed calls are missed jobs', body: "You're on a job, phone's off, and a lead moves on to the next result. A chatbot on your site can catch that visitor instead." },
              { Icon: Globe, title: 'You need something you control', body: "A social page can get flagged, restricted, or buried by an algorithm change. A website is yours to point people to, always." },
            ].map((card, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: 'clamp(18px, 5vw, 28px) clamp(16px, 4vw, 24px)', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 'clamp(40px, 11vw, 52px)', height: 'clamp(40px, 11vw, 52px)', background: '#eff6ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(10px, 3vw, 16px)' }}>
                  <card.Icon size={22} color={PRIMARY} strokeWidth={2} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(14.5px, 3.8vw, 16px)', color: '#0f172a', marginBottom: 'clamp(5px, 1.5vw, 8px)' }}>{card.title}</div>
                <div style={{ fontSize: 'clamp(12.5px, 3.4vw, 14px)', color: '#64748b', lineHeight: 1.6 }}>{card.body}</div>
              </div>
            ))}
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
            <Check>A custom website built for your cleaning business — not a generic template</Check>
            <Check>A domain name of your choice</Check>
            <Check>Fast, secure hosting, fully managed — nothing for you to set up</Check>
            <Check>Mobile-friendly design, since most of your visitors are on their phone</Check>
            <Check>An AI chatbot, powered by GoHighLevel, that engages visitors and captures their contact info automatically</Check>
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

      {/* How it works */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>How It Works</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <StepCard number="1" title="Apply and tell us about your business" desc="Fill out the form below with a few details about your cleaning business and what you'd want on your site." />
            <StepCard number="2" title="We build your site and set up your chatbot" desc="We design and build your website and configure your AI chatbot so it's ready to answer visitors and capture their info." />
            <StepCard number="3" title="You pick your domain" desc="Already own one? We'll use it. Starting fresh? We'll help you pick and set up a domain name for your business." />
            <StepCard number="4" title="Your site goes live" desc="Once everything's set up, your website and chatbot go live and start working for you around the clock." />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Simple, Flat Pricing</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>No setup fee. No surprise invoices. Cancel anytime.</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 'clamp(24px, 6vw, 36px)', textAlign: 'center', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
              <span style={{ fontSize: 'clamp(36px, 9vw, 52px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>${MONTHLY_PRICE}</span>
              <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/month</span>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Website, hosting, chatbot, and ongoing updates — all included</p>
            <a
              href="#apply"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '14px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 15.5, boxShadow: '0 8px 24px rgba(29,78,216,0.35)' }}
            >
              Apply Now →
            </a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 36, textAlign: 'center' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { q: 'Do I own the website?', a: "Your site is built and hosted as part of your active subscription — similar to how a lot of small business tools work. As long as your subscription is active, it's live and it's yours to use and point customers to. We'll walk through the specifics with you when you apply." },
              { q: 'What happens if I cancel?', a: "Your website and chatbot come down when the subscription ends. There's no long-term contract, so you're free to cancel anytime — we'd just rather talk first and see if something can be fixed." },
              { q: 'How does the chatbot work?', a: "It's powered by GoHighLevel and sits on your website, ready to answer visitor questions and collect their name, contact info, and what they need — even when you're on a job or it's after hours." },
              { q: 'Can I use a domain I already own?', a: "Yes. If you already have a domain, we'll use it. If not, we'll help you pick one and get it set up as part of onboarding." },
              { q: 'Is there a setup fee?', a: 'No. It\'s one flat monthly rate — no setup fee, no separate build cost.' },
              { q: 'How long until my site is live?', a: "It depends on what your business needs. We'll give you a clear timeline once we understand your site and review your application." },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', marginBottom: 2, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 8 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply form */}
      <div id="apply" style={{ padding: 'clamp(40px, 8vw, 80px) 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 12 }}>Apply for Your Website</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>Tell us a bit about your business and we'll follow up to confirm details and get you set up.</p>
          </div>
          {sent ? (
            <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><IconSuccess /></div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#15803d', marginBottom: 8 }}>Application Sent!</div>
              <div style={{ fontSize: 15, color: '#166534' }}>We'll review your application and follow up to get your website and chatbot set up.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(18px, 5vw, 40px)' }}>
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
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Phone Number</label>
                  <input type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 000-0000" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services You Offer</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Domain Names</label>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>Give us at least 3 ideas in case your first choice is taken — #1 is your priority.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} value={form.domain1} onChange={e => setForm(f => ({ ...f, domain1: e.target.value }))} placeholder="1st choice (priority) — e.g. sparklecleanco.com" />
                    <input style={inputStyle} value={form.domain2} onChange={e => setForm(f => ({ ...f, domain2: e.target.value }))} placeholder="2nd choice" />
                    <input style={inputStyle} value={form.domain3} onChange={e => setForm(f => ({ ...f, domain3: e.target.value }))} placeholder="3rd choice" />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Website (if any)</label>
                  <input style={inputStyle} value={form.currentWebsite} onChange={e => setForm(f => ({ ...f, currentWebsite: e.target.value }))} placeholder="https://... or Facebook page link" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tell us about your business</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="What you'd want on your site, service area, questions..." />
                </div>
              </div>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#dc2626', marginBottom: 14 }}>{error}</div>
              )}
              <button type="submit" disabled={sending} style={{ width: '100%', background: sending ? '#93c5fd' : PRIMARY_GRADIENT, color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s', boxShadow: sending ? 'none' : '0 8px 22px rgba(29,78,216,0.35)' }}>
                {sending ? 'Sending...' : <> Send My Application <IconArrow size={18} color="white" /> </>}
              </button>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 14, marginBottom: 0 }}>We'll follow up within 48 hours to confirm details and get started.</p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
