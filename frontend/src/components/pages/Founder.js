import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';
import './PageHero.css';

const pStyle = { fontSize: 15, color: '#334155', lineHeight: 1.7, margin: '0 0 18px' };

export default function Founder() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Helmet>
        <title>Meet the Founder | Clean Estimator</title>
        <meta name="description" content="Elias Zoleta built and runs Clean Estimator — a free, accurate cleaning cost estimator used by homeowners and cleaning companies across all 50 U.S. states." />
        <link rel="canonical" href="https://www.cleanestimator.com/founder" />
      </Helmet>

      {/* Same dark band / glow / left-aligned hero as About.js, for the
          same reason it was built there: this page should read as part of
          the same site, not a bespoke bio template. */}
      <div className="page-hero-band" style={{ padding: 'clamp(18px, 5vw, 40px) 0' }}>
        <div className="page-hero-glow" aria-hidden="true" />
        <div className="page-hero-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', textAlign: 'left' }}>
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 8, letterSpacing: '-0.01em' }}>
            Meet the Founder
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.55, maxWidth: 640 }}>
            The person who built Clean Estimator, and why.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px clamp(36px, 7vw, 80px)', position: 'relative' }}>

        {/* Profile card -- a real bordered/shadowed card now instead of a
            bare flex row sitting on the page background, with a few
            credibility badges so the "who is this" question is answered
            in three glances before anyone reads a word of the bio. */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32, padding: 'clamp(20px, 5vw, 28px)', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOWS.sm }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: COLORS.heroGradient, color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 30, fontWeight: 800, boxShadow: SHADOWS.md,
          }}>
            {/* TODO: replace with the real headshot once it's attached as a
                file -- e.g. <img src="/images/elias-zoleta.jpg" alt="Elias Zoleta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
            EZ
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.01em', margin: '0 0 3px' }}>Elias Zoleta</h2>
            <p style={{ fontSize: 14.5, color: COLORS.primary, fontWeight: 600, margin: '0 0 12px' }}>Founder, Clean Estimator</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['3 Years in Cleaning Marketing', 'AI Automation Builder', 'Self-Taught, Claude-Powered'].map(badge => (
                <span key={badge} style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.primary, background: COLORS.primaryMuted, border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: RADIUS.pill, padding: '5px 12px' }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section style={{ marginBottom: 36 }}>
          <p style={{ ...pStyle, fontSize: 16.5, fontWeight: 500, color: COLORS.ink }}>
            Hi! I built and run Clean Estimator myself — the pricing logic, the lead capture, the embeddable widget partner businesses put on their own sites, and the dashboard behind all of it. Before I built Clean Estimator I was Marketing and Automation Specialist for cleaning companies for 3 years.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            What I Build
          </div>
          <p style={pStyle}>
            I build AI-driven automation systems that do real work — qualifying leads, answering questions, booking appointments, and running entire workflows without a person in the loop.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            I've spent years building end-to-end marketing automation: workflows, pipelines, funnels, and campaigns for real businesses. I build AI chatbots for websites, WhatsApp, Facebook Messenger, Instagram, and SMS, and voice AI agents that handle inbound calls and book calendar appointments automatically.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            How I Build
          </div>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            I'm self-trained, and I use Claude as a genuine build partner — I've used it to design, build, and launch full-stack web apps end to end: functionality, UI, copy, databases, dashboards, login portals, payment systems, and the automation layered on top. Clean Estimator is one of them.
          </p>
        </section>

        {/* Closing line as a soft tinted pull-quote card, same treatment as
            About.js's mission statement, so the page ends on a designed
            beat instead of trailing off as one more plain paragraph. */}
        <section style={{ marginBottom: 44 }}>
          <div style={{ background: COLORS.primaryMuted, border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: RADIUS.xl, padding: 'clamp(20px, 5vw, 26px) clamp(22px, 5vw, 30px)' }}>
            <p style={{ fontSize: 'clamp(15px, 3.6vw, 18px)', color: COLORS.ink, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
              I guess that makes me a vibe coder, lol — but the apps are real, live, and used by real people.
            </p>
          </div>
        </section>

        {/* Contact CTA -- same treatment as About.js's, for the same reason:
            this page's job is to end with a way to reach a real person. */}
        <section style={{ background: COLORS.heroGradient, borderRadius: RADIUS.xl, padding: '40px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -100, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} aria-hidden="true" />
          <div style={{ position: 'relative' }}>
            <div style={{ width: 44, height: 44, borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageCircle size={22} color="#93c5fd" strokeWidth={2.1} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>Questions or Feedback?</h2>
            <p style={{ color: '#cbd5e1', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>I'm a small team and I read every message.</p>
            <a
              href="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', background: 'white', color: COLORS.ink, borderRadius: RADIUS.sm, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              Contact Me
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
