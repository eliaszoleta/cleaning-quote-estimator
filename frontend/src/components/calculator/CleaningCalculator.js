import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import './CleaningCalculator.css';
import { AlertCircle, MapPin, BarChart3, Zap } from 'lucide-react';
import { postCalculate } from '../../utils/api';
import { getCachedPartnerMatch } from '../../utils/partnerLookup';
import { trackMetaEvent } from '../../utils/metaPixel';
import { trackNextdoorEvent } from '../../utils/nextdoorPixel';
import { getFontStack, getGoogleFontHref } from '../../utils/fonts';
import { COLORS, SHADOWS } from '../../styles/theme';
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
import LeadCaptureStep from './steps/LeadCaptureStep';
import ResultsScreen from './ResultsScreen';
import EstimateSentScreen from './EstimateSentScreen';

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
};

// Maps a step id to its progress-bar label -- indexed by step name rather
// than position, so it stays correct whether or not 'lead' is actually
// present in `steps` (see skipLeadCapture below). Every per-service detail
// step (home/apartment/commercial/...) shares the 'Details' label.
function labelForStep(step) {
  if (step === 'service') return 'Service';
  if (step === 'location') return 'Location';
  if (step === 'lead') return 'Send';
  if (step === 'results') return 'Results';
  return 'Details';
}

export default function CleaningCalculator({ companyConfig = null, embedded = false, initialService = null, siteLanding = false, onShowResults = null, demoPartner = null, skipLeadCapture = false, onShareEmail = null }) {
  const cardRef = useRef(null);
  // Measures the card's own rendered width, not window.innerWidth -- this
  // renders both in a real <iframe width="100%"> embed (where window IS
  // the iframe's own narrow viewport, so innerWidth happened to work) and
  // directly in the dashboard's Branding tab preview (no iframe -- window
  // is the whole desktop browser, so innerWidth stayed "desktop" no matter
  // how narrow the actual preview panel was, giving it a different,
  // uncapped-looking layout than the same widget gets on a real site).
  const [isMobile, setIsMobile] = useState(false);
  const [serviceType, setServiceType] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? initialService : null);
  const [stepIndex, setStepIndex] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? 1 : 0);
  const [location, setLocation] = useState({ zip: '', state: '' });
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

  // Skips the lead-capture step entirely when the company has it disabled
  // (ServicesTab.js's "Enable Lead Capture" toggle) or the caller forces it
  // off (skipLeadCapture -- the dashboard's own "Run an Estimate" tab,
  // where there's no outside visitor to capture). Filtering `steps` itself
  // here is what actually keeps the step unreachable -- a previous version
  // only filtered a separate, display-only array used for the progress bar,
  // so the real lead step still showed up in normal navigation regardless
  // of either toggle.
  const enableLead = !skipLeadCapture && companyConfig?.enableLeadCapture !== false;
  const steps = serviceType
    ? (enableLead ? SERVICE_STEPS[serviceType] : SERVICE_STEPS[serviceType].filter(s => s !== 'lead'))
    : ['service'];
  const currentStep = steps[stepIndex];

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const check = (width) => setIsMobile(width <= 640);
    check(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      check(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
          // separate lookup.
          const partnerMatch = embedded ? null : await getCachedPartnerMatch();
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
        // skipLeadCapture is only ever set by RunEstimateTab.js -- the
        // account owner running their own calculator, not a stranger on
        // the embedded widget -- so only they get the "please subscribe"
        // popup. A visitor on the actual widget still just sees the plain,
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

  const handleDetailsNext = (details) => {
    setServiceDetails(details);
    if (enableLead) {
      goNext();
    } else {
      // No lead step to trigger the calculation from in this flow --
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

  // Results page. On a siteLanding page (our own standalone calculator
  // pages) the wizard steps stay flush/embedded inside the page's own card,
  // but results should look exactly like the homepage's full results screen
  // (its own grey background, its own card, Share/Print/disclaimer outside
  // it) -- only a real third-party embed (EmbedWrapper) needs it flush too.
  //
  // On our own site (not a real third-party embed, and not the
  // partner-recruitment demo page, which needs the real card to show
  // prospects what it looks like) the full breakdown is never shown here --
  // the backend already emails it the moment handleLeadNext's
  // /api/calculate call returns, so showing it immediately on-screen too
  // just made that email redundant and visitors never opened it. This way
  // the email is the one place to see the numbers.
  const showInstantResults = (embedded && !siteLanding) || !!demoPartner;

  if (currentStep === 'results' && result) {
    if (!showInstantResults) {
      return (
        <div style={fontFamily ? { fontFamily: getFontStack(fontFamily) } : undefined}>
          <EstimateSentScreen
            name={leadInfo?.name}
            email={leadInfo?.email}
            serviceType={serviceType}
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
          onShareEmail={onShareEmail ? (email, clientName) => onShareEmail({ to: email, clientName, serviceType, zip: location.zip || null, state: location.state || null, serviceDetails }) : undefined}
        />
      </div>
    );
  }

  const DetailComponent = DETAIL_STEP_COMPONENT[currentStep];

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
              This tool is limited to 2 free estimates a day. Want unlimited calculations for your business?
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

        <div style={{ padding: embedded ? 0 : '0 16px 28px' }}>
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
          borderRadius: embedded ? 0 : 10,
          boxShadow: embedded ? 'none' : SHADOWS.lg,
          overflow: 'hidden',
          border: embedded ? 'none' : `1px solid ${COLORS.border}`,
        }}>
          {/* Progress bar */}
          {currentStep !== 'service' && currentStep !== 'results' && (
            <div style={{ background: COLORS.surfaceMuted, borderBottom: `1px solid ${COLORS.border}`, padding: '16px 24px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.dangerMuted, borderBottom: `1px solid ${COLORS.dangerBorder}`, padding: '11px 24px', color: COLORS.danger, fontSize: 13.5 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: embedded ? '20px 12px' : isMobile ? '20px 12px' : '32px 40px' }}>
            {currentStep === 'service' && (
              <ServiceSelect onSelect={handleServiceSelect} primaryColor={primaryColor} companyName={companyName} ctaHeadline={companyConfig?.ctaHeadline} ctaHeadlineEnabled={companyConfig?.ctaHeadlineEnabled} services={companyConfig?.services} embedded={embedded} isMobile={isMobile} />
            )}
            {currentStep === 'location' && (
              <LocationStep
                value={location}
                onBack={goBack}
                onNext={handleLocationNext}
                primaryColor={primaryColor}
                serviceStates={companyConfig?.serviceStates || []}
                serviceCities={companyConfig?.serviceCities || {}}
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
                isFinalStep={!enableLead}
                loading={!enableLead && loading}
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
          </div>
        </div>

        {/* Trust bar */}
        {!embedded && currentStep === 'service' && (
          <div style={{ maxWidth: 720, margin: '20px auto 0', display: 'flex', justifyContent: 'center', rowGap: 10, columnGap: 28, flexWrap: 'wrap' }}>
            {[
              { Icon: MapPin,    label: 'All 50 states',     color: '#059669' },
              { Icon: BarChart3, label: '10 service types',   color: '#2563eb' },
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
