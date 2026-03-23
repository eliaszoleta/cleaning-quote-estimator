import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BLOG_POSTS, CATEGORIES } from '../../data/blogPosts';

export default function BlogIndex() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <>
      <Helmet>
        <title>Cleaning Cost Guides & Tips | Clean Estimator Blog</title>
        <meta name="description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses." />
      </Helmet>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Cleaning Cost Guides</h1>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40 }}>Expert guides to help you understand cleaning service pricing and make informed decisions.</p>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          <a href="/blog" style={{ padding: '8px 16px', borderRadius: 20, background: '#0f172a', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>All Posts</a>
          {CATEGORIES.map(c => (
            <a key={c.id} href={`/blog/category/${c.id}`} style={{ padding: '8px 16px', borderRadius: 20, background: '#f1f5f9', color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              {c.icon} {c.label}
            </a>
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <a href={`/blog/${featured.slug}`} style={{ display: 'block', background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 16, padding: '36px 40px', marginBottom: 36, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ background: '#2563eb', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Featured</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{featured.categoryLabel} · {featured.readTime} read</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 10, lineHeight: 1.3 }}>{featured.title}</h2>
            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>{featured.excerpt}</p>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 15 }}>Read the full guide →</span>
          </a>
        )}

        {/* Post grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {rest.map(post => (
            <a key={post.slug} href={`/blog/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {post.categoryLabel} · {post.readTime} read
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.4 }}>{post.title}</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt}</p>
              <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 14 }}>Read more →</span>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 60, background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '32px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Ready to get an estimate?</div>
            <p style={{ color: '#374151', fontSize: 15 }}>Use our free calculator to get a ZIP-code specific price for any cleaning service.</p>
          </div>
          <a href="/" style={{ background: '#2563eb', color: 'white', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>Free Calculator →</a>
        </div>
      </div>
    </>
  );
}
