import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Loader2, Zap } from 'lucide-react';
import { supabase } from './lib/supabase';
import { postCheckout } from './utils/api';
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
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ClientPortal = lazy(() => import('./components/client/ClientPortal'));
const SEOContent = lazy(() => import('./components/ui/SEOContent'));
const BlogIndex = lazy(() => import('./components/blog/BlogIndex'));
const BlogPost = lazy(() => import('./components/blog/BlogPost'));
const BlogCategory = lazy(() => import('./components/blog/BlogCategory'));
const CompanyLanding = lazy(() => import('./components/pages/CompanyLanding'));
const PartnerWithUs = lazy(() => import('./components/pages/PartnerWithUs'));
const WebsiteSubscription = lazy(() => import('./components/pages/WebsiteSubscription'));
const WebsiteApproval = lazy(() => import('./components/pages/WebsiteApproval'));
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
const StartCleaningBusinessIndex = lazy(() => import('./components/pages/StartCleaningBusinessIndex'));
const StartCleaningBusinessStatePage = lazy(() => import('./components/pages/StartCleaningBusinessStatePage'));
const CityPage = lazy(() => import('./components/pages/CityPage'));
const CalculatorPage = lazy(() => import('./components/pages/CalculatorPage'));
const EstimatorPage = lazy(() => import('./components/pages/EstimatorPage'));
const MethodologyPage = lazy(() => import('./components/pages/MethodologyPage'));
const BookingPage = lazy(() => import('./components/pages/BookingPage'));
const CancelBookingPage = lazy(() => import('./components/pages/CancelBookingPage'));
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

// Supabase's email-confirmation link redirects back here with
// #...&type=signup in the URL hash (distinct from the #...&type=recovery
// used for password resets, already handled below via the
// PASSWORD_RECOVERY auth event) -- read synchronously, before
// supabase-js's detectSessionInUrl consumes and clears the hash, so this
// only ever fires on the actual confirmation-link visit, never on a later
// /company page load with the same still-active session.
const isEmailConfirmation = pathname === '/company' && /type=signup/.test(window.location.hash);

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
// One consolidated dashboard (tabs, not separate pages/logins) now serves
// all of these -- /admin and every legacy sub-path still work as direct
// links, each just opening the shell on the matching tab instead of its
// own standalone page.
const ADMIN_TAB_SLUGS = ['website-requests', 'leads', 'companies', 'partners', 'email-marketing', 'booking'];
const isAdminDashboard = pathname === '/admin' || pathname.startsWith('/admin/');
const adminInitialTab = (() => {
  const slug = pathname.replace(/^\/admin\/?/, '');
  return ADMIN_TAB_SLUGS.includes(slug) ? slug : 'website-requests';
})();
const isClientPortal = pathname === '/client' || pathname.startsWith('/client');
const isPartnerWithUs = pathname === '/partner-with-us';
const isWebsiteSubscription = pathname === '/website-for-cleaning-companies';
const websiteApprovalMatch = pathname.match(/^\/website-approval\/([a-f0-9]+)$/);
const isDemoGallery = pathname === '/website-example';
const demoSiteMatch = pathname.match(/^\/website-example\/([a-z0-9-]+)(?:\/(about|services|service-areas|contact)(?:\/([a-z0-9-]+))?)?$/);
const isPartnerCityPricing = pathname === '/partner-city-pricing';
const isPartnerDemo = pathname === '/partner-demo';
const isBuyCityPlacementSuccess = pathname === '/buy-city-placement/success';
const isBuyCityPlacement = pathname === '/buy-city-placement';
const isServicePage = pathname.startsWith('/cleaning-services/');
const isCityPage = pathname.startsWith('/cleaning-cost/city/');
const isStatePage = pathname.startsWith('/cleaning-cost/') && !isCityPage;
const isStartBusinessIndex = pathname === '/start-a-cleaning-business';
const isStartBusinessState = pathname.startsWith('/start-a-cleaning-business/');
const isCalculatorPage = pathname === '/cleaning-cost-calculator';
const isEstimatorPage = pathname === '/cleaning-cost-estimator';
const isMethodologyPage = pathname === '/how-we-calculate-prices';
const isBookACall = pathname === '/book-a-call';
const isCancelBooking = pathname === '/cancel-booking';
const isServiceCalculatorPage = getAllServices().some(s => pathname === '/' + calculatorSlugFor(s));

const embedCompanyId = isEmbed ? searchParams.get('company') : null;

// UK/Canada/Australia each get their own fully separate blog section
// (/blog/uk, /blog/ca, /blog/au) rather than a country field mixed into the
// one US list at /blog -- see blogRegistry.js's comment on why that
// separation is deliberate. These country prefixes must be checked BEFORE
// the generic '/blog/category/' and '/blog/' fallbacks below, since e.g.
// '/blog/uk' and '/blog/uk/category/carpet' both start with '/blog/' too
// and would otherwise be swallowed by the US BlogPost/BlogCategory routes
// (treating "uk" as a post slug).
const COUNTRY_BLOG_KEYS = ['uk', 'ca', 'au'];

