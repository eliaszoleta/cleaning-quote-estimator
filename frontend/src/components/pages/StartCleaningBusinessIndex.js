import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Rocket, ArrowRight } from 'lucide-react';
import { getAllStates } from '../../data/statePricing';
import { BLOG_POSTS } from '../../data/blogPosts';
import './PageHero.css';

export default function StartCleaningBusinessIndex() {
  const states = getAllStates();
  const posts = BLOG_POSTS.filter(p => p.category === 'starting-out');

  const title = 'How to Start a Cleaning Business (2026): Costs, Licensing & State-by-State Guide | Clean Estimator';
  const description = 'Everything you need to start a cleaning business: LLC setup, licensing, insurance, pricing, equipment, and taxes — plus exact LLC filing fees for all 50 states.';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cleanestimator.com' },
      { '@type': 'ListItem', position: 2, name: 'Start a Cleaning Business', item: 'https://www.cleanestimator.com/start-a-cleaning-business' },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://www.cleanestimator.com/start-a-cleaning-business" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-hero-band" style={{ paddingBottom: 88 }}>
          <div className="page-hero-glow" aria-hidden="true" />
          <div className="page-hero-inner" style={{ maxWidth: 880, textAlign: 'left' }}>
            <div className="page-hero-breadcrumb">
              <a href="/">Home</a><span>›</span><span>Start a Cleaning Business</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 880, margin: '-64px auto 0', padding: '0 20px clamp(36px, 7vw, 64px)', position: 'relative' }}>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(20px, 5vw, 36px)', marginBottom: 28, boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Rocket size={18} color="#ea580c" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting Your Business</span>
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4.5vw,36px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 14 }}>How to Start a Cleaning Business</h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7 }}>
              Everything you need to go from idea to your first paid job: business structure, licensing, insurance, pricing, equipment, taxes, contracts, and getting your first clients — plus the exact LLC filing fee for every state.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', borderRadius: 12, padding: '18px 24px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Ready to get online?</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>$5 setup · 2 months free · then $249/mo</div>
            </div>
            <a href="/website-for-cleaning-companies" style={{ background: 'white', color: '#c2410c', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              Get a Free Website →
            </a>
          </div>

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>The Complete Starting-Out Guide</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {posts.map(post => (
                <a key={post.slug} href={`/blog/${post.slug}`} style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fed7aa'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(234,88,12,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{post.readTime}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 8 }}>{post.title}</div>
                  <span style={{ fontSize: 13, color: '#ea580c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Read guide <ArrowRight size={13} /></span>
                </a>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 'clamp(20px, 5vw, 32px)', marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Find Your State's LLC Filing Fee</h2>
            <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 18 }}>LLC filing fees, filing agencies, and state-specific notes for every state.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {states.map(s => (
                <a key={s.code} href={`/start-a-cleaning-business/${s.slug}`} style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '24px 28px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>Not ready to build your own marketing yet?</div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Clean Estimator's Local Partner Program gives one cleaning business per city exclusive, guaranteed lead visibility — no website required to start.</p>
            <a href="/partner-with-us" style={{ background: '#ea580c', color: 'white', padding: '12px 28px', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              See If Your City Is Available →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
