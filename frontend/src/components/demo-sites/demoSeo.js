// JSON-LD builders for the demo sites -- mirrors the schema pattern the
// real client sites use (LocalBusiness, BreadcrumbList, FAQPage), so a
// dedicated service/area page here demonstrates the same structured-data
// setup a client gets on their own domain. These demo pages stay
// noindex (see DemoSiteLayout.js), so this is for demonstrating the
// technique, not for getting these specific fictional pages indexed.

const SITE_ORIGIN = 'https://www.cleanestimator.com';

export function demoAbsoluteUrl(site, path = '') {
  return `${SITE_ORIGIN}/website-example/${site.slug}${path}`;
}

export function localBusinessJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': `${demoAbsoluteUrl(site)}#business`,
    name: site.businessName,
    description: site.tagline,
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.zip,
      addressCountry: 'US',
    },
    areaServed: site.serviceAreas.map((area) => ({ '@type': 'City', name: area })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${site.businessName} Services`,
      itemListElement: site.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.desc },
      })),
    },
  };
}

export function breadcrumbJsonLd(site, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: demoAbsoluteUrl(site, item.path),
    })),
  };
}

export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}
