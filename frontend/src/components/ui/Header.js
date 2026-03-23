import React, { useState } from 'react';

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
  },
};

const navItems = [
  { label: 'Calculator', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <a href="/" style={styles.logo}>
          <span style={styles.logoIcon}>✦</span>
          Clean Estimator
        </a>

        {/* Desktop nav */}
        <nav style={{ ...styles.nav, '@media(max-width:640px)': { display: 'none' } }}>
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
            For Companies
          </a>
          <a
            href="/company"
            style={styles.cta}
            onMouseEnter={e => { e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
          >
            Company Login →
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(m => !m)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, fontSize: 22 }}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(n => (
            <a key={n.href} href={n.href} style={{ ...styles.navLink, display: 'block', padding: '10px 12px' }}>
              {n.label}
            </a>
          ))}
          <a href="/for-companies" style={{ ...styles.navLink, display: 'block', padding: '10px 12px' }}>For Companies</a>
          <a href="/company" style={{ ...styles.cta, display: 'block', textAlign: 'center', marginLeft: 0, marginTop: 8 }}>Company Login →</a>
        </div>
      )}
    </header>
  );
}
