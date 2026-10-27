import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import './CleaningCalculator.css';
import { AlertCircle, MapPin, BarChart3, Zap, ChevronDown, Loader2 } from 'lucide-react';
import { postCalculate } from '../../utils/api';
import { getDeviceId } from '../../utils/deviceId';
import CountryFlag from '../dashboard/CountryFlag';
import { getCachedPartnerMatch } from '../../utils/partnerLookup';
import { trackMetaEvent } from '../../utils/metaPixel';
import { trackNextdoorEvent } from '../../utils/nextdoorPixel';
import { getFontStack, getGoogleFontHref } from '../../utils/fonts';
import { COLORS, SHADOWS, RADIUS } from '../../styles/theme';
import ServiceSelect from './steps/ServiceSelect';
import LocationStep from './steps/LocationStep';
import HomeStep from './steps/HomeStep';
import ApartmentStep from './steps/ApartmentStep';
import CommercialStep from './steps/CommercialStep';
import CarpetStep from './steps/CarpetStep';
import UpholsteryStep from './steps/UpholsteryStep';
import AirDuctStep from './steps/AirDuctStep';
import DryerVentStep from './steps/DryerVentStep';
import TileGroutStep from './steps/TileGroutStep';
import MoldStep from './steps/MoldStep';
import WaterDamageStep from './steps/WaterDamageStep';
import AirbnbStep from './steps/AirbnbStep';
import PostConstructionStep from './steps/PostConstructionStep';
import LeadCaptureStep from './steps/LeadCaptureStep';
import UserTypeStep from './steps/UserTypeStep';
import ResultsScreen from './ResultsScreen';
import EstimateSentScreen from './EstimateSentScreen';
import PricingUpdateNotice from './PricingUpdateNotice';

const SERVICE_STEPS = {
  home_residential: ['service', 'location', 'home', 'lead', 'results'],
  apartment: ['service', 'location', 'apartment', 'lead', 'results'],
  commercial: ['service', 'location', 'commercial', 'lead', 'results'],
  carpet: ['service', 'location', 'carpet', 'lead', 'results'],
  upholstery: ['service', 'location', 'upholstery', 'lead', 'results'],
  air_duct: ['service', 'location', 'air_duct', 'lead', 'results'],
  dryer_vent: ['service', 'location', 'dryer_vent', 'lead', 'results'],
  tile_grout: ['service', 'location', 'tile_grout', 'lead', 'results'],
  mold_remediation: ['service', 'location', 'mold', 'lead', 'results'],
  water_damage: ['service', 'location', 'water_damage', 'lead', 'results'],
  airbnb: ['service', 'location', 'airbnb', 'lead', 'results'],
  post_construction: ['service', 'location', 'post_construction', 'lead', 'results'],
};

// Maps a serviceType (snake_case, as used above and by /api/calculate) to
// the camelCase key the dashboard's Services tab actually toggles in
// companyConfig.services -- same mapping ServiceSelect.js uses to filter
// its grid, needed here too so a ?service=... URL param can't reach a
// service the company has disabled just because it skips that grid.
const SERVICE_CONFIG_KEYS = {
  home_residential: 'homeResidential',
  apartment: 'apartment',
  commercial: 'commercial',
  carpet: 'carpet',
  upholstery: 'upholstery',
  air_duct: 'airDuct',
  dryer_vent: 'dryerVent',
  tile_grout: 'tileGrout',
  mold_remediation: 'moldRemediation',
  water_damage: 'waterDamage',
  airbnb: 'airbnb',
  post_construction: 'postConstruction',
};

const DETAIL_STEP_COMPONENT = {
  home: HomeStep,
  apartment: ApartmentStep,
  commercial: CommercialStep,
  carpet: CarpetStep,
  upholstery: UpholsteryStep,
  air_duct: AirDuctStep,
  dryer_vent: DryerVentStep,
  tile_grout: TileGroutStep,
  mold: MoldStep,
  water_damage: WaterDamageStep,
  airbnb: AirbnbStep,
  post_construction: PostConstructionStep,
};

