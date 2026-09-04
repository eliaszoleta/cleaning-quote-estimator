import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FileQuestion, Lightbulb, ArrowRight } from 'lucide-react';
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
    return `<div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:700;color:#0f172a;margin:28px 0 12px">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:40px 0 16px;letter-spacing:-0.01em">$1</h2>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Emoji with text
  html = html.replace(/^([✅⚠️🚩❌✓])\s+(.+)$/gm, '<div style="display:flex;gap:8px;margin-bottom:8px"><span>$1</span><span>$2</span></div>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#1e40af;font-weight:500">$1</a>');

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
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <FileQuestion size={30} strokeWidth={1.75} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Post not found</h1>
      <a href="/blog" style={{ color: '#1e40af', fontWeight: 600 }}>← Back to blog</a>
    </div>
  );

  const related = BLOG_POSTS.filter(p => p.slug !== slug && p.category === post.category).slice(0, 2);
  const others = BLOG_POSTS.filter(p => p.slug !== slug && p.category !== post.category).slice(0, 2);
  const suggestions = [...related, ...others].slice(0, 3);

  const canonicalUrl = `https://www.cleanestimator.com/blog/${slug}`;
  const seoTitle = `${post.title} | Clean Estimator`;
  const dateISO = post.dateISO || (post.date ? new Date(post.date).toISOString() : new Date().toISOString());

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: dateISO,
    dateModified: dateISO,
    image: 'https://www.cleanestimator.com/og-image.svg',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    url: canonicalUrl,
    author: { '@type': 'Organization', name: 'Clean Estimator', url: 'https://www.cleanestimator.com' },
    publisher: {
      '@type': 'Organization',
      name: 'Clean Estimator',
      url: 'https://www.cleanestimator.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cleanestimator.com/og-image.svg',
        width: 1200,
        height: 630,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.cleanestimator.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.categoryLabel || post.category, item: `https://www.cleanestimator.com/blog/category/${post.category}` },
      { '@type': 'ListItem', position: 4, name: post.title, item: canonicalUrl },
    ],
  };

  // Optional per-post FAQ schema -- only posts that define `faqs` get this
  // block, so it's additive and doesn't affect posts without one. Directly
  // targets AI Overviews / rich results, which pull heavily from FAQPage
  // structured data for exactly this kind of Q&A content.
  const faqSchema = post.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:site_name" content="Clean Estimator" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://www.cleanestimator.com/og-image.svg" />
        <meta property="og:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
        <meta property="article:published_time" content={dateISO} />
        <meta property="article:modified_time" content={dateISO} />
        <meta property="article:section" content={post.categoryLabel || post.category} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CleanEstimator" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content="https://www.cleanestimator.com/og-image.svg" />
        <meta name="twitter:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
          <a href="/" style={{ color: '#94a3b8' }}>Home</a> › <a href="/blog" style={{ color: '#94a3b8' }}>Blog</a> › <a href={`/blog/category/${post.category}`} style={{ color: '#94a3b8' }}>{post.categoryLabel}</a>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <a href={`/blog/category/${post.category}`} style={{ color: '#1e40af', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{post.categoryLabel}</a>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>·</span>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{post.readTime} read</span>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>·</span>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.01em' }}>{post.title}</h1>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.6 }}>{post.excerpt}</p>
        </div>

        {/* CTA box */}
        <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f8ff)', border: '1px solid #bfdbfe', borderRadius: 14, padding: '18px 22px', marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#1e40af', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={17} strokeWidth={2} /> Get a free local estimate for your project
          </span>
          <a href="/" style={{ background: '#1d4ed8', color: 'white', padding: '9px 20px', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>Use Free Calculator →</a>
        </div>

        {/* Content */}
        <div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

        {/* Bottom CTA */}
        <div style={{ background: 'linear-gradient(135deg, #0b1220, #1e293b)', borderRadius: 18, padding: '36px 40px', marginTop: 48, color: 'white', textAlign: 'center', boxShadow: '0 12px 32px rgba(15,23,42,0.24)' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Get a Free Local Estimate</h3>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 15 }}>Our calculator gives ZIP-code specific prices across all 50 states. Free and instant.</p>
          <a href="/" style={{ background: '#1d4ed8', color: 'white', padding: '14px 32px', borderRadius: 11, textDecoration: 'none', fontWeight: 700, fontSize: 16, boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>Calculate My Cost →</a>
        </div>

        {/* Related posts */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Related Guides</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {suggestions.map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} style={{ display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(30,64,175,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{p.categoryLabel}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Read <ArrowRight size={13} strokeWidth={2.5} /></div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
