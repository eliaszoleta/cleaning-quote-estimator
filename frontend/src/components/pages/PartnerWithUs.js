import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getAllStates, getStateByCode } from '../../data/statePricing';
import { getCityTier, getAllCityTierEntries, POPULATION_THRESHOLD, MAJOR_CITY_PRICE, MINOR_CITY_PRICE } from '../../data/partnerCityTiers';

const PRIMARY = '#2563eb';
const PRIMARY_GRADIENT = '#1d4ed8';
const WEB3FORMS_KEY = 'b0da3f48-9982-4a5a-9195-4200a80ba8c6';

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

function StatBadge({ number, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 20px' }}>
      <div style={{ fontSize: 'clamp(36px, 6vw, 52px)', fontWeight: 900, color: PRIMARY, lineHeight: 1, letterSpacing: '-2px' }}>{number}</div>
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

const ALL_CITY_TIERS = getAllCityTierEntries();
const STATES_WITH_CITIES = ALL_STATES
  .map(s => ({ ...s, cities: ALL_CITY_TIERS.filter(c => c.stateCode === s.code).sort((a, b) => b.population - a.population) }))
  .filter(s => s.cities.length > 0);

function CityTierBrowser() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openStates, setOpenStates] = useState(() => new Set());

  const q = search.trim().toLowerCase();
  const filtered = q
    ? STATES_WITH_CITIES
        .map(s => ({ ...s, cities: s.cities.filter(c => c.city.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) }))
        .filter(s => s.cities.length > 0)
    : STATES_WITH_CITIES;

  const toggleState = (code) => {
    setOpenStates(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: '24px auto 0' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'white', border: `1.5px solid ${PRIMARY}`, color: PRIMARY, borderRadius: 12, padding: '13px 20px', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}
      >
        {open ? 'Hide' : `See pricing for all ${ALL_CITY_TIERS.length}+ cities we cover`}
        <IconArrow size={14} color={PRIMARY} />
      </button>
      {open && (
        <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <input
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white', marginBottom: 12 }}
            placeholder="Search for your city or state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.length === 0 && (
              <div style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No matches. We may not have your city's population on file yet &mdash; add it in the form below and we'll confirm your tier directly.</div>
            )}
            {filtered.map(s => {
              const isOpen = q ? true : openStates.has(s.code);
              const majorCount = s.cities.filter(c => c.tier === 'major').length;
              return (
                <div key={s.code} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleState(s.code)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.name} <span style={{ fontWeight: 500, color: '#94a3b8' }}>({s.cities.length})</span></span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{majorCount} major &middot; {s.cities.length - majorCount} minor</span>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                      {s.cities.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', fontSize: 13, borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                          <span style={{ color: '#374151' }}>{c.city}</span>
                          <span style={{ fontWeight: 700, color: c.tier === 'major' ? PRIMARY : '#9333ea' }}>${c.price}/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>Tiers are based on well-established population estimates, not exact census counts &mdash; good enough to classify a city, not a precision figure. Don't see your city? Add it in the application form below and we'll confirm your exact rate.</p>
        </div>
      )}
    </div>
  );
}

export default function PartnerWithUs() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', message: '' });
  const [cityList, setCityList] = useState([]);
  const [stateInput, setStateInput] = useState('');
  const [citySelectValue, setCitySelectValue] = useState('');
  const [customCityText, setCustomCityText] = useState('');

  const citiesForState = stateInput ? (STATES_WITH_CITIES.find(s => s.code === stateInput)?.cities || []) : [];

  const addCity = (city) => {
    if (!city || !stateInput) return;
    const tierInfo = getCityTier(city, stateInput);
    const stateObj = getStateByCode(stateInput);
    setCityList(list => [...list, { city, stateCode: stateInput, stateName: stateObj ? stateObj.name : stateInput, tierInfo }]);
  };

  const handleCitySelect = (e) => {
    const val = e.target.value;
    setCitySelectValue(val);
    if (val && val !== '__other__') {
      addCity(val);
      setCitySelectValue('');
    }
  };

  const addCustomCity = () => {
    const city = customCityText.trim();
    if (!city) return;
    addCity(city);
    setCustomCityText('');
    setCitySelectValue('');
  };

  const removeCity = (idx) => setCityList(list => list.filter((_, i) => i !== idx));

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
        setError('Something went wrong. Please try again or email us directly at eliaszoleta87@gmail.com');
      }
    } catch {
      setError('Network error. Please try again or email us directly at eliaszoleta87@gmail.com');
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

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', padding: 'clamp(60px, 10vw, 100px) 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 22 }}>
            Get Recommended to Thousands of Homeowners
            <span style={{ display: 'block', color: '#93c5fd' }}> Ready to Hire a Cleaner</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#cbd5e1', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 36px' }}>
            Clean Estimator gets <strong style={{ color: 'white' }}>20,000&ndash;30,000 organic visits per month</strong> from people actively using our cost calculator &mdash; not casual browsers, but homeowners and renters with a real cleaning job in mind and a budget in hand.
          </p>
          <a href="#apply" style={{ display: 'inline-flex', alignItems: 'center', background: PRIMARY_GRADIENT, color: 'white', padding: '15px 36px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 17, letterSpacing: '-0.2px', gap: 4, boxShadow: '0 8px 24px rgba(29,78,216,0.4)' }}>
            Get My City <IconArrow size={18} color="white" />
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <StatBadge number="20K+" label="Monthly visitors" />
          <StatBadge number="100%" label="Organic, targeted traffic" />
          <StatBadge number="1" label="Partner per city" />
          <StatBadge number="$175-$350" label="Per city / month" />
        </div>
      </div>

      {/* Why it works */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 12 }}>Why This Traffic Converts</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>Most advertising reaches people who aren&apos;t looking. Our visitors are different.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: <IconHome />, title: 'They already want the service', body: 'Every visitor used our estimator to price out a cleaning job. They came here because they need a cleaner &mdash; not because an ad interrupted them.' },
              { icon: <IconPin />, title: 'They give us their location', body: 'Users enter their ZIP code or city to get an accurate local estimate. We know exactly where they are and match them to you.' },
              { icon: <IconWallet />, title: 'They have a budget', body: "Our estimator gives them a price range. By the time they see your recommendation, they already know what to expect to pay and they're ready to book." },
            ].map((card, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: '28px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 52, height: 52, background: '#eff6ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{card.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: card.body }} />
              </div>
            ))}
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
            <StepCard number="3" title="You show up wherever your customers are — not just one page" desc="Your listing appears as a recommended local cleaner on the estimate results page, and as a floating banner on every page someone in your city visits — the home page, blog posts, cost guides, all of it." />
            <StepCard number="4" title="They call or visit your website directly" desc="There's no middleman and no lead fee. The customer contacts you directly. Every lead is yours, no commission, no strings." />
            <StepCard number="5" title="You track exactly what it's earning you" desc="Log into your free partner dashboard anytime to see how many times your listing was shown and how many calls it generated — real numbers, not guesswork." />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 700, margin: '0 auto 20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1px solid #bfdbfe', borderRadius: 18, padding: 'clamp(24px, 4vw, 32px)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Major City</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>${MAJOR_CITY_PRICE}</span>
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>About {POPULATION_THRESHOLD.toLocaleString()}+ residents &mdash; e.g. Dallas, Seattle, Atlanta</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #fdf4ff, #fef9ff)', border: '1px solid #e9d5ff', borderRadius: 18, padding: 'clamp(24px, 4vw, 32px)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Smaller City</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>${MINOR_CITY_PRICE}</span>
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Under {POPULATION_THRESHOLD.toLocaleString()} residents &mdash; half the major-city rate</div>
            </div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(24px, 4vw, 36px)', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <Check>Exclusive placement &mdash; only 1 partner per city</Check>
              <Check>Your name, address, phone, website &amp; logo on every results page in your city, plus a floating recommendation banner sitewide</Check>
              <Check>Direct contact &mdash; customers call or click you straight away</Check>
              <Check>No lead fees, no commissions, no hidden costs</Check>
              <Check>Free performance dashboard &mdash; see your views, calls, and click-through rate anytime</Check>
              <Check>Cancel anytime with 30 days notice</Check>
              <Check>Serve multiple cities under one account &mdash; each priced by that city's own tier</Check>
            </div>
            <div style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', fontSize: 13.5, color: '#1e40af', lineHeight: 1.6 }}>
              <strong>Example:</strong> A business covering a major metro like Dallas (${MAJOR_CITY_PRICE}/mo) plus a smaller city like Waco (${MINOR_CITY_PRICE}/mo) pays ${MAJOR_CITY_PRICE + MINOR_CITY_PRICE}/month total. Type your cities into the form below and we'll show you the exact tier and price for each.
            </div>
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
              { q: 'How exactly does my business appear?', a: 'Two ways. After a user completes an estimate, a branded card with your business name, address, logo, phone number, and website link appears on their results page as a recommended local cleaner. On top of that, a small floating banner with the same info follows visitors in your city across the whole site — home page, blog posts, cost guides — not just the results page. Both look like trusted recommendations, not banner ads.' },
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
                  <input type="tel" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cities You Want to Cover *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      style={{ ...inputStyle, flex: 1 }}
                      value={stateInput}
                      onChange={e => { setStateInput(e.target.value); setCitySelectValue(''); setCustomCityText(''); }}
                    >
                      <option value="">Select a state</option>
                      {ALL_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                    <select
                      style={{ ...inputStyle, flex: 2 }}
                      value={citySelectValue}
                      onChange={handleCitySelect}
                      disabled={!stateInput}
                    >
                      <option value="">{stateInput ? 'Select a city' : 'Select a state first'}</option>
                      {citiesForState.map(c => (
                        <option key={c.city} value={c.city}>{c.city} &mdash; {c.tier === 'major' ? 'Major' : 'Minor'} ${c.price}/mo</option>
                      ))}
                      {stateInput && <option value="__other__">My city isn't listed...</option>}
                    </select>
                  </div>
                  {citySelectValue === '__other__' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        style={{ ...inputStyle, flex: 2 }}
                        value={customCityText}
                        onChange={e => setCustomCityText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCity(); } }}
                        placeholder="Type your city name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={addCustomCity}
                        disabled={!customCityText.trim()}
                        style={{ padding: '11px 18px', border: 'none', borderRadius: 9, background: !customCityText.trim() ? '#cbd5e1' : PRIMARY, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: !customCityText.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {cityList.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cityList.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 12px' }}>
                          <div style={{ fontSize: 13.5, color: '#0f172a' }}>
                            <strong>{c.city}, {c.stateCode}</strong>
                            {c.tierInfo ? (
                              <span style={{ marginLeft: 8, color: c.tierInfo.tier === 'major' ? PRIMARY : '#9333ea', fontWeight: 700 }}>
                                {c.tierInfo.tier === 'major' ? 'Major' : 'Minor'} &mdash; ${c.tierInfo.price}/mo
                              </span>
                            ) : (
                              <span style={{ marginLeft: 8, color: '#94a3b8', fontStyle: 'italic' }}>we'll confirm this city's tier</span>
                            )}
                          </div>
                          <button type="button" onClick={() => removeCity(i)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }} aria-label="Remove city">&times;</button>
                        </div>
                      ))}
                      {monthlyTotal > 0 && (
                        <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700, textAlign: 'right', paddingTop: 2 }}>
                          Estimated total: ${monthlyTotal}/month{unmatchedCities.length ? '+' : ''}
                        </div>
                      )}
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
