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
      <div className="page-hero-band" style={{ padding: 'clamp(18px, 5vw, 40px) 0 clamp(36px, 9vw, 96px)' }}>
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

        {/* Photo + name/title -- the one place a "card" is right, since it's
            a real portrait next to a real name, not a stand-in for content
            structure. */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: COLORS.heroGradient, color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 32, fontWeight: 800, boxShadow: SHADOWS.md,
          }}>
            {/* TODO: replace with the real headshot once it's attached as a
                file -- e.g. <img src="/images/elias-zoleta.jpg" alt="Elias Zoleta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
            EZ
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.01em', margin: '0 0 3px' }}>Elias Zoleta</h2>
            <p style={{ fontSize: 14.5, color: COLORS.primary, fontWeight: 600, margin: 0 }}>Founder, Clean Estimator</p>
          </div>
        </div>

        <section style={{ marginBottom: 44 }}>
          <p style={pStyle}>
            I built and run Clean Estimator myself — the pricing logic, the lead capture, the embeddable widget partner businesses put on their own sites, and the dashboard behind all of it.
          </p>
          <p style={pStyle}>
            I build AI-driven automation systems that do real work — qualifying leads, answering questions, booking appointments, and running entire workflows without a person in the loop.
          </p>
          <p style={pStyle}>
            My deepest expertise is Go High Level, where I've spent years building end-to-end marketing automation: workflows, pipelines, funnels, and campaigns for real businesses. Inside that, I build AI chatbots that run natively across websites, WhatsApp, Facebook Messenger, Instagram, and SMS, and voice AI agents that handle inbound calls and book calendar appointments automatically — either natively in GHL or through Retell AI wired up in n8n.
          </p>
          <p style={pStyle}>
            But GHL is a tool, not the ceiling. I'm self-trained, and I use Claude as a genuine build partner — I've used it to design, build, and launch full-stack web apps end to end: functionality, UI, copy, databases, dashboards, login portals, payment systems, and the automation layered on top. Clean Estimator is one of them.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            I guess that makes me a vibe coder, lol — but the apps are real, live, and used by real people.
          </p>
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
