// Curated font choices for the embedded calculator widget's Branding tab.
// The widget is embedded as an <iframe> (see EmbedTab.js), so it can't
// automatically inherit the parent page's font the way inline-injected
// widgets can -- this is what lets a company manually match it to their
// own site's typography instead of always showing Clean Estimator's
// default. Web-safe entries need no extra loading; Google Fonts entries
// are lazy-loaded via a <link> injected at runtime only when actually
// selected (see the useEffect in CleaningCalculator.js), not preloaded
// for every possible choice.
// Each Google Fonts entry's stack routes through its own metric-matched
// '<Name> Fallback' (defined in App.css, computed off that font's and
// Arial's real tables) before the generic sans-serif -- otherwise the
// browser shows plain, narrower-than-most-of-these Arial for the moment
// between first paint and this webfont finishing its (lazy, runtime) load,
// then visibly reflows into place once it swaps in. See App.css for why.
export const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter (default)', stack: "'Inter', 'Inter Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", google: 'Inter:wght@400;500;600;700;800' },
  { id: 'Poppins', label: 'Poppins', stack: "'Poppins', 'Poppins Fallback', sans-serif", google: 'Poppins:wght@400;500;600;700;800' },
  { id: 'Roboto', label: 'Roboto', stack: "'Roboto', 'Roboto Fallback', sans-serif", google: 'Roboto:wght@400;500;700;900' },
  { id: 'Open Sans', label: 'Open Sans', stack: "'Open Sans', 'Open Sans Fallback', sans-serif", google: 'Open+Sans:wght@400;500;600;700;800' },
  { id: 'Lato', label: 'Lato', stack: "'Lato', 'Lato Fallback', sans-serif", google: 'Lato:wght@400;700;900' },
  { id: 'Montserrat', label: 'Montserrat', stack: "'Montserrat', 'Montserrat Fallback', sans-serif", google: 'Montserrat:wght@400;500;600;700;800' },
  { id: 'Nunito', label: 'Nunito', stack: "'Nunito', 'Nunito Fallback', sans-serif", google: 'Nunito:wght@400;600;700;800' },
  { id: 'Work Sans', label: 'Work Sans', stack: "'Work Sans', 'Work Sans Fallback', sans-serif", google: 'Work+Sans:wght@400;500;600;700;800' },
  { id: 'Raleway', label: 'Raleway', stack: "'Raleway', 'Raleway Fallback', sans-serif", google: 'Raleway:wght@400;500;600;700;800' },
  { id: 'Source Sans 3', label: 'Source Sans', stack: "'Source Sans 3', 'Source Sans 3 Fallback', sans-serif", google: 'Source+Sans+3:wght@400;500;600;700;800' },
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
