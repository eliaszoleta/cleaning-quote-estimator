// Nextdoor Ads Pixel -- same rules as metaPixel.js: loaded only on
// cleanestimator.com's own pages, never inside the /embed iframe route
// third-party companies use to embed the widget on their own sites, since
// that would attribute a stranger's site visit to our own ad account.
// initNextdoorPixel() is called once from App.js, gated on !isEmbed.
//
// Boilerplate below is Nextdoor's own snippet (from their Ads Manager pixel
// setup), not reconstructed from memory -- only the ID was extracted into a
// constant. Pixel IDs aren't secret; they ship in cleartext to every
// visitor's browser by design.
const PIXEL_ID = process.env.REACT_APP_NEXTDOOR_PIXEL_ID || 'a3a8ce98-ceab-4fd1-8b82-0fb259021307';

export function initNextdoorPixel() {
  if (!PIXEL_ID || typeof window === 'undefined' || window.ndp) return;

  /* eslint-disable */
  !function(e,n){var t,p;e.ndp||((t=e.ndp=function(){
  t.handleRequest?t.handleRequest.apply(t,arguments):t.queue.push(arguments)
  }).queue=[],t.v=1,(p=n.createElement(e="script")).async=!0,
  p.src="https://ads.nextdoor.com/public/pixel/ndp.js?id="+PIXEL_ID,
  (n=n.getElementsByTagName(e)[0]).parentNode.insertBefore(p,n))
  }(window,document);
  /* eslint-enable */

  window.ndp('init', PIXEL_ID, {});
  window.ndp('track', 'PAGE_VIEW');
}

// Safe no-op if the pixel was never initialized (embed routes, ad blockers,
// or PIXEL_ID unset). Event names here (LEAD, ESTIMATE_COMPLETED) mirror
// the Meta pixel's -- double-check in Nextdoor Ads Manager > Conversion
// Events that these are selectable as optimization goals; their pixel
// setup flow wasn't something this session could verify against live docs.
export function trackNextdoorEvent(eventName, params) {
  if (typeof window === 'undefined' || !window.ndp) return;
  window.ndp('track', eventName, params);
}
