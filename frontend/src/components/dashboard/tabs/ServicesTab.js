import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Building, Layers, Wind, Flame, Grid3x3, AlertTriangle, Droplets } from 'lucide-react';

const SERVICES = [
  { id: 'homeResidential', label: 'House Cleaning',      Icon: Home          },
  { id: 'apartment',       label: 'Apartment Cleaning',  Icon: Building2     },
  { id: 'commercial',      label: 'Commercial Cleaning', Icon: Building      },
  { id: 'carpet',          label: 'Carpet Cleaning',     Icon: Layers        },
  { id: 'airDuct',         label: 'Air Duct Cleaning',   Icon: Wind          },
  { id: 'dryerVent',       label: 'Dryer Vent Cleaning', Icon: Flame         },
  { id: 'tileGrout',       label: 'Tile & Grout',        Icon: Grid3x3       },
  { id: 'moldRemediation', label: 'Mold Remediation',    Icon: AlertTriangle },
  { id: 'waterDamage',     label: 'Water Damage',        Icon: Droplets      },
];

const DEFAULT_SVC = { enabled: true, markup: 1.0, minimumCharge: null };

export default function ServicesTab({ config, update }) {
  const [services, setServices] = useState({});
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [customQuestions, setCustomQuestions] = useState([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      initialized.current = true;
      setServices(config.services || {});
      setEnableLeadCapture(config.enableLeadCapture !== false);
      setCustomQuestions(config.customLeadQuestions || []);
    }
  }, [config]);

  const getSvc = (id) => ({ ...DEFAULT_SVC, ...(services[id] || {}) });

  const setSvc = (id, key, val) => {
    setServices(prev => {
      const next = { ...prev, [id]: { ...getSvc(id), [key]: val } };
      if (update) update({ services: next });
      return next;
    });
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

  const inp = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#0f172a', outline: 'none', background: 'white' };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Services & Pricing</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Toggle services and set pricing. Click <strong>Save Changes</strong> in the header when done.</p>
      </div>

      {/* Services list */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Available Services</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Disabled services are hidden from your widget.</div>
          </div>
        </div>

        <div style={{ padding: '6px 8px' }}>
          {SERVICES.map(({ id, label, Icon }) => {
            const s = getSvc(id);
            return (
              <div
                key={id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, marginBottom: 3,
                  background: s.enabled ? 'white' : '#f8fafc',
                  border: `1px solid ${s.enabled ? '#e2e8f0' : '#f1f5f9'}`,
                  flexWrap: 'wrap', transition: 'all 0.12s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: s.enabled ? '#eff6ff' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={s.enabled ? '#2563eb' : '#cbd5e1'} strokeWidth={2} />
                </div>

                <span style={{ minWidth: 155, fontWeight: 600, fontSize: 14, color: s.enabled ? '#0f172a' : '#94a3b8' }}>
                  {label}
                </span>

                {s.enabled && (
                  <>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Markup</label>
                    <input
                      type="number" step={0.05} min={0.5} max={3.0} value={s.markup}
                      onChange={e => setSvc(id, 'markup', parseFloat(e.target.value) || 1.0)}
                      style={{ ...inp, width: 64 }}
                    />
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>×</span>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Min $</label>
                    <input
                      type="number" min={0} value={s.minimumCharge || ''}
                      onChange={e => setSvc(id, 'minimumCharge', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="None"
                      style={{ ...inp, width: 74 }}
                    />
                  </>
                )}

                {/* Toggle */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 23, cursor: 'pointer' }}>
                    <input type="checkbox" checked={s.enabled} onChange={e => setSvc(id, 'enabled', e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 23, background: s.enabled ? '#2563eb' : '#cbd5e1', transition: 'background 0.2s' }}>
                      <span style={{ position: 'absolute', top: 2.5, left: s.enabled ? 21 : 2.5, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </span>
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.enabled ? '#2563eb' : '#94a3b8', minWidth: 22 }}>
                    {s.enabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 12, color: '#94a3b8' }}>
          <strong style={{ color: '#64748b' }}>Markup:</strong> 1.0 = no change, 1.2 = +20%. &nbsp;
          <strong style={{ color: '#64748b' }}>Min $:</strong> minimum quote amount (leave blank for defaults).
        </div>
      </div>

      {/* Lead capture */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Lead Capture</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Collect contact info before showing the quote.</div>
        </div>
        <div style={{ padding: 18 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 18 }}>
            <div style={{ position: 'relative', display: 'inline-block', width: 42, height: 23, flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
              <input type="checkbox" checked={enableLeadCapture} onChange={e => setLeadCapture(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 23, background: enableLeadCapture ? '#2563eb' : '#cbd5e1', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2.5, left: enableLeadCapture ? 21 : 2.5, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Enable lead capture form</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Show name / email / phone form before displaying results.</div>
            </div>
          </label>

          {enableLeadCapture && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>
                Custom questions <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(optional)</span>
              </div>
              {customQuestions.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 13, marginBottom: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <input value={q.label} onChange={e => updateQuestion(idx, 'label', e.target.value)}
                      placeholder="Question label (e.g. 'How did you hear about us?')" style={{ ...inp, flex: 1, minWidth: 180 }} />
                    <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}
                      style={{ ...inp, width: 120, cursor: 'pointer' }}>
                      <option value="text">Text input</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <button onClick={() => removeQuestion(idx)}
                      style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      Remove
                    </button>
                  </div>
                  {q.type === 'select' && (
                    <input value={(q.options || []).join(',')} onChange={e => updateQuestion(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Options comma-separated: Google,Friend,Yelp,Other" style={{ ...inp, width: '100%' }} />
                  )}
                </div>
              ))}
              <button onClick={addQuestion}
                style={{ padding: '8px 16px', border: '1.5px dashed #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>
                + Add Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
