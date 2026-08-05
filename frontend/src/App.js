import React, { useState, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabase';
import CleaningCalculator from './components/calculator/CleaningCalculator';
import ResultsScreen from './components/calculator/ResultsScreen';
import CompanyDashboard from './components/dashboard/CompanyDashboard';
import AuthPage from './components/dashboard/AuthPage';
import AdminPartners from './components/admin/AdminPartners';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import SEOContent from './components/ui/SEOContent';
import BlogIndex from './components/blog/BlogIndex';
import BlogPost from './components/blog/BlogPost';
import BlogCategory from './components/blog/BlogCategory';
import CompanyLanding from './components/pages/CompanyLanding';
import PartnerWithUs from './components/pages/PartnerWithUs';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
import ServicePage from './components/pages/ServicePage';
import StatePage from './components/pages/StatePage';
import EmbedWrapper from './components/EmbedWrapper';
import './App.css';

const pathname = window.location.pathname.replace(/\/$/, '') || '/';
const searchParams = new URLSearchParams(window.location.search);

const isEmbed = pathname.startsWith('/embed');
const isResults = pathname === '/results';
const isCompany = pathname === '/company' || pathname.startsWith('/company');
const isForCompanies = pathname === '/for-companies';
const isBlog = pathname === '/blog' || pathname.startsWith('/blog/');
const isAbout = pathname === '/about';
const isContact = pathname === '/contact';
const isPrivacy = pathname === '/privacy-policy';
const isTerms = pathname === '/terms-of-service';
const isAdminPartners = pathname === '/admin/partners';
const isPartnerWithUs = pathname === '/partner-with-us';
const isServicePage = pathname.startsWith('/cleaning-services/');
const isStatePage = pathname.startsWith('/cleaning-cost/');

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
        <ResultsScreen
          result={data.r}
          serviceDetails={data.d}
          companyConfig={null}
          embedded={false}
          onReset={() => { window.location.href = '/'; }}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isCompany);

  useEffect(() => {
    if (!isCompany || !supabase) { setAuthLoading(false); return; }
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(() => { clearTimeout(timeout); setAuthLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/company';
  };

  if (isEmbed) return (
    <HelmetProvider>
      <EmbedWrapper companyId={embedCompanyId} />
    </HelmetProvider>
  );

  if (isResults) return <HelmetProvider><ResultsPage /></HelmetProvider>;

  if (isAdminPartners) return <HelmetProvider><AdminPartners /></HelmetProvider>;

  if (isPartnerWithUs) return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main><PartnerWithUs /></main>
        <Footer />
      </div>
    </HelmetProvider>
  );

  if (isForCompanies) return <HelmetProvider><CompanyLanding /></HelmetProvider>;

  if (isBlog) return <HelmetProvider><div className="app"><Header /><main><BlogRouter /></main><Footer /></div></HelmetProvider>;

  if (isAbout) return <HelmetProvider><div className="app"><Header /><main><About /></main><Footer /></div></HelmetProvider>;
  if (isContact) return <HelmetProvider><div className="app"><Header /><main><Contact /></main><Footer /></div></HelmetProvider>;
  if (isPrivacy) return <HelmetProvider><div className="app"><Header /><main><PrivacyPolicy /></main><Footer /></div></HelmetProvider>;
  if (isTerms) return <HelmetProvider><div className="app"><Header /><main><TermsOfService /></main><Footer /></div></HelmetProvider>;
  if (isServicePage) return <HelmetProvider><div className="app"><Header /><main><ServicePage slug={pathname.replace('/cleaning-services/', '')} /></main><Footer /></div></HelmetProvider>;
  if (isStatePage) return <HelmetProvider><div className="app"><Header /><main><StatePage slug={pathname.replace('/cleaning-cost/', '')} /></main><Footer /></div></HelmetProvider>;

  if (isCompany) {
    if (authLoading) return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'white', fontSize: 16 }}>Loading...</div>
      </div>
    );
    if (!user && !supabase) return (
      <HelmetProvider>
        <div className="app"><Header /><main style={{ padding: 40, textAlign: 'center' }}>
          <h2>Supabase not configured</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable authentication.</p>
        </main><Footer /></div>
      </HelmetProvider>
    );
    if (!user) return <HelmetProvider><AuthPage onAuth={setUser} /></HelmetProvider>;
    return <HelmetProvider><CompanyDashboard user={user} onLogout={handleLogout} /></HelmetProvider>;
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
          <CleaningCalculator />
          <SEOContent />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}
