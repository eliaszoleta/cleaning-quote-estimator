import React, { useState } from 'react';
import { Sparkles, Home as HomeIcon, Truck, Repeat, Leaf, Star, ShieldCheck, BadgeCheck, ThumbsUp, ChevronDown, Check } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';
import { getFaqs } from './siteConfigs';
import ImagePlaceholder from './ImagePlaceholder';
import HeroQuoteForm from './HeroQuoteForm';

const SERVICE_ICONS = [Sparkles, HomeIcon, Truck, Repeat, Leaf];

// Deterministic-but-varied illustrative stats, derived from each site's
// founding year rather than hardcoded, so the ten sites don't all show the
// identical "500+ reviews, 4.9 stars."
function reviewStatsFor(site) {
  const years = new Date().getFullYear() - site.founded;
  const reviewCount = 80 + years * 45;
  const rating = (4.7 + (site.founded % 3) * 0.1).toFixed(1);
  return { reviewCount, rating };
}

function HeroA({ site }) {
  const c = site.colors;
  return (
    <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 76px) 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.bgAlt, color: c.primary, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
            <ShieldCheck size={13} /> Licensed &amp; Insured · Serving {site.city} since {site.founded}
          </div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 700, color: c.ink, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16, color: c.textMuted, lineHeight: 1.65, maxWidth: 460 }}>
            Trusted, background-checked cleaners for {site.city} homes. Get a free, no-obligation quote in minutes.
          </p>
        </div>
        <HeroQuoteForm site={site} />
      </div>
    </div>
  );
}

