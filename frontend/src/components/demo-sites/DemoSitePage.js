import React from 'react';
import { getSite } from './siteConfigs';
import { getExternalSite } from './externalSites';
import DemoSiteLayout from './DemoSiteLayout';
import DemoHome from './DemoHome';
import DemoAbout from './DemoAbout';
import DemoServices from './DemoServices';
import DemoServiceAreas from './DemoServiceAreas';
import DemoServicePage from './DemoServicePage';
import DemoAreaPage from './DemoAreaPage';
import DemoContact from './DemoContact';

const PAGE_COMPONENTS = {
  home: DemoHome,
  about: DemoAbout,
  services: DemoServices,
  'service-areas': DemoServiceAreas,
  contact: DemoContact,
};

// Pages with a dedicated per-slug sub-route (/services/:slug,
// /service-areas/:slug) -- each one gets its own unique meta/H1/FAQs/schema
// instead of only appearing as a card on the combined listing page.
const SUB_PAGE_COMPONENTS = {
  services: DemoServicePage,
  'service-areas': DemoAreaPage,
};
const SUB_PAGE_PROP = {
  services: 'serviceSlug',
  'service-areas': 'areaSlug',
};

// Real, live client site -- iframed full-bleed so the browser's address bar
// stays on cleanestimator.com/website-example/:slug instead of jumping to
// the client's own domain, while a visitor still sees the actual site, not
// a screenshot or a rebuild of it.
function ExternalSitePage({ site }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'white' }}>
      <iframe
        src={site.externalUrl}
        title={site.businessName}
        style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

// Resolves /website-example/:slug(/:page) to the right template. Not found
// (bad slug or page) sends visitors back to the gallery rather than a blank
// screen -- a mistyped or stale link is the only realistic way to land here.
export default function DemoSitePage({ slug, page, subSlug }) {
  const externalSite = getExternalSite(slug);
  if (externalSite) return <ExternalSitePage site={externalSite} />;

  const site = getSite(slug);
  const pageKey = page || 'home';

  if (subSlug && SUB_PAGE_COMPONENTS[pageKey]) {
    if (!site) {
      if (typeof window !== 'undefined') window.location.replace('/website-example');
      return null;
    }
    const SubPage = SUB_PAGE_COMPONENTS[pageKey];
    const propName = SUB_PAGE_PROP[pageKey];
    return (
      <DemoSiteLayout site={site} current={pageKey}>
        <SubPage {...{ [propName]: subSlug }} />
      </DemoSiteLayout>
    );
  }

  const Page = PAGE_COMPONENTS[pageKey];

  if (!site || !Page) {
    if (typeof window !== 'undefined') window.location.replace('/website-example');
    return null;
  }

  return (
    <DemoSiteLayout site={site} current={pageKey}>
      <Page />
    </DemoSiteLayout>
  );
}
