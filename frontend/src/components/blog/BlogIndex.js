import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, SprayCan, Building2, ShieldAlert, Rocket, ArrowRight, Search, X } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES } from '../../data/blogPosts';
import { BLOG_COUNTRIES, getCountryBlog } from '../../data/intl/blogRegistry';
import '../pages/PageHero.css';

// Small nav strip linking the 4 separate blogs (US default + the 3
// country-specific ones) to each other -- keeps them discoverable/
// crosslinked for SEO without ever mixing their post lists together (each
// blog's own index only ever renders its own POSTS array, never a merged
// one -- see blogRegistry.js's comment on why that's a hard requirement,
// not just a style choice).
function BlogCountrySwitcher({ current }) {
  const items = [
    { key: null, label: 'United States', href: '/blog' },
    ...Object.values(BLOG_COUNTRIES).map(c => ({ key: c.key, label: c.label, href: c.basePath })),
  ];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
      {items.map(item => (
        <a
          key={item.label}
          href={item.href}
          style={{
            padding: '5px 13px', borderRadius: 16, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
            background: item.key === current ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
            color: item.key === current ? 'white' : '#94a3b8',
            border: item.key === current ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

const CATEGORY_ICONS = {
  'house-cleaning': { Icon: Home, color: '#1d4ed8', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  carpet: { Icon: SprayCan, color: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' },
  commercial: { Icon: Building2, color: '#0891b2', bg: 'linear-gradient(135deg,#ecfeff,#cffafe)' },
  restoration: { Icon: ShieldAlert, color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)' },
  'starting-out': { Icon: Rocket, color: '#ea580c', bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)' },
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
        background: active ? '#1d4ed8' : 'white',
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

function PostCard({ post, basePath = '/blog' }) {
  const meta = CATEGORY_ICONS[post.category];
  const Icon = meta?.Icon;
  return (
    <a href={`${basePath}/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(16px, 4.5vw, 24px)', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.05)' }}
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
      <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Read more <ArrowRight size={14} strokeWidth={2.5} /></span>
    </a>
  );
}

export default function BlogIndex({ country } = {}) {
  const countryBlog = country ? getCountryBlog(country) : null;
  const POSTS = countryBlog ? countryBlog.posts : BLOG_POSTS;
  const CATS = countryBlog ? countryBlog.categories : CATEGORIES;
  const basePath = countryBlog ? countryBlog.basePath : '/blog';
  const siteName = countryBlog ? countryBlog.siteName : 'Clean Estimator';
  const heroTitle = countryBlog ? countryBlog.heroTitle : 'Cleaning Cost Guides';
  const heroSubtitle = countryBlog ? countryBlog.heroSubtitle : 'Expert guides to help you understand cleaning service pricing and make informed decisions.';
  const canonicalUrl = `https://www.cleanestimator.com${basePath}`;
  const metaTitle = `${heroTitle} & Tips | ${siteName} Blog`;
  const metaDescription = countryBlog
    ? `${countryBlog.heroSubtitle} Browse cost guides by category.`
    : 'Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.';

  const featured = POSTS[0];
  const rest = POSTS.slice(1);
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const normalize = s => s.toLowerCase().replace(/[-_]/g, ' ');
    const term = normalize(query.trim());
    return POSTS.filter(p =>
      normalize(p.title).includes(term) ||
      normalize(p.excerpt).includes(term) ||
      normalize(p.categoryLabel || '').includes(term) ||
      normalize(p.slug || '').includes(term)
    );
  }, [query, isSearching, POSTS]);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://www.cleanestimator.com/og-image.png" />
        <meta property="og:site_name" content={siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://www.cleanestimator.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": `${siteName} Cleaning Cost Blog`,
          "description": metaDescription,
          "url": canonicalUrl,
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
      <div className="page-hero-band" style={{ paddingBottom: 64 }}>
        <div className="page-hero-glow" aria-hidden="true" />
        <div className="page-hero-inner" style={{ maxWidth: 1100, textAlign: 'left' }}>
          <BlogCountrySwitcher current={country || null} />
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 8, letterSpacing: '-0.01em' }}>{heroTitle}</h1>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.55, maxWidth: 640 }}>{heroSubtitle}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px clamp(14px, 7vw, 60px)' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginTop: -32, marginBottom: 'clamp(20px, 4vw, 32px)' }}>
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
              boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
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
                {searchResults.map(post => <PostCard key={post.slug} post={post} basePath={basePath} />)}
              </div>
            )}
          </>
        ) : (
        <>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
          <CategoryPill id={null} label="All Posts" href={basePath} active />
          {CATS.map(c => (
            <CategoryPill key={c.id} id={c.id} label={c.label} href={`${basePath}/category/${c.id}`} />
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <a href={`${basePath}/${featured.slug}`} style={{ display: 'block', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f8ff 45%, #f0fdf4 100%)', border: '1px solid #bfdbfe', borderRadius: 18, padding: 'clamp(20px, 5vw, 36px) clamp(18px, 4.5vw, 40px)', marginBottom: 'clamp(24px, 5vw, 36px)', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 8px 20px rgba(30,64,175,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 8px rgba(15,23,42,0.04), 0 16px 36px rgba(30,64,175,0.14)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03), 0 8px 20px rgba(30,64,175,0.06)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>Featured</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{featured.categoryLabel} · {featured.readTime} read</span>
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 26px)', fontWeight: 800, color: '#0f172a', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{featured.title}</h2>
            <p style={{ fontSize: 'clamp(14px, 3.6vw, 16px)', color: '#374151', lineHeight: 1.55, marginBottom: 16 }}>{featured.excerpt}</p>
            <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Read the full guide <ArrowRight size={16} strokeWidth={2.5} /></span>
          </a>
        )}

        {/* Post grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {rest.map(post => <PostCard key={post.slug} post={post} basePath={basePath} />)}
        </div>
        </>
        )}

        {/* CTA */}
        <div style={{ marginTop: 'clamp(36px, 8vw, 60px)', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 18, padding: 'clamp(24px, 6vw, 36px) clamp(20px, 5vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 12px 32px rgba(15,23,42,0.24)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 6 }}>Ready to get an estimate?</div>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Use our free calculator to get a {countryBlog ? 'location-specific' : 'ZIP-code specific'} price for any cleaning service.</p>
          </div>
          <a href="/" style={{ background: '#1d4ed8', color: 'white', padding: '14px 28px', borderRadius: 11, textDecoration: 'none', fontWeight: 700, fontSize: 16, flexShrink: 0, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>Free Calculator →</a>
        </div>
      </div>
    </>
  );
}
