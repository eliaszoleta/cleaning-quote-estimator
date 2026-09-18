import React from 'react';
import { Sparkles, Home as HomeIcon, Truck, Repeat, Leaf, Star, PhoneCall, Send, ShieldCheck } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';
import { TRUST_FEATURES } from './siteConfigs';
import ImagePlaceholder from './ImagePlaceholder';

const SERVICE_ICONS = [Sparkles, HomeIcon, Truck, Repeat, Leaf];
const TRUST_ICONS = [PhoneCall, Star, Send];

function HeroA({ site }) {
  const c = site.colors;
  const { openQuote } = useDemoSite();
  return (
    <div style={{ background: c.bg, padding: 'clamp(40px, 8vw, 76px) 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.bgAlt, color: c.primary, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
            <ShieldCheck size={13} /> Licensed &amp; Insured · Serving {site.city} since {site.founded}
          </div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 700, color: c.ink, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16, color: c.textMuted, lineHeight: 1.65, marginBottom: 30, maxWidth: 460 }}>
            Trusted, background-checked cleaners for {site.city} homes. Get a free, no-obligation quote in minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={openQuote} style={{ background: c.primary, color: 'white', padding: '15px 28px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
            <a href={`/website-example/${site.slug}/services`} style={{ background: 'white', color: c.ink, padding: '15px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: `1.5px solid ${c.border}`, textDecoration: 'none' }}>Our Services</a>
          </div>
        </div>
        <ImagePlaceholder note={site.heroImageNote} height={340} accent={c.primary} />
      </div>
    </div>
  );
}

function HeroB({ site }) {
  const c = site.colors;
  const { openQuote } = useDemoSite();
  return (
    <>
      <div style={{ background: c.primaryDark, padding: 'clamp(56px, 10vw, 100px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>{site.city}, {site.state}</div>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(28px, 5.5vw, 48px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Book in minutes, get a confirmation instantly, and know exactly who's showing up.
          </p>
          <button onClick={openQuote} style={{ background: c.accent, color: c.primaryDark, padding: '16px 32px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 15.5, cursor: 'pointer', fontFamily: site.fontBody }}>Get a Free Quote</button>
        </div>
      </div>
      <div style={{ padding: '0 20px', marginTop: -1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <ImagePlaceholder note={site.heroImageNote} height={280} radius={0} accent={c.primary} />
        </div>
      </div>
    </>
  );
}

function HeroC({ site }) {
  const c = site.colors;
  const { openQuote } = useDemoSite();
  return (
    <div style={{ background: c.bg, padding: 'clamp(36px, 8vw, 70px) 20px clamp(64px, 10vw, 100px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(34px, 7vw, 62px)', fontWeight: 800, color: c.ink, lineHeight: 1.05, marginBottom: 22, letterSpacing: '-1px' }}>{site.tagline}</h1>
          <p style={{ fontSize: 16, color: c.textMuted, lineHeight: 1.65, marginBottom: 26, maxWidth: 440 }}>
            {site.city}'s cleaning service for people who notice the details.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <button onClick={openQuote} style={{ background: c.ink, color: c.bg, padding: '15px 30px', borderRadius: 2, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: site.fontBody, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request a Quote</button>
            <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ color: c.accent, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>or call {site.phone}</a>
          </div>
        </div>
        <div style={{ marginTop: 40, maxWidth: 420, marginLeft: 'auto' }}>
          <ImagePlaceholder note={site.heroImageNote} height={260} accent={c.primary} />
        </div>
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

      {/* Trust features -- auto text-back, review requests, follow-up */}
      <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: c.ink, textAlign: 'center', marginBottom: 40 }}>You'll Never Chase Us Down</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 24 }}>
            {TRUST_FEATURES.map((f, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <div key={f.title} style={{ textAlign: 'center', padding: '0 10px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon size={20} color={c.primary} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: c.ink, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
                <p style={{ fontSize: 14.5, color: c.ink, lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ fontWeight: 700, fontSize: 13, color: c.textMuted }}>— {t.name}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: c.textMuted, marginTop: 20, fontStyle: 'italic' }}>Illustrative example only — a real site would feature your own customer reviews.</p>
        </div>
      </div>

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
