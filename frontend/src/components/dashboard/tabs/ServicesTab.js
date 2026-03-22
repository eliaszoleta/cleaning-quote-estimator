import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { patchCompanyServices } from '../../../utils/api';

const SERVICES = [
  { id: 'homeResidential', label: 'House Cleaning', icon: '🏠' },
  { id: 'apartment', label: 'Apartment Cleaning', icon: '🏢' },
  { id: 'commercial', label: 'Commercial Cleaning', icon: '🏬' },
  { id: 'carpet', label: 'Carpet Cleaning', icon: '🪣' },
  { id: 'airDuct', label: 'Air Duct Cleaning', icon: '💨' },
  { id: 'dryerVent', label: 'Dryer Vent Cleaning', icon: '🔥' },
  { id: 'tileGrout', label: 'Tile & Grout', icon: '🔲' },
  { id: 'moldRemediation', label: 'Mold Remediation', icon: '⚠️' },
  { id: 'waterDamage', label: 'Water Damage', icon: '💧' },
];

const DEFAULT_SERVICE = { enabled: true, markup: 1.0, minimumCharge: null };

export default function ServicesTab({ config, companyId, update }) {
  const [services, setServices] = useState({});
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const initialized = useRef(false);
  const markupTimers = useRef({});

  useEffect(() => {
    if (config && !initialized.current) {
      initialized.current = true;
      setServices(config.services || {});
      setEnableLeadCapture(config.enableLeadCapture !== false);
      setCustomQuestions(config.customLeadQuestions || []);
    }
  }, [config]);

  const getSvc = (id) => ({ ...DEFAULT_SERVICE, ...(services[id] || {}) });

  // Auto-save services to dedicated backend endpoint — no global save needed
  const saveServices = async (nextServices) => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await patchCompanyServices(token, companyId, nextServices);
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2000);
      if (update) update({ services: nextServices });
    } catch (err) {
      console.error('Failed to save services:', err.message);
      setSavedMsg('Error saving');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (id, enabled) => {
    const next = { ...services, [id]: { ...getSvc(id), enabled } };
    setServices(next);
    saveServices(next);
  };

  const setMarkup = (id, markup) => {
    const next = { ...services, [id]: { ...getSvc(id), markup } };
    setServices(next);
    // Debounce markup saves to avoid hammering the API on every keystroke
    clearTimeout(markupTimers.current[id]);
    markupTimers.current[id] = setTimeout(() => saveServices(next), 800);
  };

  const setMinCharge = (id, minimumCharge) => {
    const next = { ...services, [id]: { ...getSvc(id), minimumCharge } };
    setServices(next);
    clearTimeout(markupTimers.current[`min_${id}`]);
    markupTimers.current[`min_${id}`] = setTimeout(() => saveServices(next), 800);
  };

  const setLeadCapture = (val) => {
    setEnableLeadCapture(val);
    if (update) update({ enableLeadCapture: val });
  };

  const addQuestion = () => {
    setCustomQuestions(prev => {
      const next = [...prev, { id: `q${Date.now()}`, label: '', type: 'text', placeholder: '', options: [] }];
      if (update) update({ customLeadQuestions: next });
      return next;
    });
  };

  const removeQuestion = (idx) => {
    setCustomQuestions(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (update) update({ customLeadQuestions: next });
      return next;
    });
  };

  const updateQuestion = (idx, key, val) => {
    setCustomQuestions(prev => {
      const next = prev.map((q, i) => i === idx ? { ...q, [key]: val } : q);
      if (update) update({ customLeadQuestions: next });
      return next;
    });
  };

  const input = {
    padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#0f172a', outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Services & Pricing</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Changes save automatically when you toggle a service.</p>
        </div>
        {(saving || savedMsg) && (
          <div style={{ fontSize: 13, fontWeight: 600, color: saving ? '#64748b' : savedMsg === 'Saved' ? '#16a34a' : '#dc2626', padding: '8px 16px', background: saving ? '#f1f5f9' : savedMsg === 'Saved' ? '#f0fdf4' : '#fef2f2', borderRadius: 8 }}>
            {saving ? 'Saving…' : savedMsg}
          </div>
        )}
      </div>

      {/* Services */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Available Services</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Disable services you don't offer. They'll be hidden from your widget.</div>
        </div>
        <div style={{ padding: 8 }}>
          {SERVICES.map(svc => {
            const s = getSvc(svc.id);
            return (
              <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 8, background: s.enabled ? 'white' : '#f8fafc', marginBottom: 4, border: `1px solid ${s.enabled ? '#e2e8f0' : '#f1f5f9'}` }}>
                <span style={{ fontSize: 22 }}>{svc.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: s.enabled ? '#0f172a' : '#94a3b8' }}>{svc.label}</span>

                {s.enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Markup:</label>
                    <input
                      type="number" step={0.05} min={0.5} max={3.0} value={s.markup}
                      onChange={e => setMarkup(svc.id, parseFloat(e.target.value) || 1.0)}
                      style={{ ...input, width: 70 }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>×</span>
                  </div>
                )}

                {s.enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Min $:</label>
                    <input
                      type="number" min={0} value={s.minimumCharge || ''}
                      onChange={e => setMinCharge(svc.id, e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Default"
                      style={{ ...input, width: 80 }}
                    />
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={e => toggleService(svc.id, e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{s.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            <strong>Markup</strong> adjusts all prices for that service. 1.0 = no change, 1.2 = 20% higher, 0.9 = 10% lower.
            <strong style={{ marginLeft: 4 }}>Min $</strong> sets the minimum quote amount. Leave blank to use system defaults.
          </p>
        </div>
      </div>

      {/* Lead capture */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lead Capture</div>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={enableLeadCapture} onChange={e => setLeadCapture(e.target.checked)} style={{ width: 18, height: 18 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Enable lead capture form</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Show name/email/phone form before displaying results. Recommended.</div>
            </div>
          </label>

          {enableLeadCapture && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#374151' }}>Custom questions (optional)</div>
              {customQuestions.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 10, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <input value={q.label} onChange={e => updateQuestion(idx, 'label', e.target.value)} placeholder="Question label (e.g. 'How did you hear about us?')" style={{ ...input, flex: 1 }} />
                    <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)} style={{ ...input, width: 120, background: 'white', cursor: 'pointer' }}>
                      <option value="text">Text input</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <button onClick={() => removeQuestion(idx)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Remove</button>
                  </div>
                  {q.type === 'select' && (
                    <input value={(q.options || []).join(',')} onChange={e => updateQuestion(idx, 'options', e.target.value.split(',').map(s => s.trim()))} placeholder="Options (comma-separated): Google,Friend,Yelp,Other" style={{ ...input, width: '100%' }} />
                  )}
                </div>
              ))}
              <button onClick={addQuestion} style={{ padding: '9px 18px', border: '2px dashed #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>
                + Add Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
