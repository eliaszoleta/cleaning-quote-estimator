import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import './CleaningCalculator.css';
import { AlertCircle, MapPin, BarChart3, ShieldOff, Zap } from 'lucide-react';
import { postCalculate } from '../../utils/api';
import { getCachedPartnerMatch } from '../../utils/partnerLookup';
import ServiceSelect from './steps/ServiceSelect';
import LocationStep from './steps/LocationStep';
import HomeStep from './steps/HomeStep';
import ApartmentStep from './steps/ApartmentStep';
import CommercialStep from './steps/CommercialStep';
import CarpetStep from './steps/CarpetStep';
import AirDuctStep from './steps/AirDuctStep';
import DryerVentStep from './steps/DryerVentStep';
import TileGroutStep from './steps/TileGroutStep';
import MoldStep from './steps/MoldStep';
import WaterDamageStep from './steps/WaterDamageStep';
import LeadCaptureStep from './steps/LeadCaptureStep';
import ResultsScreen from './ResultsScreen';

const SERVICE_STEPS = {
  home_residential: ['service', 'location', 'home', 'lead', 'results'],
  apartment: ['service', 'location', 'apartment', 'lead', 'results'],
  commercial: ['service', 'location', 'commercial', 'lead', 'results'],
  carpet: ['service', 'location', 'carpet', 'lead', 'results'],
  air_duct: ['service', 'location', 'air_duct', 'lead', 'results'],
  dryer_vent: ['service', 'location', 'dryer_vent', 'lead', 'results'],
  tile_grout: ['service', 'location', 'tile_grout', 'lead', 'results'],
  mold_remediation: ['service', 'location', 'mold', 'lead', 'results'],
  water_damage: ['service', 'location', 'water_damage', 'lead', 'results'],
};

const DETAIL_STEP_COMPONENT = {
  home: HomeStep,
  apartment: ApartmentStep,
  commercial: CommercialStep,
  carpet: CarpetStep,
  air_duct: AirDuctStep,
  dryer_vent: DryerVentStep,
  tile_grout: TileGroutStep,
  mold: MoldStep,
  water_damage: WaterDamageStep,
};

const PROGRESS_LABELS = ['Service', 'Location', 'Details', 'Send', 'Results'];

