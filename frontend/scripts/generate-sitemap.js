/**
 * generate-sitemap.js
 * Reads blogPosts.js and auto-generates public/sitemap.xml.
 * Run automatically before every build via the "prebuild" npm script.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.cleanestimator.com';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Parse blogPosts.js as text ─────────────────────────────────────────────

const postsFile = fs.readFileSync(
  path.join(__dirname, '../src/data/blogPosts.js'),
  'utf8'
);

// Extract all slug + date pairs from BLOG_POSTS array
const slugMatches = [...postsFile.matchAll(/(?<!\w)slug:\s*['"]([^'"]+)['"]/g)];
const dateMatches = [...postsFile.matchAll(/(?<!\w)date:\s*['"]([^'"]+)['"]/g)];

const posts = slugMatches.map((m, i) => ({
  slug: m[1],
  date: dateMatches[i]?.['1'] || TODAY,
}));

// Extract unique category slugs from category fields
const categoryMatches = [...postsFile.matchAll(/(?<!\w)category:\s*['"]([^'"]+)['"]/g)];
const categorySlugs = [...new Set(categoryMatches.map(m => m[1]))];

// ── Parse services.js and statePricing.js as text ──────────────────────────

const servicesFile = fs.readFileSync(
  path.join(__dirname, '../src/data/services.js'),
  'utf8'
);
const serviceSlugs = [...servicesFile.matchAll(/(?<!\w)slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

const statesFile = fs.readFileSync(
  path.join(__dirname, '../src/data/statePricing.js'),
  'utf8'
);
const stateSlugs = [...statesFile.matchAll(/(?<!\w)slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

// City slugs are computed at runtime (`${slugify(name)}-${stateCode}`), not a
// literal string in the source, so the regex scan above can't find them --
// actually evaluate cityPricing.js (with its statePricing.js import stripped
// and the needed function injected, same trick prerender.js uses) to get the
// real computed slugs.
const statesModForCities = (() => {
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    statesFile
      .replace(/^export const /gm, 'const ')
      .replace(/^export function /gm, 'function ')
      + '\nreturn { getStateBySlug, adjustForState };'
  );
  return fn();
})();
const cityFile = fs.readFileSync(
  path.join(__dirname, '../src/data/cityPricing.js'),
  'utf8'
);
const citySlugs = (() => {
  const src = cityFile
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ');
  // eslint-disable-next-line no-new-func
  const fn = new Function('getStateBySlug', 'adjustForState', 'getAllServices', 'typicalCost', src + '\nreturn { getAllCities };');
  return fn(statesModForCities.getStateBySlug, statesModForCities.adjustForState, () => [], () => ({ low: 0, high: 0 }))
    .getAllCities().map(c => c.slug);
})();

// ── Static pages ───────────────────────────────────────────────────────────
const staticPages = [
  { path: '/',                 priority: '1.0', changefreq: 'weekly',  lastmod: TODAY },
  { path: '/blog',             priority: '0.9', changefreq: 'weekly',  lastmod: TODAY },
  { path: '/for-companies',    priority: '0.8', changefreq: 'monthly', lastmod: TODAY },
  { path: '/about',            priority: '0.6', changefreq: 'monthly', lastmod: '2026-01-01' },
  { path: '/contact',          priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' },
  { path: '/privacy-policy',   priority: '0.3', changefreq: 'yearly',  lastmod: '2026-01-01' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly',  lastmod: '2026-01-01' },
];

// ── Build XML ──────────────────────────────────────────────────────────────
function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '',
  '  <!-- Core pages -->',
  ...staticPages.map(p =>
    urlEntry({ loc: `${SITE_URL}${p.path}`, lastmod: p.lastmod, changefreq: p.changefreq, priority: p.priority })
  ),
  '',
  '  <!-- Blog category pages -->',
  ...categorySlugs.map(slug =>
    urlEntry({ loc: `${SITE_URL}/blog/category/${slug}`, lastmod: TODAY, changefreq: 'weekly', priority: '0.7' })
  ),
  '',
  '  <!-- Blog posts (auto-generated from blogPosts.js) -->',
  ...posts.map(p =>
    urlEntry({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: p.date, changefreq: 'monthly', priority: '0.8' })
  ),
  '',
  '  <!-- Cleaning services (auto-generated from services.js) -->',
  ...serviceSlugs.map(slug =>
    urlEntry({ loc: `${SITE_URL}/cleaning-services/${slug}`, lastmod: TODAY, changefreq: 'monthly', priority: '0.9' })
  ),
  '',
  '  <!-- Cleaning cost by state (auto-generated from statePricing.js) -->',
  ...stateSlugs.map(slug =>
    urlEntry({ loc: `${SITE_URL}/cleaning-cost/${slug}`, lastmod: TODAY, changefreq: 'monthly', priority: '0.8' })
  ),
  '',
  '  <!-- Cleaning cost by city (auto-generated from cityPricing.js) -->',
  ...citySlugs.map(slug =>
    urlEntry({ loc: `${SITE_URL}/cleaning-cost/city/${slug}`, lastmod: TODAY, changefreq: 'monthly', priority: '0.7' })
  ),
  '',
  '</urlset>',
].join('\n') + '\n';

// ── Write output ───────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');

console.log(`✓ sitemap.xml — ${posts.length} posts, ${categorySlugs.length} categories, ${serviceSlugs.length} services, ${stateSlugs.length} states, ${citySlugs.length} cities`);