function HeroB({ site }) {
  const c = site.colors;
  return (
    <div style={{ background: c.primaryDark, padding: 'clamp(48px, 9vw, 90px) 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>{site.city}, {site.state}</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: 480 }}>
            Book in minutes, get a confirmation instantly, and know exactly who's showing up.
          </p>
        </div>
        <HeroQuoteForm site={site} />
      </div>
    </div>
  );
}

function HeroC({ site }) {
  const c = site.colors;
  return (
    <div style={{ background: c.bg, padding: 'clamp(36px, 8vw, 70px) 20px clamp(64px, 10vw, 100px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 800, color: c.ink, lineHeight: 1.05, marginBottom: 22, letterSpacing: '-1px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16, color: c.textMuted, lineHeight: 1.65, maxWidth: 440 }}>
            {site.city}'s cleaning service for people who notice the details.
          </p>
        </div>
        <HeroQuoteForm site={site} />
      </div>
    </div>
  );
}

const HEROES = { A: HeroA, B: HeroB, C: HeroC };

export default function DemoHome() {
  const { site } = useDemoSite();
  const c = site.colors;
  const Hero = HEROES[site.layout] || HeroA;

  return (
    <>
      <Hero site={site} />

      {/* Trust strip */}
      <div style={{ background: 'white', borderBottom: `1px solid ${c.border}`, padding: '18px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 36px' }}>
          {['Licensed & Insured', '5-Star Rated', 'Satisfaction Guaranteed', 'Same-Week Availability'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: c.ink }}>
              <ShieldCheck size={15} color={c.primary} strokeWidth={2.3} /> {item}
            </div>
          ))}
        </div>
      </div>

      {/* Services teaser */}
      <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: c.bgAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(24px, 4.5vw, 34px)', fontWeight: 700, color: c.ink, marginBottom: 10 }}>What We Offer</h2>
            <p style={{ fontSize: 15, color: c.textMuted, maxWidth: 520, margin: '0 auto' }}>{site.businessName} handles it all, from a single visit to a full recurring schedule.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 18 }}>
            {site.services.map((s, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <div key={s.title} style={{ background: c.card, borderRadius: 14, padding: 24, border: `1px solid ${c.border}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={18} color={c.primary} />
                  </div>
                  <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 15.5, color: c.ink, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href={`/website-example/${site.slug}/services`} style={{ color: c.primary, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>See all services →</a>
          </div>
        </div>
      </div>

      {/* Why us -- alternating image/text/checklist blocks, the kind of
          expertise + legitimacy signal a service business needs before a
          stranger hands over a house key. Copy is unique per business
          (see siteConfigs.js's whyUs field), not one block reused 10 times. */}
      <WhyUsSection site={site} />

      {/* Reviews / trust stat bar -- the kind of big, hard-to-fake social
          proof number a visitor looks for before trusting a home services
          business with their front door. */}
      <ReviewStatBar site={site} />

      {/* Testimonials */}
      <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: c.bgAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: c.ink, textAlign: 'center', marginBottom: 36 }}>What Our Clients Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 18 }}>
            {site.testimonials.map(t => (
              <div key={t.name} style={{ background: c.card, borderRadius: 14, padding: 24, border: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} color={c.accent} fill={c.accent} />)}
                </div>
                <p style={{ fontSize: 14.5, color: c.ink, lineHeight: 1.65, marginBottom: 14 }}>"{t.text}"</p>
                <div style={{ fontWeight: 700, fontSize: 13, color: c.textMuted }}>— {t.name}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: c.textMuted, marginTop: 20, fontStyle: 'italic' }}>Illustrative example only — a real site would feature your own customer reviews.</p>
        </div>
      </div>

      {/* Before / after results -- concrete proof of work, not just claims */}
      <BeforeAfter site={site} />

      {/* FAQ -- answers the hesitations a first-time visitor has before
          they'll hand over their address and a key. */}
      <DemoFaq site={site} />

      {/* Closing CTA */}
      <div style={{ background: site.colors.primaryDark, padding: 'clamp(40px, 8vw, 70px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h3 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: 'white', marginBottom: 12 }}>Ready for a Cleaner Space?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 24, fontSize: 14.5 }}>Get your free quote today — no obligation, no pressure.</p>
          <DemoCtaButton site={site} />
        </div>
      </div>
    </>
  );
}

function DemoCtaButton({ site }) {
  const { openQuote } = useDemoSite();
  return (
    <button onClick={openQuote} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: site.colors.accent, color: site.colors.primaryDark, padding: '14px 30px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: site.fontBody }}>
      Get a Free Quote
    </button>
  );
}

function WhyUsBlock({ site, block, index }) {
  const c = site.colors;
  const { openQuote } = useDemoSite();
  const imageFirst = index % 2 === 0;
  const image = <ImagePlaceholder note={block.imageNote} height={340} accent={c.primary} />;
  const text = (
    <div>
      <h3 style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 'clamp(22px, 4vw, 28px)', color: c.ink, marginBottom: 14, letterSpacing: '-0.3px' }}>{block.headline}</h3>
      {block.body.map((p, i) => (
        <p key={i} style={{ fontSize: 14.5, color: c.textMuted, lineHeight: 1.7, marginBottom: 12 }}>{p}</p>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0 24px' }}>
        {block.checklist.map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={12} color={c.primary} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 14, color: c.ink, fontWeight: 500 }}>{item}</span>
          </div>
        ))}
      </div>
      <button onClick={openQuote} style={{ background: c.primary, color: 'white', padding: '13px 26px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: site.fontBody }}>
        Get a Free Quote
      </button>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 44, alignItems: 'center', marginBottom: 'clamp(40px, 7vw, 64px)' }}>
      {imageFirst ? <>{image}{text}</> : <>{text}{image}</>}
    </div>
  );
}

function WhyUsSection({ site }) {
  const c = site.colors;
  return (
    <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: c.card }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {site.whyUs.map((block, i) => <WhyUsBlock key={block.headline} site={site} block={block} index={i} />)}
      </div>
    </div>
  );
}

function ReviewStatBar({ site }) {
  const c = site.colors;
  const { reviewCount, rating } = reviewStatsFor(site);
  const badges = [
    { Icon: ShieldCheck, text: 'Licensed & Insured' },
    { Icon: BadgeCheck, text: 'Background-Checked Cleaners' },
    { Icon: ThumbsUp, text: 'Satisfaction Guaranteed' },
  ];
  return (
    <div style={{ background: c.card, padding: 'clamp(36px, 7vw, 60px) 20px', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={22} color={c.accent} fill={c.accent} />)}
        </div>
        <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4.5vw, 32px)', fontWeight: 800, color: c.ink, marginBottom: 8 }}>
          {reviewCount}+ Five-Star Reviews with a {rating} Average Rating
        </h2>
        <p style={{ fontSize: 14.5, color: c.textMuted, marginBottom: 28 }}>Real feedback from real {site.city}-area customers.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 32px' }}>
          {badges.map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: c.ink }}>
              <Icon size={16} color={c.primary} /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BeforeAfter({ site }) {
  const c = site.colors;
  return (
    <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: 'white' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: c.ink, marginBottom: 10 }}>Our Results Speak for Themselves</h2>
          <p style={{ fontSize: 14.5, color: c.textMuted, maxWidth: 520, margin: '0 auto' }}>A real before-and-after from a recent {site.city} job.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
          <div>
            <ImagePlaceholder note={`BEFORE: a visibly dirty or stained area (carpet, floor, or countertop) in a home, unedited, natural lighting.`} height={240} accent={c.primary} />
            <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 10 }}>Before</div>
          </div>
          <div>
            <ImagePlaceholder note={`AFTER: the exact same area as the "before" photo, same framing and angle, now spotless.`} height={240} accent={c.primary} />
            <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: c.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 10 }}>After</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoFaq({ site }) {
  const c = site.colors;
  const [openIdx, setOpenIdx] = useState(0);
  const faqs = getFaqs(site);
  return (
    <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: c.bgAlt }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: c.ink, textAlign: 'center', marginBottom: 36 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={f.q} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', textAlign: 'left', fontFamily: site.fontBody }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: c.ink }}>{f.q}</span>
                  <ChevronDown size={18} color={c.textMuted} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', fontSize: 13.5, color: c.textMuted, lineHeight: 1.65 }}>{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
