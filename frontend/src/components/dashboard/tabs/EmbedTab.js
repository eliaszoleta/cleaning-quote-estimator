import React, { useState } from 'react';

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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Embed Your Widget</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Paste the code below anywhere on your website to embed your branded calculator.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <EmbedCard
          title="Standard iFrame (recommended)"
          desc="Works on any website. Paste inside your page's HTML."
          code={iframeCode}
          onCopy={() => copy(iframeCode, 'iframe')}
          copied={copied === 'iframe'}
        />

        <EmbedCard
          title="JavaScript Snippet"
          desc="Dynamically injects the widget. Good for CMS platforms."
          code={scriptCode}
          onCopy={() => copy(scriptCode, 'script')}
          copied={copied === 'script'}
        />

        <EmbedCard
          title="WordPress Shortcode"
          desc="Install the CleanCalc WordPress plugin, then paste this shortcode."
          code={wordpressCode}
          onCopy={() => copy(wordpressCode, 'wp')}
          copied={copied === 'wp'}
        />

        {/* Instructions */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#0f172a' }}>Installation Guide</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { platform: 'Wix', steps: ['Go to Edit Site', 'Add an Embed element', 'Paste the iFrame code'] },
              { platform: 'Squarespace', steps: ['Add a Code Block', 'Switch to HTML mode', 'Paste the iFrame code'] },
              { platform: 'WordPress', steps: ['Open Gutenberg editor', 'Add a Custom HTML block', 'Paste the iFrame code'] },
              { platform: 'Weebly / Duda', steps: ['Add Embed Code element', 'Paste iFrame in the box', 'Publish your changes'] },
            ].map(({ platform, steps }) => (
              <div key={platform} style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{platform}</div>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {steps.map(s => <li key={s} style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Preview link */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e40af', marginBottom: 6 }}>Preview your widget</div>
          <p style={{ fontSize: 13, color: '#1d4ed8', marginBottom: 12 }}>See exactly how it looks before embedding on your site.</p>
          <a href={`/embed?company=${companyId}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Open Widget Preview ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function EmbedCard({ title, desc, code, onCopy, copied }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{desc}</div>
        </div>
        <button onClick={onCopy} style={{ padding: '8px 18px', background: copied ? '#16a34a' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0, marginLeft: 16 }}>
          {copied ? '✓ Copied!' : 'Copy Code'}
        </button>
      </div>
      <div style={{ background: '#0f172a', padding: '16px 20px', overflowX: 'auto' }}>
        <code style={{ fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, color: '#7dd3fc', whiteSpace: 'pre', display: 'block' }}>
          {code}
        </code>
      </div>
    </div>
  );
}
