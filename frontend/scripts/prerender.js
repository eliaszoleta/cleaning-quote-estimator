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

function loadServicesData() {
  const raw = fs.readFileSync(path.join(SRC, 'data/services.js'), 'utf8');
  const src = raw
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export default /gm, 'const _default = ');
  // eslint-disable-next-line no-new-func
  const fn = new Function(src + '\nreturn { getAllServices, getServiceBySlug, getRelatedServices, typicalCost };');
  return fn();
}

function loadStatesData() {
  const raw = fs.readFileSync(path.join(SRC, 'data/statePricing.js'), 'utf8');
  const src = raw
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export default /gm, 'const _default = ');
  // eslint-disable-next-line no-new-func
  const fn = new Function(src + '\nreturn { getAllStates, getStateBySlug, getFeaturedStates, adjustForState };');
  return fn();
}

// cityPricing.js imports getStateBySlug/adjustForState from statePricing.js and
// getAllServices/typicalCost from services.js (real ES imports the webpack/React
// build resolves natively) instead of duplicating that pricing data -- a second
// copy of the same multiplier table is exactly the kind of two-sources-of-truth
// mistake that already caused blog copy to contradict the calculator once on
// this site. The raw-text eval trick every other loader here uses can't execute
// import statements, so strip them and inject the already-loaded functions as
// parameters instead of re-parsing them from source.
function loadCityData(statesMod, servicesMod) {
  const raw = fs.readFileSync(path.join(SRC, 'data/cityPricing.js'), 'utf8');
  const src = raw
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export default /gm, 'const _default = ');
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'getStateBySlug', 'adjustForState', 'getAllServices', 'typicalCost',
    src + '\nreturn { getAllCities, getCityBySlug, getCitiesByState, getFeaturedCities, cityServicePrices };'
  );
  return fn(statesMod.getStateBySlug, statesMod.adjustForState, servicesMod.getAllServices, servicesMod.typicalCost);
}

function loadFaqsData() {
  const raw = fs.readFileSync(path.join(SRC, 'data/faqs.js'), 'utf8');
  const src = raw.replace(/^export function /gm, 'function ');
  // eslint-disable-next-line no-new-func
  const fn = new Function(src + '\nreturn { getAllFaqs };');
  return fn();
}

// ─── 2. Extract CSS/JS asset tags from the built index.html ─────────────────

function getAssetTags() {
  const indexHtml = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  const cssLinks   = (indexHtml.match(/<link[^>]+\.css[^>]*>/g) || []).join('\n  ');
  const fontLinks  = (indexHtml.match(/<link[^>]+fonts\.g(?:oogleapis|static)\.com[^>]*>/g) || []).join('\n  ');
  const jsScripts  = (indexHtml.match(/<script\b[^>]*\ssrc="[^"]*\.js[^"]*"[^>]*>\s*<\/script>/g) || []).join('\n  ');
  return { cssLinks: [fontLinks, cssLinks].filter(Boolean).join('\n  '), jsScripts };
}

// ─── 3. Helpers ──────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── 4. Static nav header (visible to Googlebot without JS) ─────────────────

function staticHeader() {
  return `<header style="background:white;border-bottom:1px solid #e2e8f0;padding:0 24px">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px">
    <a href="/" style="font-size:18px;font-weight:800;color:#0f172a;text-decoration:none">Clean Estimator</a>
    <nav style="display:flex;gap:24px;align-items:center">
      <a href="/cleaning-cost-calculator" style="font-size:14px;color:#475569;text-decoration:none;font-weight:500">Cost Calculator</a>
      <a href="/#how-it-works" style="font-size:14px;color:#475569;text-decoration:none;font-weight:500">How It Works</a>
      <a href="/blog" style="font-size:14px;color:#475569;text-decoration:none;font-weight:500">Blog</a>
      <a href="/#faq" style="font-size:14px;color:#475569;text-decoration:none;font-weight:500">FAQ</a>
      <a href="/for-companies" style="font-size:14px;color:#475569;text-decoration:none;font-weight:500">For Companies</a>
      <a href="/" style="background:${PRIMARY};color:white;padding:8px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700">Get Estimate</a>
    </nav>
  </div>
</header>`;
}

// ─── 5. Markdown renderer (mirrors BlogPost.js renderMarkdown) ───────────────

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

// ─── 6. Blog post renderer ───────────────────────────────────────────────────

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
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
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
<div id="root">${staticHeader()}<div style="max-width:760px;margin:0 auto;padding:60px 24px;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
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
</div>${staticFooter()}</div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 7. Blog index renderer ──────────────────────────────────────────────────

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
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
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
${staticHeader()}
<div style="max-width:1100px;margin:0 auto;padding:60px 24px;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
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
${staticFooter()}
</div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 8. Category page renderer ───────────────────────────────────────────────

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
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
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
${staticHeader()}
<div style="background:#f8fafc;min-height:100vh;padding:48px 24px 64px;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
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
${staticFooter()}
</div>
  ${assets.jsScripts}
</body>
</html>`;
}

// ─── 8b. Shared static footer (visible to Googlebot without JS) ─────────────

function staticFooter() {
  return `<footer style="background:#0f172a;color:#94a3b8">
  <div style="max-width:1200px;margin:0 auto;padding:64px 24px 40px;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:40px;margin-bottom:48px">
      <div>
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em">Blog Categories</div>
        <a href="/blog/category/house-cleaning" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">House Cleaning Tips</a>
        <a href="/blog/category/carpet" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Carpet Cleaning</a>
        <a href="/blog/category/commercial" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Commercial Cleaning</a>
        <a href="/blog/category/restoration" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Mold &amp; Water Damage</a>
        <a href="/blog" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">All Blog Posts</a>
      </div>
      <div>
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em">Resources</div>
        <a href="/cleaning-cost-calculator" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Cleaning Cost Calculator</a>
        <a href="/about" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">About Clean Estimator</a>
        <a href="/contact" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Contact</a>
      </div>
      <div>
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em">For Companies</div>
        <a href="/for-companies" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Embed the Calculator</a>
        <a href="/company" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Company Login</a>
      </div>
      <div>
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em">Legal</div>
        <a href="/privacy-policy" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Privacy Policy</a>
        <a href="/terms-of-service" style="display:block;color:#94a3b8;text-decoration:none;font-size:14px;margin-bottom:10px">Terms of Service</a>
      </div>
    </div>
    <div style="border-top:1px solid #1e293b;padding-top:32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:30px;height:30px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:15px">&#10022;</span>
        <span style="color:white;font-weight:700">Clean Estimator</span>
      </div>
      <div style="font-size:13px;color:#64748b">&copy; ${new Date().getFullYear()} Clean Estimator. All rights reserved.</div>
    </div>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:0 24px 40px;font-size:12px;color:#475569;line-height:1.7;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
    <strong style="color:#64748b">Disclaimer:</strong> All price estimates provided by Clean Estimator are for informational purposes only.
    Actual cleaning service costs vary based on local market conditions, specific service requirements, company pricing policies,
    and other factors. Always get multiple quotes from licensed, insured cleaning professionals in your area.
    Clean Estimator is not responsible for any decisions made based on these estimates.
  </div>
