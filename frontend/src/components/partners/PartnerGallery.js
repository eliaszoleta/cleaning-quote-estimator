import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const PRIMARY = '#2563eb';
const AUTO_ADVANCE_MS = 4000;

const SLIDES = [
  { src: '/images/partner-gallery/floating-partner-banner.png', title: 'Your listing follows visitors sitewide', desc: 'A floating banner shows your business on every page a visitor in your city browses — not just the results page.' },
  { src: '/images/partner-gallery/results-page-partner-card.png', title: 'Featured on every estimate result', desc: 'Right after someone gets their price estimate, your business appears as the recommended local cleaner — with your phone, website, and email one tap away.' },
  { src: '/images/partner-gallery/estimate-email-partner-recommendation.png', title: 'You\'re in the estimate email too', desc: 'When a visitor opts in for their estimate by email, your business shows up right there as their recommended local cleaner — another touchpoint, not just the site.' },
  { src: '/images/partner-gallery/google-search-cleaning-estimator.png', title: 'Ranking in Google for real search traffic', desc: 'Clean Estimator shows up in Google’s AI Overview and organic results for searches like "cleaning estimator."' },
  { src: '/images/partner-gallery/google-search-cleaning-cost-calculator.png', title: 'Cited by Google’s AI Overview', desc: 'For "cleaning cost calculator," Google’s AI Overview cites Clean Estimator directly as a source.' },
  { src: '/images/partner-gallery/google-search-free-cleaning-estimate-calculator.png', title: 'Showing up for high-intent searches', desc: 'Ranking for "free cleaning estimate calculator" — exactly what homeowners search before hiring.' },
  { src: '/images/partner-gallery/google-search-cleaning-estimate-online.png', title: 'Multiple keywords, consistent visibility', desc: 'Also ranking for "cleaning estimate online," reinforcing steady, ongoing organic traffic.' },
  { src: '/images/partner-gallery/analytics-traffic.png', title: 'Real visitors, real traffic', desc: 'Live analytics showing thousands of active users and tens of thousands of monthly events — the audience your listing reaches.' },
];

export default function PartnerGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || lightboxOpen) return undefined;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, index]);

  const go = (i) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  // Swipe navigation for the lightbox -- the prev/next chevrons are the
  // only way to move between images on a touch device otherwise, and
  // swiping is the interaction people actually reach for on a phone.
  const touchStart = useRef(null);
  const onLightboxTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onLightboxTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    // Require a clearly horizontal, deliberate swipe so a vertical drag or
    // a plain tap-to-close doesn't get misread as a navigation gesture.
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      style={{ maxWidth: 860, margin: '0 auto' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15,23,42,0.08)', background: '#0f172a' }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '52.3%' }}>
          {SLIDES.map((slide, i) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.title}
              onClick={() => i === index && setLightboxOpen(true)}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top',
                opacity: i === index ? 1 : 0,
                transition: 'opacity 0.5s ease',
                pointerEvents: i === index ? 'auto' : 'none',
                cursor: i === index ? 'zoom-in' : 'default',
              }}
            />
          ))}
          {/* Zoom hint */}
          <div
            onClick={() => setLightboxOpen(true)}
            style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,23,42,0.6)', color: 'white', fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 20, cursor: 'pointer' }}
          >
            <ZoomIn size={13} /> Click to enlarge
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous screenshot"
          style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(15,23,42,0.55)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next screenshot"
          style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(15,23,42,0.55)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, minHeight: 62 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{SLIDES[index].title}</div>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>{SLIDES[index].desc}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 16 }}>
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === index ? PRIMARY : '#cbd5e1', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}
          />
        ))}
      </div>

      {lightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={SLIDES[index].title}
          onClick={() => setLightboxOpen(false)}
          onTouchStart={onLightboxTouchStart}
          onTouchEnd={onLightboxTouchEnd}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,20,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 48px)' }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(index - 1); }}
            aria-label="Previous screenshot"
            style={{ position: 'absolute', top: '50%', left: 'clamp(8px, 3vw, 32px)', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(index + 1); }}
            aria-label="Next screenshot"
            style={{ position: 'absolute', top: '50%', right: 'clamp(8px, 3vw, 32px)', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={22} />
          </button>

          <div style={{ maxWidth: '92vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={e => e.stopPropagation()}>
            <img
              src={SLIDES[index].src}
              alt={SLIDES[index].title}
              style={{ maxWidth: '92vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 3 }}>{SLIDES[index].title}</div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{index + 1} of {SLIDES.length}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
