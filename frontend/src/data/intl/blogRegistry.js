import { POSTS as UK_POSTS, CATEGORIES as UK_CATEGORIES } from './blogPostsUK';
import { POSTS as CA_POSTS, CATEGORIES as CA_CATEGORIES } from './blogPostsCA';
import { POSTS as AU_POSTS, CATEGORIES as AU_CATEGORIES } from './blogPostsAU';

// One entry per country-specific blog, each fully separate from the default
// (US) blog at /blog -- blogPosts.js/BLOG_POSTS/CATEGORIES is untouched by
// this file. Keeping US and country content in physically separate data
// files/arrays (rather than one list filtered by a country field) is
// deliberate: it's the only way to guarantee /blog can never end up
// rendering a mix of US and non-US posts just because someone adds a post
// without setting a filter field correctly.
//
// `basePath` is the single source of truth every blog component and the
// prerender script key off of for hrefs/canonicals -- changing a country's
// URL prefix only ever means changing it here. `siteName`/`heroTitle`/
// `heroSubtitle` are read directly by BlogIndex.js/BlogCategory.js/
// BlogPost.js and by prerender.js's country render calls -- keep those
// exact field names in sync if this file is ever regenerated.
export const BLOG_COUNTRIES = {
  uk: {
    key: 'uk',
    label: 'United Kingdom',
    shortLabel: 'UK',
    basePath: '/blog/uk',
    siteName: 'Clean Estimator UK',
    currencySymbol: '£',
    hreflang: 'en-GB',
    heroTitle: 'UK Cleaning Cost Guides',
    heroSubtitle: 'Expert guides to flat, house and commercial cleaning prices across the UK.',
    posts: UK_POSTS,
    categories: UK_CATEGORIES,
  },
  ca: {
    key: 'ca',
    label: 'Canada',
    shortLabel: 'Canada',
    basePath: '/blog/ca',
    siteName: 'Clean Estimator Canada',
    currencySymbol: 'C$',
    hreflang: 'en-CA',
    heroTitle: 'Canada Cleaning Cost Guides',
    heroSubtitle: 'Expert guides to house and commercial cleaning prices across Canada.',
    posts: CA_POSTS,
    categories: CA_CATEGORIES,
  },
  au: {
    key: 'au',
    label: 'Australia',
    shortLabel: 'Australia',
    basePath: '/blog/au',
    siteName: 'Clean Estimator Australia',
    currencySymbol: 'A$',
    hreflang: 'en-AU',
    heroTitle: 'Australia Cleaning Cost Guides',
    heroSubtitle: 'Expert guides to house, unit and commercial cleaning prices across Australia.',
    posts: AU_POSTS,
    categories: AU_CATEGORIES,
  },
};

export const BLOG_COUNTRY_KEYS = Object.keys(BLOG_COUNTRIES);

export function getCountryBlog(key) {
  return BLOG_COUNTRIES[key] || null;
}

export function getCountryPostBySlug(key, slug) {
  const blog = getCountryBlog(key);
  return blog ? (blog.posts.find(p => p.slug === slug) || null) : null;
}

export function getCountryPostsByCategory(key, categoryId) {
  const blog = getCountryBlog(key);
  return blog ? blog.posts.filter(p => p.category === categoryId) : [];
}
