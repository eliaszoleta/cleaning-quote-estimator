'use strict';

const fs   = require('fs');
const path = require('path');

const BUILD  = path.join(__dirname, '../build');
const SRC    = path.join(__dirname, '../src');
const DOMAIN = 'https://www.cleanestimator.com';
const PRIMARY = '#2563eb';

// ─── 1. Load blog data ──────────────────────────────────────────────────────

function loadBlogData() {
  const raw = fs.readFileSync(path.join(SRC, 'data/blogPosts.js'), 'utf8');
  const src = raw
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export default /gm, 'const _default = ')
    .replace(/^export \{[^}]*\};\s*$/gm, '');
  // eslint-disable-next-line no-new-func
  const fn = new Function(src + '\nreturn { BLOG_POSTS, CATEGORIES };');
  return fn();
}

// ─── 2. Extract CSS/JS asset tags from the built index.html ─────────────────

function getAssetTags() {
  const indexHtml = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  const cssLinks  = (indexHtml.match(/<link[^>]+\.css[^>]*>/g)  || []).join('\n  ');
  const jsScripts = (indexHtml.match(/<script[^>]+\.js[^>]*>/g) || []).join('\n  ');
  return { cssLinks, jsScripts };
}

// ─── 3. Helpers ──────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── 4. Markdown renderer (mirrors BlogPost.js renderMarkdown) ───────────────

function renderMarkdown(md) {
  if (!md) return '';
  let html = md.trim();

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim()).map(c =>
      '<th style="padding:10px 14px;text-align:left;background:#f8fafc;font-weight:700;font-size:14px;border-bottom:2px solid #e2e8f0">' + c.trim() + '</th>'
    ).join('');
    const rows = bodyRows.trim().split('\n').filter(Boolean).map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c =>
        '<td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #f1f5f9">' + c.trim() + '</td>'
      ).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    return '<div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:700;color:#0f172a;margin:28px 0 12px">$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:40px 0 16px">$1</h2>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:' + PRIMARY + ';font-weight:500">$1</a>');

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      '<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.6">' + line.replace(/^- /, '') + '</li>'
    ).join('');
    return '<ul style="padding-left:24px;margin:12px 0">' + items + '</ul>';
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      '<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.6">' + line.replace(/^\d+\. /, '') + '</li>'
    ).join('');
    return '<ol style="padding-left:24px;margin:12px 0">' + items + '</ol>';
  });

  // Paragraphs (double newlines)
  html = html.split(/\n\n+/).map(para => {
    if (/^<(h[1-6]|ul|ol|div|table|hr|blockquote)/.test(para)) return para;
    return '<p style="font-size:16px;line-height:1.8;color:#374151;margin:0 0 16px">' + para.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return html;
}

// ─── 5. Blog post renderer ───────────────────────────────────────────────────

function renderBlogPost(post, cat, assets) {
  const dateISO  = post.dateISO || (post.date ? new Date(post.date).toISOString() : new Date().toISOString());
  const seoTitle = post.title + ' | Clean Estimator';
  const catLabel = (cat && cat.label) || post.categoryLabel || post.category;
  const contentHtml = renderMarkdown(post.content);

  const articleSchemaStr = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: dateISO,
    dateModified: dateISO,
    image: DOMAIN + '/og-image.svg',
    url: DOMAIN + '/blog/' + post.slug,
    mainEntityOfPage: { '@type': 'WebPage', '@id': DOMAIN + '/blog/' + post.slug },
    author: { '@type': 'Organization', name: 'Clean Estimator', url: DOMAIN },
    publisher: {
      '@type': 'Organization',
      name: 'Clean Estimator',
      url: DOMAIN,
      logo: { '@type': 'ImageObject', url: DOMAIN + '/og-image.svg' },
    },
  });

  const breadcrumbSchemaStr = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: DOMAIN + '/blog' },
      { '@type': 'ListItem', position: 3, name: catLabel, item: DOMAIN + '/blog/category/' + post.category },
      { '@type': 'ListItem', position: 4, name: post.title, item: DOMAIN + '/blog/' + post.slug },
    ],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(seoTitle)}</title>
  <meta name="description" content="${esc(post.excerpt)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${DOMAIN}/blog/${post.slug}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:site_name" content="Clean Estimator">
  <meta property="og:title" content="${esc(seoTitle)}">
  <meta property="og:description" content="${esc(post.excerpt)}">
  <meta property="og:url" content="${DOMAIN}/blog/${post.slug}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${DOMAIN}/og-image.svg">
  <meta property="og:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator">
  <meta property="article:published_time" content="${dateISO}">
  <meta property="article:modified_time" content="${dateISO}">
  <meta property="article:section" content="${esc(catLabel)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(seoTitle)}">
  <meta name="twitter:description" content="${esc(post.excerpt)}">
  <meta name="twitter:image" content="${DOMAIN}/og-image.svg">
  <script type="application/ld+json">${articleSchemaStr}</script>
  <script type="application/ld+json">${breadcrumbSchemaStr}</script>
  ${assets.cssLinks}
