import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { normalizeStateName } from '../../utils/partnerLookup';
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

const EMPTY_LOCATION = { city: '', state: '' };

const EMPTY_FORM = {
  business_name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  active: true,
  locations: [EMPTY_LOCATION],
};

export default function AdminPartners() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [partners, setPartners] = useState([]);
  const [locationsByPartner, setLocationsByPartner] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (!error) setPartners(data || []);
    else setError(error.message);

    // Every city/state a partner serves (one row per city -- see the setup
    // SQL). Grouped by partner_id so the list and edit form can show all of
    // a client's cities, not just one.
    const { data: locData } = await supabase.from('partner_locations').select('*').order('city');
    if (locData) {
      const grouped = {};
      for (const loc of locData) {
        if (!grouped[loc.partner_id]) grouped[loc.partner_id] = [];
        grouped[loc.partner_id].push(loc);
      }
      setLocationsByPartner(grouped);
    }

    // Banner impressions/calls per partner, for reporting back to each
    // paying partner what they're getting for the placement. Reads from the
    // partner_banner_stats view (see the setup SQL) -- silently skipped if
    // that view doesn't exist yet so it never breaks the main partner list.
    const { data: statsData } = await supabase.from('partner_banner_stats').select('*');
    if (statsData) {
      setStats(Object.fromEntries(statsData.map(s => [s.partner_id, s])));
    }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', '1');
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase) return;
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

    let partnerId = editId;
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('partners').update(partnerFields).eq('id', editId));
    } else {
      const { data, error: insertErr } = await supabase.from('partners').insert(partnerFields).select().single();
      err = insertErr;
      partnerId = data?.id;
    }
    if (err) { setSaving(false); setError(err.message); return; }

    // Full-replace the partner's service areas: simplest way to keep them
    // in sync with whatever the form currently has, added/removed/edited.
    const { error: delErr } = await supabase.from('partner_locations').delete().eq('partner_id', partnerId);
    if (!delErr) {
      const { error: locErr } = await supabase.from('partner_locations').insert(
        validLocations.map(l => ({ partner_id: partnerId, city: l.city, state: l.state }))
      );
      if (locErr) { setSaving(false); setError(locErr.message); return; }
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = (p) => {
    const existingLocations = (locationsByPartner[p.id] || []).map(l => ({ city: l.city, state: l.state }));
    setForm({
      business_name: p.business_name,
      address: p.address || '',
      phone: p.phone || '',
      email: p.email || '',
      website: p.website || '',
      logo_url: p.logo_url || '',
      active: p.active,
      locations: existingLocations.length > 0 ? existingLocations : [EMPTY_LOCATION],
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleToggle = async (p) => {
    await supabase.from('partners').update({ active: !p.active }).eq('id', p.id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this partner?')) return;
    await supabase.from('partners').delete().eq('id', id);
    load();
  };

  const updateLocation = (index, field, value) => {
    setForm(f => ({ ...f, locations: f.locations.map((l, i) => i === index ? { ...l, [field]: value } : l) }));
  };
  const addLocation = () => setForm(f => ({ ...f, locations: [...f.locations, { ...EMPTY_LOCATION }] }));
  const removeLocation = (index) => setForm(f => ({ ...f, locations: f.locations.filter((_, i) => i !== index) }));

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Clean Estimator Partner Management</div>
        <input type="password" placeholder="Password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }} style={{ ...inputStyle, marginBottom: 12, borderColor: pwError ? '#ef4444' : '#e2e8f0' }} autoFocus />
        {pwError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>Incorrect password.</div>}
        <button type="submit" style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Log In</button>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a' }}>Partner Businesses</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>These appear as recommendations on the estimate results page.</div>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Plus size={15} /> Add Partner
          </button>
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}
        {!supabase && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', color: '#92400e', fontSize: 13, marginBottom: 20 }}>Supabase is not configured.</div>}
        {showForm && (
          <div style={{ background: 'white', border: '1.5px solid #2563eb', borderRadius: 14, padding: '24px 28px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{editId ? 'Edit Partner' : 'New Partner'}</div>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Business Name *</label>
                  <input required style={inputStyle} value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Address</label>
                  <input style={inputStyle} placeholder="e.g. 123 Main St, Las Vegas, NV 89101" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Shown in the estimate results card and the floating banner, above the phone number.</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Service Areas *</label>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Every city/state this partner serves — the banner shows for visitors matched to any of these.</div>
                  {form.locations.map((loc, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input required style={inputStyle} placeholder="City (e.g. Las Vegas)" value={loc.city} onChange={e => updateLocation(i, 'city', e.target.value)} />
                      <input required style={inputStyle} placeholder="State — full name (e.g. Nevada)" value={loc.state} onChange={e => updateLocation(i, 'state', e.target.value)} />
                      <button type="button" onClick={() => removeLocation(i)} disabled={form.locations.length === 1} style={{ background: 'none', border: 'none', cursor: form.locations.length === 1 ? 'not-allowed' : 'pointer', color: form.locations.length === 1 ? '#cbd5e1' : '#ef4444', padding: 4, flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, color: '#2563eb' }}>
                    <Plus size={13} /> Add another city
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Email</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Website URL</label>
                  <input style={inputStyle} placeholder="https://..." value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Logo URL</label>
                  <input style={inputStyle} placeholder="https://... (optional)" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Active</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.active ? '#16a34a' : '#94a3b8', padding: 0 }}>
                    {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{form.active ? 'Will appear on results page' : 'Hidden'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : (editId ? 'Save Changes' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
        ) : partners.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 40, textAlign: 'center', color: '#94a3b8' }}>No partners yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {partners.map(p => (
              <div key={p.id} style={{ background: 'white', border: `1.5px solid ${p.active ? '#e2e8f0' : '#f1f5f9'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: p.active ? 1 : 0.6 }}>
                {p.logo_url && <img src={p.logo_url} alt={p.business_name} style={{ height: 44, width: 44, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{p.business_name}</div>
                  {(p.address || p.phone) && (
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{p.address}{p.address && p.phone && ' · '}{p.phone}</div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                    {(locationsByPartner[p.id] || []).map((loc, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#475569', background: '#f1f5f9', borderRadius: 5, padding: '2px 8px' }}>{loc.city}, {loc.state}</span>
                    ))}
                  </div>
                  <PartnerBannerStats stats={stats[p.id]} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.active ? '#16a34a' : '#94a3b8', background: p.active ? '#f0fdf4' : '#f8fafc', border: `1px solid ${p.active ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 6, padding: '3px 9px' }}>{p.active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => handleToggle(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.active ? '#16a34a' : '#94a3b8', padding: 4 }}>
                    {p.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => handleEdit(p)} style={{ padding: '6px 14px', border: '1.5px solid #e2e8f0', borderRadius: 7, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, color: '#374151' }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#374151' }}>
      <span><strong>{impressions.toLocaleString()}</strong> banner views</span>
      <span><strong>{calls.toLocaleString()}</strong> call button taps</span>
      <span><strong>{leads.toLocaleString()}</strong> leads emailed</span>
      <span style={{ color: '#94a3b8' }}>{ctr}% CTR</span>
    </div>
  );
}
