import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useDemoSite } from './DemoSiteContext';
import { buildGalleryItems } from './demoImagePool';

// Slide gallery for each demo site's home page -- a spotlight photo with
// caption, a jump-to thumbnail strip, and progress dots, auto-advancing like
// the work-in-action gallery on the real client sites. Images are pulled
// from the shared stock pool (see demoImagePool.js); the service name and
// city are this business's own real data, not boilerplate.
export default function DemoWorkGallery() {
  const { site, openQuote } = useDemoSite();
  const c = site.colors;
  const items = buildGalleryItems(site);
  const total = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const thumbRef = useRef(null);

  const next = useCallback(() => setIndex((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setIndex((p) => (p - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(next, 4500);
    return () => clearTimeout(t);
  }, [paused, next, index]);

  useEffect(() => {
    const strip = thumbRef.current;
    const thumb = strip?.children[index];
    if (!strip || !thumb || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2, behavior: 'smooth' });
  }, [index]);

  const active = items[index];
  if (!active) return null;

  return (
    <div style={{ padding: 'clamp(44px, 8vw, 80px) 20px', background: c.bgAlt }}>
      <div
        style={{ maxWidth: 1000, margin: '0 auto' }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 28, borderBottom: `1px solid ${c.border}`, paddingBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.primary, marginBottom: 8 }}>
              <Sparkles size={13} /> Our Work in Action
            </div>
            <h2 style={{ fontFamily: site.fontHeading, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: c.ink, margin: 0 }}>Recent Jobs Around {site.city}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: c.textMuted }}>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
            <button type="button" onClick={prev} aria-label="Previous photo" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${c.border}`, background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.ink }}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={next} aria-label="Next photo" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${c.border}`, background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.ink }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="demo-gallery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 30px rgba(15,23,42,0.12)' }}>
              <img key={active.id} src={active.image} alt={active.alt} loading="lazy" style={{ width: '100%', height: 'clamp(240px, 42vw, 420px)', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: c.primary, color: 'white' }}>{active.category}</span>
                <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)' }}>{active.location}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {items.map((item, i) => (
                <button key={item.id} type="button" onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`}
                  style={{ height: 7, width: i === index ? 26 : 7, borderRadius: 999, border: 'none', cursor: 'pointer', background: i === index ? c.primary : c.border, transition: 'width 0.2s ease' }} />
              ))}
            </div>
          </div>

          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.primary, marginBottom: 6 }}>Project Details</div>
              <div style={{ fontFamily: site.fontHeading, fontWeight: 700, fontSize: 18, color: c.ink, marginBottom: 6 }}>{active.title}</div>
              <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.65, margin: 0 }}>{active.description}</p>
            </div>
            <button onClick={openQuote} style={{ background: c.primary, color: 'white', border: 'none', padding: '11px 20px', borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: site.fontBody }}>Request This Service</button>
            <div ref={thumbRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 10, borderTop: `1px solid ${c.border}` }}>
              {items.map((item, i) => (
                <button key={item.id} type="button" onClick={() => setIndex(i)} aria-label={`Jump to ${item.title}`}
                  style={{
                    flexShrink: 0, width: 56, height: 56, borderRadius: 10, overflow: 'hidden', padding: 0, cursor: 'pointer',
                    border: i === index ? `2px solid ${c.primary}` : `1px solid ${c.border}`, opacity: i === index ? 1 : 0.65,
                  }}>
                  <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 760px) {
          .demo-gallery-grid { grid-template-columns: 2fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