</footer>`;
}

// ─── 8c. Standalone static page renderers (About / Contact / Legal / For-Companies) ─

function renderStaticPage({ path: urlPath, seoTitle, seoDesc, bodyHtml, maxWidth = 760, assets, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(seoTitle)}</title>
  <meta name="description" content="${esc(seoDesc)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${DOMAIN}${urlPath}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta property="og:site_name" content="Clean Estimator">
  <meta property="og:title" content="${esc(seoTitle)}">
  <meta property="og:description" content="${esc(seoDesc)}">
  <meta property="og:url" content="${DOMAIN}${urlPath}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${DOMAIN}/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(seoTitle)}">
  <meta name="twitter:description" content="${esc(seoDesc)}">
  <meta name="twitter:image" content="${DOMAIN}/og-image.svg">
  ${extraHead}
  ${assets.cssLinks}
</head>
<body>
<div id="root">${staticHeader()}<div style="max-width:${maxWidth}px;margin:0 auto;padding:60px 24px;font-family:'Poppins','Poppins Fallback',Arial,sans-serif">
${bodyHtml}
</div>${staticFooter()}</div>
  ${assets.jsScripts}
</body>
</html>`;
}

function renderAbout(assets) {
  const seoTitle = 'About Clean Estimator | Free Cleaning Cost Estimator';
  const seoDesc = 'Clean Estimator provides free, accurate cleaning cost estimates for homeowners and businesses across all 50 U.S. states.';
  const sections = [
    ['Our mission', 'Make cleaning service pricing transparent, accessible, and instant. We want every homeowner and business owner to walk into a cleaning consultation already knowing what to expect — so they can negotiate confidently and avoid overpaying.'],
    ['How we calculate prices', 'Our pricing engine uses industry data, market research, and state-by-state cost-of-living adjustments to generate estimates. We regularly update our pricing models to reflect current market rates. Our estimates are deliberately presented as ranges because actual prices depend on factors only visible in person.'],
    ['Who we serve', 'Clean Estimator serves two groups: (1) homeowners and property managers looking for fast, unbiased price guidance before calling cleaning companies, and (2) cleaning companies who want to embed our calculator on their own websites to capture leads with accurate, localized estimates.'],
    ["Disclaimer", "Our estimates are starting points, not quotes. Actual cleaning service costs depend on the specific condition of the property, local market competition, the cleaning company's pricing, and many other factors. Always get multiple quotes from licensed, insured professionals before booking."],
  ];
  const body = `  <h1 style="font-size:40px;font-weight:900;color:#0f172a;margin-bottom:12px">About Clean Estimator</h1>
  <p style="font-size:18px;color:#64748b;margin-bottom:40px;line-height:1.7">We built Clean Estimator to solve a frustrating problem: no one knows what cleaning actually costs until they've already called 3 companies and waited for callbacks.</p>
  <div style="display:flex;flex-direction:column;gap:24px">
    ${sections.map(([title, txt]) => `<div style="background:#f8fafc;border-radius:12px;padding:24px 28px;border:1px solid #e2e8f0">
      <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:10px">${esc(title)}</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7">${esc(txt)}</p>
    </div>`).join('\n    ')}
  </div>
  <div style="margin-top:40px;text-align:center">
    <a href="/contact" style="background:${PRIMARY};color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Contact Us</a>
  </div>`;
  return renderStaticPage({ path: '/about', seoTitle, seoDesc, bodyHtml: body, assets });
}

