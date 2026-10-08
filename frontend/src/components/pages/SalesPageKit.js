import React, { useState, useEffect } from 'react';
import { ChevronDown, ShieldCheck, X } from 'lucide-react';

// Shared visual building blocks for the three "sales" pages (partner-with-us,
// website-for-cleaning-companies, estimator). Pulled out once these three
// pages started wanting the same three things: a bold full-width section
// divider to break up the scroll, a real collapsible FAQ instead of static
// always-open cards, and a trust badge restating the page's actual
// no-risk policy -- inspired by high-converting long-form sales pages, but
// built from real claims already made elsewhere on each page, not invented
// urgency/guarantees that don't exist.

// ── Section band ────────────────────────────────────────────────────────
// A full-bleed color band used as a "chapter marker" between major sections,
// giving the page visual rhythm on a long scroll instead of one undifferentiated
// white page. Deliberately plain -- no countdowns, no fake scarcity copy.
export function SectionBand({ eyebrow, title, subtitle, variant = 'dark' }) {
  const bg = variant === 'accent'
    ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
    : '#0f172a';
  return (
    <div style={{ background: bg, padding: 'clamp(28px, 6vw, 44px) 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ fontSize: 11.5, fontWeight: 800, color: variant === 'accent' ? '#bfdbfe' : '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontSize: 'clamp(18px, 3.4vw, 24px)', fontWeight: 800, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.35 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 14, color: variant === 'accent' ? '#dbeafe' : '#94a3b8', marginTop: 10, lineHeight: 1.6 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FAQ accordion ───────────────────────────────────────────────────────
// Same collapse behavior already used on /cleaning-cost-estimator, pulled
// out so partner-with-us and website-for-cleaning-companies get the same
// real interaction instead of a wall of always-open cards.
export function FaqAccordion({ faqs, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
            <button
              onClick={() => setOpenIndex(open ? -1 : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              aria-expanded={open}
            >
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{faq.q}</span>
              <ChevronDown size={17} color="#94a3b8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {open && (
              <div style={{ padding: '0 20px 18px' }}>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{faq.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Guarantee / trust badge ─────────────────────────────────────────────
// A seal-style callout for the policy each page already states in copy
// elsewhere (no payment until approved, cancel anytime, no contract) --
// made visually prominent instead of buried as one bullet among many.
// Blue/green, not gold -- this isn't a "you'll get rich" claim, it's a
// real refund/cancellation policy, and should read like one.
export function GuaranteeBadge({ title, points }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
      background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)', border: '1.5px solid #bbf7d0',
      borderRadius: 18, padding: 'clamp(18px, 4vw, 26px)', maxWidth: 680, margin: '0 auto',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'white', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(21,128,61,0.18)',
        border: '2px solid #bbf7d0',
      }}>
        <ShieldCheck size={30} color="#15803d" strokeWidth={2} />
      </div>
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15.5, color: '#14532d', marginBottom: 6 }}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {points.map((p, i) => (
            <span key={i} style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sticky mobile CTA ───────────────────────────────────────────────────
// Keeps the one primary action reachable on a long scroll without a
// desktop sticky header (which these pages don't have) -- mobile-only,
// appears after the hero's own CTA has scrolled out of view, dismissible.
export function StickyMobileCTA({ label, href, onClick }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div
      className="spk-sticky-cta"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 400,
        background: 'white', borderTop: '1px solid #e2e8f0', boxShadow: '0 -8px 24px rgba(15,23,42,0.12)',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <a
        href={href}
        onClick={onClick}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: '#1d4ed8', color: 'white', padding: '13px 18px', borderRadius: 10,
          textDecoration: 'none', fontWeight: 800, fontSize: 15, boxShadow: '0 6px 18px rgba(29,78,216,0.35)',
        }}
      >
        {label}
      </a>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#64748b' }}
      >
        <X size={17} />
      </button>
      <style>{`
        @media (min-width: 768px) { .spk-sticky-cta { display: none; } }
      `}</style>
    </div>
  );
}
