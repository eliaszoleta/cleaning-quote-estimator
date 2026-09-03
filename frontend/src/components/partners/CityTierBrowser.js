import React, { useState } from 'react';
import { getAllStates } from '../../data/statePricing';
import { getAllCityTierEntries } from '../../data/partnerCityTiers';

const PRIMARY = '#2563eb';

function formatPopulation(population) {
  if (population >= 1000000) return `${(population / 1000000).toFixed(population % 1000000 === 0 ? 0 : 1)}M`;
  return `${Math.round(population / 1000)}K`;
}

const IconArrow = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13,6 19,12 13,18" />
  </svg>
);

const ALL_STATES = getAllStates();
const ALL_CITY_TIERS = getAllCityTierEntries();

// Every state paired with its cities (major/minor tier + price), sorted by
// population -- shared by the Partner With Us page's collapsible browser and
// the standalone /partner-city-pricing page.
export const STATES_WITH_CITIES = ALL_STATES
  .map(s => ({ ...s, cities: ALL_CITY_TIERS.filter(c => c.stateCode === s.code).sort((a, b) => b.population - a.population) }))
  .filter(s => s.cities.length > 0);

// alwaysOpen: skip the "See pricing for..." toggle button and render the
// search + state list directly -- used on the dedicated pricing page, where
// the whole point of the page is this list.
export default function CityTierBrowser({ alwaysOpen = false }) {
  const [open, setOpen] = useState(alwaysOpen);
  const [search, setSearch] = useState('');
  const [openStates, setOpenStates] = useState(() => new Set());

  const q = search.trim().toLowerCase();
  const filtered = q
    ? STATES_WITH_CITIES
        .map(s => ({ ...s, cities: s.cities.filter(c => c.city.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) }))
        .filter(s => s.cities.length > 0)
    : STATES_WITH_CITIES;

  const toggleState = (code) => {
    setOpenStates(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: alwaysOpen ? '0 auto' : '24px auto 0' }}>
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'white', border: `1.5px solid ${PRIMARY}`, color: PRIMARY, borderRadius: 12, padding: '13px 20px', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}
        >
          {open ? 'Hide' : `See pricing for all ${ALL_CITY_TIERS.length}+ cities we cover`}
          <IconArrow size={14} color={PRIMARY} />
        </button>
      )}
      {open && (
        <div style={{ marginTop: alwaysOpen ? 0 : 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <input
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white', marginBottom: 12 }}
            placeholder="Search for your city or state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: alwaysOpen ? 'none' : 420, overflowY: alwaysOpen ? 'visible' : 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.length === 0 && (
              <div style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No matches. We may not have your city's population on file yet &mdash; add it in the application form and we'll confirm your tier directly.</div>
            )}
            {filtered.map(s => {
              const isOpen = q ? true : openStates.has(s.code);
              const majorCount = s.cities.filter(c => c.tier === 'major').length;
              return (
                <div key={s.code} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleState(s.code)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.name} <span style={{ fontWeight: 500, color: '#94a3b8' }}>({s.cities.length})</span></span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{majorCount} major &middot; {s.cities.length - majorCount} minor</span>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                      {s.cities.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', fontSize: 13, borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                          <span style={{ color: '#374151' }}>{c.city} <span style={{ color: '#94a3b8', fontSize: 11.5, fontWeight: 500 }}>&middot; pop. {formatPopulation(c.population)}</span></span>
                          <span style={{ fontWeight: 700, color: c.tier === 'major' ? PRIMARY : '#9333ea' }}>${c.price}/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>Tiers are based on well-established population estimates, not exact census counts &mdash; good enough to classify a city, not a precision figure. Don't see your city? Reach out and we'll confirm your exact rate.</p>
        </div>
      )}
    </div>
  );
}
