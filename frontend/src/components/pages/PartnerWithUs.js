import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { formatPhoneInput } from '../../utils/formatPhone';
import { getAllStates, getStateByCode } from '../../data/statePricing';
import { getCityTier, POPULATION_THRESHOLD, MAJOR_CITY_PRICE, MINOR_CITY_PRICE } from '../../data/partnerCityTiers';
import CityTierBrowser, { STATES_WITH_CITIES } from '../partners/CityTierBrowser';
import PartnerGallery from '../partners/PartnerGallery';
import { PartnerBannerCard } from '../partners/FloatingPartnerBanner';

const PRIMARY = '#2563eb';
const PRIMARY_GRADIENT = '#1d4ed8';
const WEB3FORMS_KEY = 'b0da3f48-9982-4a5a-9195-4200a80ba8c6';

// Same sample data /partner-demo uses -- a generic "SC" mark inlined as a
// data URI so the hero mockup doesn't depend on an external image file.
const SAMPLE_LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><circle cx='48' cy='48' r='48' fill='%232563eb'/><text x='48' y='49' font-family='Arial,Helvetica,sans-serif' font-size='36' font-weight='800' fill='white' text-anchor='middle' dominant-baseline='middle'>SC</text></svg>";
const SAMPLE_PARTNER = {
  id: 'demo',
  business_name: 'Sparkle Clean Co.',
  address: '123 Main St, Austin, TX',
  phone: '(555) 123-4567',
  website: 'https://example.com',
  logo_url: SAMPLE_LOGO,
};

const IconHome = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconPin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconWallet = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 12h2" />
    <path d="M2 9h20" />
  </svg>
);

