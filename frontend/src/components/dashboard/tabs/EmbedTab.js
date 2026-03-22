import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://cleaningcalculator.app';

export default function EmbedTab({ config, user }) {
  const [copied, setCopied] = useState(null);

  const companyId = user.id;
  const height = config?.frameHeight || 700;
  const radius = config?.borderRadius || 12;

  const iframeCode = `<iframe
  src="${SITE_URL}/embed?company=${companyId}"
  width="100%"
  height="${height}"
  style="border:none;border-radius:${radius}px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"
  title="Cleaning Cost Estimator"
  loading="lazy">
</iframe>`;

  const scriptCode = `<div id="cleancalc-widget"></div>
<script>
  (function(){
    var el=document.createElement('iframe');
    el.src='${SITE_URL}/embed?company=${companyId}';
    el.width='100%';el.height='${height}';
    el.style.cssText='border:none;border-radius:${radius}px;box-shadow:0 4px 24px rgba(0,0,0,.10);';
    el.title='Cleaning Cost Estimator';el.loading='lazy';
    document.getElementById('cleancalc-widget').appendChild(el);
  })();
</script>`;

  const wordpressCode = `[cleancalc_widget company_id="${companyId}" height="${height}"]`;

  const copy = async (text, key) => {
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
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Embed Your Widget</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Paste the code below anywhere on your website to embed your branded calculator.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmbedCard title="Standard iFrame" badge="Recommended" desc="Works on any website. Paste inside your page's HTML." code={iframeCode} onCopy={() => copy(iframeCode, 'iframe')} copied={copied === 'iframe'} />
        <EmbedCard title="JavaScript Snippet" desc="Dynamically injects the widget. Good for CMS platforms." code={scriptCode} onCopy={() => copy(scriptCode, 'script')} copied={copied === 'script'} />
        <EmbedCard title="WordPress Shortcode" desc="Install the CleanCalc WordPress plugin, then paste this shortcode." code={wordpressCode} onCopy={() => copy(wordpressCode, 'wp')} copied={copied === 'wp'} />

        {/* Installation Guide */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Installation Guide</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {[
              { platform: 'Wix',            steps: ['Go to Edit Site', 'Add an Embed element', 'Paste the iFrame code'] },
              { platform: 'Squarespace',    steps: ['Add a Code Block', 'Switch to HTML mode', 'Paste the iFrame code'] },
              { platform: 'WordPress',      steps: ['Open Gutenberg editor', 'Add a Custom HTML block', 'Paste the iFrame code'] },
              { platform: 'Weebly / Duda', steps: ['Add Embed Code element', 'Paste iFrame in the box', 'Publish your changes'] },
            ].map(({ platform, steps }) => (
              <div key={platform} style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0f172a' }}>{platform}</div>
                <ol style={{ paddingLeft: 16, margin: 0 }}>
                  {steps.map(s => <li key={s} style={{ fontSize: 12.5, color: '#64748b', marginBottom: 5 }}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Preview link */}
        <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f8fafc)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 4 }}>Preview your widget</div>
            <p style={{ fontSize: 13, color: '#3b82f6', margin: 0 }}>See exactly how it looks before embedding on your site.</p>
          </div>
          <a
            href={`/embed?company=${companyId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
          >
            Open Preview <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

function EmbedCard({ title, badge, desc, code, onCopy, copied }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
            {badge && <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 20 }}>{badge}</span>}
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
          {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
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