function renderCalculatorPage(assets) {
  const seoTitle = 'Cleaning Cost Calculator - Free Instant Estimate (2026)';
  const seoDesc = 'Free cleaning cost calculator with ZIP-code accurate pricing. Instantly estimate house cleaning, carpet cleaning, commercial cleaning, mold remediation, and more. No signup required.';

  const whyPoints = [
    ['ZIP-Code Accurate', 'Every price this cleaning cost calculator returns is adjusted for your local labor rates and cost of living, not a flat national guess.'],
    ['Instant Results', "Answer a few quick questions and get your estimate in under 60 seconds — no waiting for a callback from a cleaning company."],
    ['9 Service Types Covered', 'From standard house cleaning to mold remediation and water damage restoration, this calculator covers the full range of cleaning and restoration services.'],
    ['100% Free, No Signup', 'Use the cleaning cost calculator as many times as you want. No account, no credit card, and no obligation to book.'],
  ];

  const calcFaqs = [
    { q: 'Is this cleaning cost calculator really free?', a: 'Yes. Our cleaning cost calculator is completely free to use, with no signup, no account, and no hidden fees. You can run as many estimates as you need.' },
    { q: 'How accurate is the cleaning cost calculator?', a: 'The calculator uses real market pricing data with state-by-state cost-of-living adjustments, so your estimate reflects typical local pricing. Final prices from an actual cleaning company can vary based on the specific condition of your home and other in-person factors, so treat the result as a reliable starting range rather than a binding quote.' },
    { q: 'What information do I need to use the cleaning cost calculator?', a: 'Just your ZIP code, the type of cleaning service you need, and a few basic details about your space (like square footage or number of rooms). No email or phone number is required to see your price range.' },
    { q: 'Does the cleaning cost calculator work for businesses too?', a: 'Yes. In addition to house and apartment cleaning, the calculator includes commercial cleaning, carpet cleaning, air duct cleaning, dryer vent cleaning, tile & grout cleaning, mold remediation, and water damage restoration — for both residential and commercial properties.' },
    { q: 'Can I embed this cleaning cost calculator on my own website?', a: 'Yes — cleaning companies can embed a white-labeled version of this calculator on their own site to capture leads with accurate, localized estimates. Visit our for-companies page for details.' },
  ];

  const body = `  <h1 style="font-size:clamp(28px,5vw,42px);font-weight:900;color:#0f172a;line-height:1.15;margin-bottom:14px;text-align:center">Cleaning Cost Calculator</h1>
  <p style="font-size:17px;color:#64748b;max-width:640px;margin:0 auto 32px;line-height:1.7;text-align:center">This free cleaning cost calculator gives you an instant, ZIP-code specific price for house cleaning, carpet cleaning, commercial cleaning, and 6 other services. Built as a standalone cleaning calculator you can bookmark and reuse — no signup, no phone calls, just enter your details and get a real cleaning estimator price range in under 60 seconds.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:32px;margin-bottom:40px;text-align:center">
    <p style="font-size:14px;color:#94a3b8;margin:0">Loading your free cleaning cost calculator&hellip; please enable JavaScript to use the interactive calculator.</p>
  </div>
  <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:20px;text-align:center">Why Use This Cleaning Cost Calculator</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:40px">
    ${whyPoints.map(([t, txt]) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:22px 24px">
      <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px">${esc(t)}</h3>
      <p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">${esc(txt)}</p>
    </div>`).join('\n    ')}
  </div>
  <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:32px 36px">
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:16px">Cleaning Cost Calculator FAQs</h2>
    ${faqAccordionHtml(calcFaqs)}
  </div>
  <div style="margin-top:40px;text-align:center">
    <p style="font-size:14px;color:#64748b">Want cost breakdowns by state or service instead? Browse our <a href="/blog" style="color:${PRIMARY};font-weight:600">cleaning cost guides</a>.</p>
  </div>`;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', item: DOMAIN },
    { name: 'Cleaning Cost Calculator', item: `${DOMAIN}/cleaning-cost-calculator` },
  ]);
  const webAppSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cleaning Cost Calculator',
    url: `${DOMAIN}/cleaning-cost-calculator`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: seoDesc,
  });

  return renderStaticPage({
    path: '/cleaning-cost-calculator',
    seoTitle,
    seoDesc,
    bodyHtml: body,
    maxWidth: 900,
    assets,
    extraHead: `<script type="application/ld+json">${webAppSchema}</script><script type="application/ld+json">${breadcrumb}</script><script type="application/ld+json">${faqSchema(calcFaqs)}</script>`,
  });
}

function renderContact(assets) {
  const seoTitle = 'Contact Us | Clean Estimator';
  const seoDesc = 'Get in touch with the Clean Estimator team for support, partnerships, or general questions.';
  const body = `  <h1 style="font-size:36px;font-weight:900;color:#0f172a;margin-bottom:8px">Contact Us</h1>
  <p style="color:#64748b;font-size:16px;margin-bottom:36px;line-height:1.6">Questions, feedback, or partnership inquiries — we'd love to hear from you. Reach us any time at <a href="mailto:hello@cleanestimator.com" style="color:${PRIMARY};font-weight:600">hello@cleanestimator.com</a>, or use the contact form below.</p>
  <p style="font-size:14px;color:#94a3b8">Please enable JavaScript to use the contact form.</p>`;
  return renderStaticPage({ path: '/contact', seoTitle, seoDesc, bodyHtml: body, maxWidth: 640, assets });
}

function renderLegalPage(kind, assets) {
  const isPrivacy = kind === 'privacy';
  const seoTitle = isPrivacy ? 'Privacy Policy | Clean Estimator' : 'Terms of Service | Clean Estimator';
  const seoDesc = isPrivacy
    ? 'How Clean Estimator collects, uses, and protects your information.'
    : 'The terms governing your use of Clean Estimator and its cleaning cost calculator.';
  const sections = isPrivacy ? [
    ['Information We Collect', 'When you use our calculator, we collect the answers you provide (service type, location, property details) to generate your estimate. If you choose to provide your name, email, or phone number in the lead capture form, we store that information. We also collect standard web analytics data (page views, browser type, referral source) through privacy-respecting analytics tools.'],
    ['How We Use Your Information', "We use your calculator inputs solely to generate price estimates. If you provide contact information, it may be shared with the cleaning company whose widget you're using (if you're using an embedded widget on a company's site). We do not sell your personal information to third parties. We may use your email to send you a copy of your estimate if you request it."],
    ['Cookies', 'We use minimal cookies for session functionality and analytics. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though some features may not work correctly.'],
    ['Data Retention', "Calculator session data is not permanently stored unless you provide contact information. Lead information submitted through company widgets is retained for the duration of the company's subscription plus 90 days, then deleted."],
    ['Your Rights', 'You have the right to request deletion of any personal information we hold about you. Contact us at privacy@cleanestimator.com and we will delete your data within 30 days.'],
    ['Security', 'We use industry-standard security measures including HTTPS encryption, secure database access controls, and regular security audits. No system is 100% secure, but we take reasonable precautions to protect your data.'],
    ['Changes', 'We may update this policy occasionally. Continued use of Clean Estimator after changes constitutes acceptance of the updated policy.'],
    ['Contact', 'For privacy-related questions, email privacy@cleanestimator.com.'],
  ] : [
    ['Acceptance', "By using Clean Estimator, you agree to these terms. If you don't agree, please don't use the service."],
    ['Description of Service', 'Clean Estimator provides an online tool for estimating cleaning service costs. For cleaning companies, we provide an embeddable widget and lead management dashboard ("Company Services").'],
    ['Estimates Are Not Quotes', 'All price estimates generated by Clean Estimator are for informational purposes only and do not constitute quotes, contracts, or guarantees. Actual cleaning service costs may vary significantly. Clean Estimator is not responsible for any financial decisions made based on these estimates.'],
    ['Company Accounts', 'Company accounts are for cleaning service businesses. You must provide accurate information when registering. You are responsible for keeping your account credentials secure. You may not share your account with other businesses.'],
    ['Subscription and Payment', 'Company Services are available on a paid subscription basis ($159/month) after a 7-day free trial. A credit card is required to start the trial. Payments are processed by Stripe. Subscriptions auto-renew monthly. You may cancel at any time through the billing portal; cancellation takes effect at the end of the current billing period.'],
    ['Refunds', 'We do not offer refunds for partial months. If you cancel before your trial ends, you will not be charged.'],
    ['Prohibited Uses', "You may not use Clean Estimator to: (a) generate false or misleading pricing information; (b) scrape or harvest data at scale; (c) attempt to access other users' accounts; (d) use the service for any illegal purpose."],
    ['Disclaimer of Warranties', 'Clean Estimator is provided "as is" without warranties of any kind. We do not warrant that estimates are accurate, complete, or suitable for any particular purpose.'],
    ['Limitation of Liability', "Clean Estimator's total liability to you for any claims arising from use of the service is limited to the amount you paid us in the 3 months prior to the claim, or $50, whichever is greater."],
    ['Termination', 'We may suspend or terminate your account if you violate these terms. You may delete your account at any time by contacting support.'],
    ['Governing Law', 'These terms are governed by the laws of the State of Delaware, USA.'],
    ['Contact', 'Questions about these terms? Email legal@cleanestimator.com.'],
  ];
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const body = `  <h1 style="font-size:36px;font-weight:900;color:#0f172a;margin-bottom:8px">${isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
  <p style="color:#64748b;margin-bottom:40px">Last updated: ${lastUpdated}</p>
  ${sections.map(([title, txt]) => `<div style="margin-bottom:28px">
    <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(title)}</h2>
    <p style="color:#374151;font-size:15px;line-height:1.8">${esc(txt)}</p>
  </div>`).join('\n  ')}`;
  return renderStaticPage({ path: isPrivacy ? '/privacy-policy' : '/terms-of-service', seoTitle, seoDesc, bodyHtml: body, assets });
}

// ─── 8d. Service & state cost page renderers ─────────────────────────────────

function fmt(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function faqAccordionHtml(faqs) {
  return faqs.map(f => `
    <div style="background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="padding:14px 18px;font-weight:700;font-size:14.5px;color:#0f172a">${esc(f.q)}</div>
      <div style="padding:0 18px 16px"><p style="font-size:13.5px;color:#475569;line-height:1.7;margin:0">${esc(f.a)}</p></div>
    </div>`).join('');
}

function serviceSchema(service, cost) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.metaDescription,
    provider: { '@type': 'Organization', name: 'Clean Estimator', url: DOMAIN },
    areaServed: 'United States',
    offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: String(cost.low), highPrice: String(cost.high) },
  });
}

function faqSchema(faqs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
}

function breadcrumbSchema(items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  });
}

function unitSuffix(service) {
  if (service.unitType === 'per_sqft') return '/sq ft';
  if (service.unitType === 'per_room') return '/room';
  return '';
}

// Per-sq-ft tier rates are often well under $1 (e.g. commercial: $0.052–$0.185/sq ft) —
// rounding those to whole dollars collapses them all to "$0". Show cents for rates.
function fmtTier(n, service) {
  return service.unitType === 'per_sqft' ? `$${n.toFixed(2)}` : fmt(n);
}

function renderServicePage(service, statesMod, assets) {
  const ICON_EMOJI = { home_residential: '🏠', apartment: '🏢', commercial: '🏬', carpet: '🧶', air_duct: '💨', dryer_vent: '🔥', tile_grout: '▦', mold_remediation: '⚠️', water_damage: '💧' };

  const headlineTier = service.tiers[service.typicalTierIndex] || service.tiers[0];
  const cost = service.unitType === 'flat'
    ? { low: headlineTier.low, high: headlineTier.high }
    : { low: Math.round(headlineTier.low * (service.typicalQuantity || 1) * (service.typicalVisitsPerMonth || 1)), high: Math.round(headlineTier.high * (service.typicalQuantity || 1) * (service.typicalVisitsPerMonth || 1)) };

  const tierRows = service.tiers.map((tier, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#fafafa'}">
      <td style="padding:10px 14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9">${esc(tier.label)}</td>
      <td style="padding:10px 14px;color:${PRIMARY};font-weight:700;border-bottom:1px solid #f1f5f9;white-space:nowrap">${fmtTier(tier.low, service)}&ndash;${fmtTier(tier.high, service)}<span style="color:#94a3b8;font-weight:500;font-size:12px">${unitSuffix(service)}</span></td>
      <td style="padding:10px 14px;color:#475569;border-bottom:1px solid #f1f5f9">${esc(tier.note)}</td>
    </tr>`).join('');

  const bulletsHtml = service.bullets.map(b => `<li style="display:flex;gap:8px;font-size:14.5px;color:#374151;line-height:1.7;margin-bottom:10px"><span style="color:#16a34a;flex-shrink:0">&check;</span>${esc(b)}</li>`).join('');

  const qty = service.unitType === 'flat' ? 1 : (service.typicalQuantity || 1) * (service.typicalVisitsPerMonth || 1);
  const featured = statesMod.getFeaturedStates();
  const stateRows = featured.map(state => {
    const range = statesMod.adjustForState(headlineTier.low * qty, headlineTier.high * qty, state);
    return `<a href="/cleaning-cost/${state.slug}" style="text-decoration:none"><div style="border:1px solid #f1f5f9;background:#fafafa;border-radius:8px;padding:11px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:13px;font-weight:600;color:#0f172a">${esc(state.name)}</span><span style="font-size:12.5px;font-weight:700;color:${PRIMARY};white-space:nowrap">${fmt(range.low)}&ndash;${fmt(range.high)}</span></div></a>`;
  }).join('');

  const related = (service.relatedSlugs || []).slice(0, 3);
  const relatedHtml = related.map(slug => `<a href="/cleaning-services/${slug}" style="text-decoration:none"><div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px 18px"><div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px">${esc(slug)}</div><span style="font-size:12.5px;color:${PRIMARY};font-weight:600">See pricing &rarr;</span></div></a>`).join('');

  const unitNote = service.unitType === 'flat' ? 'typical job cost' : service.unitType === 'per_room' ? `for a ${service.typicalQuantity}-room home` : service.id === 'commercial' ? `for a ${service.typicalQuantity.toLocaleString()} sq ft office, weekly` : `for ${service.typicalQuantity.toLocaleString()} sq ft`;

  const body = `  <div style="display:flex;gap:6px;font-size:13px;color:#94a3b8;margin-bottom:24px;flex-wrap:wrap">
    <a href="/" style="color:#64748b;text-decoration:none">Home</a><span>&rsaquo;</span>
    <span style="color:#0f172a">${esc(service.name)}</span>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <div style="width:44px;height:44px;border-radius:12px;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px">${ICON_EMOJI[service.id] || '🏠'}</div>
    <h1 style="font-size:clamp(24px,4vw,32px);font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:10px">${esc(service.name)} Cost 2026</h1>
    <p style="font-size:15.5px;color:#64748b;line-height:1.7;margin-bottom:20px">${esc(service.tagline)}</p>
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <span style="font-size:30px;font-weight:800;color:${PRIMARY}">${fmt(cost.low)} &ndash; ${fmt(cost.high)}</span>
      <span style="font-size:13px;color:#94a3b8">${esc(unitNote)}</span>
    </div>
  </div>
  ${service.disclaimer ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:13px 16px;margin-bottom:24px;display:flex;gap:10px">
    <span style="flex-shrink:0;margin-top:1px">&#9888;&#65039;</span>
    <div><div style="font-weight:700;color:#991b1b;margin-bottom:3px;font-size:13px">Important</div><p style="font-size:13px;color:#7f1d1d;line-height:1.6;margin:0">${esc(service.disclaimer)}</p></div>
  </div>` : ''}
  <div style="background:linear-gradient(135deg,${PRIMARY},#1d4ed8);border-radius:12px;padding:18px 24px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div style="color:white"><div style="font-weight:700;font-size:15px">Get a ZIP-code accurate ${esc(service.name.toLowerCase())} estimate</div><div style="font-size:13px;opacity:0.9">Free &middot; No signup &middot; 60 seconds</div></div>
    <a href="/?service=${service.id}" style="background:white;color:${PRIMARY};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap">Calculate Now &rarr;</a>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:6px">Pricing by Tier</h2>
    <p style="font-size:13.5px;color:#64748b;margin-bottom:4px">National average pricing &mdash; ${esc(service.unit)}.</p>
    <div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc"><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">Tier</th><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">Price</th><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">Notes</th></tr></thead>
      <tbody>${tierRows}</tbody>
    </table></div>
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-top:32px;margin-bottom:14px">What to Know</h2>
    <ul style="list-style:none;padding:0;margin:0">${bulletsHtml}</ul>
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-top:32px;margin-bottom:14px">${esc(service.name)} Cost by State</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">${stateRows}</div>
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-top:32px;margin-bottom:14px">FAQs</h2>
    ${faqAccordionHtml(service.faqs)}
  </div>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px 28px;margin-bottom:32px;text-align:center">
    <div style="font-weight:800;font-size:18px;color:#0f172a;margin-bottom:6px">Ready to get an accurate estimate?</div>
    <p style="font-size:14px;color:#64748b;margin-bottom:16px">Use our free calculator for a ZIP-code accurate ${esc(service.name.toLowerCase())} estimate in under 60 seconds.</p>
    <a href="/?service=${service.id}" style="background:${PRIMARY};color:white;padding:12px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px">Get My Free Estimate &rarr;</a>
  </div>
  ${related.length ? `<div><div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px">Related Services</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${relatedHtml}</div></div>` : ''}`;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', item: DOMAIN },
    { name: 'Cleaning Services', item: `${DOMAIN}/#services` },
    { name: service.name, item: `${DOMAIN}/cleaning-services/${service.slug}` },
  ]);

  return renderStaticPage({
    path: `/cleaning-services/${service.slug}`,
    seoTitle: service.seoTitle,
    seoDesc: service.metaDescription,
    bodyHtml: body,
    maxWidth: 780,
    assets,
    extraHead: `<script type="application/ld+json">${serviceSchema(service, cost)}</script><script type="application/ld+json">${faqSchema(service.faqs)}</script><script type="application/ld+json">${breadcrumb}</script>`,
  });
}

