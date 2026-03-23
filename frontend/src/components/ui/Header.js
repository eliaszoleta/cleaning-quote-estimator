import React, { useState, useEffect } from 'react';

const styles = {
  header: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
  },
  logoIcon: {
    width: 34,
    height: 34,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 18,
    flexShrink: 0,
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
  cta: {
    background: '#2563eb',
    color: 'white',
    padding: '9px 18px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    marginLeft: 8,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  ctaMobile: {
    background: '#2563eb',
    color: 'white',
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
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
        {/* Logo */}
        <a href="/" style={styles.logo} aria-label="Clean Estimator — Free Cleaning Cost Estimator">
          <span style={styles.logoIcon} aria-hidden="true">✦</span>
          Clean Estimator
        </a>

        {isMobile ? (
          /* ── Mobile: Get Estimator CTA + hamburger ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="/for-companies"
              style={styles.ctaMobile}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; }}
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
          /* ── Desktop nav ── */
          <nav style={styles.nav}>
            {navItems.map(n => (
              <a
                key={n.href}
                href={n.href}
                style={styles.navLink}
                onMouseEnter={e => { e.target.style.color = '#0f172a'; e.target.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent'; }}
              >
                {n.label}
              </a>
            ))}
            <a
              href="/for-companies"
              style={styles.navLink}
              onMouseEnter={e => { e.target.style.color = '#0f172a'; e.target.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent'; }}
            >
              Get Estimator
            </a>
            <a
              href="/company"
              style={styles.cta}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; }}
            >
              Company Login →
            </a>
          </nav>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4, background: 'white' }}>
          {navItems.map(n => (
            <a key={n.href} href={n.href} style={{ ...styles.navLink, display: 'block', padding: '10px 12px' }}>
              {n.label}
            </a>
          ))}
          <a href="/company" style={{ ...styles.cta, display: 'block', textAlign: 'center', marginLeft: 0, marginTop: 8 }}>
            Company Login →
          </a>
        </div>
      )}
    </header>
  );
}
