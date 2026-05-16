import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getPostsByCategory, CATEGORIES, BLOG_POSTS } from '../../data/blogPosts';

export default function BlogCategory({ category }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const posts = cat ? getPostsByCategory(category) : BLOG_POSTS;
  const title = cat ? cat.label : 'All Posts';

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
        <div style={{ marginBottom: 8 }}>
          <a href="/blog" style={{ color: '#2563eb', fontWeight: 600, fontSize: 14 }}>← All posts</a>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{cat?.icon} {title}</h1>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36 }}>{posts.length} guide{posts.length !== 1 ? 's' : ''}</p>

        {/* Other categories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {CATEGORIES.filter(c => c.id !== category).map(c => (
            <a key={c.id} href={`/blog/category/${c.id}`} style={{ padding: '8px 16px', borderRadius: 20, background: '#f1f5f9', color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              {c.icon} {c.label}
            </a>
          ))}
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>No posts in this category yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <a key={post.slug} href={`/blog/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      {post.readTime} read · {new Date(post.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.35 }}>{post.title}</h2>
                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{post.excerpt}</p>
                  </div>
                  <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 4 }}>Read →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
