import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Copy, Check, Eye, EyeOff, RotateCcw, AlertTriangle, Lightbulb } from 'lucide-react';

export default function APIKeysTab({ config, saveConfig, saving }) {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (config?.apiKey) setApiKey(config.apiKey);
  }, [config]);

  const generateKey = async () => {
    setGenerating(true);
    const newKey = `sk_live_${uuidv4().replace(/-/g, '')}`;
    setApiKey(newKey);
    setRevealed(true);
    await saveConfig({ apiKey: newKey });
    setGenerating(false);
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.prompt('Copy your API key:', apiKey);
    }
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 12)}${'•'.repeat(28)}${apiKey.slice(-4)}` : '';

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>API Access</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Use your API key to pull leads directly into your CRM.</p>
      </div>

      {/* Key card */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Your API Key</div>

        {apiKey ? (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <code style={{ color: '#7dd3fc', fontFamily: "'Menlo','Monaco',monospace", fontSize: 12.5, wordBreak: 'break-all', flex: 1 }}>
                {revealed ? apiKey : maskedKey}
              </code>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setRevealed(r => !r)}
                  title={revealed ? 'Hide key' : 'Reveal key'}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e293b', color: '#94a3b8', border: 'none', padding: '6px 11px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  {revealed ? 'Hide' : 'Reveal'}
                </button>
                <button
                  onClick={copyKey}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? '#16a34a' : '#2563eb', color: 'white', border: 'none', padding: '6px 11px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.15s' }}
                >
                  {copied ? <><Check size={13} strokeLinecap="square" strokeLinejoin="miter" /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 14 }}>
              <AlertTriangle size={13} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Treat this key like a password. Don't expose it in client-side code or public repositories.
              </p>
            </div>

            <button
              onClick={() => { if (window.confirm('Generate a new key? Your old key will stop working immediately.')) generateKey(); }}
              disabled={generating || saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: generating || saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, color: '#374151', opacity: generating || saving ? 0.6 : 1 }}
            >
              <RotateCcw size={13} /> {generating ? 'Generating…' : 'Rotate Key'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>No API key generated yet.</p>
            <button onClick={generateKey} disabled={generating}
              style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {generating ? 'Generating…' : 'Generate API Key →'}
            </button>
          </div>
        )}
      </div>

      {/* Docs */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>API Reference</div>

        {[
          { label: 'List Leads', color: '#7dd3fc', code: `GET /api/leads\nX-API-Key: your_api_key\n\n# Optional query params:\n?limit=100          # Max 1,000\n?since=2025-01-01   # ISO date filter` },
          { label: 'Response Format', color: '#86efac', code: `{\n  "success": true,\n  "count": 42,\n  "data": [\n    {\n      "id": "uuid",\n      "name": "Jane Smith",\n      "email": "jane@example.com",\n      "phone": "(555) 000-0000",\n      "service_type": "home_residential",\n      "estimated_price_low": 150,\n      "estimated_price_high": 220,\n      "created_at": "2025-01-15T14:30:00Z"\n    }\n  ]\n}` },
          { label: 'cURL Example', color: '#fde68a', code: `curl https://api.cleanestimator.com/api/leads \\\n  -H "X-API-Key: ${apiKey || 'your_api_key_here'}"` },
        ].map(({ label, color, code }) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 7, color: '#374151' }}>{label}</div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '13px 16px', overflow: 'auto' }}>
              <code style={{ color, fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, whiteSpace: 'pre', display: 'block' }}>{code}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lightbulb size={16} color="#16a34a" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#15803d', marginBottom: 3 }}>Zapier & Make Integration</div>
          <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Use the Webhooks by Zapier action or Make's HTTP module to poll /api/leads and push new leads to HubSpot, Salesforce, Google Sheets, or any CRM.</p>
        </div>
      </div>
    </div>
  );
}
