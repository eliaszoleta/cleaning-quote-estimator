import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Building, Layers, Sofa, Wind, Flame, Grid3x3, AlertTriangle, Droplets, MapPin, X, KeyRound, Construction } from 'lucide-react';
import { getAllStates } from '../../../data/statePricing';

const ALL_STATES = getAllStates();

// Canada pilot (Oct 2026) -- just the code/name this tab's region picker
// actually needs, not the SEO cost-range data ALL_STATES carries (that
// belongs to the marketing site's per-state pages, out of scope here).
// Codes/names must match CANADA_PROVINCE_NAMES' keys in
// backend/src/config/defaults.js exactly.
const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' },
];

const SERVICES = [
  { id: 'homeResidential', label: 'House Cleaning',      Icon: Home          },
  { id: 'apartment',       label: 'Apartment Cleaning',  Icon: Building2     },
  { id: 'commercial',      label: 'Commercial Cleaning', Icon: Building      },
  { id: 'carpet',          label: 'Carpet Cleaning',     Icon: Layers        },
  { id: 'upholstery',      label: 'Upholstery Cleaning', Icon: Sofa          },
  { id: 'airDuct',         label: 'Air Duct Cleaning',   Icon: Wind          },
  { id: 'dryerVent',       label: 'Dryer Vent Cleaning', Icon: Flame         },
  { id: 'tileGrout',       label: 'Tile & Grout',        Icon: Grid3x3       },
  { id: 'moldRemediation', label: 'Mold Remediation',    Icon: AlertTriangle },
  { id: 'waterDamage',     label: 'Water Damage',        Icon: Droplets      },
  { id: 'airbnb',          label: 'Airbnb Hosts & Vacation Rentals', Icon: KeyRound },
  { id: 'postConstruction', label: 'Post-Construction', Icon: Construction  },
];

// Exported so other dashboard tabs referencing "how many services we offer"
// (e.g. HelpTab.js) derive it from this real list instead of a typed-out
// number that goes stale the next time a service is added here.
export const SERVICES_COUNT = SERVICES.length;

const DEFAULT_SVC = { enabled: true, markup: 1.0, minimumCharge: null };

// Recurring-frequency discounts only apply to the two services visitors
// actually book on a recurring schedule -- used to be its own "Discount"
// nav tab, which meant leaving this page (where the rest of a service's
// pricing already lives) just to set a weekly/biweekly/monthly %.
const DISCOUNT_SERVICES = [
  { id: 'homeResidential', label: 'House Cleaning',      Icon: Home      },
  { id: 'apartment',       label: 'Apartment Cleaning',  Icon: Building2 },
  { id: 'commercial',      label: 'Commercial Cleaning', Icon: Building  },
  { id: 'airbnb',          label: 'Airbnb Hosts & Vacation Rentals', Icon: KeyRound },
];
const DISCOUNT_FREQUENCIES = [
  { id: 'weekly',   label: 'Weekly'    },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly',  label: 'Monthly'   },
];
const DEFAULT_DISCOUNTS = { weekly: 0, biweekly: 0, monthly: 0 };

