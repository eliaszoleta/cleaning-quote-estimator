import React from 'react';
import { ExternalLink } from 'lucide-react';
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
// a screenshot or a rebuild of it. The small pill is the only chrome added:
// an iframe has no back button of its own, and if the host ever sets
// X-Frame-Options/CSP (neither does today, but a client-controlled site
// could change that at any time), this is the fallback that still gets a
// visitor to the real thing.
function ExternalSitePage({ site }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'white' }}>
      <a
        href={site.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 10,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(15,23,42,0.85)', color: 'white', backdropFilter: 'blur(6px)',
          padding: '8px 14px', borderRadius: 20, textDecoration: 'none',
          fontSize: 12.5, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        <ExternalLink size={13} /> Open in new tab
      </a>
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
