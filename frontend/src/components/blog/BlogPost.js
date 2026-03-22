import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getPostBySlug, BLOG_POSTS } from '../../data/blogPosts';

// Simple markdown-to-HTML renderer (tables, headers, bold, lists, links)
function renderMarkdown(md) {
  if (!md) return '';
  let html = md.trim();

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th style="padding:10px 14px;text-align:left;background:#f8fafc;font-weight:700;font-size:14px;border-bottom:2px solid #e2e8f0">${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').filter(Boolean).map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #f1f5f9">${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:700;color:#0f172a;margin:28px 0 12px">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:40px 0 16px">$1</h2>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Emoji with text: ✅ text / ⚠️ text / 🚩 text
  html = html.replace(/^([✅⚠️🚩❌✓])\s+(.+)$/gm, '<div style="display:flex;gap:8px;margin-bottom:8px"><span>$1</span><span>$2</span></div>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb;font-weight:500">$1</a>');

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.6">${line.replace(/^- /, '')}</li>`).join('');
    return `<ul style="padding-left:24px;margin:12px 0">${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.6">${line.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol style="padding-left:24px;margin:12px 0">${items}</ol>`;
  });

  // Paragraphs (double newlines)
  html = html.split(/\n\n+/).map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<div') || para.startsWith('<table') || para.startsWith('<hr')) return para;
    return `<p style="font-size:16px;line-height:1.8;color:#374151;margin:0 0 16px">${para.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

export default function BlogPost({ slug }) {
  const post = getPostBySlug(slug);

  if (!post) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Post not found</h1>
      <a href="/blog" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to blog</a>
    </div>
  );

  const related = BLOG_POSTS.filter(p => p.slug !== slug && p.category === post.category).slice(0, 2);
  const others = BLOG_POSTS.filter(p => p.slug !== slug && p.category !== post.category).slice(0, 2);
  const suggestions = [...related, ...others].slice(0, 3);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.dateISO || post.date,
    author: { '@type': 'Organization', name: 'CleanCalc' },
    publisher: { '@type': 'Organization', name: 'CleanCalc', url: 'https://cleaningcalculator.app' },
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | CleanCalc</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://cleaningcalculator.app/blog/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
          <a href="/" style={{ color: '#94a3b8' }}>Home</a> › <a href="/blog" style={{ color: '#94a3b8' }}>Blog</a> › <a href={`/blog/category/${post.category}`} style={{ color: '#94a3b8' }}>{post.categoryLabel}</a>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href={`/blog/category/${post.category}`} style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{post.categoryLabel}</a>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{post.readTime} read</span>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginBottom: 16 }}>{post.title}</h1>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.6 }}>{post.excerpt}</p>
        </div>

        {/* CTA box */}
        <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#1e40af', fontWeight: 500 }}>💡 Get a free local estimate for your project</span>
          <a href="/" style={{ background: '#2563eb', color: 'white', padding: '9px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Use Free Calculator →</a>
        </div>

        {/* Content */}
        <div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

        {/* Bottom CTA */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '32px 36px', marginTop: 48, color: 'white', textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Get a Free Local Estimate</h3>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 15 }}>Our calculator gives ZIP-code specific prices across all 50 states. Free and instant.</p>
          <a href="/" style={{ background: '#2563eb', color: 'white', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>Calculate My Cost →</a>
        </div>

        {/* Related posts */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Related Guides</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {suggestions.map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} style={{ display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{p.categoryLabel}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginTop: 10 }}>Read →</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