</head>
<body>
<div id="root"><div style="max-width:760px;margin:0 auto;padding:60px 24px;font-family:system-ui,-apple-system,sans-serif">
  <div style="font-size:13px;color:#94a3b8;margin-bottom:24px">
    <a href="/" style="color:#94a3b8">Home</a> ›
    <a href="/blog" style="color:#94a3b8">Blog</a> ›
    <a href="/blog/category/${post.category}" style="color:#94a3b8">${esc(catLabel)}</a>
  </div>
  <div style="margin-bottom:40px">
    <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
      <a href="/blog/category/${post.category}" style="color:${PRIMARY};font-size:13px;font-weight:700;text-decoration:none">${esc(catLabel)}</a>
      <span style="color:#cbd5e1;font-size:13px">·</span>
      <span style="color:#94a3b8;font-size:13px">${esc(post.readTime || '')} read</span>
    </div>
    <h1 style="font-size:clamp(26px,4vw,40px);font-weight:900;color:#0f172a;line-height:1.2;margin-bottom:16px">${esc(post.title)}</h1>
    <p style="font-size:18px;color:#64748b;line-height:1.6">${esc(post.excerpt)}</p>
  </div>
  <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <span style="font-size:14px;color:#1e40af;font-weight:500">Get a free local estimate for your project</span>
    <a href="/" style="background:${PRIMARY};color:white;padding:9px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;flex-shrink:0">Use Free Calculator &#8594;</a>
  </div>
  <div style="line-height:1.8">${contentHtml}</div>
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:14px;padding:32px 36px;margin-top:48px;color:white;text-align:center">
    <h3 style="font-size:22px;font-weight:800;margin-bottom:10px">Get a Free Local Estimate</h3>
    <p style="color:#94a3b8;margin-bottom:20px;font-size:15px">Our calculator gives ZIP-code specific prices across all 50 states. Free and instant.</p>
    <a href="/" style="background:${PRIMARY};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Calculate My Cost &#8594;</a>
  </div>
</div></div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 6. Blog index renderer ──────────────────────────────────────────────────

