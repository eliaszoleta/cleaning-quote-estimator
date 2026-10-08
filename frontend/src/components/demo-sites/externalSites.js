// Real, live example builds (as opposed to siteConfigs.js's fictional
// businesses rendered by our own DemoHome/DemoAbout/etc. templates) --
// shown via an iframe at /website-example/:slug (see DemoSitePage.js)
// instead of a direct external link, so a visitor never leaves
// cleanestimator.com's own URL.
const EXTERNAL_SITES = [
  {
    slug: 'pristine-cleaning',
    businessName: 'Pristine Cleaning',
    tagline: 'Airbnb turnovers, deep cleans & move-out cleaning',
    city: 'Mesquite',
    state: 'NV',
    logoLabel: 'PC',
    fontHeading: "'Poppins', Arial, sans-serif",
    colors: { primary: '#1a2438', primaryDark: '#0f1622', accent: '#c9a227', bg: '#faf8f3' },
    externalUrl: 'https://pristine-cleaning-nine.vercel.app/',
  },
  {
    slug: 'suds-and-smile',
    businessName: 'Southern Suds and Smiles',
    tagline: 'We do the soaking and sudsing for you, with a smile!',
    city: 'Charleston',
    state: 'MO',
    logoLabel: 'SS',
    fontHeading: "'Poppins', Arial, sans-serif",
    colors: { primary: '#2d5b70', primaryDark: '#1e3f4f', accent: '#e0a940', bg: '#f7fbfc' },
    externalUrl: 'https://suds-and-smile.vercel.app/',
  },
  {
    // Placeholder metadata -- outbound access to this domain is blocked in
    // this sandbox, so the real business name, tagline, city, and palette
    // haven't been verified against the live site. The iframe itself still
    // points at the real URL and works now; see chat for what to confirm.
    slug: 'the-cleaning-sister',
    businessName: 'The Cleaning Sister',
    tagline: 'Professional home cleaning you can trust.',
    city: '',
    state: '',
    logoLabel: 'CS',
    fontHeading: "'Poppins', Arial, sans-serif",
    colors: { primary: '#b5638c', primaryDark: '#7d4160', accent: '#e8a9c0', bg: '#fdf6f9' },
    externalUrl: 'https://the-cleaning-sister.vercel.app/',
  },
];

export function getExternalSite(slug) {
  return EXTERNAL_SITES.find(s => s.slug === slug) || null;
}

export default EXTERNAL_SITES;