export default function CleaningCalculator({ companyConfig = null, embedded = false, initialService = null, siteLanding = false, onShowResults = null, demoPartner = null }) {
  const cardRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [serviceType, setServiceType] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? initialService : null);
  const [stepIndex, setStepIndex] = useState(() => (initialService && SERVICE_STEPS[initialService]) ? 1 : 0);
  const [location, setLocation] = useState({ zip: '', state: '' });
  const [serviceDetails, setServiceDetails] = useState({});
  const [leadInfo, setLeadInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = serviceType ? SERVICE_STEPS[serviceType] : ['service'];
  const currentStep = steps[stepIndex];

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Pre-select service from URL param (skipped if initialService already set it)
  useEffect(() => {
    if (initialService) return;
    const param = new URLSearchParams(window.location.search).get('service');
    if (param && SERVICE_STEPS[param]) {
      setServiceType(param);
      setStepIndex(1);
    }
  }, [initialService]);

  // Scroll to card on step change, accounting for sticky navbar height
  useEffect(() => {
    if (stepIndex === 0 || !cardRef.current) return;
    const navbarHeight = 70;
    const top = cardRef.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [stepIndex]);

  // Let a siteLanding page's own wrapper drop its fixed white/shadow card
  // once results are showing, since ResultsScreen renders its own full page
  // chrome (grey background, its own card, buttons outside it) that would
  // otherwise get boxed in a second time by that wrapper.
  useEffect(() => {
    onShowResults?.(currentStep === 'results' && !!result);
  }, [currentStep, result, onShowResults]);

  const goNext = () => setStepIndex(i => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));

  const handleServiceSelect = (type) => {
    setServiceType(type);
    setServiceDetails({});
    setResult(null);
    setError(null);
    setStepIndex(1);
  };

  const handleLocationNext = (loc) => {
    setLocation(loc);
    goNext();
  };

  const handleDetailsNext = (details) => {
    setServiceDetails(details);
    goNext();
  };

  const handleLeadNext = async (lead) => {
    setLeadInfo(lead);
    setError(null);
    setLoading(true);
    try {
      // Same match ResultsScreen shows on-page (skipped when embedded, same
      // as ResultsScreen's own guard) -- forwarded so the estimate email can
      // include the same recommended-partner card, not a separate lookup.
      const partnerMatch = embedded ? null : await getCachedPartnerMatch();
      const res = await postCalculate({
        serviceType,
        zip: location.zip || null,
        state: location.state || null,
        serviceDetails,
        companyId: companyConfig?.companyId || null,
        leadInfo: lead?.email ? lead : null,
        partnerInfo: partnerMatch,
      });
      setResult(res.data);
      goNext();
    } catch (err) {
      setError(err.message || 'Calculation failed. Please try again.');
    } finally {
      setLoading(false);
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
  };

  // Branding from companyConfig (or defaults)
  const primaryColor = companyConfig?.primaryColor || '#2563eb';
  const companyName = companyConfig?.companyName || null;
  const enableLead = companyConfig?.enableLeadCapture !== false;
  const customQuestions = companyConfig?.customLeadQuestions || [];

  // If lead capture disabled, skip lead step
  const effectiveSteps = !enableLead
    ? steps.filter(s => s !== 'lead')
    : steps;

  const progressStep = Math.min(stepIndex, 4);

  // Results page. On a siteLanding page (our own standalone calculator
  // pages) the wizard steps stay flush/embedded inside the page's own card,
  // but results should look exactly like the homepage's full results screen
  // (its own grey background, its own card, Share/Print/disclaimer outside
  // it) -- only a real third-party embed (EmbedWrapper) needs it flush too.
  if (currentStep === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        serviceDetails={serviceDetails}
        companyConfig={companyConfig}
        embedded={embedded && !siteLanding}
        onReset={handleReset}
        demoPartner={demoPartner}
      />
    );
  }

  const DetailComponent = DETAIL_STEP_COMPONENT[currentStep];

  return (
    <>
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
        background: embedded ? 'white' : 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 100%)',
        padding: embedded ? '0' : '28px 16px',
      }}>
        {/* Hero (non-embedded only) */}
        {!embedded && currentStep === 'service' && (
          <div className="calc-hero">
            <div className="calc-hero__badge">Free • Instant • No signup required</div>
            <h1 className="calc-hero__title">Free Cleaning Cost Calculator and Estimator</h1>
            <p className="calc-hero__subtitle">Instant, ZIP-code accurate cleaning cost estimates for house cleaning, deep cleaning, move-out, carpet, air duct, mold remediation &amp; more.</p>
          </div>
        )}

        {/* Calculator card */}
        <div ref={cardRef} style={{
          maxWidth: 720,
          margin: '0 auto',
          background: 'white',
          borderRadius: embedded ? 0 : 16,
          boxShadow: embedded ? 'none' : '0 8px 40px rgba(0,0,0,0.10)',
          overflow: 'hidden',
          border: embedded ? 'none' : '1px solid #e2e8f0',
        }}>
          {/* Progress bar */}
          {currentStep !== 'service' && currentStep !== 'results' && (
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                {PROGRESS_LABELS.slice(0, effectiveSteps.length).map((label, i) => (
                  <span key={label} style={{
                    fontSize: 12, fontWeight: 600,
                    color: i <= progressStep ? primaryColor : '#94a3b8',
                  }}>
                    {label}
                  </span>
                ))}
              </div>
              <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(progressStep / (effectiveSteps.length - 1)) * 100}%`,
                  background: primaryColor,
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '11px 24px', color: '#dc2626', fontSize: 13.5 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: embedded ? '20px 16px' : isMobile ? '20px 16px' : '32px 40px' }}>
            {currentStep === 'service' && (
              <ServiceSelect onSelect={handleServiceSelect} primaryColor={primaryColor} companyName={companyName} />
            )}
            {currentStep === 'location' && (
              <LocationStep
                value={location}
                onBack={goBack}
                onNext={handleLocationNext}
                primaryColor={primaryColor}
              />
            )}
            {DetailComponent && (
              <DetailComponent
                value={serviceDetails}
                onBack={goBack}
                onNext={handleDetailsNext}
                primaryColor={primaryColor}
                location={location}
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
          <div style={{ maxWidth: 720, margin: '20px auto 0', display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
            {[
              { Icon: MapPin,    label: 'All 50 states',     color: '#059669' },
              { Icon: BarChart3, label: '9 service types',   color: '#2563eb' },
              { Icon: ShieldOff, label: 'No email required', color: '#7c3aed' },
              { Icon: Zap,       label: 'Instant results',   color: '#ea580c' },
            ].map(({ Icon, label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                <Icon size={14} color={color} /> {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