function renderBlogIndex(posts, categories, assets) {
  const featured = posts[0];
  const rest = posts.slice(1);

  const catPills = categories.map(c =>
    '<a href="/blog/category/' + c.id + '" style="padding:8px 16px;border-radius:20px;background:#f1f5f9;color:#374151;text-decoration:none;font-size:14px;font-weight:600">' + esc(c.label) + '</a>'
  ).join('\n    ');

  const postCard = (post, isFeatured) => {
    const catLabel = (categories.find(c => c.id === post.category) || {}).label || post.categoryLabel || post.category;
    const bgStyle = isFeatured
      ? 'background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:16px;padding:36px 40px;margin-bottom:36px'
      : 'background:white;border:1px solid #e2e8f0;border-radius:14px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.05)';
    const hTag = isFeatured ? 'h2' : 'h3';
    const fontSize = isFeatured ? '26px' : '17px';
    const fontWeight = isFeatured ? '800' : '700';
    const excerptSize = isFeatured ? '16px' : '14px';
    const linkSize = isFeatured ? '15px' : '14px';
    const linkText = isFeatured ? 'Read the full guide &#8594;' : 'Read more &#8594;';
    return '<a href="/blog/' + post.slug + '" style="display:block;text-decoration:none;' + bgStyle + '">' +
      '<div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">' + esc(catLabel) + ' &middot; ' + esc(post.readTime || '') + ' read</div>' +
      '<' + hTag + ' style="font-size:' + fontSize + ';font-weight:' + fontWeight + ';color:#0f172a;margin-bottom:10px;line-height:1.3">' + esc(post.title) + '</' + hTag + '>' +
      '<p style="font-size:' + excerptSize + ';color:#475569;line-height:1.6;margin-bottom:16px">' + esc(post.excerpt) + '</p>' +
      '<span style="color:' + PRIMARY + ';font-weight:700;font-size:' + linkSize + '">' + linkText + '</span>' +
      '</a>';
  };

  const blogSchemaStr = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Clean Estimator Cleaning Cost Blog',
    description: 'Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.',
    url: DOMAIN + '/blog',
    publisher: { '@type': 'Organization', name: 'Clean Estimator', url: DOMAIN },
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cleaning Cost Guides &amp; Tips | Clean Estimator Blog</title>
  <meta name="description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${DOMAIN}/blog">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:title" content="Cleaning Cost Guides &amp; Tips | Clean Estimator Blog">
  <meta property="og:description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${DOMAIN}/blog">
  <meta property="og:image" content="${DOMAIN}/og-image.svg">
  <meta property="og:site_name" content="Clean Estimator">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Cleaning Cost Guides &amp; Tips | Clean Estimator Blog">
  <meta name="twitter:description" content="Expert guides on cleaning service costs, tips for hiring cleaners, and restoration advice for homeowners and businesses.">
  <meta name="twitter:image" content="${DOMAIN}/og-image.svg">
  <script type="application/ld+json">${blogSchemaStr}</script>
  ${assets.cssLinks}
</head>
<body>
<div id="root">
<div style="max-width:1100px;margin:0 auto;padding:60px 24px;font-family:system-ui,-apple-system,sans-serif">
  <h1 style="font-size:40px;font-weight:900;color:#0f172a;margin-bottom:8px">Cleaning Cost Guides</h1>
  <p style="font-size:18px;color:#64748b;margin-bottom:40px">Expert guides to help you understand cleaning service pricing and make informed decisions.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:40px">
    <a href="/blog" style="padding:8px 16px;border-radius:20px;background:#0f172a;color:white;text-decoration:none;font-size:14px;font-weight:600">All Posts</a>
    ${catPills}
  </div>
  ${featured ? postCard(featured, true) : ''}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
    ${rest.map(p => postCard(p, false)).join('\n    ')}
  </div>
  <div style="margin-top:60px;background:#f0f7ff;border:1px solid #bfdbfe;border-radius:14px;padding:32px 36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
    <div>
      <div style="font-weight:800;font-size:20px;color:#0f172a;margin-bottom:6px">Ready to get an estimate?</div>
      <p style="color:#374151;font-size:15px">Use our free calculator to get a ZIP-code specific price for any cleaning service.</p>
    </div>
    <a href="/" style="background:${PRIMARY};color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;flex-shrink:0">Free Calculator &#8594;</a>
  </div>
</div>
</div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 7. Category page renderer ───────────────────────────────────────────────

function renderCategoryPage(cat, posts, assets) {
  const catPosts = posts.filter(p => p.category === cat.id);
  const seoTitle = cat.label + ' Cost Guide 2026 | Clean Estimator';
  const seoDesc  = 'Expert cost guides for ' + cat.label.toLowerCase() + ' services. Get free ZIP-code specific estimates for your area.';

  const breadcrumbSchemaStr = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: DOMAIN + '/blog' },
      { '@type': 'ListItem', position: 3, name: cat.label, item: DOMAIN + '/blog/category/' + cat.id },
    ],
  });

  const postRows = catPosts.map(post =>
    '<a href="/blog/' + post.slug + '" style="display:block;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:22px 26px;text-decoration:none;margin-bottom:16px">' +
    '<div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">' + esc(cat.label) + ' &middot; ' + esc(post.readTime || '') + ' read</div>' +
    '<h2 style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:6px;line-height:1.4">' + esc(post.title) + '</h2>' +
    '<p style="font-size:13.5px;color:#64748b;line-height:1.6;margin-bottom:10px">' + esc(post.excerpt) + '</p>' +
    '<span style="color:' + PRIMARY + ';font-weight:700;font-size:14px">Read more &#8594;</span>' +
    '</a>'
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(seoTitle)}</title>
  <meta name="description" content="${esc(seoDesc)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${DOMAIN}/blog/category/${cat.id}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:title" content="${esc(seoTitle)}">
  <meta property="og:description" content="${esc(seoDesc)}">
  <meta property="og:url" content="${DOMAIN}/blog/category/${cat.id}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Clean Estimator">
  <meta property="og:image" content="${DOMAIN}/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(seoTitle)}">
  <meta name="twitter:description" content="${esc(seoDesc)}">
  <meta name="twitter:image" content="${DOMAIN}/og-image.svg">
  <script type="application/ld+json">${breadcrumbSchemaStr}</script>
  ${assets.cssLinks}
