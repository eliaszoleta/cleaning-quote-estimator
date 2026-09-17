import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Clean Estimator</title>
        <link rel="canonical" href="https://www.cleanestimator.com/privacy-policy" />
      </Helmet>
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(28px, 7vw, 56px) 20px 10px' }}>
          <h1 style={{ fontSize: 'clamp(26px, 6vw, 36px)', fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>Privacy Policy</h1>
          <p style={{ color: '#64748b' }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px clamp(40px, 8vw, 64px)', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['Information We Collect', 'When you use our calculator, we collect the answers you provide (service type, location, property details) to generate your estimate. If you choose to provide your name, email, or phone number in the lead capture form, we store that information. We also collect standard web analytics data (page views, browser type, referral source) through privacy-respecting analytics tools.'],
            ['How We Use Your Information', 'We use your calculator inputs solely to generate price estimates. If you provide contact information, it may be shared with the cleaning company whose widget you\'re using (if you\'re using an embedded widget on a company\'s site). We do not sell your personal information to third parties. We may use your email to send you a copy of your estimate if you request it.'],
            ['Cookies', 'We use minimal cookies for session functionality and analytics. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though some features may not work correctly.'],
            ['Data Retention', 'Calculator session data is not permanently stored unless you provide contact information. Lead information submitted through company widgets is retained for the duration of the company\'s subscription plus 90 days, then deleted.'],
            ['Your Rights', 'You have the right to request deletion of any personal information we hold about you. Contact us at info@cleanestimator.com and we will delete your data within 30 days.'],
            ['Security', 'We use industry-standard security measures including HTTPS encryption, secure database access controls, and regular security audits. No system is 100% secure, but we take reasonable precautions to protect your data.'],
            ['Changes', 'We may update this policy occasionally. Continued use of Clean Estimator after changes constitutes acceptance of the updated policy.'],
            ['Contact', 'For privacy-related questions, email info@cleanestimator.com.'],
          ].map(([title, body], i) => (
            <div key={title} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12.5, fontWeight: 800 }}>{i + 1}</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{title}</h2>
                <p style={{ color: '#475569', fontSize: 14.5, margin: 0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
