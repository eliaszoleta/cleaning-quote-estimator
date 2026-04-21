import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Clean Estimator</title>
        <link rel="canonical" href="https://www.cleanestimator.com/privacy-policy" />
      </Helmet>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        {[
          ['Information We Collect', 'When you use our calculator, we collect the answers you provide (service type, location, property details) to generate your estimate. If you choose to provide your name, email, or phone number in the lead capture form, we store that information. We also collect standard web analytics data (page views, browser type, referral source) through privacy-respecting analytics tools.'],
          ['How We Use Your Information', 'We use your calculator inputs solely to generate price estimates. If you provide contact information, it may be shared with the cleaning company whose widget you\'re using (if you\'re using an embedded widget on a company\'s site). We do not sell your personal information to third parties. We may use your email to send you a copy of your estimate if you request it.'],
          ['Cookies', 'We use minimal cookies for session functionality and analytics. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though some features may not work correctly.'],
          ['Data Retention', 'Calculator session data is not permanently stored unless you provide contact information. Lead information submitted through company widgets is retained for the duration of the company\'s subscription plus 90 days, then deleted.'],
          ['Your Rights', 'You have the right to request deletion of any personal information we hold about you. Contact us at privacy@cleanestimator.com and we will delete your data within 30 days.'],
          ['Security', 'We use industry-standard security measures including HTTPS encryption, secure database access controls, and regular security audits. No system is 100% secure, but we take reasonable precautions to protect your data.'],
          ['Changes', 'We may update this policy occasionally. Continued use of Clean Estimator after changes constitutes acceptance of the updated policy.'],
          ['Contact', 'For privacy-related questions, email privacy@cleanestimator.com.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h2>
            <p style={{ color: '#374151', fontSize: 15 }}>{body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