</head>
<body>
<div id="root">
<div style="background:#f8fafc;min-height:100vh;padding:48px 24px 64px;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:900px;margin:0 auto">
    <a href="/blog" style="font-size:13px;color:#64748b;text-decoration:none;display:inline-block;margin-bottom:28px">&#8592; All Guides</a>
    <h1 style="font-size:clamp(24px,4vw,34px);font-weight:800;color:#0f172a;margin-bottom:8px">${esc(cat.label)}</h1>
    <p style="font-size:16px;color:#64748b;margin-bottom:40px">${esc(seoDesc)}</p>
    ${postRows || '<p style="color:#64748b">No articles yet.</p>'}
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:14px;padding:32px 36px;margin-top:48px;color:white;text-align:center">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:10px">Get a Free Local Estimate</h3>
      <p style="color:#94a3b8;margin-bottom:20px;font-size:15px">Free calculator &mdash; instant ZIP-code specific estimates across all 50 states.</p>
      <a href="/" style="background:${PRIMARY};color:white;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px">Get My Free Estimate &#8594;</a>
    </div>
  </div>
</div>
</div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 8. Write helper ─────────────────────────────────────────────────────────

function writeFile(relPath, html) {
  const full = path.join(BUILD, relPath, 'index.html');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf8');
}

// ─── 9. Main ─────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(BUILD)) {
    console.log('⚠  prerender: build/ not found — skipping');
    return;
  }

  const { BLOG_POSTS, CATEGORIES } = loadBlogData();
  const assets = getAssetTags();
  let count = 0;

  writeFile('blog', renderBlogIndex(BLOG_POSTS, CATEGORIES, assets));
  count++;

  for (const cat of CATEGORIES) {
    writeFile('blog/category/' + cat.id, renderCategoryPage(cat, BLOG_POSTS, assets));
    count++;
  }

  for (const post of BLOG_POSTS) {
    const cat = CATEGORIES.find(c => c.id === post.category);
    writeFile('blog/' + post.slug, renderBlogPost(post, cat, assets));
    count++;
  }

  console.log('✓ prerender — ' + count + ' pages generated (' + BLOG_POSTS.length + ' posts, ' + CATEGORIES.length + ' categories)');
}

main();