function renderStatePage(state, servicesMod, statesMod, faqsMod, assets, citiesMod) {
  const otherStates = statesMod.getAllStates().filter(s => s.slug !== state.slug);
  const cities = citiesMod.getCitiesByState(state.slug);
  const faqs = faqsMod.getAllFaqs().slice(0, 5);
  const pctVsNational = Math.round((state.multiplier - 1) * 100);
  const TIER_COPY = {
    high: `Cleaning service costs in ${state.name} run above the national average, driven by higher labor rates and cost of living.`,
    low: `Cleaning service costs in ${state.name} run below the national average, making it a comparatively affordable market for cleaning services.`,
    average: `Cleaning service costs in ${state.name} are close to the national average.`,
  };

  const serviceRows = servicesMod.getAllServices().map((service, i) => {
    const national = servicesMod.typicalCost(service);
    const adjusted = statesMod.adjustForState(national.low, national.high, state);
    return `<tr style="background:${i % 2 === 0 ? 'white' : '#fafafa'}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9"><a href="/cleaning-services/${service.slug}" style="color:#0f172a;font-weight:600;text-decoration:none">${esc(service.name)}</a></td>
      <td style="padding:10px 14px;color:${PRIMARY};font-weight:700;border-bottom:1px solid #f1f5f9;white-space:nowrap">${fmt(adjusted.low)}&ndash;${fmt(adjusted.high)}</td>
    </tr>`;
  }).join('');

  const otherStatesHtml = otherStates.map(s => `<a href="/cleaning-cost/${s.slug}" style="font-size:12.5px;color:#64748b;text-decoration:none;background:white;border:1px solid #e2e8f0;border-radius:20px;padding:6px 12px">${esc(s.name)}</a>`).join(' ');
  const citiesInStateHtml = cities.map(c => `<a href="/cleaning-cost/city/${c.slug}" style="font-size:12.5px;color:#64748b;text-decoration:none;background:white;border:1px solid #e2e8f0;border-radius:20px;padding:6px 12px">${esc(c.name)}</a>`).join(' ');

  const seoTitle = `Cleaning Service Cost in ${state.name} (2026) | Average Prices & Estimates | Clean Estimator`;
  const seoDesc = `See average cleaning service costs in ${state.name} for 2026: house cleaning, carpet, mold remediation, water damage, and more, adjusted for local labor rates. Get a free instant estimate.`;

  const body = `  <div style="display:flex;gap:6px;font-size:13px;color:#94a3b8;margin-bottom:24px;flex-wrap:wrap">
    <a href="/" style="color:#64748b;text-decoration:none">Home</a><span>&rsaquo;</span>
    <span style="color:#0f172a">Cleaning Cost in ${esc(state.name)}</span>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <div style="font-size:12px;font-weight:700;color:${PRIMARY};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">${esc(state.name)}</div>
    <h1 style="font-size:clamp(24px,4vw,32px);font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:10px">Cleaning Service Cost in ${esc(state.name)} (2026)</h1>
    <p style="font-size:15.5px;color:#64748b;line-height:1.7;margin-bottom:20px">${esc(TIER_COPY[state.tier])}${pctVsNational !== 0 ? ` That's about ${Math.abs(pctVsNational)}% ${pctVsNational > 0 ? 'above' : 'below'} the national average.` : ''}</p>
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <span style="font-size:30px;font-weight:800;color:${PRIMARY}">${fmt(state.low)} &ndash; ${fmt(state.high)}</span>
      <span style="font-size:13px;color:#94a3b8">standard house cleaning, 2,000 sq ft home</span>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,${PRIMARY},#1d4ed8);border-radius:12px;padding:18px 24px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div style="color:white"><div style="font-weight:700;font-size:15px">Get a ZIP-code accurate estimate in ${esc(state.name)}</div><div style="font-size:13px;opacity:0.9">Free &middot; No signup &middot; 60 seconds</div></div>
    <a href="/" style="background:white;color:${PRIMARY};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap">Calculate Now &rarr;</a>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:6px">Cost by Service in ${esc(state.name)}</h2>
    <p style="font-size:13.5px;color:#64748b;margin-bottom:4px">Estimated typical job cost, adjusted for ${esc(state.name)}'s labor rates.</p>
    <div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc"><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">Service</th><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">${esc(state.name)} Estimate</th></tr></thead>
      <tbody>${serviceRows}</tbody>
    </table></div>
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-top:32px;margin-bottom:14px">FAQs</h2>
    ${faqAccordionHtml(faqs)}
  </div>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px 28px;margin-bottom:32px;text-align:center">
    <div style="font-weight:800;font-size:18px;color:#0f172a;margin-bottom:6px">Ready to get an accurate estimate?</div>
    <p style="font-size:14px;color:#64748b;margin-bottom:16px">Use our free calculator for a ZIP-code accurate cleaning estimate in ${esc(state.name)} in under 60 seconds.</p>
    <a href="/" style="background:${PRIMARY};color:white;padding:12px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px">Get My Free Estimate &rarr;</a>
  </div>
  ${cities.length > 0 ? `<div style="margin-bottom:32px">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px">Cleaning Costs by City in ${esc(state.name)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${citiesInStateHtml}</div>
  </div>` : ''}
  <div>
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px">Cleaning Costs in Other States</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${otherStatesHtml}</div>
  </div>`;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', item: DOMAIN },
    { name: `Cleaning Cost in ${state.name}`, item: `${DOMAIN}/cleaning-cost/${state.slug}` },
  ]);

  return renderStaticPage({
    path: `/cleaning-cost/${state.slug}`,
    seoTitle,
    seoDesc,
    bodyHtml: body,
    maxWidth: 780,
    assets,
    extraHead: `<script type="application/ld+json">${faqSchema(faqs)}</script><script type="application/ld+json">${breadcrumb}</script>`,
  });
}

function renderCityPage(city, servicesMod, citiesMod, faqsMod, assets) {
  const otherCitiesInState = citiesMod.getCitiesByState(city.stateSlugRef).filter(c => c.slug !== city.slug);
  const featuredCities = citiesMod.getFeaturedCities().filter(c => c.slug !== city.slug).slice(0, 8);
  const faqs = faqsMod.getAllFaqs().slice(0, 5);
  const pctVsNational = Math.round((city.multiplier - 1) * 100);
  const TIER_COPY = {
    high: `Cleaning service costs in ${city.name} run above the national average, in line with ${city.name}'s overall cost of living.`,
    low: `Cleaning service costs in ${city.name} run below the national average, making it a comparatively affordable market for cleaning services.`,
    average: `Cleaning service costs in ${city.name} are close to the national average.`,
  };

  const serviceRows = citiesMod.cityServicePrices(city).map(({ service, low, high }, i) => `<tr style="background:${i % 2 === 0 ? 'white' : '#fafafa'}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9"><a href="/cleaning-services/${service.slug}" style="color:#0f172a;font-weight:600;text-decoration:none">${esc(service.name)}</a></td>
      <td style="padding:10px 14px;color:${PRIMARY};font-weight:700;border-bottom:1px solid #f1f5f9;white-space:nowrap">${fmt(low)}&ndash;${fmt(high)}</td>
    </tr>`).join('');

  const otherCitiesHtml = otherCitiesInState.map(c => `<a href="/cleaning-cost/city/${c.slug}" style="font-size:12.5px;color:#64748b;text-decoration:none;background:white;border:1px solid #e2e8f0;border-radius:20px;padding:6px 12px">${esc(c.name)}</a>`).join(' ')
    + ` <a href="/cleaning-cost/${city.stateSlugRef}" style="font-size:12.5px;color:${PRIMARY};font-weight:700;text-decoration:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:6px 12px">All of ${esc(city.stateName)} &rarr;</a>`;
  const featuredCitiesHtml = featuredCities.map(c => `<a href="/cleaning-cost/city/${c.slug}" style="font-size:12.5px;color:#64748b;text-decoration:none;background:white;border:1px solid #e2e8f0;border-radius:20px;padding:6px 12px">${esc(c.name)}, ${c.stateCode}</a>`).join(' ');

  const seoTitle = `Cleaning Service Cost in ${city.name}, ${city.stateCode} (2026) | Clean Estimator`;
  const seoDesc = `See average cleaning service costs in ${city.name}, ${city.stateName} for 2026: house cleaning, carpet, mold remediation, water damage, and more. Get a free instant estimate.`;

  const body = `  <div style="display:flex;gap:6px;font-size:13px;color:#94a3b8;margin-bottom:24px;flex-wrap:wrap">
    <a href="/" style="color:#64748b;text-decoration:none">Home</a><span>&rsaquo;</span>
    <a href="/cleaning-cost/${city.stateSlugRef}" style="color:#64748b;text-decoration:none">${esc(city.stateName)}</a><span>&rsaquo;</span>
    <span style="color:#0f172a">${esc(city.name)}</span>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <div style="font-size:12px;font-weight:700;color:${PRIMARY};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">${esc(city.name)}, ${city.stateCode}</div>
    <h1 style="font-size:clamp(24px,4vw,32px);font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:10px">Cleaning Service Cost in ${esc(city.name)}, ${city.stateCode} (2026)</h1>
    <p style="font-size:15.5px;color:#64748b;line-height:1.7;margin-bottom:20px">${esc(TIER_COPY[city.tier])}${pctVsNational !== 0 ? ` That's about ${Math.abs(pctVsNational)}% ${pctVsNational > 0 ? 'above' : 'below'} the national average, matching the broader ${esc(city.stateName)} market.` : ''}</p>
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <span style="font-size:30px;font-weight:800;color:${PRIMARY}">${fmt(city.low)} &ndash; ${fmt(city.high)}</span>
      <span style="font-size:13px;color:#94a3b8">standard house cleaning, 2,000 sq ft home</span>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,${PRIMARY},#1d4ed8);border-radius:12px;padding:18px 24px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div style="color:white"><div style="font-weight:700;font-size:15px">Get a ZIP-code accurate estimate in ${esc(city.name)}</div><div style="font-size:13px;opacity:0.9">Free &middot; No signup &middot; 60 seconds</div></div>
    <a href="/" style="background:white;color:${PRIMARY};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap">Calculate Now &rarr;</a>
  </div>
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:32px 36px;margin-bottom:24px">
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:6px">Cost by Service in ${esc(city.name)}</h2>
    <p style="font-size:13.5px;color:#64748b;margin-bottom:4px">Estimated typical job cost, adjusted for the ${esc(city.stateName)} market.</p>
    <div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc"><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">Service</th><th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0">${esc(city.name)} Estimate</th></tr></thead>
      <tbody>${serviceRows}</tbody>
    </table></div>
    <h2 style="font-size:19px;font-weight:800;color:#0f172a;margin-top:32px;margin-bottom:14px">FAQs</h2>
    ${faqAccordionHtml(faqs)}
  </div>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px 28px;margin-bottom:32px;text-align:center">
    <div style="font-weight:800;font-size:18px;color:#0f172a;margin-bottom:6px">Ready to get an accurate estimate?</div>
    <p style="font-size:14px;color:#64748b;margin-bottom:16px">Use our free calculator for a ZIP-code accurate cleaning estimate in ${esc(city.name)} in under 60 seconds.</p>
    <a href="/" style="background:${PRIMARY};color:white;padding:12px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px">Get My Free Estimate &rarr;</a>
  </div>
  ${otherCitiesInState.length ? `<div style="margin-bottom:32px">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px">More Cities in ${esc(city.stateName)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${otherCitiesHtml}</div>
  </div>` : ''}
  <div>
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px">Popular Cities</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${featuredCitiesHtml}</div>
  </div>`;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', item: DOMAIN },
    { name: `Cleaning Cost in ${city.stateName}`, item: `${DOMAIN}/cleaning-cost/${city.stateSlugRef}` },
    { name: `Cleaning Cost in ${city.name}`, item: `${DOMAIN}/cleaning-cost/city/${city.slug}` },
  ]);

  return renderStaticPage({
    path: `/cleaning-cost/city/${city.slug}`,
    seoTitle,
    seoDesc,
    bodyHtml: body,
    maxWidth: 780,
    assets,
    extraHead: `<script type="application/ld+json">${faqSchema(faqs)}</script><script type="application/ld+json">${breadcrumb}</script>`,
  });
}

function renderForCompanies(assets) {
  const seoTitle = 'Embed a Cleaning Cost Calculator on Your Website | Clean Estimator for Companies';
  const seoDesc = 'Add a branded cleaning cost estimator to your website. Capture leads, customize pricing, white-label branding. 7-day free trial. $159/month.';
  const features = [
    ['White-label branding', 'Your logo, colors, and call-to-action text. Visitors never see the Clean Estimator name.'],
    ['Lead capture built-in', 'Collect name, email, phone, and timeline from every visitor before they see the estimate.'],
    ['ZIP-code accurate pricing', 'State-specific pricing multipliers ensure your quotes reflect your local market.'],
    ['Per-service markup control', 'Adjust pricing up or down per service. Set your own minimum charges.'],
    ['Easy one-line embed', 'Paste one line of HTML to add the calculator to any website, Wix, Squarespace, or WordPress.'],
    ['API for CRM sync', 'Pull leads via REST API into HubSpot, Salesforce, or any CRM using Zapier or Make.'],
  ];
  const steps = [
    ['1', 'Sign up', 'Create your account and start your 7-day free trial — credit card required.'],
    ['2', 'Customize your widget', 'Add your logo, set your brand colors, configure which services you offer, and write your CTA.'],
    ['3', 'Embed on your site', "Copy one line of code and paste it anywhere on your website. That's it."],
    ['4', 'Capture leads', 'Watch leads flow in. Manage them in your dashboard or sync to your CRM.'],
  ];
  const testimonials = [
    ['Sarah M.', 'Sparkle Cleaning Services — Austin, TX', "We've been using Clean Estimator for 4 months and it's generated 47 qualified leads. Conversion rate is way higher than our contact form because visitors are pre-qualified."],
    ['James R.', 'Pro Restoration Group — Denver, CO', "The water damage and mold calculators are exactly what we needed. Customers come in already understanding the price range, so there's less sticker shock on-site."],
    ['Maria L.', 'Crystal Clean Commercial — Miami, FL', "Setup took about 20 minutes. The embed is seamless — my website visitors don't even realize it's a third-party tool."],
  ];
  const planFeatures = ['Unlimited calculator sessions', 'White-label branding', 'Lead capture dashboard', 'API access', 'All 9 service calculators', 'CSV export', 'Priority support'];

  const body = `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:white;padding:64px 32px;border-radius:16px;text-align:center;margin-bottom:48px">
    <div style="display:inline-block;background:rgba(37,99,235,0.25);color:#93c5fd;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:22px;border:1px solid rgba(37,99,235,0.35)">For cleaning companies</div>
    <h1 style="font-size:clamp(28px,5vw,48px);font-weight:800;line-height:1.15;margin-bottom:18px">Add a Branded Cleaning Cost Calculator to Your Website</h1>
    <p style="font-size:17px;color:#94a3b8;max-width:540px;margin:0 auto 32px;line-height:1.6">Capture more leads, reduce tire-kickers, and close more jobs with a white-label estimator that works 24/7.</p>
    <a href="/company" style="background:${PRIMARY};color:white;padding:15px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Start Free Trial &#8594;</a>
    <p style="color:#475569;font-size:13.5px;margin-top:14px">$159/mo after 7 days &middot; Cancel anytime</p>
  </div>

  <h2 style="font-size:28px;font-weight:700;text-align:center;color:#0f172a;margin-bottom:36px">Everything you need</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:56px">
    ${features.map(([title, desc]) => `<div style="background:white;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px 20px">
      <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(title)}</h3>
      <p style="font-size:13.5px;color:#475569;line-height:1.65;margin:0">${esc(desc)}</p>
    </div>`).join('\n    ')}
  </div>

  <h2 style="font-size:28px;font-weight:700;text-align:center;color:#0f172a;margin-bottom:36px">Up and running in 30 minutes</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;margin-bottom:56px">
    ${steps.map(([n, title, desc]) => `<div style="text-align:center">
      <div style="width:44px;height:44px;background:${PRIMARY};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px;margin:0 auto 12px">${n}</div>
      <h3 style="font-weight:700;font-size:15px;color:#0f172a;margin-bottom:6px">${esc(title)}</h3>
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0">${esc(desc)}</p>
    </div>`).join('\n    ')}
  </div>

  <h2 style="font-size:28px;font-weight:700;text-align:center;color:#0f172a;margin-bottom:36px">What cleaning companies say</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:56px">
    ${testimonials.map(([name, company, text]) => `<div style="background:white;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px 20px">
      <p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:14px">&ldquo;${esc(text)}&rdquo;</p>
      <div style="font-weight:700;font-size:13.5px;color:#0f172a">${esc(name)}</div>
      <div style="font-size:12.5px;color:#64748b;margin-top:2px">${esc(company)}</div>
    </div>`).join('\n    ')}
  </div>

  <div id="pricing" style="background:linear-gradient(135deg,#f0f7ff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:40px 32px;text-align:center;margin-bottom:48px">
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px">Simple, transparent pricing</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:20px">One plan. Everything included. No surprises.</p>
    <div style="font-size:34px;font-weight:900;color:#0f172a">$159<span style="font-size:13px;color:#64748b;font-weight:600">/month</span></div>
    <p style="color:#16a34a;font-weight:600;font-size:12px;margin-bottom:16px">$159/mo after 7 days &middot; Cancel anytime</p>
    <ul style="list-style:none;padding:0;max-width:280px;margin:0 auto 20px;text-align:left">
      ${planFeatures.map(f => `<li style="font-size:13px;color:#374151;margin-bottom:8px">&#10003; ${esc(f)}</li>`).join('\n      ')}
    </ul>
    <a href="/company" style="display:inline-block;background:${PRIMARY};color:white;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Start Free Trial &#8594;</a>
  </div>

  <div style="text-align:center">
    <h2 style="font-size:26px;font-weight:700;color:#0f172a;margin-bottom:12px">Ready to capture more leads?</h2>
    <p style="font-size:15px;color:#64748b;margin-bottom:24px">Join cleaning companies already using Clean Estimator to turn website visitors into booked jobs.</p>
    <a href="/company" style="background:${PRIMARY};color:white;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Get Started Free &#8594;</a>
  </div>`;

  return renderStaticPage({ path: '/for-companies', seoTitle, seoDesc, bodyHtml: body, maxWidth: 1100, assets });
}

// ─── 9. Homepage injection ────────────────────────────────────────────────────

function injectHomepage(posts, categories) {
  const indexPath = path.join(BUILD, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('<div id="root"></div>')) return;

  const topPosts = posts.slice(0, 6);
  const postLinks = topPosts.map(p =>
    `<li style="margin-bottom:10px"><a href="/blog/${p.slug}" style="color:${PRIMARY};text-decoration:none;font-size:14px;font-weight:500;line-height:1.5">${esc(p.title)}</a></li>`
  ).join('\n      ');

  const staticContent = `${staticHeader()}
