import React from 'react';

const cols = [
  {
    title: 'Calculators',
    links: [
      { label: 'House Cleaning Cost', href: '/?service=home_residential' },
      { label: 'Apartment Cleaning Cost', href: '/?service=apartment' },
      { label: 'Commercial Cleaning Cost', href: '/?service=commercial' },
      { label: 'Carpet Cleaning Cost', href: '/?service=carpet' },
      { label: 'Air Duct Cleaning Cost', href: '/?service=air_duct' },
      { label: 'Dryer Vent Cleaning Cost', href: '/?service=dryer_vent' },
      { label: 'Tile & Grout Cleaning Cost', href: '/?service=tile_grout' },
      { label: 'Mold Remediation Cost', href: '/?service=mold_remediation' },
      { label: 'Water Damage Restoration Cost', href: '/?service=water_damage' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'House Cleaning Tips', href: '/blog/category/house-cleaning' },
      { label: 'Commercial Cleaning Guide', href: '/blog/category/commercial' },
      { label: 'Mold & Water Damage', href: '/blog/category/restoration' },
      { label: 'Carpet Care', href: '/blog/category/carpet' },
      { label: 'About Clean Estimator', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'For Companies',
    links: [
      { label: 'Embed the Calculator', href: '/for-companies' },
      { label: 'Pricing & Plans', href: '/for-companies#pricing' },
      { label: 'Company Login', href: '/company' },
      { label: 'API Access', href: '/for-companies#api' },
      { label: 'White-label Widget', href: '/for-companies#widget' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
    ],
  },
];

const s = {
  footer: { background: '#0f172a', color: '#94a3b8', marginTop: 80 },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '64px 24px 40px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 },
  colTitle: { color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  link: { display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.15s' },
  bottom: { borderTop: '1px solid #1e293b', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 30, height: 30, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15 },
  copy: { fontSize: 13, color: '#64748b' },
  disclaimer: { maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px', fontSize: 12, color: '#475569', lineHeight: 1.7 },
};

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.grid}>
          {cols.map(col => (
            <div key={col.title}>
              <div style={s.colTitle}>{col.title}</div>
              {col.links.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  style={s.link}
                  onMouseEnter={e => { e.target.style.color = 'white'; }}
                  onMouseLeave={e => { e.target.style.color = '#94a3b8'; }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={s.bottom}>
          <div style={s.brand}>
            <span style={s.logoIcon}>✦</span>
            <span style={{ color: 'white', fontWeight: 700 }}>Clean Estimator</span>
          </div>
          <div style={s.copy}>© {new Date().getFullYear()} Clean Estimator. All rights reserved.</div>
        </div>
      </div>
      <div style={s.disclaimer}>
        <strong style={{ color: '#64748b' }}>Disclaimer:</strong> All price estimates provided by Clean Estimator are for informational purposes only.
        Actual cleaning service costs vary based on local market conditions, specific service requirements, company pricing policies,
        and other factors. Always get multiple quotes from licensed, insured cleaning professionals in your area.
        Clean Estimator is not responsible for any decisions made based on these estimates.
      </div>
    </footer>
  );
}
