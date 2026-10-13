import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Loader2, Copy, ExternalLink } from 'lucide-react';
import CleaningCalculator from '../../calculator/CleaningCalculator';
import { FONT_OPTIONS, getFontStack } from '../../../utils/fonts';
import LogoField from '../../partners/LogoField';
import { uploadCompanyLogo } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://www.cleanestimator.com';

export default function BrandingTab({ config, update, autoSave, onSave, saving, saved, user }) {
  const [copied, setCopied] = useState(null);
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
    ctaHeadline: '', ctaHeadlineEnabled: true, ctaSubtext: '', ctaPhone: '', ctaEmail: '',
    leadNotificationEmail: '',
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
        ctaHeadlineEnabled: config.ctaHeadlineEnabled !== false,
        ctaSubtext: config.ctaSubtext || '',
        ctaPhone: config.ctaPhone || '',
        ctaEmail: config.ctaEmail || '',
        leadNotificationEmail: config.leadNotificationEmail || '',
        fontFamily: config.fontFamily || 'Inter',
        frameHeight: String(config.frameHeight || '700'),
        borderRadius: String(config.borderRadius || '12'),
      });
    }
  }, [config]);

  // Debounced auto-save -- every field here used to only stage into
  // localConfig until the header's Save Changes was clicked, same
  // "did my change actually take effect?" confusion the Services tab's
  // toggle/Service-Area auto-save already fixed once. Firing autoSave on
  // every keystroke would hammer the backend with a full save per
  // character typed, so this waits until typing pauses (900ms) before
  // actually persisting -- update() still runs immediately so the live
  // preview and localConfig (what a manual Save Changes elsewhere would
  // submit) never lag behind what's on screen.
  const saveTimer = useRef(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const set = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      const patch = {
        companyName: next.companyName,
        logo: next.logo,
        primaryColor: next.primaryColor,
        accentColor: next.accentColor,
        ctaHeadline: next.ctaHeadline,
        ctaHeadlineEnabled: next.ctaHeadlineEnabled,
        ctaSubtext: next.ctaSubtext,
        ctaPhone: next.ctaPhone,
        ctaEmail: next.ctaEmail,
        leadNotificationEmail: next.leadNotificationEmail,
        fontFamily: next.fontFamily,
        frameHeight: parseInt(next.frameHeight) || 700,
        borderRadius: parseInt(next.borderRadius) || 12,
      };
      // Keep localConfig in sync immediately so the live preview and any
      // manual Save Changes elsewhere always reflect the latest typing.
      if (update) update(patch);
      if (autoSave) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => autoSave(patch), 900);
      }
      return next;
    });
  };

  const previewConfig = {
    companyName: form.companyName,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    // No hardcoded fallback here -- an empty field should preview exactly
    // like production does for an untouched account (ServiceSelect.js and
    // LeadCaptureStep.js each already fall back to their own default
    // headline when this is empty), not a third, preview-only default.
    ctaHeadline: form.ctaHeadline,
    ctaHeadlineEnabled: form.ctaHeadlineEnabled,
    ctaSubtext: form.ctaSubtext,
    ctaPhone: form.ctaPhone,
    ctaEmail: form.ctaEmail,
    fontFamily: form.fontFamily,
    // Left out entirely before -- the preview always showed all 10 services
    // regardless of what was toggled off in the Services tab, since
    // ServiceSelect.js treats a missing `services` object as "show
    // everything." config.services is kept live by the shared `update()`
    // callback both tabs write through, so this reflects toggles
    // immediately, not just after Save Changes.
    services: config?.services,
    // Same gap, same fix -- the Services tab's "Service Areas" picker
    // (serviceStates/serviceCities) restricts which states LocationStep
    // shows, but the preview never passed either through, so it kept
    // showing all 50 states no matter what was actually selected there.
    serviceStates: config?.serviceStates,
    serviceCities: config?.serviceCities,
  };

  const input = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 7, fontSize: 14, color: '#0f172a', outline: 'none',
  };

  // Embed code -- lives here instead of its own tab now, right after the
  // live preview above, since "grab the code" is the natural next step
  // once a company is done customizing how the widget looks.
  const companyId = user.id;
  const embedHeight = config?.frameHeight || 700;
  const embedRadius = config?.borderRadius || 12;
  const iframeId = `cleancalc-iframe-${companyId}`;

  const iframeCode = `<iframe
  id="${iframeId}"
  src="${SITE_URL}/embed?company=${companyId}"
  width="100%"
  height="${embedHeight}"
  style="border:none;border-radius:${embedRadius}px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"
  title="Cleaning Cost Estimator"
  loading="lazy">
</iframe>
<script>
  (function(){
    var iframe=document.getElementById('${iframeId}');
    window.addEventListener('message',function(e){
      if(!e.data||e.source!==iframe.contentWindow)return;
      if(e.data.type==='cleancalc-resize'){
        iframe.style.height=Math.max(e.data.height,300)+'px';
      } else if(e.data.type==='cleancalc-scroll-to-top'){
        var top=iframe.getBoundingClientRect().top+window.pageYOffset-70;
        window.scrollTo({top:top,behavior:'smooth'});
      }
    });
  })();
</script>`;

  const scriptCode = `<div id="cleancalc-widget"></div>
<script>
  (function(){
    var el=document.createElement('iframe');
    el.src='${SITE_URL}/embed?company=${companyId}';
    el.width='100%';el.height='${embedHeight}';
    el.style.cssText='border:none;border-radius:${embedRadius}px;box-shadow:0 4px 24px rgba(0,0,0,.10);';
    el.title='Cleaning Cost Estimator';el.loading='lazy';
    document.getElementById('cleancalc-widget').appendChild(el);
    window.addEventListener('message',function(e){
      if(!e.data||e.source!==el.contentWindow)return;
      if(e.data.type==='cleancalc-resize'){
        el.style.height=Math.max(e.data.height,300)+'px';
      } else if(e.data.type==='cleancalc-scroll-to-top'){
        var top=el.getBoundingClientRect().top+window.pageYOffset-70;
        window.scrollTo({top:top,behavior:'smooth'});
      }
    });
  })();
</script>`;

  const wordpressCode = `[cleanestimator_widget company_id="${companyId}" height="${embedHeight}"]`;

  const copyEmbed = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt('Copy this code:', text);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Widget Branding</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Customize how your estimator looks on your website.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Settings column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Card title="Company Info">
            <Field label="Company name">
              <input style={input} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Sparkle Cleaning Service" />
            </Field>
            <LogoField value={form.logo} onChange={url => set('logo', url)} inputStyle={input} upload={uploadLogo} urlOnly />
          </Card>

          <Card title="Lead Notifications" subtitle="Where new leads on your widget get emailed" important>
            <Field label="Send leads to" hint="Every time someone completes an estimate on your widget, we'll email the details here.">
              <input style={input} type="email" value={form.leadNotificationEmail} onChange={e => set('leadNotificationEmail', e.target.value)} placeholder="leads@yourcompany.com" />
            </Field>
          </Card>

          <Card title="Colors">
            <Field label="Primary color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width: 48, height: 38, borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
                <input style={{ ...input, width: 120 }} value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#2563eb" />
              </div>
            </Field>
            <Field label="Accent color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)} style={{ width: 48, height: 38, borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
                <input style={{ ...input, width: 120 }} value={form.accentColor} onChange={e => set('accentColor', e.target.value)} placeholder="#16a34a" />
              </div>
            </Field>
          </Card>

          <Card title="Typography">
            <Field label="Widget font" hint="Match the font your own website already uses -- shown across every step of the estimator, not just the results page.">
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Headline</label>
                <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={form.ctaHeadlineEnabled} onChange={e => set('ctaHeadlineEnabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', inset: 0, borderRadius: 20, background: form.ctaHeadlineEnabled ? '#2563eb' : '#cbd5e1', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: form.ctaHeadlineEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </span>
                </label>
              </div>
              <input style={{ ...input, opacity: form.ctaHeadlineEnabled ? 1 : 0.5 }} disabled={!form.ctaHeadlineEnabled} value={form.ctaHeadline} onChange={e => set('ctaHeadline', e.target.value)} placeholder="Get your instant estimate" />
              {!form.ctaHeadlineEnabled && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Hidden on the form -- only the subtext below will show.</div>}
            </div>
            <Field label="Subtext">
              <input style={input} value={form.ctaSubtext} onChange={e => set('ctaSubtext', e.target.value)} placeholder="We'll email your results and connect you with one of our team members" />
            </Field>
          </Card>

          <Card title="Results Page Call-to-Action" subtitle="Shown after the visitor already has their estimate" important>
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

        {/* Preview column -- the sticky div itself still stretches to the
            full grid column (needed for sticky positioning to have room
            to work in), so capping just the bordered box left it flush
            against the column's left edge with all the leftover width
            piling up as empty space on the right. Capping AND centering
            this inner wrapper (label + box together) instead keeps both
            of them centered as a unit, on any monitor width.
            960px (not the old 720px, which matched a hardcoded cap the
            embedded widget itself used to have everywhere) approximates a
            real, fairly generous embed -- a company pasting the iframe into
            a wide content section on their own site, not the narrower
            720px-ish width this preview used to imply, was rendering
            noticeably differently (and more usefully, more columns) than
            what this panel showed. Still just an approximation: the real
            widget always matches whatever width a given site's own page
            actually provides, which this can't know in advance. */}
        <div style={{ position: 'sticky', top: 96 }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Live Preview</div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', background: 'white' }}>
              <CleaningCalculator companyConfig={previewConfig} embedded={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Embed code -- used to be its own "Estimator" tab, now right below
          the branding this code reflects. */}
      <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: '-0.3px' }}>Embed Your Widget</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Paste the code below anywhere on your website to embed your branded estimator.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EmbedCard title="Standard iFrame" badge="Recommended" desc="Works on any website. Add a block or section wherever you want it to show up on the page — left, right, or centered — and paste this code there." code={iframeCode} onCopy={() => copyEmbed(iframeCode, 'iframe')} copied={copied === 'iframe'} />
          <EmbedCard title="JavaScript Snippet" desc="Dynamically injects the widget. Good for CMS platforms." code={scriptCode} onCopy={() => copyEmbed(scriptCode, 'script')} copied={copied === 'script'} />
          <EmbedCard title="WordPress Shortcode" desc="Install the Clean Estimator WordPress plugin, then paste this shortcode." code={wordpressCode} onCopy={() => copyEmbed(wordpressCode, 'wp')} copied={copied === 'wp'} />

          {/* Installation Guide */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Installation Guide</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {[
                { platform: 'Wix',            steps: ['Go to Edit Site', 'Add an Embed element', 'Paste the iFrame code'] },
                { platform: 'Squarespace',    steps: ['Add a Code Block', 'Switch to HTML mode', 'Paste the iFrame code'] },
                { platform: 'WordPress',      steps: ['Open Gutenberg editor', 'Add a Custom HTML block', 'Paste the iFrame code'] },
                { platform: 'Weebly / Duda', steps: ['Add Embed Code element', 'Paste iFrame in the box', 'Publish your changes'] },
              ].map(({ platform, steps }) => (
                <div key={platform} style={{ background: '#f8fafc', borderRadius: 7, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0f172a' }}>{platform}</div>
                  <ol style={{ paddingLeft: 16, margin: 0 }}>
                    {steps.map(s => <li key={s} style={{ fontSize: 12.5, color: '#64748b', marginBottom: 5 }}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* Preview link */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', marginBottom: 4 }}>Preview your widget</div>
              <p style={{ fontSize: 13, color: '#2563eb', margin: 0 }}>See exactly how it looks before embedding on your site.</p>
            </div>
            <a
              href={`/embed?company=${companyId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(30,64,175,0.20)' }}
            >
              Open Preview <ExternalLink size={13} />
            </a>
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
            color: 'white', border: 'none', borderRadius: 7,
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

function EmbedCard({ title, badge, desc, code, onCopy, copied }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{title}</span>
            {badge && <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 999 }}>{badge}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>{desc}</div>
        </div>
        <button
          onClick={onCopy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: copied ? '#16a34a' : '#0f172a',
            color: 'white', border: 'none', borderRadius: 7,
            cursor: 'pointer', fontWeight: 600, fontSize: 12.5,
            flexShrink: 0, marginLeft: 14, transition: 'background 0.15s',
          }}
        >
          {copied ? <><Check size={13} strokeLinecap="square" strokeLinejoin="miter" /> Copied!</> : <><Copy size={13} /> Copy Code</>}
        </button>
      </div>
      <div style={{ background: '#0f172a', padding: '14px 18px', overflowX: 'auto' }}>
        <code style={{ fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, color: '#7dd3fc', whiteSpace: 'pre', display: 'block' }}>
          {code}
        </code>
      </div>
    </div>
  );
}

function Card({ title, subtitle, important, children }) {
  return (
    <div style={{ background: 'white', border: important ? '1.5px solid #fcd34d' : '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', boxShadow: important ? '0 0 0 3px rgba(251,191,36,0.08)' : 'none' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: important ? '#fffbeb' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
          {important && (
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', color: '#92400e', background: '#fde68a', padding: '2px 7px', borderRadius: 999 }}>
              IMPORTANT
            </span>
          )}
        </div>
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