<div style="font-family:'Poppins','Poppins Fallback',Arial,sans-serif;background:#f8fafc;min-height:80vh">
  <div style="max-width:1100px;margin:0 auto;padding:40px 24px 64px">
    <div style="text-align:center;padding:48px 24px 40px">
      <h1 style="font-size:clamp(28px,5vw,52px);font-weight:900;color:#0f172a;line-height:1.15;margin-bottom:16px">Free Cleaning Cost Estimator 2026</h1>
      <p style="font-size:18px;color:#475569;max-width:560px;margin:0 auto 32px;line-height:1.6">Get instant, ZIP-code specific cleaning service prices for house cleaning, carpet cleaning, air duct cleaning, and more — 100% free.</p>
      <a href="/" style="background:${PRIMARY};color:white;padding:16px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:17px;display:inline-block">Get My Free Estimate &#8594;</a>
    </div>
    <div id="how-it-works" style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:36px 40px;margin-bottom:40px">
      <h2 style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:28px;text-align:center">How It Works</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px">
        <div style="text-align:center">
          <div style="width:48px;height:48px;background:#eff6ff;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px">📍</div>
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px">1. Enter Your ZIP Code</h3>
          <p style="font-size:14px;color:#64748b;line-height:1.6">Local labor rates and cost-of-living factors are applied automatically.</p>
        </div>
        <div style="text-align:center">
          <div style="width:48px;height:48px;background:#eff6ff;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px">🏠</div>
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px">2. Describe Your Home</h3>
          <p style="font-size:14px;color:#64748b;line-height:1.6">Select service type, home size, and any add-ons for an accurate quote.</p>
        </div>
        <div style="text-align:center">
          <div style="width:48px;height:48px;background:#eff6ff;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px">💰</div>
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px">3. Get Your Estimate</h3>
          <p style="font-size:14px;color:#64748b;line-height:1.6">Instant price range with low, average, and high estimates for your area.</p>
        </div>
      </div>
    </div>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:36px 40px;margin-bottom:40px">
      <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px;text-align:center">How Our Cleaning Estimator Calculates Your Price</h2>
      <p style="font-size:14px;color:#64748b;text-align:center;max-width:560px;margin:0 auto 24px;line-height:1.6">Clean Estimator is a free cleaning cost estimator that builds every quote from six real variables — not a flat national guess.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Home Size (Square Footage)</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">Your base price scales with square footage — $90–$115 under 1,000 sq ft, up to $272–$338 over 3,000 sq ft.</p></div>
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Service Type</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">Standard cleaning is the baseline. Deep cleaning costs 68–85% more, move-in/move-out costs 88–105% more.</p></div>
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Location (ZIP Code)</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">State and city cost-of-living adjust your price — CA and NY run 30–60% above the national average.</p></div>
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Cleaning Frequency</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">Weekly service gets a 20% discount, biweekly 15%, and monthly 10% off the one-time rate.</p></div>
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Add-Ons</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">Inside oven, inside fridge, interior windows, and laundry are priced separately on top of the base clean.</p></div>
        <div><h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px">Home Condition</h3><p style="font-size:13.5px;color:#475569;line-height:1.6;margin:0">A home not professionally cleaned in months typically costs 22–28% more for the first visit.</p></div>
      </div>
    </div>
    <div style="margin-bottom:40px">
      <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:20px">Cleaning Cost Guides</h2>
      <ul style="list-style:none;padding:0;margin:0;background:white;border:1px solid #e2e8f0;border-radius:14px;padding:24px 28px">
        ${postLinks}
      </ul>
      <a href="/blog" style="display:inline-block;margin-top:14px;color:${PRIMARY};font-weight:700;font-size:14px;text-decoration:none">View all guides &#8594;</a>
    </div>
    <div id="faq" style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:36px 40px">
      <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:24px">Frequently Asked Questions</h2>
      <div style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">How much does house cleaning cost?</h3>
        <p style="font-size:14px;color:#475569;line-height:1.6">House cleaning runs $90–$338 per visit depending on home size — $158–$198 is typical for a 1,500–2,000 sq ft home. Our calculator gives you a precise estimate based on your ZIP code.</p>
      </div>
      <div style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">What affects carpet cleaning prices?</h3>
        <p style="font-size:14px;color:#475569;line-height:1.6">Carpet cleaning costs $44–$100 per room depending on condition, with a $90–$110 whole-home minimum. Factors include room count, soil level (light to pet stains), and method (steam vs. dry cleaning).</p>
      </div>
      <div style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">How often should I have my air ducts cleaned?</h3>
        <p style="font-size:14px;color:#475569;line-height:1.6">Most experts recommend air duct cleaning every 3–5 years. A standard residential system costs $330–$420, plus $65–$85 per additional HVAC system. More frequent cleaning may be needed with pets or allergies.</p>
      </div>
      <div style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">How much does mold remediation cost?</h3>
        <p style="font-size:14px;color:#475569;line-height:1.6">Mold remediation costs $750–$1,050 for a small spot (under 10 sq ft) up to $8,500–$13,000+ for extensive contamination (300+ sq ft). It always requires an in-person inspection — final pricing depends on the extent of contamination and whether the moisture source has been fixed.</p>
      </div>
      <div>
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">Is this calculator really free?</h3>
        <p style="font-size:14px;color:#475569;line-height:1.6">Yes, 100% free. No sign-up, no email required. We provide estimates based on real local market data so you can negotiate confidently with cleaning companies.</p>
      </div>
    </div>
  </div>
