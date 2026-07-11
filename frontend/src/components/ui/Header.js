import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const styles = {
  header: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 20px rgba(15,23,42,0.05)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: 20,
    color: '#0f172a',
    flexShrink: 0,
    letterSpacing: '-0.01em',
  },
  logoIcon: {
    width: 34,
    height: 34,
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 3px 10px rgba(30,64,175,0.32), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  nav: { display: 'flex', alignItems: 'center', gap: 4 },
  navLink: {
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: '#475569',
    transition: 'all 0.15s',
  },
  partnerLink: {
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 700,
    color: '#1e40af',
    transition: 'all 0.15s',
  },
  cta: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
    color: 'white',
    padding: '9px 18px',
    borderRadius: 9,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    marginLeft: 8,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 10px rgba(30,64,175,0.24)',
  },
  ctaMobile: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
    color: 'white',
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(30,64,175,0.22)',
  },
};

const navItems = [
  { label: 'Calculator', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <a href="/" style={{ ...styles.logo, fontSize: isMobile ? 16 : 20 }} aria-label="Clean Estimator — Free Cleaning Cost Estimator">
          <span style={styles.logoIcon} aria-hidden="true"><Sparkles size={17} strokeWidth={2.25} /></span>
          {!isMobile && 'Clean Estimator'}
        </a>

        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="/for-companies"
              style={styles.ctaMobile}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(30,64,175,0.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,64,175,0.22)'; }}
            >
              Get Estimator
            </a>
            <button
              onClick={() => setMenuOpen(m => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', fontSize: 22, color: '#0f172a', lineHeight: 1 }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        ) : (
          <nav style={styles.nav}>
            {navItems.map(n => (
              <a
                key={n.href}
                href={n.href}
                style={styles.navLink}
                onMouseEnter={e => { e.target.style.color = '#0f172a'; e.target.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent'; }}
              >
                {n.label}
              </a>
            ))}
            <a
              href="/partner-with-us"
              style={styles.partnerLink}
              onMouseEnter={e => { e.target.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; }}
            >
              Partner With Us
            </a>
            <a
              href="/for-companies"
              style={styles.navLink}
              onMouseEnter={e => { e.target.style.color = '#0f172a'; e.target.style.background = '#f1f5f9'; }}
              onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent'; }}
            >
              Get Estimator
            </a>
            <a
              href="/company"
              style={styles.cta}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,64,175,0.34)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(30,64,175,0.24)'; e.currentTarget.style.transform = 'none'; }}
            >
              Company Login →
            </a>
          </nav>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4, background: 'white' }}>
          {navItems.map(n => (
            <a key={n.href} href={n.href} style={{ ...styles.navLink, display: 'block', padding: '10px 12px' }}>
              {n.label}
            </a>
          ))}
          <a href="/partner-with-us" style={{ ...styles.navLink, display: 'block', padding: '10px 12px', color: '#1e40af', fontWeight: 700 }}>
            Partner With Us
          </a>
          <a href="/company" style={{ ...styles.cta, display: 'block', textAlign: 'center', marginLeft: 0, marginTop: 8 }}>
            Company Login →
          </a>
        </div>
      )}
    </header>
  );
}
