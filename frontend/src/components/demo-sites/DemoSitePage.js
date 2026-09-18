import React from 'react';
import { getSite } from './siteConfigs';
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

// Resolves /website-example/:slug(/:page) to the right template. Not found
// (bad slug or page) sends visitors back to the gallery rather than a blank
// screen -- a mistyped or stale link is the only realistic way to land here.
export default function DemoSitePage({ slug, page }) {
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
