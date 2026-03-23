import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, MapPin, BarChart3, ShieldOff, Zap } from 'lucide-react';
import { postCalculate } from '../../utils/api';
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

const PROGRESS_LABELS = ['Service', 'Location', 'Details', 'Your Info', 'Results'];

export default function CleaningCalculator({ companyConfig = null, embedded = false }) {
  const [serviceType, setServiceType] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [location, setLocation] = useState({ zip: '', state: '' });
  const [serviceDetails, setServiceDetails] = useState({});
  const [leadInfo, setLeadInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = serviceType ? SERVICE_STEPS[serviceType] : ['service'];
  const currentStep = steps[stepIndex];

  // Pre-select service from URL param
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('service');
    if (param && SERVICE_STEPS[param]) {
      setServiceType(param);
      setStepIndex(1);
    }
  }, []);

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
      const res = await postCalculate({
        serviceType,
        zip: location.zip || null,
        state: location.state || null,
        serviceDetails,
        companyId: companyConfig?.companyId || null,
        leadInfo: lead?.email ? lead : null,
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

  // Results page
  if (currentStep === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        serviceDetails={serviceDetails}
        companyConfig={companyConfig}
        embedded={embedded}
        onReset={handleReset}
      />
    );
  }

  const DetailComponent = DETAIL_STEP_COMPONENT[currentStep];

  return (
    <>
      {!embedded && (
        <Helmet>
          <title>Free Cleaning Cost Estimator 2026 | Clean Estimator</title>
          <meta name="description" content="Get instant, accurate cleaning cost estimates for your home, apartment, or business. Compare prices by ZIP code across all 50 states." />
          <meta property="og:site_name" content="Clean Estimator" />
          <meta property="og:title" content="Free Cleaning Cost Estimator 2026 | Clean Estimator" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.cleanestimator.com/" />
          <meta name="twitter:title" content="Free Cleaning Cost Estimator 2026 | Clean Estimator" />
        </Helmet>
      )}

      <div style={{
        background: embedded ? 'white' : 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 100%)',
        minHeight: embedded ? 'auto' : '100vh',
        padding: embedded ? '0' : '40px 16px',
      }}>
        {/* Hero (non-embedded only) */}
        {!embedded && currentStep === 'service' && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Free • Instant • No signup required
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 16 }}>
              How Much Does Cleaning Cost<br />
              <span style={{ color: primaryColor }}>In Your Area?</span>
            </h1>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>
              Get an accurate, ZIP-code specific estimate for any cleaning service in seconds.
            </p>
          </div>
        )}

        {/* Calculator card */}
        <div style={{
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
          <div style={{ padding: embedded ? '20px 16px' : '32px 40px' }}>
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
