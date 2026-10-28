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
            The person behind Clean Estimator and the vision behind it.
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
              {['3+ Years in Cleaning Industry Marketing', 'AI Automation & SaaS Development'].map(badge => (
                <span key={badge} style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.primary, background: COLORS.primaryMuted, border: `1px solid ${COLORS.primaryMutedBorder}`, borderRadius: RADIUS.pill, padding: '5px 12px' }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section style={{ marginBottom: 36 }}>
          <p style={{ ...pStyle, fontSize: 16.5, fontWeight: 500, color: COLORS.ink }}>
            Hi, I'm Elias. I built Clean Estimator to make cleaning price estimates more accessible while helping cleaning businesses connect with potential customers. I developed the pricing logic, lead capture system, embeddable calculator, and partner dashboard that power the platform.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Before building Clean Estimator, I worked in marketing and automation for cleaning companies, gaining firsthand experience with the challenges businesses face when generating leads and managing their operations.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            What I Do
          </div>
          <p style={pStyle}>
            I build AI-powered automation systems that help businesses save time, qualify leads, answer customer questions, and book appointments.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            My work includes marketing funnels, CRM workflows, lead management systems, and AI chat and voice agents for websites, WhatsApp, Facebook Messenger, Instagram, and SMS. I also build automated phone systems that handle inbound calls and schedule appointments.
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            How I Work
          </div>
          <p style={pStyle}>
            I combine marketing experience, automation expertise, and modern AI development tools to build practical business solutions. From web applications and customer portals to payment integrations, dashboards, and backend workflows, I focus on building systems that work reliably in real-world use.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Clean Estimator is one example of that approach: a live platform built to serve homeowners, renters, and cleaning businesses.
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
            <p style={{ color: '#cbd5e1', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>I'm a small team, and I read every message.</p>
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