</div>${staticFooter()}`;

  html = html.replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✓ homepage — static content injected into build/index.html');
}

// ─── 10. Write helper ─────────────────────────────────────────────────────────

function writeFile(relPath, html) {
  const full = path.join(BUILD, relPath, 'index.html');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf8');
}

// ─── 11. Main ─────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(BUILD)) {
    console.log('⚠  prerender: build/ not found — skipping');
    return;
  }

  const { BLOG_POSTS, CATEGORIES } = loadBlogData();
  const servicesMod = loadServicesData();
  const statesMod = loadStatesData();
  const faqsMod = loadFaqsData();
  const assets = getAssetTags();
  let count = 0;

  injectHomepage(BLOG_POSTS, CATEGORIES);

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

  writeFile('about', renderAbout(assets));
  count++;
  writeFile('contact', renderContact(assets));
  count++;
  writeFile('privacy-policy', renderLegalPage('privacy', assets));
  count++;
  writeFile('terms-of-service', renderLegalPage('terms', assets));
  count++;
  writeFile('for-companies', renderForCompanies(assets));
  count++;
  writeFile('cleaning-cost-calculator', renderCalculatorPage(assets));
  count++;

  const services = servicesMod.getAllServices();
  for (const service of services) {
    writeFile('cleaning-services/' + service.slug, renderServicePage(service, statesMod, assets));
    count++;
  }

  const citiesMod = loadCityData(statesMod, servicesMod);

  const states = statesMod.getAllStates();
  for (const state of states) {
    writeFile('cleaning-cost/' + state.slug, renderStatePage(state, servicesMod, statesMod, faqsMod, assets, citiesMod));
    count++;
  }

  const cities = citiesMod.getAllCities();
  for (const city of cities) {
    writeFile('cleaning-cost/city/' + city.slug, renderCityPage(city, servicesMod, citiesMod, faqsMod, assets));
    count++;
  }

  console.log('✓ prerender — ' + count + ' pages generated (' + BLOG_POSTS.length + ' posts, ' + CATEGORIES.length + ' categories, 6 static pages, ' + services.length + ' services, ' + states.length + ' states, ' + cities.length + ' cities)');
}

main();
