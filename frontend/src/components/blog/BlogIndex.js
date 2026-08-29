import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, SprayCan, Building2, ShieldAlert, ArrowRight, Search, X } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES } from '../../data/blogPosts';

const CATEGORY_ICONS = {
  'house-cleaning': { Icon: Home, color: '#1e40af', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  carpet: { Icon: SprayCan, color: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' },
  commercial: { Icon: Building2, color: '#0891b2', bg: 'linear-gradient(135deg,#ecfeff,#cffafe)' },
  restoration: { Icon: ShieldAlert, color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)' },
};

function CategoryPill({ id, label, href, active }) {
  const meta = CATEGORY_ICONS[id];
  const Icon = meta?.Icon;
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 16px 7px 12px', borderRadius: 20,
        background: active ? 'linear-gradient(135deg,#1e3a8a,#1d4ed8)' : 'white',
        border: active ? 'none' : '1px solid #e2e8f0',
        color: active ? 'white' : '#374151',
        textDecoration: 'none', fontSize: 14, fontWeight: 600,
        boxShadow: active ? '0 3px 10px rgba(30,64,175,0.25)' : '0 1px 2px rgba(15,23,42,0.04)',
        transition: 'all 0.15s',
      }}
    >
      {Icon && (
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.2)' : meta.bg, color: active ? 'white' : meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={12} strokeWidth={2.5} />
        </span>
      )}
      {label}
    </a>
  );
}

function PostCard({ post }) {
  const meta = CATEGORY_ICONS[post.category];
  const Icon = meta?.Icon;
  return (
    <a href={`/blog/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 8px rgba(15,23,42,0.04), 0 12px 28px rgba(30,64,175,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.05)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {Icon && (
          <span style={{ width: 28, height: 28, borderRadius: 9, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
        )}
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {post.categoryLabel} · {post.readTime}
        </div>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.4 }}>{post.title}</h3>
      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt}</p>
      <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Read more <ArrowRight size={14} strokeWidth={2.5} /></span>
    </a>
  );
}

export default function BlogIndex() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const normalize = s => s.toLowerCase().replace(/[-_]/g, ' ');
    const term = normalize(query.trim());
    return BLOG_POSTS.filter(p =>
      normalize(p.title).includes(term) ||
      normalize(p.excerpt).includes(term) ||
      normalize(p.categoryLabel || '').includes(term) ||
      normalize(p.slug || '').includes(term)
    );
  }, [query, isSearching]);

  return (
    <>
      <Helmet>
        <title>Cleaning Cost Guides &amp; Tips | Clean Estimator Blog</title>
        <meta name="description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses." />
        <link rel="canonical" href="https://www.cleanestimator.com/blog" />
        <meta property="og:title" content="Cleaning Cost Guides & Tips | Clean Estimator Blog" />
        <meta property="og:description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cleanestimator.com/blog" />
        <meta property="og:image" content="https://www.cleanestimator.com/og-image.png" />
        <meta property="og:site_name" content="Clean Estimator" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cleaning Cost Guides & Tips | Clean Estimator Blog" />
        <meta name="twitter:description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses." />
        <meta name="twitter:image" content="https://www.cleanestimator.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Clean Estimator Cleaning Cost Blog",
          "description": "Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.",
          "url": "https://www.cleanestimator.com/blog",
          "publisher": {
            "@type": "Organization",
            "name": "Clean Estimator",
            "url": "https://www.cleanestimator.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.cleanestimator.com/og-image.png"
            }
          }
        })}</script>
      </Helmet>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>Cleaning Cost Guides</h1>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 28 }}>Expert guides to help you understand cleaning service pricing and make informed decisions.</p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cleaning topics — e.g. tipping, Airbnb, mold…"
            aria-label="Search blog posts"
            style={{
              width: '100%', padding: '13px 40px', borderRadius: 12, border: '1.5px solid #e2e8f0',
              fontSize: 15, color: '#0f172a', background: 'white', boxSizing: 'border-box',
              outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          {isSearching && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {isSearching ? (
          <>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              {searchResults.length === 0
                ? `No posts found for "${query.trim()}"`
                : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${query.trim()}"`}
            </p>
            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
                {searchResults.map(post => <PostCard key={post.slug} post={post} />)}
              </div>
            )}
          </>
        ) : (
        <>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          <CategoryPill id={null} label="All Posts" href="/blog" active />
          {CATEGORIES.map(c => (
            <CategoryPill key={c.id} id={c.id} label={c.label} href={`/blog/category/${c.id}`} />
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <a href={`/blog/${featured.slug}`} style={{ display: 'block', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f8ff 45%, #f0fdf4 100%)', border: '1px solid #bfdbfe', borderRadius: 18, padding: '36px 40px', marginBottom: 36, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 8px 20px rgba(30,64,175,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 8px rgba(15,23,42,0.04), 0 16px 36px rgba(30,64,175,0.14)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03), 0 8px 20px rgba(30,64,175,0.06)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>Featured</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{featured.categoryLabel} · {featured.readTime} read</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{featured.title}</h2>
            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>{featured.excerpt}</p>
            <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Read the full guide <ArrowRight size={16} strokeWidth={2.5} /></span>
          </a>
        )}

        {/* Post grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {rest.map(post => <PostCard key={post.slug} post={post} />)}
        </div>
        </>
        )}

        {/* CTA */}
        <div style={{ marginTop: 60, background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 18, padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 12px 32px rgba(15,23,42,0.24)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 6 }}>Ready to get an estimate?</div>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Use our free calculator to get a ZIP-code specific price for any cleaning service.</p>
          </div>
          <a href="/" style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8,#2563eb)', color: 'white', padding: '14px 28px', borderRadius: 11, textDecoration: 'none', fontWeight: 700, fontSize: 16, flexShrink: 0, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>Free Calculator →</a>
        </div>
      </div>
    </>
  );
}
