import { createContext, useContext } from 'react';

// Carries the active site's config + the quote-popup opener down to every
// page template without prop-drilling through five separate page files.
const DemoSiteContext = createContext(null);

export function useDemoSite() {
  return useContext(DemoSiteContext);
}

export default DemoSiteContext;
