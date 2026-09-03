import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PRIMARY = '#2563eb';
const AUTO_ADVANCE_MS = 4000;

const SLIDES = [
  { src: '/images/partner-gallery/floating-partner-banner.png', title: 'Your listing follows visitors sitewide', desc: 'A floating banner shows your business on every page a visitor in your city browses — not just the results page.' },
  { src: '/images/partner-gallery/results-page-partner-card.png', title: 'Featured on every estimate result', desc: 'Right after someone gets their price estimate, your business appears as the recommended local cleaner — with your phone, website, and email one tap away.' },
  { src: '/images/partner-gallery/google-search-cleaning-estimator.png', title: 'Ranking in Google for real search traffic', desc: 'Clean Estimator shows up in Google’s AI Overview and organic results for searches like "cleaning estimator."' },
  { src: '/images/partner-gallery/google-search-cleaning-cost-calculator.png', title: 'Cited by Google’s AI Overview', desc: 'For "cleaning cost calculator," Google’s AI Overview cites Clean Estimator directly as a source.' },
  { src: '/images/partner-gallery/google-search-free-cleaning-estimate-calculator.png', title: 'Showing up for high-intent searches', desc: 'Ranking for "free cleaning estimate calculator" — exactly what homeowners search before hiring.' },
  { src: '/images/partner-gallery/google-search-cleaning-estimate-online.png', title: 'Multiple keywords, consistent visibility', desc: 'Also ranking for "cleaning estimate online," reinforcing steady, ongoing organic traffic.' },
  { src: '/images/partner-gallery/analytics-traffic.png', title: 'Real visitors, real traffic', desc: 'Live analytics showing thousands of active users and tens of thousands of monthly events — the audience your listing reaches.' },
];

export default function PartnerGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const go = (i) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

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
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top',
                opacity: i === index ? 1 : 0,
                transition: 'opacity 0.5s ease',
                pointerEvents: i === index ? 'auto' : 'none',
              }}
            />
          ))}
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
    </div>
  );
}
