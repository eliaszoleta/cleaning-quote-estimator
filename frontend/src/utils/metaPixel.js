// Meta (Facebook) Pixel -- loaded only on cleanestimator.com's own pages,
// never inside the /embed iframe route third-party companies use to embed
// the widget on their own sites. Firing it there would attribute a
// stranger's site visit to our own ad account and pollute their data with
// traffic that never touched cleanestimator.com. initMetaPixel() is called
// once from App.js, gated on !isEmbed -- CalculatorPage/EstimatorPage/the
// homepage all pass embedded=true to CleaningCalculator for styling only,
// so trackMetaEvent below stays a safe no-op there instead of double-gating.

// Pixel IDs aren't secret -- they ship in cleartext to every visitor's
// browser by design (the client has to call fbq('init', ID) itself), so
// defaulting it here is fine. REACT_APP_META_PIXEL_ID still overrides it
// per-deploy if this ever needs to point at a different Meta ad account.
const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || '1407282954925304';

export function initMetaPixel() {
  if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;

  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

// Safe no-op if the pixel was never initialized (embed routes, ad blockers,
// or REACT_APP_META_PIXEL_ID not configured for this deploy).
export function trackMetaEvent(eventName, params) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', eventName, params);
}
