import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { supabase } from './lib/supabase';
import CleaningCalculator from './components/calculator/CleaningCalculator';
import ResultsScreen from './components/calculator/ResultsScreen';
import CompanyDashboard from './components/dashboard/CompanyDashboard';
import AuthPage from './components/dashboard/AuthPage';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import SEOContent from './components/ui/SEOContent';
import BlogIndex from './components/blog/BlogIndex';
import BlogPost from './components/blog/BlogPost';
import BlogCategory from './components/blog/BlogCategory';
import CompanyLanding from './components/pages/CompanyLanding';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
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

  // Embed mode — no chrome
  if (isEmbed) return (
    <HelmetProvider>
      <EmbedWrapper companyId={embedCompanyId} />
    </HelmetProvider>
  );

  if (isResults) return <HelmetProvider><ResultsPage /></HelmetProvider>;

  if (isForCompanies) return <HelmetProvider><CompanyLanding /></HelmetProvider>;

  if (isBlog) return <HelmetProvider><div className="app"><Header /><main><BlogRouter /></main><Footer /></div></HelmetProvider>;

  if (isAbout) return <HelmetProvider><div className="app"><Header /><main><About /></main><Footer /></div></HelmetProvider>;
  if (isContact) return <HelmetProvider><div className="app"><Header /><main><Contact /></main><Footer /></div></HelmetProvider>;
  if (isPrivacy) return <HelmetProvider><div className="app"><Header /><main><PrivacyPolicy /></main><Footer /></div></HelmetProvider>;
  if (isTerms) return <HelmetProvider><div className="app"><Header /><main><TermsOfService /></main><Footer /></div></HelmetProvider>;

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

  // Home — public calculator
  return (
    <HelmetProvider>
      <div className="app">
        <Header />
        <main>
          {/* H1 intro — critical for SEO; establishes primary keyword signal for Google */}
          <section style={{ background: 'white', padding: '36px 24px 0', textAlign: 'center' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.025em' }}>
                Free Cleaning Cost Estimator &amp; Calculator
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 14px' }}>
                Instant, ZIP-code accurate cleaning cost estimates for house cleaning, deep cleaning, move-out, carpet, air duct, mold remediation &amp; more. No signup required.
              </p>
              <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12.5, color: '#64748b', paddingBottom: 4 }}>
                {['100% free', 'No signup required', '9 cleaning services', 'All 50 states'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>
          </section>
          <CleaningCalculator />
          <SEOContent />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}
