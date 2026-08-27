import React from 'react';
import { Sparkles } from 'lucide-react';

const cols = [
  {
    title: 'Cleaning Services',
    links: [
      { label: 'House Cleaning', href: '/cleaning-services/house-cleaning-cost' },
      { label: 'Apartment Cleaning', href: '/cleaning-services/apartment-cleaning-cost' },
      { label: 'Commercial Cleaning', href: '/cleaning-services/commercial-cleaning-cost' },
      { label: 'Carpet Cleaning', href: '/cleaning-services/carpet-cleaning-cost' },
      { label: 'Mold Remediation', href: '/cleaning-services/mold-remediation-cost' },
      { label: 'Water Damage Restoration', href: '/cleaning-services/water-damage-restoration-cost' },
    ],
  },
  {
    title: 'Cleaning Cost by State',
    links: [
      { label: 'California', href: '/cleaning-cost/california' },
      { label: 'Texas', href: '/cleaning-cost/texas' },
      { label: 'Florida', href: '/cleaning-cost/florida' },
      { label: 'New York', href: '/cleaning-cost/new-york' },
      { label: 'Illinois', href: '/cleaning-cost/illinois' },
      { label: 'Washington', href: '/cleaning-cost/washington' },
    ],
  },
  {
    title: 'Blog Categories',
    links: [
      { label: 'House Cleaning Tips', href: '/blog/category/house-cleaning' },
      { label: 'Carpet Cleaning', href: '/blog/category/carpet' },
      { label: 'Commercial Cleaning', href: '/blog/category/commercial' },
      { label: 'Mold & Water Damage', href: '/blog/category/restoration' },
      { label: 'All Blog Posts', href: '/blog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Cleaning Cost Calculator', href: '/cleaning-cost-calculator' },
      { label: 'Cleaning Cost Estimator', href: '/cleaning-cost-estimator' },
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
  footer: { background: '#0b1220', color: '#94a3b8' },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '64px 24px 40px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 },
  colTitle: { color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  link: { display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.15s, transform 0.15s' },
  bottom: { borderTop: '1px solid #1e293b', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 30, height: 30,
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
    boxShadow: '0 2px 8px rgba(30,64,175,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
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
                  onMouseEnter={e => { e.target.style.color = 'white'; e.target.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.transform = 'none'; }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={s.bottom}>
          <div style={s.brand}>
            <span style={s.logoIcon}><Sparkles size={15} strokeWidth={2.25} /></span>
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
