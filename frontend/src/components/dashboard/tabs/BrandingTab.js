import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import CleaningCalculator from '../../calculator/CleaningCalculator';
import { FONT_OPTIONS, getFontStack } from '../../../utils/fonts';
import LogoField from '../../partners/LogoField';
import { uploadCompanyLogo } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

export default function BrandingTab({ config, update, onSave, saving, saved }) {
  // Session is fetched per-upload (rather than once on mount) so a long
  // idle stretch on this tab before uploading a logo can't hand
  // uploadCompanyLogo a token that's since expired.
  const uploadLogo = async ({ contentType, dataBase64 }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session expired -- please refresh and log in again.');
    return uploadCompanyLogo(session.access_token, session.user.id, { contentType, dataBase64 });
  };

  const [form, setForm] = useState({
    companyName: '', logo: '', primaryColor: '#2563eb', accentColor: '#16a34a',
    ctaHeadline: '', ctaSubtext: '', ctaPhone: '', ctaEmail: '',
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
        ctaPhone: config.ctaPhone || '',
        ctaEmail: config.ctaEmail || '',
        fontFamily: config.fontFamily || 'Inter',
        frameHeight: String(config.frameHeight || '700'),
        borderRadius: String(config.borderRadius || '12'),
      });
    }
  }, [config]);

  const set = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      // Keep localConfig in sync so Save Changes always has the latest branding
      if (update) update({
        companyName: next.companyName,
        logo: next.logo,
        primaryColor: next.primaryColor,
        accentColor: next.accentColor,
        ctaHeadline: next.ctaHeadline,
        ctaSubtext: next.ctaSubtext,
        ctaPhone: next.ctaPhone,
        ctaEmail: next.ctaEmail,
        fontFamily: next.fontFamily,
        frameHeight: parseInt(next.frameHeight) || 700,
        borderRadius: parseInt(next.borderRadius) || 12,
      });
      return next;
    });
  };

  const previewConfig = {
    companyName: form.companyName,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    ctaHeadline: form.ctaHeadline || 'Get Your Instant Estimate',
    ctaSubtext: form.ctaSubtext,
    ctaPhone: form.ctaPhone,
    ctaEmail: form.ctaEmail,
    fontFamily: form.fontFamily,
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
            <LogoField value={form.logo} onChange={url => set('logo', url)} inputStyle={input} upload={uploadLogo} />
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

          <Card title="Typography">
            <Field label="Widget font" hint="Match the font your own website already uses -- shown across every step of the calculator, not just the results page.">
              <select
                value={form.fontFamily}
                onChange={e => set('fontFamily', e.target.value)}
                style={{ ...input, cursor: 'pointer', fontFamily: getFontStack(form.fontFamily) }}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>{f.label}</option>
                ))}
              </select>
            </Field>
          </Card>

          {/* These two used to be one "Call to Action" card, which made it
              easy to assume all fields belonged to the same button --
              Headline/Subtext actually show on the lead-capture form
              (before the estimate), while Phone/Email show on the results
              page (after it), as direct contact info rather than a button --
              split into two clearly-scoped cards so that mistake isn't the
              default path anymore. */}
          <Card title="Lead Capture Form" subtitle="Shown before the visitor sees their estimate">
            <Field label="Headline">
              <input style={input} value={form.ctaHeadline} onChange={e => set('ctaHeadline', e.target.value)} placeholder="Get Your Instant Estimate" />
            </Field>
            <Field label="Subtext">
              <input style={input} value={form.ctaSubtext} onChange={e => set('ctaSubtext', e.target.value)} placeholder="Optional — we'll connect you with local pros." />
            </Field>
          </Card>

          <Card title="Results Page Call-to-Action" subtitle="Shown after the visitor already has their estimate">
            <Field label="Phone number" hint="Shown as a tap-to-call button on the results page, and a clickable link in the estimate email they receive">
              <input style={input} value={form.ctaPhone} onChange={e => set('ctaPhone', e.target.value)} placeholder="(555) 123-4567" />
            </Field>
            <Field label="Business email" hint="Shown on the results page and in the estimate email they receive">
              <input style={input} type="email" value={form.ctaEmail} onChange={e => set('ctaEmail', e.target.value)} placeholder="contact@yourcompany.com" />
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

      {/* Save Changes repeated here -- the header button is easy to miss
          after scrolling down through the settings column, so this gives
          people a save action right where they finish editing. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '11px 22px',
            background: saving ? '#334155' : '#2563eb',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, transition: 'background 0.15s',
          }}
        >
          {saving
            ? <><Loader2 size={14} className="spin" /> Saving…</>
            : <><Save size={14} /> Save Changes</>
          }
        </button>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 13.5, fontWeight: 600 }}>
            <Check size={15} strokeLinecap="square" strokeLinejoin="miter" /> Saved
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{subtitle}</div>}
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
