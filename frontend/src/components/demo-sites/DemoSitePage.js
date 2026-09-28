import React from 'react';
import { getSite } from './siteConfigs';
import { getExternalSite } from './externalSites';
import DemoSiteLayout from './DemoSiteLayout';
import DemoHome from './DemoHome';
import DemoAbout from './DemoAbout';
import DemoServices from './DemoServices';
import DemoServiceAreas from './DemoServiceAreas';
import DemoContact from './DemoContact';

const PAGE_COMPONENTS = {
  home: DemoHome,
  about: DemoAbout,
  services: DemoServices,
  'service-areas': DemoServiceAreas,
  contact: DemoContact,
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
export default function DemoSitePage({ slug, page }) {
  const externalSite = getExternalSite(slug);
  if (externalSite) return <ExternalSitePage site={externalSite} />;

  const site = getSite(slug);
  const pageKey = page || 'home';
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