function BlogRouter() {
  if (pathname === '/blog') return <BlogIndex />;

  for (const key of COUNTRY_BLOG_KEYS) {
    const base = `/blog/${key}`;
    if (pathname === base) return <BlogIndex country={key} />;
    if (pathname.startsWith(`${base}/category/`)) {
      return <BlogCategory country={key} category={pathname.replace(`${base}/category/`, '')} />;
    }
    if (pathname.startsWith(`${base}/`)) {
      return <BlogPost country={key} slug={pathname.replace(`${base}/`, '')} />;
    }
  }

  if (pathname.startsWith('/blog/category/')) {
    return <BlogCategory category={pathname.replace('/blog/category/', '')} />;
  }
  if (pathname.startsWith('/blog/')) {
    return <BlogPost slug={pathname.replace('/blog/', '')} />;
  }
  return <BlogIndex />;
}

// A brand-new account confirming its email lands back on /company with a
// session already established by supabase-js -- this gives that visit the
// same "straight to Stripe Checkout" treatment AuthPage.js gives a signup
// that didn't need email confirmation, so every new company goes through
// checkout before ever seeing the dashboard, regardless of which signup
// path their Supabase project is configured for. Falls through to the
// normal dashboard (via onDone) if creating the checkout session fails,
// rather than stranding a just-confirmed account on an error -- same
// fallback AuthPage.js uses.
//
// Deliberately does NOT auto-redirect to Checkout on mount anymore -- it
// used to, but that gave someone who just clicked a "confirm your email"
// link no time to even read "last step" before being bounced to Stripe,
// and anyone who then backed out/closed that tab was left on a page that
// looked unfinished with no way back to it. Now it waits for an explicit
// click before creating the checkout session and redirecting.
function ActivateAfterConfirm({ onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { onDone(); return; }
      const res = await postCheckout(token);
      window.location.href = res.url;
    } catch (err) {
      setLoading(false);
      setError(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -160, right: -100, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} aria-hidden="true" />
      <div style={{ background: 'white', borderRadius: 22, padding: '52px 44px', maxWidth: 420, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          {loading ? <Loader2 size={32} color="#2563eb" strokeWidth={1.8} className="spin" /> : <Zap size={30} color="#2563eb" strokeWidth={1.8} />}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>Last step — activate your calculator</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
          Email confirmed. When you're ready, we'll take you to a secure checkout page to activate Clean Estimator.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, margin: '14px 0 22px' }}>
          <Zap size={13} /> 30 days free, then $25/month
        </div>
        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
            Something went wrong starting checkout. Please try again.
          </p>
        )}
        <button
          type="button"
          onClick={handleActivate}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {loading ? 'Taking you to checkout…' : 'Activate my calculator'}
        </button>
      </div>
    </div>
  );
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
  // Set once ActivateAfterConfirm has run (either it sent the browser to
  // Stripe and this never gets read again, or creating the checkout
  // session failed and this lets the normal dashboard render instead of
  // retrying on every re-render).
  const [skipActivation, setSkipActivation] = useState(false);

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

  if (isAdminDashboard) return <HelmetProvider><Suspense fallback={<PageFallback />}><AdminDashboard initialTab={adminInitialTab} /></Suspense></HelmetProvider>;

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
        <DemoSitePage slug={demoSiteMatch[1]} page={demoSiteMatch[2]} subSlug={demoSiteMatch[3]} />
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

  if (websiteApprovalMatch) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><Suspense fallback={<PageFallback />}><WebsiteApproval token={websiteApprovalMatch[1]} /></Suspense></main>
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

  if (isStartBusinessState) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><StartCleaningBusinessStatePage slug={pathname.replace('/start-a-cleaning-business/', '')} /></Suspense></main><Footer /></div></HelmetProvider>;

  if (isStartBusinessIndex) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><StartCleaningBusinessIndex /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isCalculatorPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><CalculatorPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isEstimatorPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><EstimatorPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isMethodologyPage) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><MethodologyPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isBookACall) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><BookingPage /></Suspense></main><Footer /></div></HelmetProvider>;
  if (isCancelBooking) return <HelmetProvider><div className="app"><Header /><main><Suspense fallback={<PageFallback />}><CancelBookingPage token={searchParams.get('token') || ''} /></Suspense></main><Footer /></div></HelmetProvider>;
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
    if (isEmailConfirmation && !skipActivation) return <HelmetProvider>{companyHelmet}<ActivateAfterConfirm onDone={() => setSkipActivation(true)} /></HelmetProvider>;
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
