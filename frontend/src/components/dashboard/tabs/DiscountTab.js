import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2 } from 'lucide-react';

const SERVICES = [
  { id: 'homeResidential', label: 'House Cleaning',     Icon: Home      },
  { id: 'apartment',       label: 'Apartment Cleaning', Icon: Building2 },
];

const FREQUENCIES = [
  { id: 'weekly',   label: 'Weekly'    },
  { id: 'biweekly', label: 'Bi-Weekly' },
  { id: 'monthly',  label: 'Monthly'   },
];

const DEFAULT_DISCOUNTS = { weekly: 0, biweekly: 0, monthly: 0 };

// Recurring-frequency discounts used to be hardcoded (20%/15%/10%) and
// applied to every visitor's estimate automatically, with no way for a
// company to turn it off. This tab makes it opt-in per service: the
// calculator only discounts a recurring booking once the company sets a
// percentage here (see frequencyDiscounts in defaults.js and
// cleaningCalculation.js) -- 0/blank means no discount at all.
export default function DiscountTab({ config, update }) {
  const [services, setServices] = useState({});
  const initialized = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      initialized.current = true;
      setServices(config.services || {});
    }
  }, [config]);

  const getDiscounts = (id) => ({ ...DEFAULT_DISCOUNTS, ...(services[id]?.frequencyDiscounts || {}) });

  const setDiscount = (id, freq, fraction) => {
    setServices(prev => {
      const svc = prev[id] || {};
      const nextDiscounts = { ...DEFAULT_DISCOUNTS, ...(svc.frequencyDiscounts || {}), [freq]: fraction };
      const next = { ...prev, [id]: { ...svc, frequencyDiscounts: nextDiscounts } };
      if (update) update({ services: next });
      return next;
    });
  };

  const inp = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#0f172a', outline: 'none', background: 'white', width: 72 };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Recurring Discounts</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Off by default — visitors are quoted the full price for recurring bookings unless you set a percentage below. Click <strong>Save Changes</strong> in the header when done.
        </p>
      </div>

      {SERVICES.map(({ id, label, Icon }) => {
        const d = getDiscounts(id);
        return (
          <div key={id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color="#2563eb" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {FREQUENCIES.map(({ id: freq, label: freqLabel }) => (
                <div key={freq}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{freqLabel}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number" min={0} max={90} step={1}
                      value={Math.round((d[freq] || 0) * 100) || ''}
                      onChange={e => setDiscount(id, freq, Math.max(0, Math.min(90, parseFloat(e.target.value) || 0)) / 100)}
                      placeholder="0"
                      style={inp}
                    />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