export default function ServicesTab({ config, update, patchServices, autoSave }) {
  const [services, setServices] = useState({});
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [country, setCountry] = useState('US');
  const [serviceStates, setServiceStates] = useState([]);
  const [stateSearch, setStateSearch] = useState('');
  // Region list/labels switch on country -- a 'CA' company's serviceStates
  // field holds province codes instead of state codes (same storage field,
  // see DEFAULT_COMPANY_CONFIG's comment in defaults.js), so every lookup
  // below needs to resolve against whichever list actually matches what's
  // stored.
  const regionList = country === 'CA' ? CA_PROVINCES : ALL_STATES;
  const regionWord = country === 'CA' ? 'province' : 'state';
  // { [stateCode]: string[] } -- keyed by state so a company serving
  // multiple states gets each state's own city list, instead of every
  // state's cities showing up mixed together in one shared dropdown no
  // matter which state a visitor picked.
  const [serviceCities, setServiceCities] = useState({});
  const [citySearch, setCitySearch] = useState({});
  const initialized = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      initialized.current = true;
      setServices(config.services || {});
      setEnableLeadCapture(config.enableLeadCapture !== false);
      setCustomQuestions(config.customLeadQuestions || []);
      setCountry(config.country || 'US');
      setServiceStates(config.serviceStates || []);
      setServiceCities(config.serviceCities || {});
    }
  }, [config]);

  // Service Area (states + cities) saves immediately, same as the service
  // on/off toggles below -- these are discrete add/remove actions, not
  // continuous typing, so there's no "excessive autosave" concern, and
  // leaving them staged behind Save Changes was exactly the "did my change
  // actually take effect on the widget?" confusion the toggle autosave
  // already fixed once.
  const toggleState = (code) => {
    const removing = serviceStates.includes(code);
    setServiceStates(prev => {
      const next = removing ? prev.filter(c => c !== code) : [...prev, code];
      if (autoSave) autoSave({ serviceStates: next });
      else if (update) update({ serviceStates: next });
      return next;
    });
    // Drop that state's cities too when the state itself is removed --
    // otherwise they sit around orphaned, unreachable from the UI but
    // still saved.
    if (removing) {
      setServiceCities(prev => {
        if (!(code in prev)) return prev;
        const next = { ...prev };
        delete next[code];
        if (autoSave) autoSave({ serviceCities: next });
        else if (update) update({ serviceCities: next });
        return next;
      });
    }
  };

  const addCity = (stateCode, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setServiceCities(prev => {
      const existing = prev[stateCode] || [];
      if (existing.some(c => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = { ...prev, [stateCode]: [...existing, trimmed] };
      if (autoSave) autoSave({ serviceCities: next });
      else if (update) update({ serviceCities: next });
      return next;
    });
  };

  const removeCity = (stateCode, name) => {
    setServiceCities(prev => {
      const next = { ...prev, [stateCode]: (prev[stateCode] || []).filter(c => c !== name) };
      if (autoSave) autoSave({ serviceCities: next });
      else if (update) update({ serviceCities: next });
      return next;
    });
  };

  const getSvc = (id) => ({ ...DEFAULT_SVC, ...(services[id] || {}) });

  const getDiscounts = (id) => ({ ...DEFAULT_DISCOUNTS, ...(getSvc(id).frequencyDiscounts || {}) });

  // Debounced auto-save for markup/minimumCharge/discount %, same reasoning
  // as BrandingTab.js's: update() keeps the UI and localConfig current
  // instantly, but the actual persist waits until typing pauses (900ms)
  // instead of firing a full save per keystroke.
  const saveTimer = useRef(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  const scheduleAutoSave = (nextServices) => {
    if (!autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave({ services: nextServices }), 900);
  };

  const setDiscount = (id, freq, fraction) => {
    setServices(prev => {
      const svc = { ...DEFAULT_SVC, ...(prev[id] || {}) };
      const nextDiscounts = { ...DEFAULT_DISCOUNTS, ...(svc.frequencyDiscounts || {}), [freq]: fraction };
      const next = { ...prev, [id]: { ...svc, frequencyDiscounts: nextDiscounts } };
      if (update) update({ services: next });
      scheduleAutoSave(next);
      return next;
    });
  };

  const setSvc = (id, key, val) => {
    setServices(prev => {
      const next = { ...prev, [id]: { ...getSvc(id), [key]: val } };
      if (update) update({ services: next });
      scheduleAutoSave(next);
      return next;
    });
  };

  // Enable/disable saves immediately instead of waiting on the header's
  // Save Changes button -- a company turning a service off expects it gone
  // from their live widget right away, not just staged for the next manual
  // save. Markup/minimumCharge edits still go through Save Changes as
  // before (auto-saving those on every keystroke would be excessive).
  const toggleService = (id) => {
    const nextSvc = { ...getSvc(id), enabled: !getSvc(id).enabled };
    const next = { ...services, [id]: nextSvc };
    setServices(next);
    if (update) update({ services: next });
    if (patchServices) patchServices({ [id]: nextSvc });
  };

  // Lead capture toggle saves instantly, same as the service on/off
  // toggles above -- it's a discrete flip, not continuous typing.
  const setLeadCapture = (val) => {
    setEnableLeadCapture(val);
    if (update) update({ enableLeadCapture: val });
    if (autoSave) autoSave({ enableLeadCapture: val });
  };

  const scheduleQuestionsAutoSave = (nextQuestions) => {
    if (!autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave({ customLeadQuestions: nextQuestions }), 900);
  };

  const addQuestion = () => {
    setCustomQuestions(prev => {
      const next = [...prev, { id: `q${Date.now()}`, label: '', type: 'text', placeholder: '', options: [] }];
      if (update) update({ customLeadQuestions: next });
      // Adding a row is a discrete action, not typing -- save right away
      // rather than waiting on the debounce below.
      if (autoSave) autoSave({ customLeadQuestions: next });
      return next;
    });
  };

  const removeQuestion = (idx) => {
    setCustomQuestions(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (update) update({ customLeadQuestions: next });
      if (autoSave) autoSave({ customLeadQuestions: next });
      return next;
    });
  };

  const updateQuestion = (idx, key, val) => {
    setCustomQuestions(prev => {
      const next = prev.map((q, i) => i === idx ? { ...q, [key]: val } : q);
      if (update) update({ customLeadQuestions: next });
      scheduleQuestionsAutoSave(next);
      return next;
    });
  };

  const inp = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, color: '#0f172a', outline: 'none', background: 'white' };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: '-0.3px' }}>Services & Pricing</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Everything on this page saves automatically as you go — no need to click Save.</p>
      </div>

      {/* Country now lives in the dashboard header (next to Widget/Calculator
          Mode) rather than here -- same one-time account-wide setting,
          just promoted somewhere more visible. This tab (and the Service
          Area below) just reads whatever that's currently set to. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#94a3b8', marginBottom: 20 }}>
        <MapPin size={14} />
        Operating in {country === 'CA' ? 'Canada' : 'the United States'} — change this from the country switcher in the header.
      </div>

      {/* Service area */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
            <MapPin size={15} color="#2563eb" /> Service Area
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Which {regionWord}(s) do you actually operate in? Leave empty to serve all {regionList.length} {country === 'CA' ? 'provinces/territories' : 'states'} with the standard picker. Pick one {regionWord} and your widget skips the {regionWord} question entirely and just asks visitors for their city instead — pick a few and it shows only those {regionWord}s, not the full list.
          </div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          {serviceStates.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {serviceStates.map(code => {
                const s = regionList.find(st => st.code === code);
                return (
                  <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 6px 4px 12px', fontSize: 12.5, fontWeight: 600 }}>
                    {s?.name || code}
                    <button type="button" onClick={() => toggleState(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', display: 'flex', padding: 2 }}>
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <input
            style={{ ...inp, width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
            placeholder={`Search ${regionWord}s to add...`}
            value={stateSearch}
            onChange={e => setStateSearch(e.target.value)}
          />
          {stateSearch.trim() && (
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 7 }}>
              {regionList.filter(s =>
                !serviceStates.includes(s.code) &&
                (s.name.toLowerCase().includes(stateSearch.trim().toLowerCase()) || s.code.toLowerCase() === stateSearch.trim().toLowerCase())
              ).slice(0, 8).map(s => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => { toggleState(s.code); setStateSearch(''); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 13 }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cities/towns you serve -- only relevant once at least one state is
          set, since the city question only ever shows up once a state (or
          the single fixed state) is known. Free-typed by the company, not
          drawn from any external database: most cleaners serve a specific
          metro area within a state, not literally every town in it, so
          asking them what THEY cover is more accurate than any generic
          list would be anyway. */}
      {serviceStates.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Cities/Towns You Serve <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(optional)</span></div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              List the specific cities/towns you cover in each {regionWord} and your widget shows visitors a dropdown of just those instead of a free-text box. Leave a {regionWord}'s list empty and visitors can type any city for it.
            </div>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {serviceStates.map(code => {
              const stateName = regionList.find(s => s.code === code)?.name || code;
              const cities = serviceCities[code] || [];
              const search = citySearch[code] || '';
              return (
                <div key={code}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: '#374151', marginBottom: 8 }}>{stateName}</div>
                  {cities.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {cities.map(city => (
                        <span key={city} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 6px 4px 12px', fontSize: 12.5, fontWeight: 600 }}>
                          {city}
                          <button type="button" onClick={() => removeCity(code, city)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', display: 'flex', padding: 2 }}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inp, flex: 1, boxSizing: 'border-box' }}
                      placeholder={`Add a city in ${stateName} and press Enter…`}
                      value={search}
                      onChange={e => setCitySearch(prev => ({ ...prev, [code]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addCity(code, search); setCitySearch(prev => ({ ...prev, [code]: '' })); }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { addCity(code, search); setCitySearch(prev => ({ ...prev, [code]: '' })); }}
                      disabled={!search.trim()}
                      style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: search.trim() ? '#16a34a' : '#e2e8f0', color: search.trim() ? 'white' : '#94a3b8', fontWeight: 700, fontSize: 13, cursor: search.trim() ? 'pointer' : 'not-allowed' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services list */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
                  borderRadius: 7, marginBottom: 3,
                  background: s.enabled ? 'white' : '#f8fafc',
                  border: `1px solid ${s.enabled ? '#e2e8f0' : '#f1f5f9'}`,
                  flexWrap: 'wrap', transition: 'all 0.12s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                  background: s.enabled ? '#eff6ff' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={s.enabled ? '#2563eb' : '#cbd5e1'} strokeWidth={2} />
                </div>

                <span style={{ minWidth: 155, fontWeight: 600, fontSize: 14, color: s.enabled ? '#0f172a' : '#94a3b8' }}>
                  {label}
                </span>

                {s.enabled && (
                  // Each label+input is its own non-wrapping pair -- these
                  // used to be direct children of the outer flexWrap row,
                  // so on a narrow screen the row could wrap between a
                  // label and its own input ("Markup" landing on one line,
                  // its number field dropping to the next). Grouping them
                  // means wrapping only ever happens BETWEEN whole pairs.
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                      <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Markup</label>
                      <input
                        type="number" step={0.05} min={0.5} max={3.0} value={s.markup}
                        onChange={e => setSvc(id, 'markup', parseFloat(e.target.value) || 1.0)}
                        style={{ ...inp, width: 64 }}
                      />
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>×</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                      <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Min $</label>
                      <input
                        type="number" min={0} value={s.minimumCharge || ''}
                        onChange={e => setSvc(id, 'minimumCharge', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="None"
                        style={{ ...inp, width: 74 }}
                      />
                    </div>
                  </>
                )}

                {/* Toggle */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 23, cursor: 'pointer' }}>
                    <input type="checkbox" checked={s.enabled} onChange={() => toggleService(id)}
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

      {/* Recurring discounts -- off by default, same as before: a visitor
          is quoted the full price for a recurring booking unless a
          percentage is set here. */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Recurring Discounts</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Optional % off for visitors who book weekly, bi-weekly, or monthly cleaning instead of a one-time visit.</div>
        </div>
        <div style={{ padding: '6px 8px' }}>
          {DISCOUNT_SERVICES.map(({ id, label, Icon }) => {
            const d = getDiscounts(id);
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#2563eb" strokeWidth={2} />
                </div>
                <span style={{ minWidth: 155, fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{label}</span>
                {DISCOUNT_FREQUENCIES.map(({ id: freq, label: freqLabel }) => (
                  <div key={freq} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{freqLabel}</label>
                    <input
                      type="number" min={0} max={90} step={1}
                      value={Math.round((d[freq] || 0) * 100) || ''}
                      onChange={e => setDiscount(id, freq, Math.max(0, Math.min(90, parseFloat(e.target.value) || 0)) / 100)}
                      placeholder="0"
                      style={{ ...inp, width: 58 }}
                    />
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>%</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead capture */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
                <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: 13, marginBottom: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <input value={q.label} onChange={e => updateQuestion(idx, 'label', e.target.value)}
                      placeholder="Question label (e.g. 'How did you hear about us?')" style={{ ...inp, flex: 1, minWidth: 180 }} />
                    <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}
                      style={{ ...inp, width: 120, cursor: 'pointer' }}>
                      <option value="text">Text input</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <button onClick={() => removeQuestion(idx)}
                      style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
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
                style={{ padding: '8px 16px', border: '1.5px dashed #e2e8f0', borderRadius: 7, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>
                + Add Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
