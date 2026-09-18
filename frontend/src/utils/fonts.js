// Curated font choices for the embedded calculator widget's Branding tab.
// The widget is embedded as an <iframe> (see EmbedTab.js), so it can't
// automatically inherit the parent page's font the way inline-injected
// widgets can -- this is what lets a company manually match it to their
// own site's typography instead of always showing Clean Estimator's
// default. Web-safe entries need no extra loading; Google Fonts entries
// are lazy-loaded via a <link> injected at runtime only when actually
// selected (see the useEffect in CleaningCalculator.js), not preloaded
// for every possible choice.
export const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter (default)', stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", google: 'Inter:wght@400;500;600;700;800' },
  { id: 'Poppins', label: 'Poppins', stack: "'Poppins', sans-serif", google: 'Poppins:wght@400;500;600;700;800' },
  { id: 'Roboto', label: 'Roboto', stack: "'Roboto', sans-serif", google: 'Roboto:wght@400;500;700;900' },
  { id: 'Open Sans', label: 'Open Sans', stack: "'Open Sans', sans-serif", google: 'Open+Sans:wght@400;500;600;700;800' },
  { id: 'Lato', label: 'Lato', stack: "'Lato', sans-serif", google: 'Lato:wght@400;700;900' },
  { id: 'Montserrat', label: 'Montserrat', stack: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;500;600;700;800' },
  { id: 'Nunito', label: 'Nunito', stack: "'Nunito', sans-serif", google: 'Nunito:wght@400;600;700;800' },
  { id: 'Work Sans', label: 'Work Sans', stack: "'Work Sans', sans-serif", google: 'Work+Sans:wght@400;500;600;700;800' },
  { id: 'Raleway', label: 'Raleway', stack: "'Raleway', sans-serif", google: 'Raleway:wght@400;500;600;700;800' },
  { id: 'Source Sans 3', label: 'Source Sans', stack: "'Source Sans 3', sans-serif", google: 'Source+Sans+3:wght@400;500;600;700;800' },
  { id: 'Playfair Display', label: 'Playfair Display (serif)', stack: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:wght@400;500;600;700;800' },
  { id: 'Georgia', label: 'Georgia (serif)', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'Arial', label: 'Arial', stack: "Arial, Helvetica, sans-serif" },
  { id: 'Verdana', label: 'Verdana', stack: "Verdana, Geneva, sans-serif" },
  { id: 'Trebuchet MS', label: 'Trebuchet MS', stack: "'Trebuchet MS', sans-serif" },
  { id: 'system-ui', label: 'System Default', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

const BY_ID = Object.fromEntries(FONT_OPTIONS.map(f => [f.id, f]));

export function getFontOption(id) {
  return BY_ID[id] || FONT_OPTIONS[0];
}

export function getFontStack(id) {
  return getFontOption(id).stack;
}

export function getGoogleFontHref(id) {
  const opt = BY_ID[id];
  if (!opt?.google) return null;
  return `https://fonts.googleapis.com/css2?family=${opt.google}&display=swap`;
}
