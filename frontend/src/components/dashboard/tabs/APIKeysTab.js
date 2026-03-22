import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>API Access</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Use your API key to pull leads directly into your CRM.</p>

      {/* Key card */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Your API Key</div>

        {apiKey ? (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <code style={{ color: '#7dd3fc', fontFamily: "'Menlo','Monaco',monospace", fontSize: 13, wordBreak: 'break-all' }}>
                {revealed ? apiKey : maskedKey}
              </code>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setRevealed(r => !r)} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {revealed ? 'Hide' : 'Reveal'}
                </button>
                <button onClick={copyKey} style={{ background: copied ? '#16a34a' : '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              ⚠ Treat this key like a password. Don't expose it in client-side code or public repositories.
            </p>
            <button onClick={() => { if (window.confirm('Generate a new key? Your old key will stop working immediately.')) generateKey(); }}
              disabled={generating || saving}
              style={{ padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151' }}>
              {generating ? 'Generating…' : '↺ Rotate Key'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>No API key generated yet.</p>
            <button onClick={generateKey} disabled={generating} style={{ padding: '11px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {generating ? 'Generating…' : 'Generate API Key →'}
            </button>
          </div>
        )}
      </div>

      {/* Docs */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>API Reference</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#374151' }}>List Leads</div>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: '14px 18px', overflow: 'auto' }}>
            <code style={{ color: '#7dd3fc', fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, whiteSpace: 'pre' }}>
{`GET /api/leads
X-API-Key: your_api_key

# Optional query params:
?limit=100          # Max 1,000
?since=2025-01-01   # ISO date filter`}
            </code>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#374151' }}>Response Format</div>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: '14px 18px', overflow: 'auto' }}>
            <code style={{ color: '#86efac', fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, whiteSpace: 'pre' }}>
{`{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "(555) 000-0000",
      "service_type": "home_residential",
      "state": "TX",
      "zip": "78701",
      "estimated_price_low": 150,
      "estimated_price_high": 220,
      "timeline": "week",
      "service_details": { ... },
      "created_at": "2025-01-15T14:30:00Z"
    }
  ]
}`}
            </code>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#374151' }}>cURL Example</div>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: '14px 18px', overflow: 'auto' }}>
            <code style={{ color: '#fde68a', fontFamily: "'Menlo','Monaco',monospace", fontSize: 12, whiteSpace: 'pre' }}>
{`curl https://api.cleaningcalculator.app/api/leads \\
  -H "X-API-Key: ${apiKey || 'your_api_key_here'}"`}
            </code>
          </div>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 4 }}>💡 Zapier & Make Integration</div>
        <p style={{ fontSize: 13, color: '#166534' }}>Use the Webhooks by Zapier action or Make's HTTP module to poll /api/leads and push new leads to HubSpot, Salesforce, Google Sheets, or any CRM.</p>
      </div>
    </div>
  );
}
