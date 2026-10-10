import React, { useState, useEffect, useCallback } from 'react';
import { normalizeStateName } from '../../utils/partnerLookup';
import { formatPhoneInput } from '../../utils/formatPhone';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, HeartHandshake } from 'lucide-react';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { getAdminPartners, createAdminPartner, updateAdminPartner, toggleAdminPartner, deleteAdminPartner } from '../../utils/api';
import { theme, cardStyle, inputStyle, labelStyle, secondaryBtnStyle, primaryBtnStyle, pill, avatarGradient, PageHeader } from './adminTheme';

const EMPTY_LOCATION = { city: '', state: '' };

const EMPTY_FORM = {
  business_name: '',
  address: '',
  phone: '',
  personal_email: '',
  business_email: '',
  website: '',
  logo_url: '',
  active: true,
  locations: [EMPTY_LOCATION],
};

// adminKey comes from the shared login in AdminDashboard.js (the
// consolidated /admin shell) -- this component no longer manages its own
// auth state.
export default function AdminPartners({ adminKey }) {
  const [partners, setPartners] = useState([]);
  const [locationsByPartner, setLocationsByPartner] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const load = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminPartners(key);
      const { partners: partnerRows, locations, stats: statsRows } = res.data;
      setPartners(partnerRows || []);

      // Every city/state a partner serves (one row per city -- see the setup
      // SQL). Grouped by partner_id so the list and edit form can show all of
      // a client's cities, not just one.
      const grouped = {};
      for (const loc of locations || []) {
        if (!grouped[loc.partner_id]) grouped[loc.partner_id] = [];
        grouped[loc.partner_id].push(loc);
      }
      setLocationsByPartner(grouped);

      // Banner impressions/calls per partner, for reporting back to each
      // paying partner what they're getting for the placement.
      setStats(Object.fromEntries((statsRows || []).map(s => [s.partner_id, s])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) load(adminKey); }, [adminKey, load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { locations, ...partnerFields } = form;
    const validLocations = locations
      .map(l => ({ city: l.city.trim(), state: normalizeStateName(l.state) }))
      .filter(l => l.city && l.state);

    if (validLocations.length === 0) {
      setSaving(false);
      setError('Add at least one city/state this partner serves.');
      return;
    }

    try {
      const payload = { ...partnerFields, locations: validLocations };
      if (editId) await updateAdminPartner(adminKey, editId, payload);
      else await createAdminPartner(adminKey, payload);
    } catch (err) {
      setSaving(false);
      setError(err.message);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load(adminKey);
  };

  const handleEdit = (p) => {
    const existingLocations = (locationsByPartner[p.id] || []).map(l => ({ city: l.city, state: l.state }));
    setForm({
      business_name: p.business_name,
      address: p.address || '',
      phone: p.phone || '',
      personal_email: p.personal_email || '',
      business_email: p.business_email || '',
      website: p.website || '',
      logo_url: p.logo_url || '',
      active: p.active,
      locations: existingLocations.length > 0 ? existingLocations : [EMPTY_LOCATION],
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleToggle = async (p) => {
    try {
      await toggleAdminPartner(adminKey, p.id, !p.active);
      load(adminKey);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete this partner?', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await deleteAdminPartner(adminKey, id);
      load(adminKey);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateLocation = (index, field, value) => {
    setForm(f => ({ ...f, locations: f.locations.map((l, i) => i === index ? { ...l, [field]: value } : l) }));
  };
  const addLocation = () => setForm(f => ({ ...f, locations: [...f.locations, { ...EMPTY_LOCATION }] }));
  const removeLocation = (index) => setForm(f => ({ ...f, locations: f.locations.filter((_, i) => i !== index) }));

  return (
    <div style={{ minHeight: '100vh', background: theme.contentBg, padding: '30px 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <PageHeader
          icon={HeartHandshake}
          title="Partner Businesses"
          subtitle="These appear as recommendations on the estimate results page."
          actions={
            <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }} style={primaryBtnStyle}>
              <Plus size={15} /> Add Partner
            </button>
          }
        />
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}
        {showForm && (
          <div style={{ ...cardStyle, border: `1.5px solid rgba(79,70,229,0.3)`, padding: '24px 28px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary }}>{editId ? 'Edit Partner' : 'New Partner'}</div>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business Name *</label>
                  <input required style={inputStyle} value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Address</label>
                  <input style={inputStyle} placeholder="e.g. 123 Main St, Las Vegas, NV 89101" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>Shown in the estimate results card and the floating banner, above the phone number.</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Service Areas *</label>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>Every city/state this partner serves — the banner shows for visitors matched to any of these.</div>
                  {form.locations.map((loc, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input required style={inputStyle} placeholder="City (e.g. Las Vegas)" value={loc.city} onChange={e => updateLocation(i, 'city', e.target.value)} />
                      <input required style={inputStyle} placeholder="State — full name (e.g. Nevada)" value={loc.state} onChange={e => updateLocation(i, 'state', e.target.value)} />
                      <button type="button" onClick={() => removeLocation(i)} disabled={form.locations.length === 1} style={{ background: 'none', border: 'none', cursor: form.locations.length === 1 ? 'not-allowed' : 'pointer', color: form.locations.length === 1 ? '#cbd5e1' : '#ef4444', padding: 4, flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: `1.5px dashed ${theme.border}`, borderRadius: theme.radiusSm, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, color: theme.accentSolid }}>
                    <Plus size={13} /> Add another city
                  </button>
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label style={labelStyle}>Personal Email</label>
                  <input type="email" style={inputStyle} value={form.personal_email} onChange={e => setForm(f => ({ ...f, personal_email: e.target.value }))} />
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>What they sign in with at /client for their KPI dashboard. Never shown publicly.</div>
                </div>
                <div>
                  <label style={labelStyle}>Business Email</label>
                  <input type="email" style={inputStyle} value={form.business_email} onChange={e => setForm(f => ({ ...f, business_email: e.target.value }))} />
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>Where opted-in leads get forwarded, and shown on the results card/banner.</div>
                </div>
                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input style={inputStyle} placeholder="https://..." value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Logo URL</label>
                  <input style={inputStyle} placeholder="https://... (optional)" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>Active</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.active ? '#16a34a' : '#94a3b8', padding: 0 }}>
                    {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{form.active ? 'Will appear on results page' : 'Hidden'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} style={{ ...secondaryBtnStyle, padding: '10px 20px', fontSize: 14 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...primaryBtnStyle, padding: '10px 24px', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : (editId ? 'Save Changes' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading...</div>
        ) : partners.length === 0 ? (
          <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: theme.textMuted }}>No partners yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {partners.map(p => (
              <div key={p.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: p.active ? 1 : 0.6 }}>
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.business_name} style={{ height: 44, width: 44, objectFit: 'contain', borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: avatarGradient(p.business_name || p.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                    {p.business_name ? p.business_name[0].toUpperCase() : '?'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>{p.business_name}</div>
                  {(p.address || p.phone) && (
                    <div style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 2 }}>{p.address}{p.address && p.phone && ' · '}{p.phone}</div>
                  )}
                  {(p.personal_email || p.business_email) && (
                    <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                      {p.personal_email && <>Personal: {p.personal_email}</>}
                      {p.personal_email && p.business_email && '  ·  '}
                      {p.business_email && <>Business: {p.business_email}</>}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                    {(locationsByPartner[p.id] || []).map((loc, i) => (
                      <span key={i} style={pill(theme.textSecondary, theme.contentBg)}>{loc.city}, {loc.state}</span>
                    ))}
                  </div>
                  <PartnerBannerStats stats={stats[p.id]} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={pill(p.active ? '#16a34a' : '#94a3b8', p.active ? '#f0fdf4' : theme.contentBg)}>{p.active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => handleToggle(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.active ? '#16a34a' : '#94a3b8', padding: 4 }}>
                    {p.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => handleEdit(p)} style={{ ...secondaryBtnStyle, padding: '6px 14px', fontSize: 12.5 }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}

// Impressions/calls for the floating banner (see partner_banner_stats view
// in the setup SQL) -- the KPI numbers reported back to each paying partner.
function PartnerBannerStats({ stats }) {
  const impressions = stats?.impressions || 0;
  const calls = stats?.calls || 0;
  const leads = stats?.leads || 0;
  if (!impressions && !calls && !leads) return null;
  const ctr = impressions > 0 ? ((calls / impressions) * 100).toFixed(1) : '0.0';
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 7, fontSize: 12, color: theme.textSecondary }}>
      <span><strong>{impressions.toLocaleString()}</strong> banner views</span>
      <span><strong>{calls.toLocaleString()}</strong> call button taps</span>
      <span><strong>{leads.toLocaleString()}</strong> leads emailed</span>
      <span style={{ color: theme.textMuted }}>{ctr}% CTR</span>
    </div>
  );
}
