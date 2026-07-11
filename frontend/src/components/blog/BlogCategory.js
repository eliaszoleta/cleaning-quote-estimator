import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, SprayCan, Building2, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { getPostsByCategory, CATEGORIES, BLOG_POSTS } from '../../data/blogPosts';

const CATEGORY_ICONS = {
  'house-cleaning': { Icon: Home, color: '#1e40af', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  carpet: { Icon: SprayCan, color: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' },
  commercial: { Icon: Building2, color: '#0891b2', bg: 'linear-gradient(135deg,#ecfeff,#cffafe)' },
  restoration: { Icon: ShieldAlert, color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)' },
};

function CategoryPill({ id, label, href }) {
  const meta = CATEGORY_ICONS[id];
  const Icon = meta?.Icon;
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 16px 7px 12px', borderRadius: 20,
        background: 'white', border: '1px solid #e2e8f0', color: '#374151',
        textDecoration: 'none', fontSize: 14, fontWeight: 600,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)', transition: 'all 0.15s',
      }}
    >
      {Icon && (
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={12} strokeWidth={2.5} />
        </span>
      )}
      {label}
    </a>
  );
}

export default function BlogCategory({ category }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const posts = cat ? getPostsByCategory(category) : BLOG_POSTS;
  const title = cat ? cat.label : 'All Posts';
  const meta = CATEGORY_ICONS[category];
  const HeaderIcon = meta?.Icon;

  return (
    <>
      <Helmet>
        <title>{title} Guides | Clean Estimator Blog</title>
        <meta name="description" content={`Expert guides on ${title.toLowerCase()} costs, tips, and best practices. Browse ${posts.length} articles.`} />
        <link rel="canonical" href={`https://www.cleanestimator.com/blog/category/${category}`} />
        <meta property="og:title" content={`${title} Guides | Clean Estimator Blog`} />
        <meta property="og:description" content={`Expert guides on ${title.toLowerCase()} costs, tips, and best practices.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.cleanestimator.com/blog/category/${category}`} />
        <meta property="og:image" content="https://www.cleanestimator.com/og-image.png" />
        <meta property="og:site_name" content="Clean Estimator" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${title} Guides | Clean Estimator Blog`} />
        <meta name="twitter:description" content={`Expert guides on ${title.toLowerCase()} costs, tips, and best practices.`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.cleanestimator.com" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.cleanestimator.com/blog" },
            { "@type": "ListItem", "position": 3, "name": title, "item": `https://www.cleanestimator.com/blog/category/${category}` }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${title} — Clean Estimator Blog`,
          "description": `Expert guides on ${title.toLowerCase()} costs, tips, and best practices.`,
          "url": `https://www.cleanestimator.com/blog/category/${category}`,
          "publisher": { "@type": "Organization", "name": "Clean Estimator", "url": "https://www.cleanestimator.com" }
        })}</script>
      </Helmet>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: 16 }}>
          <a href="/blog" style={{ color: '#1e40af', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}><ArrowLeft size={14} strokeWidth={2.5} /> All posts</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          {HeaderIcon && (
            <span style={{ width: 48, height: 48, borderRadius: 14, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
              <HeaderIcon size={24} strokeWidth={2} />
            </span>
          )}
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36 }}>{posts.length} guide{posts.length !== 1 ? 's' : ''}</p>

        {/* Other categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {CATEGORIES.filter(c => c.id !== category).map(c => (
            <CategoryPill key={c.id} id={c.id} label={c.label} href={`/blog/category/${c.id}`} />
          ))}
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>No posts in this category yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <a key={post.slug} href={`/blog/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 28px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(15,23,42,0.04), 0 10px 26px rgba(30,64,175,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.05)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      {post.readTime} read · {new Date(post.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.35 }}>{post.title}</h2>
                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{post.excerpt}</p>
                  </div>
                  <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Read <ArrowRight size={15} strokeWidth={2.5} /></span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