const IconCheck = ({ size = 18, color = '#16a34a', bg = '#dcfce7' }) => (
  <div style={{ width: size + 4, height: size + 4, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={size - 4} height={size - 4} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="1.5,6 4.5,9 10.5,3" />
    </svg>
  </div>
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

const IconX = ({ size = 15, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Row-by-row contrast for the "Why This Beats Paid Ads" table below --
// pulled from claims already made elsewhere on this page (exclusive
// placement, flat pricing, no setup work) so the comparison doesn't
// introduce anything the rest of the page doesn't already back up.
const AD_COMPARISON = [
  {
    label: 'Targeting',
    ads: "Broad keyword or demographic guesses — you're paying to reach anyone who might be searching, not confirmed intent.",
    us: 'Only shown to visitors who already priced out your exact service in your exact city — proven intent, not a guess.',
  },
  {
    label: 'Cost model',
    ads: 'Pay per click whether it converts or not, and rates climb as more businesses bid on the same keywords.',
    us: 'One flat monthly rate per city. Unlimited views, calls, and leads — the price never moves no matter how well it performs.',
  },
  {
    label: 'Competition',
    ads: 'Your ad sits next to several competitors bidding on the exact same search — the homeowner picks whoever looks best that second.',
    us: "Exclusive placement. You're the only cleaning business shown in your city — no competing listing next to yours, ever.",
  },
  {
    label: "How it's shown",
    ads: 'Labeled "Ad," often skipped, and blocked outright by ad blockers for a growing share of visitors.',
    us: 'Shown as a recommended local cleaner right alongside their price estimate — not flagged as an ad, and immune to ad blockers.',
  },
  {
    label: 'Setup & upkeep',
    ads: 'Keyword research, bid management, ad copy testing, ongoing optimization — usually a part-time job on its own.',
    us: 'We set up your listing for you. No campaigns to manage, no bids to monitor, no ad copy to write.',
  },
];

// The hero's "product shot" -- a fake browser chrome around a generic page
// backdrop, with the *actual* PartnerBannerCard component (fixed={false},
// same sample data as /partner-demo) pinned in the corner. This is the
// real banner design, not a redrawn approximation, so it stays accurate
// if that component ever changes.
function PartnerPreview() {
  return (
    <div className="pw-float" style={{ position: 'relative' }}>
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 70px -20px rgba(2,6,23,0.55), 0 8px 20px rgba(2,6,23,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fca5a5' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fcd34d' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
          <div style={{ marginLeft: 10, flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#94a3b8' }}>
            cleanestimator.com
          </div>
        </div>
        {/* Generic page backdrop -- just enough to read as "a page," since
            the actual point of this mockup is the banner sitting on it. */}
        <div style={{ position: 'relative', padding: '24px 22px', minHeight: 280 }}>
          <div style={{ width: '70%', height: 14, borderRadius: 4, background: '#e2e8f0', marginBottom: 12 }} />
          <div style={{ width: '90%', height: 9, borderRadius: 4, background: '#f1f5f9', marginBottom: 8 }} />
          <div style={{ width: '80%', height: 9, borderRadius: 4, background: '#f1f5f9', marginBottom: 8 }} />
          <div style={{ width: '85%', height: 9, borderRadius: 4, background: '#f1f5f9', marginBottom: 24 }} />
          <div style={{ width: '60%', height: 9, borderRadius: 4, background: '#f1f5f9', marginBottom: 8 }} />
          <div style={{ width: '75%', height: 9, borderRadius: 4, background: '#f1f5f9' }} />

          <PartnerBannerCard partner={SAMPLE_PARTNER} isMobile={false} fixed={false} onDismiss={() => {}} onCallClick={() => {}} />
        </div>
      </div>

      {/* Floating exclusivity chip */}
      <div style={{
        position: 'absolute', left: -18, bottom: -22, display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', borderRadius: 12, padding: '11px 16px 11px 12px',
        boxShadow: '0 14px 32px -8px rgba(2,6,23,0.35)', border: '1px solid #f1f5f9',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MapPin size={14} color={PRIMARY} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Exclusive in this city</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94a3b8' }}>
            <span className="pw-pulse-dot" /> Only 1 partner per city
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ number, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 20px', minWidth: 0 }}>
      {/* Floor lowered from 36px -- on a narrow phone, a 2-column grid cell
          (roughly 155px wide after padding) can't fit "$175-$350" at a
          36px-minimum font size, so it overflowed straight past the cell's
          own padding to the edge of the screen. */}
      <div style={{ fontSize: 'clamp(22px, 6vw, 52px)', fontWeight: 900, color: PRIMARY, lineHeight: 1, letterSpacing: '-2px' }}>{number}</div>
      <div style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: PRIMARY_GRADIENT, color: 'white', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(29,78,216,0.3)' }}>{number}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{desc}</div>
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

const ALL_STATES = getAllStates();
const EMPTY_ROW = { state: '', city: '', customCity: false, customText: '' };

export default function PartnerWithUs() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', message: '' });
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);

  const citiesForState = (stateCode) => stateCode ? (STATES_WITH_CITIES.find(s => s.code === stateCode)?.cities || []) : [];

  const updateRow = (index, field, value) => {
    setRows(list => list.map((r, i) => {
      if (i !== index) return r;
      if (field === 'state') return { ...EMPTY_ROW, state: value };
      if (field === 'city') {
        if (value === '__other__') return { ...r, city: '', customCity: true, customText: '' };
        return { ...r, city: value, customCity: false, customText: '' };
      }
      return { ...r, [field]: value };
    }));
  };

  const addRow = () => setRows(list => [...list, { ...EMPTY_ROW }]);
  const removeRow = (index) => setRows(list => list.filter((_, i) => i !== index));

  // A row counts once it has a state and either a picked city or typed
  // custom-city text -- resolved here (rather than stored per-row) so
  // editing the dropdown always reflects the latest tier price/name.
  const cityList = rows
    .filter(r => r.state && (r.city || r.customText.trim()))
    .map(r => {
      const city = r.customCity ? r.customText.trim() : r.city;
      const stateObj = getStateByCode(r.state);
      return { city, stateCode: r.state, stateName: stateObj ? stateObj.name : r.state, tierInfo: getCityTier(city, r.state) };
    });

  const monthlyTotal = cityList.reduce((sum, c) => sum + (c.tierInfo ? c.tierInfo.price : 0), 0);
  const unmatchedCities = cityList.filter(c => !c.tierInfo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cityList.length === 0) {
      setError('Add at least one city before submitting.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const citiesSummary = cityList
        .map(c => `${c.city}, ${c.stateCode}${c.tierInfo ? ` (${c.tierInfo.tier === 'major' ? 'Major' : 'Minor'} — $${c.tierInfo.price}/mo)` : ' (tier to confirm)'}`)
        .join('; ');
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Partnership Inquiry - Clean Estimator',
          from_name: form.name,
          name: form.name,
          business: form.business,
          email: form.email,
          phone: form.phone || 'Not provided',
          cities: citiesSummary,
          estimated_monthly_total: unmatchedCities.length ? `$${monthlyTotal}+/mo (some cities need manual tier confirmation)` : `$${monthlyTotal}/mo`,
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

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white' };

  return (
    <>
      <Helmet>
        <title>Partner With Us | Clean Estimator</title>
        <meta name="description" content="Get your cleaning business recommended to thousands of homeowners actively searching for cleaning services in your city. Join Clean Estimator's partner network from $175/month per city (major metros are $350/month) — sitewide placement, multi-city support, and a free performance dashboard included." />
      </Helmet>

      {/* Hero -- same treatment as the estimator sales page: a restrained
          accent line + eyebrow instead of relying on size/weight alone, a
          two-column layout, and a static "product shot" showing exactly
          what a visitor sees (their estimate, then the partner's listing
          recommended right below it) instead of only describing it. */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: '96px 24px 110px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ width: 44, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #818cf8)', marginBottom: 22 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18 }}>
              Local partner program
            </div>
            <h1 style={{ fontSize: 'clamp(30px,4.6vw,46px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-1px' }}>
              Get recommended to thousands of homeowners<br />
              <span style={{ color: '#60a5fa' }}>ready to hire a cleaner</span>
            </h1>
            <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 480, marginBottom: 14, lineHeight: 1.65 }}>
              Clean Estimator gets <strong style={{ color: 'white' }}>20&ndash;30K organic visits a month</strong> from homeowners actively pricing out a cleaning job, not casual browsers.
            </p>
            <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 480, marginBottom: 32, lineHeight: 1.65 }}>
              Many of those leads go to waste in cities where we don&rsquo;t yet have a cleaning partner.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#apply" className="pw-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15.5, boxShadow: '0 10px 28px rgba(29,78,216,0.4)' }}>
                Get My City <span className="pw-arrow"><IconArrow size={16} color="white" /></span>
              </a>
              <a href="/partner-demo" className="pw-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', color: 'white', padding: '15px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                See Live Demo
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 380 }}>
              <PartnerPreview />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pw-btn-primary, .pw-btn-secondary { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .pw-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(29,78,216,0.45); }
        .pw-btn-secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .pw-arrow { display: inline-flex; transition: transform 0.15s ease; }
        .pw-btn-primary:hover .pw-arrow { transform: translateX(3px); }
        @keyframes pw-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .pw-float { animation: pw-float 5s ease-in-out infinite; }
        @keyframes pw-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 70%, 100% { transform: scale(2.1); opacity: 0; } }
        .pw-pulse-dot { position: relative; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
        .pw-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #22c55e; animation: pw-pulse-ring 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pw-float, .pw-pulse-dot::after { animation: none; }
          .pw-btn-primary, .pw-btn-secondary, .pw-arrow { transition: none; }
        }
      `}</style>

      {/* Stats bar */}
      <div style={{ borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <StatBadge number="20K+" label="Monthly visitors, growing" />
          <StatBadge number="100%" label="Organic, targeted traffic" />
          <StatBadge number="1" label="Partner per city" />
          <StatBadge number="$175-$350" label="Per city / month" />
        </div>
      </div>

      {/* Proof gallery */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>See It In Action</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 540, margin: '0 auto' }}>Real placements, real Google rankings, real traffic — not promises.</p>
          </div>
          <PartnerGallery />
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/partner-demo" style={{ color: PRIMARY, fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}>
              Don't just take our word for it — try the live demo →
            </a>
          </div>
        </div>
      </div>

      {/* Why it works */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>Why This Traffic Converts</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>Most advertising reaches people who aren&apos;t looking. Our visitors are different.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(12px, 3vw, 20px)' }}>
            {[
              { icon: <IconHome />, title: 'They already want the service', body: 'Every visitor used our estimator to price out a cleaning job. They came here because they need a cleaner &mdash; not because an ad interrupted them.' },
              { icon: <IconPin />, title: 'They give us their location', body: 'Users enter their ZIP code or city to get an accurate local estimate. We know exactly where they are and match them to you.' },
              { icon: <IconWallet />, title: 'They have a budget', body: "Our estimator gives them a price range. By the time they see your recommendation, they already know what to expect to pay and they're ready to book." },
            ].map((card, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: 'clamp(18px, 5vw, 28px) clamp(16px, 4vw, 24px)', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 'clamp(40px, 11vw, 52px)', height: 'clamp(40px, 11vw, 52px)', background: '#eff6ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(10px, 3vw, 16px)' }}>{card.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(14.5px, 3.8vw, 16px)', color: '#0f172a', marginBottom: 'clamp(5px, 1.5vw, 8px)' }}>{card.title}</div>
                <div style={{ fontSize: 'clamp(12.5px, 3.4vw, 14px)', color: '#64748b', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: card.body }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why not ads */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>Why This Beats Paid Ads</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.65 }}>Google and Facebook ads charge you for attention, whether it converts or not. This charges you for exclusive placement in front of people who already want a cleaner.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 640, display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: 1, background: '#e2e8f0', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#f8fafc' }} />
              <div style={{ background: '#f1f5f9', padding: '14px 16px', fontWeight: 800, fontSize: 12.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>Search &amp; Social Ads</div>
              <div style={{ background: PRIMARY_GRADIENT, padding: '14px 16px', fontWeight: 800, fontSize: 12.5, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>Clean Estimator Partnership</div>
              {AD_COMPARISON.map((row, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: 'white', padding: '16px', fontWeight: 700, fontSize: 13.5, color: '#0f172a', display: 'flex', alignItems: 'center' }}>{row.label}</div>
                  <div style={{ background: 'white', padding: '16px', fontSize: 13, color: '#64748b', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 2, flexShrink: 0 }}><IconX /></span>{row.ads}
                  </div>
                  <div style={{ background: '#eff6ff', padding: '16px', fontSize: 13, color: '#1e3a8a', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 2, flexShrink: 0 }}><IconCheck size={14} /></span>{row.us}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>How the Partnership Works</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <StepCard number="1" title="You choose your city (or cities)" desc={`Tell us which cities or metro areas you serve — one city or several. Major metro areas (roughly ${POPULATION_THRESHOLD.toLocaleString()}+ residents) are $${MAJOR_CITY_PRICE}/month; smaller cities are $${MINOR_CITY_PRICE}/month — half price. Either way you get exclusive placement, only one partner per city.`} />
            <StepCard number="2" title="We add your business to our platform" desc="We set up your profile with your business name, address, phone number, website, and logo. No tech work needed on your end." />
            <StepCard number="3" title="We detect each visitor's city automatically — no guesswork" desc="The moment someone lands on the site, we detect their city automatically — no signup or location sharing needed. If it matches one of your listed cities, your listing shows up. If not, they never see it." />
            <StepCard number="4" title="You show up wherever your customers are — not just one page" desc="Once matched, your listing appears as a recommended local cleaner on their estimate results page, as a floating banner on every other page they visit — the home page, blog posts, cost guides, all of it — and again in their inbox if they opt in to get their estimate emailed to them. Three placements from one match, not one." />
            <StepCard number="5" title="Every lead lands straight in your inbox — you don't have to wait for a call" desc="The moment a matched visitor gets their estimate emailed to them, we email you that same lead's name, contact info, and timeline directly, reply-to set to them so you can just hit reply. On top of that, they can call or visit your website directly too — there's no middleman and no lead fee either way. Every lead is yours, no commission, no strings." />
            <StepCard number="6" title="You track exactly what it's earning you" desc="Log into your free partner dashboard anytime to see how many times your listing was shown and how many calls it generated — real numbers, not guesswork." />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: 'white' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>Simple, Size-Based Pricing</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>Priced by city size, not a one-size-fits-all rate. No setup fees. No commissions. Cancel anytime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(12px, 3vw, 20px)', maxWidth: 700, margin: '0 auto 20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1px solid #bfdbfe', borderRadius: 18, padding: 'clamp(16px, 5vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(11px, 3vw, 12.5px)', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(5px, 2vw, 8px)' }}>Major City</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 'clamp(28px, 8vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>${MAJOR_CITY_PRICE}</span>
                <span style={{ fontSize: 'clamp(12.5px, 3.5vw, 15px)', color: '#64748b', fontWeight: 500 }}>/month</span>
              </div>
              <div style={{ fontSize: 'clamp(11.5px, 3vw, 13px)', color: '#64748b' }}>About {POPULATION_THRESHOLD.toLocaleString()}+ residents &mdash; e.g. Dallas, Seattle, Atlanta</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', borderRadius: 18, padding: 'clamp(16px, 5vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(11px, 3vw, 12.5px)', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(5px, 2vw, 8px)' }}>Smaller City</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 'clamp(28px, 8vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>${MINOR_CITY_PRICE}</span>
                <span style={{ fontSize: 'clamp(12.5px, 3.5vw, 15px)', color: '#64748b', fontWeight: 500 }}>/month</span>
              </div>
              <div style={{ fontSize: 'clamp(11.5px, 3vw, 13px)', color: '#64748b' }}>Under {POPULATION_THRESHOLD.toLocaleString()} residents &mdash; half the major-city rate</div>
            </div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(24px, 4vw, 36px)', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <Check>Exclusive placement &mdash; only 1 partner per city</Check>
              <Check>Your name, address, phone, website &amp; logo on every results page in your city, a floating recommendation banner sitewide, and in the estimate email if they opt in to get one</Check>
              <Check>Every matched lead emailed straight to you &mdash; name, contact info, and timeline, reply-to set to them so you can just hit reply</Check>
              <Check>Direct contact &mdash; customers can also call or click you straight away</Check>
              <Check>No lead fees, no commissions, no hidden costs</Check>
              <Check>Free performance dashboard &mdash; see your views, calls, and click-through rate anytime</Check>
              <Check>Cancel anytime with 30 days notice</Check>
              <Check>Serve multiple cities under one account &mdash; each priced by that city's own tier</Check>
            </div>
            <div style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', fontSize: 13.5, color: '#1e40af', lineHeight: 1.6 }}>
              <strong>Example:</strong> A business covering a major metro like Dallas (${MAJOR_CITY_PRICE}/mo) plus a smaller city like Waco (${MINOR_CITY_PRICE}/mo) pays ${MAJOR_CITY_PRICE + MINOR_CITY_PRICE}/month total. Type your cities into the form below and we'll show you the exact tier and price for each.
            </div>
          </div>

          <div style={{ maxWidth: 700, margin: '20px auto 0', textAlign: 'center' }}>
            <a
              href="/buy-city-placement"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_GRADIENT, color: 'white', padding: '15px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px', boxShadow: '0 8px 24px rgba(29,78,216,0.35)' }}
            >
              Buy City Placement Now →
            </a>
            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '10px 0 0' }}>
              Instant checkout &mdash; pick your city, pay, and you're live. Prefer to talk first? <a href="#apply" style={{ color: PRIMARY }}>Apply here</a> instead.
            </p>
          </div>

          <CityTierBrowser />
        </div>
      </div>

      {/* Who it's for */}
      <div style={{ padding: 'clamp(40px, 7vw, 72px) 24px', background: '#0f172a', color: 'white' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.5px' }}>Who Is This Right For?</h2>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.65 }}>This works best for established cleaning businesses that want a consistent, low-effort source of warm inbound leads.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, textAlign: 'left' }}>
            {['House cleaning & maid services', 'Carpet & upholstery cleaning', 'Commercial & office cleaning', 'Move-in / move-out cleaning', 'Air duct & HVAC cleaning', 'Post-construction cleanup'].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: '#e2e8f0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconCheck size={16} color="#4ade80" bg="rgba(74,222,128,0.15)" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 36, textAlign: 'center' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { q: 'Is there really only one partner per city?', a: 'Yes. We give one cleaning business exclusive placement per city. Once a city is taken, we waitlist new applicants. Apply early to lock in your market.' },
              { q: 'How exactly does my business appear?', a: 'Three ways. After a user completes an estimate, a branded card with your business name, address, logo, phone number, and website link appears on their results page as a recommended local cleaner. A small floating banner with the same info follows visitors in your city across the whole site — home page, blog posts, cost guides — not just the results page. And if that visitor opts in to have their estimate emailed to them, the same recommendation card is included right in that email too. All three look like trusted recommendations, not banner ads.' },
              { q: 'Can I cover more than one city?', a: `Yes. There's no limit — add as many cities as you want to serve, each priced by that city's own tier ($${MAJOR_CITY_PRICE}/month for major metros, $${MINOR_CITY_PRICE}/month for smaller cities), all under one account and one dashboard.` },
              { q: 'Can I see how it\'s performing?', a: "Yes. Every partner gets free access to a performance dashboard at cleanestimator.com/client. Sign up with the email your listing is set up with to see exactly how many times your listing was shown and how many calls it generated." },
              { q: 'What counts as a city, and how is pricing decided?', a: `We go by city name as detected from the user's IP address. Pricing is size-based: cities with roughly ${POPULATION_THRESHOLD.toLocaleString()}+ residents are "major" and billed at $${MAJOR_CITY_PRICE}/month; smaller cities are "minor" and billed at $${MINOR_CITY_PRICE}/month, half price. Add your cities in the form below and we'll show you exactly which tier each one falls into before you commit.` },
              { q: 'What if traffic in my city is low?', a: "We can share an estimate of current monthly sessions for your city before you commit. You're still getting targeted, high-intent visitors for less than the cost of one Google Ads day." },
              { q: 'Can I cancel?', a: "Yes. Give us 30 days notice and we'll remove your listing at the end of the billing cycle. No long-term contracts." },
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
      <div id="apply" style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: 'white' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>Apply for Your City</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>Fill out the form below and we'll confirm availability in your market and get you set up within 48 hours.</p>
          </div>
          {sent ? (
            <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><IconSuccess /></div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#15803d', marginBottom: 8 }}>Application Sent!</div>
              <div style={{ fontSize: 15, color: '#166534' }}>We'll review your application and get back to you within 48 hours to confirm availability in your city.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(24px, 4vw, 40px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name *</label>
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
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                  <input type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 000-0000" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cities You Want to Cover *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rows.map((row, i) => {
                      const cities = citiesForState(row.state);
                      const resolved = row.state && (row.city || row.customText.trim())
                        ? getCityTier(row.customCity ? row.customText.trim() : row.city, row.state)
                        : null;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              style={{ ...inputStyle, flex: 1 }}
                              value={row.state}
                              onChange={e => updateRow(i, 'state', e.target.value)}
                            >
                              <option value="">Select a state</option>
                              {ALL_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                            </select>
                            {row.customCity ? (
                              <input
                                style={{ ...inputStyle, flex: 2 }}
                                value={row.customText}
                                onChange={e => updateRow(i, 'customText', e.target.value)}
                                placeholder="Type your city name"
                                autoFocus
                              />
                            ) : (
                              <select
                                style={{ ...inputStyle, flex: 2 }}
                                value={row.city}
                                onChange={e => updateRow(i, 'city', e.target.value)}
                                disabled={!row.state}
                              >
                                <option value="">{row.state ? 'Select a city' : 'Select a state first'}</option>
                                {cities.map(c => (
                                  <option key={c.city} value={c.city}>{c.city} &mdash; {c.tier === 'major' ? 'Major' : 'Minor'} ${c.price}/mo</option>
                                ))}
                                {row.state && <option value="__other__">My city isn't listed...</option>}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => removeRow(i)}
                              disabled={rows.length === 1}
                              aria-label="Remove city"
                              style={{ background: 'none', border: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: rows.length === 1 ? '#cbd5e1' : '#ef4444', padding: 4, flexShrink: 0 }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {row.customCity && (
                            <button
                              type="button"
                              onClick={() => updateRow(i, 'city', '')}
                              style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '4px 0 0' }}
                            >
                              &larr; Choose from list instead
                            </button>
                          )}
                          {resolved && (
                            <div style={{ fontSize: 12.5, marginTop: 4, color: resolved.tier === 'major' ? PRIMARY : '#9333ea', fontWeight: 700 }}>
                              {resolved.tier === 'major' ? 'Major' : 'Minor'} city &mdash; ${resolved.price}/mo
                            </div>
                          )}
                          {row.state && (row.city || row.customText.trim()) && !resolved && (
                            <div style={{ fontSize: 12.5, marginTop: 4, color: '#94a3b8', fontStyle: 'italic' }}>we'll confirm this city's tier</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={addRow}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '7px 14px', marginTop: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12.5, color: PRIMARY }}
                  >
                    <Plus size={13} /> Add another city
                  </button>
                  {monthlyTotal > 0 && (
                    <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700, textAlign: 'right', marginTop: 10 }}>
                      Estimated total: ${monthlyTotal}/month{unmatchedCities.length ? '+' : ''}
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anything else?</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Types of cleaning you offer, website URL, questions..." />
                </div>
              </div>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#dc2626', marginBottom: 14 }}>{error}</div>
              )}
              <button type="submit" disabled={sending} style={{ width: '100%', background: sending ? '#93c5fd' : PRIMARY_GRADIENT, color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s', boxShadow: sending ? 'none' : '0 8px 22px rgba(29,78,216,0.35)' }}>
                {sending ? 'Sending...' : <> Send My Application <IconArrow size={18} color="white" /> </>}
              </button>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 14, marginBottom: 0 }}>We'll confirm city availability and pricing within 48 hours. No payment required to apply.</p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
