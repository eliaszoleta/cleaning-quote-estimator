import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabase';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import ServiceCalculatorPage, { calculatorSlugFor } from './components/pages/ServiceCalculatorPage';
import { getAllServices } from './data/services';
import { initMetaPixel } from './utils/metaPixel';
import { initNextdoorPixel } from './utils/nextdoorPixel';
import './App.css';

// Route-specific screens are code-split so a visitor to any one page (most
// often the homepage) only downloads that page's JS instead of the entire
// site -- dashboard, admin panels, blog engine, demo-site gallery, and every
// other page's code bundled together. Before this, all of it shipped in one
// ~380KB gzipped main.js that had to finish downloading and executing before
// the prerendered static HTML (see scripts/prerender.js) got replaced by the
// real app, which is exactly the "plain page, then a beat later the real
// site" flash visitors were seeing -- the swap couldn't happen any faster
// than that whole bundle could load. Header/Footer and ServiceCalculatorPage
// stay eager: the first two render on nearly every route anyway, and
// ServiceCalculatorPage's calculatorSlugFor export has to run synchronously
// above, before first render, which a lazy() wrapper can't provide.
const CleaningCalculator = lazy(() => import('./components/calculator/CleaningCalculator'));
const ResultsScreen = lazy(() => import('./components/calculator/ResultsScreen'));
const CompanyDashboard = lazy(() => import('./components/dashboard/CompanyDashboard'));
const AuthPage = lazy(() => import('./components/dashboard/AuthPage'));
const ResetPasswordPage = lazy(() => import('./components/dashboard/ResetPasswordPage'));
const AdminPartners = lazy(() => import('./components/admin/AdminPartners'));
const AdminCompanies = lazy(() => import('./components/admin/AdminCompanies'));
const AdminHomepageLeads = lazy(() => import('./components/admin/AdminHomepageLeads'));
const ClientPortal = lazy(() => import('./components/client/ClientPortal'));
const SEOContent = lazy(() => import('./components/ui/SEOContent'));
const BlogIndex = lazy(() => import('./components/blog/BlogIndex'));
const BlogPost = lazy(() => import('./components/blog/BlogPost'));
const BlogCategory = lazy(() => import('./components/blog/BlogCategory'));
const CompanyLanding = lazy(() => import('./components/pages/CompanyLanding'));
const PartnerWithUs = lazy(() => import('./components/pages/PartnerWithUs'));
const WebsiteSubscription = lazy(() => import('./components/pages/WebsiteSubscription'));
const DemoGallery = lazy(() => import('./components/demo-sites/DemoGallery'));
const DemoSitePage = lazy(() => import('./components/demo-sites/DemoSitePage'));
const PartnerCityPricing = lazy(() => import('./components/pages/PartnerCityPricing'));
const PartnerDemoPage = lazy(() => import('./components/pages/PartnerDemoPage'));
const BuyCityPlacement = lazy(() => import('./components/pages/BuyCityPlacement'));
const PartnerCheckoutSuccess = lazy(() => import('./components/pages/PartnerCheckoutSuccess'));
const About = lazy(() => import('./components/pages/About'));
const Founder = lazy(() => import('./components/pages/Founder'));
const Contact = lazy(() => import('./components/pages/Contact'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/pages/TermsOfService'));
const ServicePage = lazy(() => import('./components/pages/ServicePage'));
const StatePage = lazy(() => import('./components/pages/StatePage'));
const CityPage = lazy(() => import('./components/pages/CityPage'));
const CalculatorPage = lazy(() => import('./components/pages/CalculatorPage'));
const EstimatorPage = lazy(() => import('./components/pages/EstimatorPage'));
const MethodologyPage = lazy(() => import('./components/pages/MethodologyPage'));
const EmbedWrapper = lazy(() => import('./components/EmbedWrapper'));

// Shown only for the brief window (usually one animation frame or two)
// between a lazy chunk being requested and it arriving -- every route that
// uses this already has real content on screen already (the prerendered
// static HTML, or the previous page before a client-side nav), so this never
// needs to look like a real loading state.
function PageFallback() {
  return (
    <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
      Loading&hellip;
    </div>
  );
}

const pathname = window.location.pathname.replace(/\/$/, '') || '/';
const searchParams = new URLSearchParams(window.location.search);

const isEmbed = pathname.startsWith('/embed');
const isResults = pathname === '/results';
const isCompany = pathname === '/company' || pathname.startsWith('/company');
const isEstimatorLanding = pathname === '/estimator';
const isOldForCompanies = pathname === '/for-companies';
const isBlog = pathname === '/blog' || pathname.startsWith('/blog/');
const isAbout = pathname === '/about';
const isFounder = pathname === '/founder';
const isContact = pathname === '/contact';
const isPrivacy = pathname === '/privacy-policy';
const isTerms = pathname === '/terms-of-service';
const isAdminPartners = pathname === '/admin/partners';
const isAdminCompanies = pathname === '/admin/companies';
const isAdminHomepageLeads = pathname === '/admin/leads';
const isClientPortal = pathname === '/client' || pathname.startsWith('/client');
const isPartnerWithUs = pathname === '/partner-with-us';
const isWebsiteSubscription = pathname === '/website-for-cleaning-companies';
const isDemoGallery = pathname === '/website-example';
const demoSiteMatch = pathname.match(/^\/website-example\/([a-z0-9-]+)(?:\/(about|services|service-areas|contact))?$/);
const isPartnerCityPricing = pathname === '/partner-city-pricing';
const isPartnerDemo = pathname === '/partner-demo';
const isBuyCityPlacementSuccess = pathname === '/buy-city-placement/success';
const isBuyCityPlacement = pathname === '/buy-city-placement';
const isServicePage = pathname.startsWith('/cleaning-services/');
const isCityPage = pathname.startsWith('/cleaning-cost/city/');
const isStatePage = pathname.startsWith('/cleaning-cost/') && !isCityPage;
const isCalculatorPage = pathname === '/cleaning-cost-calculator';
const isEstimatorPage = pathname === '/cleaning-cost-estimator';
const isMethodologyPage = pathname === '/how-we-calculate-prices';
const isServiceCalculatorPage = getAllServices().some(s => pathname === '/' + calculatorSlugFor(s));

const embedCompanyId = isEmbed ? searchParams.get('company') : null;

function BlogRouter() {
  if (pathname === '/blog') return <BlogIndex />;
  if (pathname.startsWith('/blog/category/')) {
    return <BlogCategory category={pathname.replace('/blog/category/', '')} />;
  }
  if (pathname.startsWith('/blog/')) {
    return <BlogPost slug={pathname.replace('/blog/', '')} />;
  }
  return <BlogIndex />;
}

function ResultsPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) setData(JSON.parse(decodeURIComponent(escape(atob(hash)))));
    } catch {}
  }, []);

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
      Report not found. <a href="/" style={{ marginLeft: 8, color: '#2563eb' }}>Start a new estimate →</a>
    </div>
  );

  return (
    <div className="app">
      <Header />
      <main>
        <Suspense fallback={<PageFallback />}>
          <ResultsScreen
            result={data.r}
            serviceDetails={data.d}
            companyConfig={null}
            embedded={false}
            onReset={() => { window.location.href = '/'; }}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isCompany);
  // Clicking a password-reset email link logs the visitor in with a real
  // (temporary) session -- Supabase fires PASSWORD_RECOVERY for exactly
  // this case, distinct from a normal sign-in. Without tracking it
  // separately, that session would satisfy the `!user` check below and drop
  // the visitor straight into the full dashboard instead of making them set
  // a new password first.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isCompany || !supabase) { setAuthLoading(false); return; }
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(() => { clearTimeout(timeout); setAuthLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Never on /embed -- that route renders inside an iframe on a third-party
  // company's own site, and firing our pixels there would attribute their
  // visitors to our ad accounts.
  useEffect(() => {
    if (!isEmbed) { initMetaPixel(); initNextdoorPixel(); }
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/company';
  };

  // The redirect lives server-side in vercel.json (permanent 301) -- this is
  // just a client-side safety net for local dev / any edge cache gap.
  if (isOldForCompanies) {
    window.location.replace('/estimator' + window.location.search + window.location.hash);
    return null;
  }

  if (isEmbed) return (
    <HelmetProvider>
      <Suspense fallback={<PageFallback />}>
        <EmbedWrapper companyId={embedCompanyId} />
      </Suspense>
    </HelmetProvider>
  );

  if (isResults) return <HelmetProvider><ResultsPage /></HelmetProvider>;

  if (isAdminPartners) return <HelmetProvider><Suspense fallback={<PageFallback />}><AdminPartners /></Suspense></HelmetProvider>;

  if (isAdminCompanies) return <HelmetProvider><Suspense fallback={<PageFallback />}><AdminCompanies /></Suspense></HelmetProvider>;

  if (isAdminHomepageLeads) return <HelmetProvider><Suspense fallback={<PageFallback />}><AdminHomepageLeads /></Suspense></HelmetProvider>;

  if (isClientPortal) return <HelmetProvider><Suspense fallback={<PageFallback />}><ClientPortal /></Suspense></HelmetProvider>;

  if (isPartnerWithUs) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><PartnerWithUs /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  // No Header/Footer chrome here on purpose -- these pages simulate
  // separate, standalone customer websites, so cleanestimator.com's own
  // nav/footer would break the illusion (each demo site has its own nav).
  if (isDemoGallery) return (
    <HelmetProvider>
      <Suspense fallback={<PageFallback />}>
        <DemoGallery />
      </Suspense>
    </HelmetProvider>
  );

  if (demoSiteMatch) return (
    <HelmetProvider>
      <Suspense fallback={<PageFallback />}>
        <DemoSitePage slug={demoSiteMatch[1]} page={demoSiteMatch[2]} />
      </Suspense>
    </HelmetProvider>
  );

  if (isWebsiteSubscription) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><WebsiteSubscription /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isPartnerCityPricing) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><PartnerCityPricing /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isPartnerDemo) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><PartnerDemoPage /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isBuyCityPlacementSuccess) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><PartnerCheckoutSuccess /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isBuyCityPlacement) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><BuyCityPlacement /></Suspense></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isEstimatorLanding) return <HelmetProvider><Suspense fallback={<PageFallback />}><CompanyLanding /></Suspense></HelmetProvider>;

  if (isBlog) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><BlogRouter /></Suspense></main><Footer /></div></HelmetProvider>;

  if (isAbout) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><About /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isFounder) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><Founder /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isContact) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><Contact /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isPrivacy) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><PrivacyPolicy /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isTerms) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><TermsOfService /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isServicePage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><ServicePage slug={pathname.replace('/cleaning-services/', '')} /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isCityPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><CityPage slug={pathname.replace('/cleaning-cost/city/', '')} /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isStatePage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><StatePage slug={pathname.replace('/cleaning-cost/', '')} /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isCalculatorPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><CalculatorPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isEstimatorPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><EstimatorPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isMethodologyPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><MethodologyPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isServiceCalculatorPage) return <HelmetProvider><div className="app"><Header /><main><ServiceCalculatorPage slug={pathname.slice(1)} /></main><Footer /></div></HelmetProvider>;

  if (isCompany) {
    // No page-specific <title> existed here before -- every state fell back
    // to index.html's generic site-wide title, leaving Google to guess a
    // label for this page in search results (the same gap that made /client
    // show up as a sitelink titled "Back"). noindex since a login gate has
    // no content value to a searcher.
    const companyHelmet = (
      <Helmet>
        <title>Company Login | Clean Estimator</title>
        <meta name="description" content="Log in to your Clean Estimator company dashboard to manage your embedded calculator and leads." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
    );

    if (authLoading) return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'white', fontSize: 16 }}>Loading...</div>
      </div>
    );
    if (!user && !supabase) return (
      <HelmetProvider>
        {companyHelmet}
        <div className="app"><Header /><main style={{ padding: 40, textAlign: 'center' }}>
          <h2>Supabase not configured</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable authentication.</p>
        </main><Footer /></div>
      </HelmetProvider>
    );
    if (passwordRecovery) return <HelmetProvider>{companyHelmet}<Suspense fallback={<PageFallback />}><ResetPasswordPage onDone={() => setPasswordRecovery(false)} /></Suspense></HelmetProvider>;
    if (!user) return <HelmetProvider>{companyHelmet}<Suspense fallback={<PageFallback />}><AuthPage onAuth={setUser} /></Suspense></HelmetProvider>;
    return <HelmetProvider>{companyHelmet}<Suspense fallback={<PageFallback />}><CompanyDashboard user={user} onLogout={handleLogout} /></Suspense></HelmetProvider>;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <link rel="canonical" href="https://www.cleanestimator.com/" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Clean Estimator — Free Cleaning Cost Estimator",
          "url": "https://www.cleanestimator.com/",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": "Free cleaning cost estimator for US homeowners and businesses. Instant ZIP-code specific estimates for house cleaning, carpet cleaning, air duct cleaning, mold remediation, and more."
        })}</script>
      </Helmet>
      <div className="app">
        <Header />
        <main>
          <Suspense fallback={<PageFallback />}>
            <CleaningCalculator />
            <SEOContent />
          </Suspense>
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}