const COUNTRY_NAMES = { US: 'United States', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia' };

// Maps a step id to its progress-bar label -- indexed by step name rather
// than position, so it stays correct whether or not 'lead' is actually
// present in `steps` (see skipLeadCapture below). Every per-service detail
// step (home/apartment/commercial/...) shares the 'Details' label.
function labelForStep(step) {
  if (step === 'service') return 'Service';
  if (step === 'location') return 'Location';
  if (step === 'lead') return 'Send';
  if (step === 'usertype') return 'You';
  if (step === 'results') return 'Results';
  return 'Details';
}

export default function CleaningCalculator({ companyConfig = null, embedded = false, initialService = null, siteLanding = false, onShowResults = null, demoPartner = null, skipLeadCapture = false, onShareEmail = null, instantResults = false, showSignupCta = false, askUserType = false, showCountrySelector = false, cardRadius = null, gateLeadByPartner = false }) {
  const cardRef = useRef(null);
  // embedded=true normally means "flush, no card look" (a real third-party
  // host embed via EmbedWrapper.js, meant to blend into someone else's
  // page), so both the card and its header default to square corners in
  // that mode. But several of OUR OWN surfaces pass embedded=true purely
  // for its other behaviors (instant results, simplified lead flow) while
  // still wrapping the calculator in their own rounded, overflow:hidden
  // card (Calculator Mode's RunEstimateTab.js, the Branding tab's widget
  // preview, and the public CalculatorPage/EstimatorPage/
  // ServiceCalculatorPage/PartnerDemoPage landing pages). Left at the old
  // embedded-only default, this card's header kept square corners while
  // its wrapper clipped to a rounded one -- the wrapper's rounded corner
  // cut straight through the header's square corner, leaving a sliver of
  // the wrapper's own background showing through as a small notch at each
  // top corner (reported from Calculator Mode and Widget Mode, but not the
  // real public homepage, which renders this component standalone with no
  // such wrapper). cardRadius lets a caller that supplies its own rounded
  // wrapper tell this component to match that exact radius instead.
  const resolvedCardRadius = cardRadius != null ? cardRadius : (embedded ? 0 : 10);
  // Measures the card's own rendered width, not window.innerWidth -- this
  // renders both in a real <iframe width="100%"> embed (where window IS
  // the iframe's own narrow viewport, so innerWidth happened to work) and
  // directly in the dashboard's Branding tab preview (no iframe -- window
  // is the whole desktop browser, so innerWidth stayed "desktop" no matter
  // how narrow the actual preview panel was, giving it a different,
  // uncapped-looking layout than the same widget gets on a real site).
  const [isMobile, setIsMobile] = useState(false);
  // Measured alongside isMobile, off the same ResizeObserver -- used below
  // to tell a genuinely narrow third-party embed (which still wants the
  // card's tighter padding) apart from our own wide embedded surfaces
  // (Calculator Mode, the Branding preview) that only pass embedded=true
  // for its OTHER behaviors (instant results, no iframe-postMessage
  // scrolling) and should otherwise look as roomy as the public site.
  const [cardWidth, setCardWidth] = useState(0);
  const [serviceType, setServiceType] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? initialService : null);
  const [stepIndex, setStepIndex] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? 1 : 0);
  const [location, setLocation] = useState({ zip: '', state: '' });
  // Public-page country picker (showCountrySelector -- homepage + the 3
  // siteLanding pages, all of which pass no companyConfig, so there's no
  // company-level country to read). Always starts on US, same "default
  // selected country as always has to be US" rule the dashboard's own
  // header switcher follows for a new company. A real companyConfig (the
  // embedded widget, Calculator Mode, Branding preview) still wins below --
  // this only ever matters when companyConfig is null.
  const [publicCountry, setPublicCountry] = useState('US');
  const country = companyConfig?.country || publicCountry;
  // Brief, purely cosmetic loading state on the country dropdown itself --
  // switching country is actually instant (no network round trip, just a
  // re-render with different labels/region data), but with zero feedback
  // that read as if the click did nothing. Mirrors the dashboard header's
  // own country switcher, where picking a new country triggers a real
  // save-in-flight + a full remount of whatever's showing (RunEstimateTab,
  // ServicesTab) -- visibly "something happened" there for free. This gives
  // the public picker that same unmistakable-switch feeling on purpose,
  // via a short timed spinner over the service grid, since there's no
  // async save/remount here to borrow that feedback from.
  const [countrySwitching, setCountrySwitching] = useState(false);
  const countrySwitchTimer = useRef(null);
  useEffect(() => () => { if (countrySwitchTimer.current) clearTimeout(countrySwitchTimer.current); }, []);
  const handleCountrySwitch = (newCountry) => {
    if (newCountry === publicCountry) return;
    setPublicCountry(newCountry);
    setLocation({ zip: '', state: '' });
    setCountrySwitching(true);
    if (countrySwitchTimer.current) clearTimeout(countrySwitchTimer.current);
    countrySwitchTimer.current = setTimeout(() => setCountrySwitching(false), 550);
  };
  const [serviceDetails, setServiceDetails] = useState({});
  const [leadInfo, setLeadInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set when the backend's daily public-estimate limit kicked in (see
  // calculate.js -- only ever reachable on the public calculator). Flat
  // limit tracked by IP, applies to every visitor regardless of how "I am
  // a..." was answered. Shown as its own popup pitching the unlimited
  // internal tool, not folded into the generic `error` banner.
  const [limitReached, setLimitReached] = useState(false);
  // Set when calculate.js's subscription-active check blocked the request
  // (subscriptionInactive -- the account isn't active: trial never
  // completed Checkout, or a real subscription lapsed/expired/past-due).
  // Only ever shown as a popup when skipLeadCapture is set -- that's only
  // ever true from RunEstimateTab.js, i.e. the account owner hitting this
  // from their own Calculator Mode, not a stranger on the embedded widget.
  const [subscriptionPaused, setSubscriptionPaused] = useState(false);

  // gateLeadByPartner (cleanestimator.com's own homepage + 3 siteLanding
  // twins only, since Oct 2026's first real partner signup in Houston --
  // see the "Bring back lead capture" commit) ties the lead-capture form to
  // whether there's actually a partner to forward the lead to: a visitor
  // outside any partner's coverage area gets zero contact-form friction
  // (same as the old instant-results conversion test) instead of being
  // asked for name/email/phone for a lead nobody can act on. Defaults to
  // true (keep the normal lead-capture flow) until the lookup below
  // resolves -- by the time a visitor reaches the one place this actually
  // matters (handleDetailsNext, after picking a service AND submitting
  // location AND filling in service details), this same-origin geo check +
  // cached Supabase lookup has long since finished; true is also the safe
  // side to default to if it somehow hasn't, since it just keeps asking,
  // never silently drops a lead that should have reached a real partner.
  const [hasAreaPartner, setHasAreaPartner] = useState(true);
  useEffect(() => {
    if (!gateLeadByPartner) return;
    let cancelled = false;
    getCachedPartnerMatch().then(partner => {
      if (!cancelled) setHasAreaPartner(!!partner);
    });
    return () => { cancelled = true; };
  }, [gateLeadByPartner]);
  // True only when gateLeadByPartner is actually in effect AND the lookup
  // above resolved to no coverage -- never true for a real company's
  // embedded widget or RunEstimateTab.js (neither ever passes
  // gateLeadByPartner), so this can't affect their own lead capture.
  const noAreaPartner = gateLeadByPartner && !hasAreaPartner;

  // Skips the lead-capture step entirely when the company has it disabled
  // (ServicesTab.js's "Enable Lead Capture" toggle) or the caller forces it
  // off (skipLeadCapture -- originally only the dashboard's own "Run an
  // Estimate" tab, where there's no outside visitor to capture; since Oct
  // 2026 also set by cleanestimator.com's own homepage/landing pages
  // (App.js, CalculatorPage.js, EstimatorPage.js, ServiceCalculatorPage.js)
  // for a conversion test -- show the real Calculator-Mode-style instant
  // result with zero contact-form friction, instead of gating it behind a
  // name/email/phone form and only emailing the number. This does mean
  // those pages no longer feed AdminHomepageLeads.js or send the estimate
  // email -- a deliberate tradeoff for this test, not an oversight).
  // Also off when gateLeadByPartner determined there's no partner in this
  // visitor's area (noAreaPartner above) -- same zero-friction tradeoff,
  // just decided per-visitor instead of sitewide.
  // Filtering `steps` itself here is what actually keeps the step
  // unreachable -- a previous version only filtered a separate, display-only
  // array used for the progress bar, so the real lead step still showed up
  // in normal navigation regardless of either toggle.
  const enableLead = !skipLeadCapture && companyConfig?.enableLeadCapture !== false && !noAreaPartner;
  // askUserType (only ever paired with skipLeadCapture on the public
  // homepage/landing pages -- never on RunEstimateTab.js, where the viewer
  // is already a known business owner) swaps the old lead step for the
  // single "I am a…" question instead of dropping it outright, same
  // position in the flow. See UserTypeStep.js and ResultsScreen.js's
  // showSuggestedPrice for why that answer still matters even with no
  // other contact info collected.
  const steps = serviceType
    ? (enableLead
        ? SERVICE_STEPS[serviceType]
        : askUserType
          ? SERVICE_STEPS[serviceType].map(s => s === 'lead' ? 'usertype' : s)
          : SERVICE_STEPS[serviceType].filter(s => s !== 'lead'))
    : ['service'];
  const currentStep = steps[stepIndex];

  // Re-runs on every currentStep change, not just on mount -- the results
  // step (below) returns an entirely different tree with no cardRef div at
  // all, so cardRef's node gets unmounted while viewing results and a brand
  // new one is created when "New Estimate" returns to the service step. An
  // empty dependency array here would attach the observer once to the
  // FIRST card div and never again: when that div is removed, its
  // ResizeObserver fires a final callback reporting a collapsed 0-width
  // rect, latching isMobile true forever (the new card div after reset is
  // never measured at all) -- exactly what made "New Estimate" randomly
  // drop the service grid down to a cramped 2-column mobile layout even on
  // a wide desktop card. Re-running per step keeps the observer attached to
  // whatever the real, current card node is.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const check = (width) => { setIsMobile(width <= 640); setCardWidth(width); };
    check(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      check(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentStep]);

  // True for every non-embedded page (unchanged) AND for an embedded
  // context wide enough that it isn't actually a cramped third-party
  // widget -- see ServiceSelect.js's identical WIDE_EMBED_MIN_WIDTH cutoff
  // for the matching service-grid fix this pairs with. cardWidth is 0
  // before the ResizeObserver's first measurement, which correctly falls
  // through to the narrower, pre-existing embedded padding for that one
  // frame rather than flashing wide then narrow.
  const isWideEmbedded = embedded && cardWidth >= 500;

  // Pre-select service from URL param (skipped if initialService already set it)
  // -- gated on the service actually being enabled, so a disabled service
  // isn't just hidden from the picker grid while still reachable by
  // appending ?service=... to the embed URL directly.
  useEffect(() => {
    if (initialService) return;
    const param = new URLSearchParams(window.location.search).get('service');
    const configKey = SERVICE_CONFIG_KEYS[param];
    if (param && SERVICE_STEPS[param] && companyConfig?.services?.[configKey]?.enabled !== false) {
      setServiceType(param);
      setStepIndex(1);
    }
  }, [initialService, companyConfig]);

  // Scroll to card on step change, accounting for sticky navbar height.
  // When truly embedded (a company's own site iframing EmbedWrapper.js),
  // window here is the IFRAME's own window -- scrolling it does nothing a
  // visitor can see, since the page that actually scrolls is the host
  // site's parent window, which this iframe can't call window.scrollTo on
  // directly (different origin). Posting a message instead, for the embed
  // snippet's own listener (see EmbedTab.js) to act on against the real
  // page. siteLanding pages (CalculatorPage.js, ServiceCalculatorPage.js,
  // EstimatorPage.js, PartnerDemoPage.js) also pass embedded=true, but only
  // for the card's CSS styling -- they're our own top-level page, not an
  // iframe, so postMessage has no listener and silently does nothing. Those
  // need the real window.scrollTo just like the homepage calculator.
  useEffect(() => {
    if (stepIndex === 0 || !cardRef.current) return;
    if (embedded && !siteLanding) {
      window.parent?.postMessage({ type: 'cleancalc-scroll-to-top' }, '*');
      return;
    }
    const navbarHeight = 70;
    const top = cardRef.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [stepIndex, embedded, siteLanding]);

  // Let a siteLanding page's own wrapper drop its fixed white/shadow card
  // once results are showing, since ResultsScreen renders its own full page
  // chrome (grey background, its own card, buttons outside it) that would
  // otherwise get boxed in a second time by that wrapper.
  useEffect(() => {
    onShowResults?.(currentStep === 'results' && !!result);
  }, [currentStep, result, onShowResults]);

  // Lazy-loads the Google Font behind a company's chosen widget font (see
  // BrandingTab.js) the moment it's actually needed, instead of every
  // possible font being preloaded on every page load. No-op for web-safe
  // choices (Arial, Georgia, etc.) and for the no-companyConfig public site.
  const fontFamily = companyConfig?.fontFamily || null;
  useEffect(() => {
    const href = getGoogleFontHref(fontFamily);
    if (!href) return;
    const linkId = `cc-font-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [fontFamily]);

  const goNext = () => setStepIndex(i => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));

  const handleServiceSelect = (type) => {
    setServiceType(type);
    setServiceDetails({});
    setResult(null);
    setError(null);
    setLimitReached(false);
    setSubscriptionPaused(false);
    setStepIndex(1);
  };

  const handleLocationNext = (loc) => {
    setLocation(loc);
    goNext();
  };

  // Shared by the normal (lead-capture) flow and the skip-lead flow below.
  // Takes `detailsOverride` rather than always reading the `serviceDetails`
  // state, because the skip-lead caller invokes this in the same tick as
  // setServiceDetails(details) -- that state update hasn't committed yet,
  // so reading `serviceDetails` here would still see the previous value.
  const runCalculation = async (lead, detailsOverride) => {
    const effectiveDetails = detailsOverride || serviceDetails;
    setLeadInfo(lead);
    setError(null);
    setLimitReached(false);
    setSubscriptionPaused(false);
    setLoading(true);
    try {
      // Minimum 1.8s so the spinner reads as "actually calculating" even
      // when the API responds instantly -- raced against the real call via
      // Promise.all, so a genuinely slow request never gets slowed down
      // further (Promise.all waits for the longer of the two, not the sum).
      const [, res] = await Promise.all([
        new Promise(resolve => setTimeout(resolve, 1800)),
        (async () => {
          // Same match ResultsScreen shows on-page (skipped when embedded,
          // same as ResultsScreen's own guard) -- forwarded so the estimate
          // email can include the same recommended-partner card, not a
          // separate lookup. `embedded && !siteLanding`, not bare `embedded`
          // -- siteLanding's 3 pages (CalculatorPage/EstimatorPage/
          // ServiceCalculatorPage) pass embedded=true purely for this
          // component's CSS (see resolvedCardRadius's own comment), not
          // because they're a real third-party host embed; ResultsScreen
          // below already gets this same correction (embedded={embedded &&
          // !siteLanding}) -- this was the one spot that didn't, which
          // meant a real partner match (and the lead-forwarding email that
          // depends on it) silently never happened for any visitor on those
          // 3 pages, only ever on the bare homepage.
          const partnerMatch = (embedded && !siteLanding) ? null : await getCachedPartnerMatch();
          return postCalculate({
            serviceType,
            zip: location.zip || null,
            state: location.state || null,
            // city only ever comes from a company-scoped LocationStep (see
            // serviceStates) -- doesn't affect pricing (state is what the
            // calculation engine actually uses), just stashed in
            // serviceDetails' existing free-form JSONB column as lead
            // context, no schema change needed.
            serviceDetails: location.city ? { ...effectiveDetails, city: location.city } : effectiveDetails,
            companyId: companyConfig?.companyId || null,
            leadInfo: lead?.email ? lead : null,
            partnerInfo: partnerMatch,
            // Only meaningful when companyId is null -- a real company's
            // calculation always uses its own saved companyConfig.country
            // server-side (see calculate.js), same as before this public
            // selector existed. This is the public-page-only override.
            country: companyConfig?.companyId ? undefined : country,
            // Backs the public daily-estimate limit with a second
            // dimension beyond IP (see calculate.js) -- a visitor cycling
            // VPN servers gets a fresh IP but not a fresh deviceId, since
            // it's a persisted localStorage value, not derived from the
            // request at all. Only meaningful on the same no-companyId
            // path as country above -- a real company's own widget/
            // Calculator Mode was never subject to this limit in the
            // first place (gated on an active subscription instead).
            deviceId: companyConfig?.companyId ? undefined : getDeviceId(),
          });
        })(),
      ]);
      setResult(res.data);
      // No-ops when a pixel isn't initialized (embed routes, ad blockers, no
      // pixel ID configured) -- safe to call unconditionally rather than
      // re-deriving the embed check each pixel already gated on.
      trackMetaEvent('EstimateCompleted', { service_type: serviceType, value: res.data.totalLow, currency: 'USD' });
      trackNextdoorEvent('ESTIMATE_COMPLETED', { service_type: serviceType, value: res.data.totalLow, currency: 'USD' });
      if (lead?.email) {
        trackMetaEvent('Lead', { service_type: serviceType });
        trackNextdoorEvent('LEAD', { service_type: serviceType });
      }
      goNext();
    } catch (err) {
      if (err.responseData?.limitReached) {
        setLimitReached(true);
      } else if (err.responseData?.subscriptionInactive && skipLeadCapture) {
        // subscriptionInactive only ever comes back when companyId was sent
        // (see calculate.js), which RunEstimateTab.js does (the account
        // owner running their own calculator) and cleanestimator.com's own
        // public pages never do (companyId is always null there) -- so this
        // branch is unreachable for the homepage/landing-page skipLeadCapture
        // use (see its own comment above), even though they share the flag.
        // A visitor on the actual embedded widget still just sees the plain,
        // customer-safe inline error below.
        setSubscriptionPaused(true);
      } else {
        setError(err.message || 'Calculation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeadNext = (lead) => runCalculation(lead);

  // userType alone (no name/email/phone) still goes through the same
  // leadInfo state/shape runCalculation already handles -- postCalculate
  // only treats it as a real lead (saved + emailed) when leadInfo.email is
  // present (see runCalculation and calculate.js), so this never creates a
  // lead record, same as the plain skipLeadCapture path. leadInfo.userType
  // is what ResultsScreen's showSuggestedPrice reads below.
  const handleUserTypeNext = (userType) => runCalculation({ userType });

  const handleDetailsNext = (details) => {
    setServiceDetails(details);
    if (enableLead || askUserType) {
      goNext();
    } else {
      // No further step to trigger the calculation from in this flow --
      // run it directly off the details just submitted.
      runCalculation(null, details);
    }
  };

  const handleReset = () => {
    setServiceType(null);
    setStepIndex(0);
    setLocation({ zip: '', state: '' });
    setServiceDetails({});
    setLeadInfo(null);
    setResult(null);
    setError(null);
    setLimitReached(false);
    setSubscriptionPaused(false);
  };

  // Branding from companyConfig (or defaults)
  const primaryColor = companyConfig?.primaryColor || '#2563eb';
  const companyName = companyConfig?.companyName || null;
  const customQuestions = companyConfig?.customLeadQuestions || [];

  const progressStep = Math.min(stepIndex, steps.length - 1);

  // Results page. On a real subscriber's embedded widget (EmbedWrapper.js,
  // the thing a company actually pastes onto their own site), nobody sees
  // the on-screen breakdown -- the backend emails it the moment
  // handleLeadNext's /api/calculate call returns, which is the one place a
  // real visitor there sees the numbers. Showing it on-screen too just made
  // that email redundant and visitors never opened it.
  //
  // instantResults opts back into the on-screen breakdown instead. Two
  // callers do this, for two different reasons (cleanestimator.com's own
  // homepage/landing pages briefly did too, Oct 2026, as a conversion test
  // -- reverted back to the lead-capture flow below before any conclusion
  // was drawn; the prop itself is left in place, just unused by those 4
  // pages now, in case it's worth testing again):
  //   - RunEstimateTab.js's "Run an Estimate" tool (paired with
  //     skipLeadCapture, so there's no lead-capture step and no estimate
  //     email at all) -- the account owner quoting a job themselves, often
  //     standing in front of that customer, who needs the number
  //     immediately.
  //   - demoPartner (the partner-recruitment demo page), always on, to let
  //     a prospect see what the widget actually looks like without needing
  //     to complete a fake lead form.
  // BrandingTab.js's Live Preview deliberately does NOT opt in: it passes a
  // real companyId (so a company testing their own widget goes through the
  // actual lead-capture + estimate-email flow, the same as a real visitor
  // would on EmbedWrapper.js), so it behaves identically to the real embed
  // -- email only, no on-screen breakdown.
  //
  // noAreaPartner opts in too, for the same reason enableLead above turns
  // off for it: with no lead step run at all, there's no email to send the
  // breakdown in, so the on-screen result is the only place this visitor
  // ever sees their number.
  const showInstantResults = instantResults || !!demoPartner || noAreaPartner;

  if (currentStep === 'results' && result) {
    if (!showInstantResults) {
      return (
        <div style={fontFamily ? { fontFamily: getFontStack(fontFamily) } : undefined}>
          <EstimateSentScreen
            name={leadInfo?.name}
            email={leadInfo?.email}
            serviceType={serviceType}
            country={country}
            embedded={embedded && !siteLanding}
            onReset={handleReset}
          />
        </div>
      );
    }
    return (
      <div style={fontFamily ? { fontFamily: getFontStack(fontFamily) } : undefined}>
        <ResultsScreen
          result={result}
          serviceDetails={serviceDetails}
          companyConfig={companyConfig}
          embedded={embedded && !siteLanding}
          onReset={handleReset}
          demoPartner={demoPartner}
          showSignupCta={showSignupCta}
          userType={leadInfo?.userType}
          onShareEmail={onShareEmail ? (email, clientName) => onShareEmail({ to: email, clientName, serviceType, zip: location.zip || null, state: location.state || null, serviceDetails }) : undefined}
        />
      </div>
    );
  }

  const DetailComponent = DETAIL_STEP_COMPONENT[currentStep];

  // Handed to ServiceSelect to render inline with its own "What service do
  // you need?" heading, rather than as a separate row above it -- on
  // mobile, a row of its own left it floating above the heading with
  // nothing visually tying the two together (reported from a live
  // screenshot). Built here (not inside ServiceSelect) since it owns
  // publicCountry/countrySwitching, both private to this component.
  const countrySelectorNode = showCountrySelector && (
    <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      {/* Same pill styling/flag overlay as the dashboard header's own
          country switcher (CompanyDashboard.js), just on a light card
          background instead of the dark header bar -- this is the public,
          no-company-account version of that exact control, so a visitor
          sees the same affordance a subscriber already does. Resets
          `location` on change: it's only ever rendered before a
          service/region has been picked, but a visitor can still get here
          via Back after starting a different country's flow, and a
          leftover region code (zip/state) from one country can
          coincidentally look valid in another's region list (e.g. US's
          "WA" vs. Australia's "WA"). */}
      <select
        value={publicCountry}
        onChange={e => handleCountrySwitch(e.target.value)}
        disabled={countrySwitching}
        title="Country"
        aria-label="Country"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '6px 20px 6px 24px' : '6px 24px 6px 28px', borderRadius: 20,
          background: COLORS.surfaceMuted, border: `1px solid ${COLORS.border}`,
          color: COLORS.ink, fontWeight: 700, fontSize: isMobile ? 11.5 : 12.5,
          cursor: countrySwitching ? 'wait' : 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none',
          opacity: countrySwitching ? 0.7 : 1,
        }}
      >
        <option value="US">{isMobile ? 'US' : 'United States'}</option>
        <option value="CA">{isMobile ? 'CA' : 'Canada'}</option>
        <option value="GB">{isMobile ? 'GB' : 'United Kingdom'}</option>
        <option value="AU">{isMobile ? 'AU' : 'Australia'}</option>
      </select>
      <div style={{ position: 'absolute', left: isMobile ? 7 : 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        {countrySwitching
          ? <Loader2 size={14} className="spin" color={COLORS.muted} />
          : <CountryFlag country={publicCountry} size={14} />}
      </div>
      <ChevronDown
        size={13}
        style={{ position: 'absolute', right: isMobile ? 5 : 8, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, pointerEvents: 'none' }}
      />
    </div>
  );

  return (
    <>
      {/* Only ever set when calculate.js's public daily limit blocked the
          request -- which only happens with no companyId, so this never
          shows inside a company's own embedded widget. */}
      {limitReached && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
          onClick={() => setLimitReached(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: '36px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <AlertCircle size={26} color="#dc2626" strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Daily limit reached</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
              This tool is limited to 1 free estimate a day. Want unlimited calculations for your business?
            </p>
            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 12, padding: '16px 18px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Zap size={15} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Clean Estimator — Internal Pricing Tool</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, margin: 0 }}>
                Unlimited calculations, instant results on screen — 30 days free.
              </p>
            </div>
            <a
              href="/estimator"
              style={{ display: 'block', background: '#2563eb', color: 'white', padding: '13px 0', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15, marginBottom: 12 }}
            >
              See Clean Estimator →
            </a>
            <button
              onClick={() => setLimitReached(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Only shown to the account owner (skipLeadCapture -- see the
          catch block above), never on the embedded widget a stranger
          might be using. */}
      {subscriptionPaused && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
          onClick={() => setSubscriptionPaused(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: '36px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <AlertCircle size={26} color="#d97706" strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Calculator paused</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
              Your trial has ended or your subscription needs attention, so your calculator is paused. Subscribe to turn it back on.
            </p>
            <a
              href="/company?tab=settings&section=subscription"
              style={{ display: 'block', background: '#2563eb', color: 'white', padding: '13px 0', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15, marginBottom: 12 }}
            >
              Go to Subscription →
            </a>
            <button
              onClick={() => setSubscriptionPaused(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!embedded && (
        <Helmet>
          <title>Free Cleaning Cost Calculator 2026 | Clean Estimator</title>
          <meta name="description" content="Free cleaning cost calculator for 2026. Instant ZIP-code specific estimates for house cleaning, carpet, air duct, mold remediation & more. No signup needed." />
          <link rel="canonical" href="https://www.cleanestimator.com/" />
          <meta property="og:site_name" content="Clean Estimator" />
          <meta property="og:title" content="Free Cleaning Cost Calculator 2026 | Clean Estimator" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.cleanestimator.com/" />
          <meta property="og:image" content="https://www.cleanestimator.com/og-image.png" />
          <meta property="og:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@CleanEstimator" />
          <meta name="twitter:title" content="Free Cleaning Cost Calculator 2026 | Clean Estimator" />
          <meta name="twitter:image" content="https://www.cleanestimator.com/og-image.png" />
          <meta name="twitter:image:alt" content="Clean Estimator — Free Cleaning Cost Estimator" />
        </Helmet>
      )}

      <div style={{
        background: embedded ? 'white' : COLORS.surfaceMuted,
        fontFamily: fontFamily ? getFontStack(fontFamily) : undefined,
      }}>
        {/* Hero (non-embedded only) -- full-bleed dark band the calculator
            card sinks into, instead of a plain badge/title on a light page
            background. */}
        {!embedded && currentStep === 'service' && (
          <div className="calc-hero-band">
            <div className="calc-hero-glow" aria-hidden="true" />
            <div className="calc-hero">
              <div className="calc-hero__badge">Free • Instant • No signup required</div>
              <h1 className="calc-hero__title">Free Cleaning Cost Calculator — Get an Estimate</h1>
              <p className="calc-hero__subtitle">Instant, ZIP-code accurate cleaning cost estimates for house cleaning, deep cleaning, move-out, carpet, air duct, mold remediation &amp; more.</p>
            </div>
          </div>
        )}

        {/* This 16px/28px side-and-bottom padding is breathing room from the
            PAGE background -- right for the public homepage (no card of its
            own around this) and for a genuinely narrow third-party embed
            (which gets 0 here instead, handled below). But it's wrong
            wherever a caller already supplies its own outer card (passes
            cardRadius -- RunEstimateTab's Calculator Mode, BrandingTab's
            Widget Mode preview, and the 4 embedded siteLanding landing
            pages): that caller's wrapper already IS the breathing room
            from the page, so adding this on top left a 16px gap of the
            caller's own background between its rounded wrapper and this
            card's own (now correctly radius-matched) edge -- a notch at
            the top corners and a visible sliver down both full sides,
            confirmed pixel-for-pixel against a live screenshot (the user's
            report, repeated three times, always on the left/right, never
            top/bottom -- this padding is literally `0 16px 28px`, zero on
            top). The two previous fixes (contrast, then corner radius)
            were each real and still correct, but neither was this: this
            padding is the actual source of the gap itself. */}
        <div style={{ padding: (embedded && !isWideEmbedded) || cardRadius != null ? 0 : '0 16px 28px' }}>
        {/* Calculator card. maxWidth only applies when NOT embedded (the
            main site/dashboard, where nothing else constrains how wide this
            could stretch on a big monitor) -- when embedded, the iframe's
            own width IS the host site's deliberate choice (that's what a
            real <iframe width="100%"> embed means), so capping it here too
            fought that choice: a host giving the widget more than 720px of
            room (a full-width content section, not the narrower sidebar-ish
            embeds this cap was sized for) got a floating 720px form
            centered in all that extra space instead of using it, which read
            as one big card with oversized gutters since both are plain
            white with nothing to visually tell them apart. */}
        <div ref={cardRef} style={{
          maxWidth: embedded ? undefined : 720,
          margin: embedded ? '0 auto' : (currentStep === 'service' ? `${isMobile ? -32 : -72}px auto 0` : '14px auto 0'),
          position: 'relative',
          background: COLORS.surface,
          borderRadius: resolvedCardRadius,
          boxShadow: embedded ? 'none' : SHADOWS.lg,
          overflow: 'hidden',
          border: embedded ? 'none' : `1px solid ${COLORS.border}`,
        }}>
          {/* Progress bar -- first child inside the card, so it's the one
              that sits flush against the card's own rounded top corners
              (own matching borderTopLeft/RightRadius below, belt-and-
              suspenders alongside the card's overflow:hidden clip).
              Reported twice as "the header background doesn't quite reach
              the edge of the frame" -- confirmed via the actual rendered
              DOM (not just a screenshot) that this div's edge really does
              sit flush with the card's border at every width from 375px
              to 1440px, so it isn't a layout gap. The real cause: the
              card's own box-shadow (SHADOWS.lg -- a large, soft 60px-blur
              halo) extends well past the card's edges on every side, and
              this div's old fill (COLORS.surfaceMuted, #f8fafc, only 2-4
              RGB values off pure white) was close enough in lightness to
              that shadow halo that the eye couldn't tell where the flat
              fill actually ended and the soft shadow blur beyond the
              card's real border began -- the card's border is the true
              edge, but with that little contrast either side of it, the
              edge reads as fuzzy/uncertain instead of a confident line.
              Using a visibly darker gray here (not COLORS.surfaceMuted,
              and deliberately not changing that shared token -- it's used
              in 7 files well beyond this one calculator card) gives the
              fill enough contrast against both the white card body and
              the shadow halo that the eye reads it as a clearly bounded
              bar terminating right at the border, with no change to the
              actual layout. Separately (reported from Calculator Mode and
              Widget Mode, not the public homepage): this corner radius
              must track the card's own resolvedCardRadius, not a bare
              `embedded ? 0 : 10` -- see the resolvedCardRadius comment
              near the top of this component for why a caller-supplied
              rounded wrapper needs this to match. */}
          {currentStep !== 'service' && currentStep !== 'results' && (
            <div style={{ background: '#eef2f6', borderBottom: `1px solid ${COLORS.border}`, borderTopLeftRadius: resolvedCardRadius, borderTopRightRadius: resolvedCardRadius, padding: (embedded && !isWideEmbedded) || isMobile ? '16px 12px' : '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                {steps.map((step, i) => (
                  <span key={step} style={{
                    fontSize: 12, fontWeight: 600,
                    color: i <= progressStep ? primaryColor : COLORS.muted,
                  }}>
                    {labelForStep(step)}
                  </span>
                ))}
              </div>
              <div style={{ height: 4, background: COLORS.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(progressStep / (steps.length - 1)) * 100}%`,
                  background: primaryColor,
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.dangerMuted, borderBottom: `1px solid ${COLORS.dangerBorder}`, padding: (embedded && !isWideEmbedded) || isMobile ? '11px 12px' : '11px 24px', color: COLORS.danger, fontSize: 13.5 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: isMobile ? '20px 12px' : embedded && !isWideEmbedded ? '20px 12px' : '32px 40px' }}>
            {/* skipLeadCapture callers (see its own comment) are
                RunEstimateTab.js -- the dashboard's internal "Run an
                Estimate" tool for our own paying subscribers -- so it's fine
                to show this same refreshed-pricing reassurance about our own
                data quality there. siteLanding is the public homepage's 3
                landing-page twins (CalculatorPage/EstimatorPage/
                ServiceCalculatorPage), our own pages too even though they
                don't set skipLeadCapture (they went back to the normal
                lead-capture flow, Oct 2026 -- see showInstantResults' own
                comment). The other embedded=true callers (EmbedWrapper.js's
                real third-party embeds, BrandingTab.js's live preview) stay
                excluded -- that message would be confusing on someone
                else's site. */}
            {(!embedded || skipLeadCapture || siteLanding) && currentStep === 'service' && <PricingUpdateNotice country={country} />}
            {currentStep === 'service' && (
              <div style={{ position: 'relative' }}>
                <ServiceSelect onSelect={handleServiceSelect} primaryColor={primaryColor} companyName={companyName} ctaHeadline={companyConfig?.ctaHeadline} ctaHeadlineEnabled={companyConfig?.ctaHeadlineEnabled} services={companyConfig?.services} embedded={embedded} isMobile={isMobile} country={country} countrySelector={countrySelectorNode} />
                {/* Covers the grid for handleCountrySwitch's short window --
                    the grid underneath re-renders with the new country's
                    labels (Flat Cleaning vs. Apartment Cleaning, etc.)
                    instantly, but showing that mid-swap read as a flicker,
                    not a deliberate switch. This gives it the same
                    unmistakable "something just changed" beat the dashboard
                    gets for free from its own save-in-flight + remount. */}
                {showCountrySelector && countrySwitching && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 10, borderRadius: RADIUS.md, zIndex: 5,
                  }}>
                    <Loader2 size={22} className="spin" color={primaryColor} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.body }}>
                      Switching to {COUNTRY_NAMES[publicCountry] || publicCountry}…
                    </span>
                  </div>
                )}
              </div>
            )}
            {currentStep === 'location' && (
              <LocationStep
                value={location}
                onBack={goBack}
                onNext={handleLocationNext}
                primaryColor={primaryColor}
                serviceStates={companyConfig?.serviceStates || []}
                serviceCities={companyConfig?.serviceCities || {}}
                country={country}
              />
            )}
            {DetailComponent && (
              <DetailComponent
                value={serviceDetails}
                onBack={goBack}
                onNext={handleDetailsNext}
                primaryColor={primaryColor}
                location={location}
                companyConfig={companyConfig}
                country={country}
                isFinalStep={!enableLead && !askUserType}
                loading={!enableLead && !askUserType && loading}
              />
            )}
            {currentStep === 'lead' && (
              <LeadCaptureStep
                onBack={goBack}
                onNext={handleLeadNext}
                loading={loading}
                primaryColor={primaryColor}
                customQuestions={customQuestions}
                companyConfig={companyConfig}
              />
            )}
            {currentStep === 'usertype' && (
              <UserTypeStep
                onBack={goBack}
                onNext={handleUserTypeNext}
                loading={loading}
                primaryColor={primaryColor}
              />
            )}
          </div>
        </div>

        {/* Trust bar */}
        {!embedded && currentStep === 'service' && (
          <div style={{ maxWidth: 720, margin: '20px auto 0', display: 'flex', justifyContent: 'center', rowGap: 10, columnGap: 28, flexWrap: 'wrap' }}>
            {[
              // "All 50 states" is US-specific (and wrong once a visitor
              // picks a different country via showCountrySelector) --
              // "Nationwide coverage" reads correctly for all four without
              // needing each country's own region count threaded in here.
              // Service count is derived from SERVICE_STEPS itself, not
              // typed out, so this can't go stale the next time a service
              // is added (see this repo's standing "don't hardcode a
              // specific service count" rule -- the exact failure mode that
              // made the old "10 services" claim wrong once this calculator
              // grew to 12).
              { Icon: MapPin,    label: country === 'US' ? 'All 50 states' : 'Nationwide coverage', color: '#059669' },
              { Icon: BarChart3, label: `${Object.keys(SERVICE_STEPS).length} service types`, color: '#2563eb' },
              { Icon: Zap,       label: 'Instant results',   color: '#ea580c' },
            ].map(({ Icon, label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.body, fontWeight: 500 }}>
                <Icon size={14} color={color} /> {label}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
