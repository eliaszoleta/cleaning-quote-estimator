import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import CleaningCalculator from '../../calculator/CleaningCalculator';

const BrandingTab = forwardRef(function BrandingTab({ config }, ref) {
  const [form, setForm] = useState({
    companyName: '', logo: '', primaryColor: '#2563eb', accentColor: '#16a34a',
    ctaHeadline: '', ctaSubtext: '', ctaButtonText: '', ctaPhone: '', ctaButtonUrl: '',
    fontFamily: 'Inter', frameHeight: '700', borderRadius: '12',
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      initialized.current = true;
      setForm({
        companyName: config.companyName || '',
        logo: config.logo || '',
        primaryColor: config.primaryColor || '#2563eb',
        accentColor: config.accentColor || '#16a34a',
        ctaHeadline: config.ctaHeadline || '',
        ctaSubtext: config.ctaSubtext || '',
        ctaButtonText: config.ctaButtonText || '',
        ctaPhone: config.ctaPhone || '',
        ctaButtonUrl: config.ctaButtonUrl || '',
        fontFamily: config.fontFamily || 'Inter',
        frameHeight: String(config.frameHeight || '700'),
        borderRadius: String(config.borderRadius || '12'),
      });
    }
  }, [config]);

  useImperativeHandle(ref, () => ({
    getData: () => ({
      companyName: form.companyName,
      logo: form.logo,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      ctaHeadline: form.ctaHeadline,
      ctaSubtext: form.ctaSubtext,
      ctaButtonText: form.ctaButtonText,
      ctaPhone: form.ctaPhone,
      ctaButtonUrl: form.ctaButtonUrl,
      fontFamily: form.fontFamily,
      frameHeight: parseInt(form.frameHeight) || 700,
      borderRadius: parseInt(form.borderRadius) || 12,
    }),
  }), [form]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const previewConfig = {
    companyName: form.companyName,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    ctaHeadline: form.ctaHeadline || 'Get Your Instant Estimate',
    ctaSubtext: form.ctaSubtext,
    ctaButtonText: form.ctaButtonText || 'Get Free Quotes →',
    ctaPhone: form.ctaPhone,
    ctaButtonUrl: form.ctaButtonUrl,
  };

  const input = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Widget Branding</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Customize how your calculator looks on your website.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Settings column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Card title="Company Info">
            <Field label="Company name">
              <input style={input} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="ABC Cleaning Services" />
            </Field>
            <Field label="Logo URL" hint="Paste a publicly hosted image URL">
              <input style={input} value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://yoursite.com/logo.png" />
              {form.logo && <img src={form.logo} alt="logo preview" style={{ marginTop: 8, maxHeight: 50, borderRadius: 4 }} onError={e => { e.target.style.display = 'none'; }} />}
            </Field>
          </Card>

          <Card title="Colors">
            <Field label="Primary color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width: 48, height: 38, borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
                <input style={{ ...input, width: 120 }} value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#2563eb" />
              </div>
            </Field>
            <Field label="Accent color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)} style={{ width: 48, height: 38, borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
                <input style={{ ...input, width: 120 }} value={form.accentColor} onChange={e => set('accentColor', e.target.value)} placeholder="#16a34a" />
              </div>
            </Field>
          </Card>

          <Card title="Call to Action">
            <Field label="Headline">
              <input style={input} value={form.ctaHeadline} onChange={e => set('ctaHeadline', e.target.value)} placeholder="Get Your Instant Estimate" />
            </Field>
            <Field label="Subtext">
              <input style={input} value={form.ctaSubtext} onChange={e => set('ctaSubtext', e.target.value)} placeholder="Optional — we'll connect you with local pros." />
            </Field>
            <Field label="Button text">
              <input style={input} value={form.ctaButtonText} onChange={e => set('ctaButtonText', e.target.value)} placeholder="Get Free Quotes →" />
            </Field>
            <Field label="Phone number" hint="Adds a 'Call Now' button on results">
              <input style={input} value={form.ctaPhone} onChange={e => set('ctaPhone', e.target.value)} placeholder="(555) 123-4567" />
            </Field>
            <Field label="CTA button URL" hint="Where the main CTA button links to">
              <input style={input} value={form.ctaButtonUrl} onChange={e => set('ctaButtonUrl', e.target.value)} placeholder="https://yoursite.com/contact" />
            </Field>
          </Card>

          <Card title="Widget Dimensions">
            <Field label="Frame height (px)" hint="Height of the embedded iframe">
              <input style={{ ...input, width: 100 }} type="number" value={form.frameHeight} onChange={e => set('frameHeight', e.target.value)} min={400} max={1200} />
            </Field>
            <Field label="Border radius (px)" hint="Corner rounding of the widget card">
              <input style={{ ...input, width: 100 }} type="number" value={form.borderRadius} onChange={e => set('borderRadius', e.target.value)} min={0} max={24} />
            </Field>
          </Card>
        </div>

        {/* Preview column */}
        <div style={{ position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Live Preview</div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white', height: 600, overflowY: 'auto' }}>
            <CleaningCalculator companyConfig={previewConfig} embedded={true} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BrandingTab;

function Card({ title, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}
