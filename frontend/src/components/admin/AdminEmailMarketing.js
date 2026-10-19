import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, Trash2, Eye, Send, X, RefreshCw, Calendar, Ban, ArrowLeft, Search } from 'lucide-react';
import {
  getAdminEmailTemplates, createAdminEmailTemplate, updateAdminEmailTemplate, deleteAdminEmailTemplate,
  resyncAdminEmailTemplateDefault,
  previewAdminEmailAudience, sendAdminIndividualEmail, grantLegacyWinbackTrial,
  getAdminEmailCampaigns, getAdminEmailCampaign, createAdminEmailCampaign, cancelAdminEmailCampaign,
  getAdminHomepageLeads, getAdminCompanies, getAdminPartners,
} from '../../utils/api';
import { theme, cardStyle, inputStyle, labelStyle, secondaryBtnStyle, primaryBtnStyle, dangerBtnStyle, pill, PageHeader } from './adminTheme';

const SUB_TABS = [
  { slug: 'templates', label: 'Templates' },
  { slug: 'compose', label: 'Compose / Send' },
  { slug: 'campaigns', label: 'Campaigns' },
];

export default function AdminEmailMarketing({ adminKey }) {
  const [sub, setSub] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await getAdminEmailTemplates(adminKey);
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Error loading templates:', err.message);
    } finally {
      setTemplatesLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { if (adminKey) loadTemplates(); }, [adminKey, loadTemplates]);

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: theme.contentBg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader
          icon={Mail}
          title="Email Marketing"
          subtitle="Templates (including every automated lifecycle email), individual sends, and scheduled bulk campaigns."
        />

        <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.05)', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 22 }}>
          {SUB_TABS.map(t => (
            <button key={t.slug} onClick={() => setSub(t.slug)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: sub === t.slug ? theme.cardBg : 'transparent', color: sub === t.slug ? theme.textPrimary : theme.textMuted,
              boxShadow: sub === t.slug ? theme.shadowSm : 'none', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {sub === 'templates' && (
          <TemplatesPanel adminKey={adminKey} templates={templates} loading={templatesLoading} reload={loadTemplates} />
        )}
        {sub === 'compose' && (
          <ComposePanel adminKey={adminKey} templates={templates} />
        )}
        {sub === 'campaigns' && (
          <CampaignsPanel adminKey={adminKey} templates={templates} />
        )}
      </div>
    </div>
  );
}

// ─── Templates ──────────────────────────────────────────────────────────────

const EMPTY_DRAFT = { name: '', subject: '', html_body: '', text_body: '', variables: [] };

function TemplatesPanel({ adminKey, templates, loading, reload }) {
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const selected = templates.find(t => t.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDraft({ name: selected.name, subject: selected.subject, html_body: selected.html_body, text_body: selected.text_body, variables: selected.variables || [] });
      setCreating(false);
      setSaveMsg('');
      setShowPreview(false);
    }
  }, [selected]);

  const startNew = () => {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setCreating(true);
    setSaveMsg('');
    setShowPreview(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      if (creating) {
        const res = await createAdminEmailTemplate(adminKey, draft);
        await reload();
        setSelectedId(res.data.id);
        setCreating(false);
      } else if (selected) {
        await updateAdminEmailTemplate(adminKey, selected.id, draft);
        await reload();
      }
      setSaveMsg('Saved');
    } catch (err) {
      setSaveMsg(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Overwrites this lifecycle template's content with whatever's currently
  // hardcoded in the backend's emailTemplateDefaults.js. Needed because a
  // code change to an already-seeded template never reaches this row on its
  // own -- ensureSeeded() only inserts it once, by design, so a later admin
  // edit here doesn't get silently clobbered on the next deploy. The
  // tradeoff: a code-side copy change needs this explicit click too.
  const resyncFromDefault = async () => {
    if (!selected || !window.confirm(`Overwrite "${selected.name}" with the current code default? Any edits made here will be lost.`)) return;
    setResyncing(true);
    setSaveMsg('');
    try {
      await resyncAdminEmailTemplateDefault(adminKey, selected.id);
      await reload();
      setSaveMsg('Resynced from code');
    } catch (err) {
      setSaveMsg(err.message || 'Failed to resync');
    } finally {
      setResyncing(false);
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete template "${selected.name}"? This can't be undone.`)) return;
    try {
      await deleteAdminEmailTemplate(adminKey, selected.id);
      setSelectedId(null);
      setDraft(EMPTY_DRAFT);
      await reload();
    } catch (err) {
      setSaveMsg(err.message || 'Failed to delete');
    }
  };

  const updateVarRow = (i, field, value) => {
    setDraft(prev => {
      const vars = [...prev.variables];
      vars[i] = { ...vars[i], [field]: value };
      return { ...prev, variables: vars };
    });
  };
  const addVarRow = () => setDraft(prev => ({ ...prev, variables: [...prev.variables, { name: '', example: '' }] }));
  const removeVarRow = (i) => setDraft(prev => ({ ...prev, variables: prev.variables.filter((_, idx) => idx !== i) }));

  const previewHtml = (draft.html_body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    const v = (draft.variables || []).find(x => x.name === name);
    return v?.example || `{{${name}}}`;
  });

  const lifecycle = templates.filter(t => t.category === 'lifecycle');
  const marketing = templates.filter(t => t.category !== 'lifecycle');

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <button onClick={startNew} style={{ ...primaryBtnStyle, width: '100%', marginBottom: 14 }}>
          <Plus size={14} /> New marketing template
        </button>
        {loading ? (
          <div style={{ color: theme.textMuted, fontSize: 13, padding: 12 }}>Loading…</div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 8px' }}>Marketing ({marketing.length})</div>
            {marketing.map(t => (
              <TemplateRow key={t.id} t={t} active={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Lifecycle (automated) ({lifecycle.length})</div>
            {lifecycle.map(t => (
              <TemplateRow key={t.id} t={t} active={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
            ))}
          </>
        )}
      </div>

      {(selected || creating) && (
        <div style={{ ...cardStyle, flex: 1, minWidth: 0, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.textPrimary }}>{creating ? 'New template' : selected.name}</div>
              {!creating && selected.key && <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>key: {selected.key} — triggered automatically by the app, editable but not deletable</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!creating && selected?.key && (
                <button onClick={resyncFromDefault} disabled={resyncing} style={{ ...secondaryBtnStyle, opacity: resyncing ? 0.7 : 1 }} title="Overwrite with the current hardcoded copy from emailTemplateDefaults.js">
                  <RefreshCw size={13} /> {resyncing ? 'Resyncing…' : 'Resync from code'}
                </button>
              )}
              <button onClick={() => setShowPreview(p => !p)} style={secondaryBtnStyle}><Eye size={13} /> {showPreview ? 'Edit' : 'Preview'}</button>
              {!creating && !selected.key && <button onClick={remove} style={dangerBtnStyle}><Trash2 size={13} /></button>}
            </div>
          </div>

          {showPreview ? (
            <div>
              <div style={{ fontSize: 12.5, color: theme.textSecondary, marginBottom: 8 }}>Subject: <strong style={{ color: theme.textPrimary }}>{draft.subject}</strong></div>
              <iframe title="Template preview" srcDoc={previewHtml} style={{ width: '100%', height: 480, border: `1px solid ${theme.border}`, borderRadius: theme.radiusMd }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input style={inputStyle} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Subject</label>
                  <input style={inputStyle} value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} placeholder="Use {{tokens}} for merge fields" />
                </div>
                <div>
                  <label style={labelStyle}>HTML body</label>
                  <textarea style={{ ...inputStyle, fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, minHeight: 220, resize: 'vertical' }} value={draft.html_body} onChange={e => setDraft(d => ({ ...d, html_body: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Plain-text body</label>
                  <textarea style={{ ...inputStyle, fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, minHeight: 120, resize: 'vertical' }} value={draft.text_body} onChange={e => setDraft(d => ({ ...d, text_body: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Variables ({'{{'}name{'}}'} tokens this template uses)</label>
                  {(draft.variables || []).map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                      <input style={{ ...inputStyle, flex: 1 }} placeholder="name" value={v.name} onChange={e => updateVarRow(i, 'name', e.target.value)} />
                      <input style={{ ...inputStyle, flex: 2 }} placeholder="example value (used in preview)" value={v.example} onChange={e => updateVarRow(i, 'example', e.target.value)} />
                      <button onClick={() => removeVarRow(i)} style={{ ...secondaryBtnStyle, padding: '9px 10px' }}><X size={13} /></button>
                    </div>
                  ))}
                  <button onClick={addVarRow} style={secondaryBtnStyle}><Plus size={13} /> Add variable</button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: `1px solid ${theme.borderSoft}` }}>
                <button onClick={save} disabled={saving || !draft.name || !draft.subject || !draft.html_body} style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : creating ? 'Create template' : 'Save changes'}
                </button>
                {saveMsg && <span style={{ fontSize: 12.5, color: saveMsg === 'Saved' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{saveMsg}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ t, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '9px 12px', borderRadius: theme.radiusSm, cursor: 'pointer', marginBottom: 4,
      background: active ? '#eef2ff' : 'transparent', border: `1px solid ${active ? 'rgba(79,70,229,0.25)' : 'transparent'}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{t.name}</div>
      <div style={{ fontSize: 11.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
    </div>
  );
}

// ─── Compose / Send ─────────────────────────────────────────────────────────

function ComposePanel({ adminKey, templates }) {
  const [mode, setMode] = useState('individual');
  const [templateId, setTemplateId] = useState('');
  const template = templates.find(t => t.id === templateId) || null;

  // Individual
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [varValues, setVarValues] = useState({});
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Recipient picker -- 'custom' keeps the old freeform To/Name entry;
  // 'lead'/'company'/'partner' sends recipientType+recipientRef instead, so
  // the backend looks the real record up server-side and auto-fills merge
  // fields (name, companyName, email, and for companies, signupDateSuffix)
  // from the actual stored data instead of whatever an admin hand-types --
  // exactly the gap that let activation_reminder go out once with a blank
  // signup date (a manual send with nothing typed into that merge field).
  const [recipientMode, setRecipientMode] = useState('custom');
  const [recipientLists, setRecipientLists] = useState({ lead: null, company: null, partner: null });
  const [recipientListLoading, setRecipientListLoading] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const loadRecipientList = useCallback(async (mode) => {
    if (mode === 'custom' || recipientLists[mode]) return;
    setRecipientListLoading(true);
    try {
      let rows = [];
      if (mode === 'lead') {
        const res = await getAdminHomepageLeads(adminKey);
        rows = (res.data || []).map(l => ({ id: l.id, name: l.name || '(no name)', email: l.email, detail: l.service_type ? l.service_type.replace(/_/g, ' ') : '' }));
      } else if (mode === 'company') {
        const res = await getAdminCompanies(adminKey);
        rows = (res.data || []).map(c => ({ id: c.companyId, name: c.companyName, email: c.email, detail: c.signedUpAt ? `signed up ${new Date(c.signedUpAt).toLocaleDateString()}` : '' }));
      } else if (mode === 'partner') {
        const res = await getAdminPartners(adminKey);
        rows = (res.data?.partners || []).map(p => ({ id: p.id, name: p.business_name, email: p.business_email, detail: '' }));
      }
      setRecipientLists(prev => ({ ...prev, [mode]: rows }));
    } catch (err) {
      console.error(`Failed to load ${mode} list:`, err.message);
      setRecipientLists(prev => ({ ...prev, [mode]: [] }));
    } finally {
      setRecipientListLoading(false);
    }
  }, [adminKey, recipientLists]);

  const switchRecipientMode = (mode) => {
    setRecipientMode(mode);
    setSelectedRecipient(null);
    setRecipientQuery('');
    if (mode !== 'custom') loadRecipientList(mode);
  };

  const currentList = recipientLists[recipientMode] || [];
  const filteredRecipients = recipientQuery.trim()
    ? currentList.filter(r => `${r.name} ${r.email}`.toLowerCase().includes(recipientQuery.trim().toLowerCase()))
    : currentList;

  // Bulk
  const [sources, setSources] = useState({ leads: true, companies: false, partners: false });
  const [leadScope, setLeadScope] = useState('all');
  const [leadUserType, setLeadUserType] = useState('all');
  const [companyActiveOnly, setCompanyActiveOnly] = useState(true);
  const [companyLegacyNoCardOnly, setCompanyLegacyNoCardOnly] = useState(false);
  const [partnersActiveOnly, setPartnersActiveOnly] = useState(true);
  const [campaignName, setCampaignName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState(null);

  const grantTrial = async () => {
    if (!window.confirm('Grant a fresh 30-day Stripe trial to every legacy no-card signup that doesn\'t already have one? This changes what happens when they check out -- do this once, right before sending the win-back campaign.')) return;
    setGranting(true);
    setGrantResult(null);
    try {
      const res = await grantLegacyWinbackTrial(adminKey);
      setGrantResult({ ok: true, msg: `Granted to ${res.granted} compan${res.granted === 1 ? 'y' : 'ies'} (${res.alreadyEligible} already had it).` });
    } catch (err) {
      setGrantResult({ ok: false, msg: err.message || 'Failed to grant trial eligibility' });
    } finally {
      setGranting(false);
    }
  };

  useEffect(() => {
    setVarValues({}); setSendResult(null); setPreview(null); setCreateResult(null);
    setRecipientMode('custom'); setSelectedRecipient(null); setRecipientQuery('');
  }, [templateId]);

  const buildAudience = () => ({
    sources: Object.entries(sources).filter(([, v]) => v).map(([k]) => k),
    leadScope, leadUserType, companyActiveOnly, companyLegacyNoCardOnly, partnersActiveOnly,
  });

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const res = await previewAdminEmailAudience(adminKey, buildAudience());
      setPreview(res);
    } catch (err) {
      setPreview({ error: err.message });
    } finally {
      setPreviewing(false);
    }
  };

  const sendIndividual = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const payload = recipientMode !== 'custom' && selectedRecipient
        ? { templateId, recipientType: recipientMode, recipientRef: selectedRecipient.id, vars: varValues }
        : { templateId, to: { email: toEmail, name: toName }, vars: varValues };
      await sendAdminIndividualEmail(adminKey, payload);
      setSendResult({ ok: true, msg: `Sent to ${recipientMode !== 'custom' ? selectedRecipient.email : toEmail}` });
      setToEmail(''); setToName(''); setSelectedRecipient(null); setRecipientQuery('');
    } catch (err) {
      setSendResult({ ok: false, msg: err.message || 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  const canSendIndividual = recipientMode === 'custom' ? !!toEmail : !!selectedRecipient;

  const createCampaign = async () => {
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await createAdminEmailCampaign(adminKey, {
        templateId, name: campaignName || template?.name || 'Untitled campaign',
        audience: buildAudience(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      setCreateResult({ ok: true, msg: `Scheduled for ${res.recipientCount} recipient${res.recipientCount === 1 ? '' : 's'}${scheduledAt ? '' : ' — sending begins within about a minute'}.` });
      setCampaignName(''); setScheduledAt(''); setPreview(null);
    } catch (err) {
      setCreateResult({ ok: false, msg: err.message || 'Failed to create campaign' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ ...cardStyle, flex: 1, maxWidth: 640, padding: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Template</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">Select a template…</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}{t.key ? ' (lifecycle)' : ''}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.05)', borderRadius: 9, padding: 3, width: 'fit-content', marginBottom: 18 }}>
          {[['individual', 'Individual'], ['bulk', 'Bulk / Scheduled']].map(([v, label]) => (
            <button key={v} onClick={() => setMode(v)} style={{
              padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12.5,
              background: mode === v ? theme.cardBg : 'transparent', color: mode === v ? theme.textPrimary : theme.textMuted,
              boxShadow: mode === v ? theme.shadowSm : 'none',
            }}>{label}</button>
          ))}
        </div>

        {!template ? (
          <p style={{ fontSize: 13, color: theme.textMuted }}>Pick a template above to continue.</p>
        ) : mode === 'individual' ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Recipient</label>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.05)', borderRadius: 9, padding: 3, width: 'fit-content' }}>
                {[['custom', 'Custom'], ['lead', 'Lead'], ['company', 'Company'], ['partner', 'Partner']].map(([v, label]) => (
                  <button key={v} onClick={() => switchRecipientMode(v)} style={{
                    padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    background: recipientMode === v ? theme.cardBg : 'transparent', color: recipientMode === v ? theme.textPrimary : theme.textMuted,
                    boxShadow: recipientMode === v ? theme.shadowSm : 'none',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {recipientMode === 'custom' ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>To (email)</label>
                  <input style={inputStyle} value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Name (optional)</label>
                  <input style={inputStyle} value={toName} onChange={e => setToName(e.target.value)} />
                </div>
              </div>
            ) : selectedRecipient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.contentBg, border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusMd, padding: '10px 12px', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.textPrimary }}>{selectedRecipient.name || '(no name)'}</div>
                  <div style={{ fontSize: 12.5, color: theme.textMuted }}>{selectedRecipient.email}{selectedRecipient.detail ? ` · ${selectedRecipient.detail}` : ''}</div>
                </div>
                <button onClick={() => setSelectedRecipient(null)} style={{ ...secondaryBtnStyle, padding: '6px 10px' }}><X size={13} /></button>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: theme.textMuted }} />
                  <input
                    style={{ ...inputStyle, paddingLeft: 30 }}
                    value={recipientQuery}
                    onChange={e => setRecipientQuery(e.target.value)}
                    placeholder={`Search ${recipientMode}s by name or email…`}
                  />
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusMd, marginTop: 6 }}>
                  {recipientListLoading ? (
                    <div style={{ padding: 14, fontSize: 13, color: theme.textMuted }}>Loading…</div>
                  ) : filteredRecipients.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 13, color: theme.textMuted }}>No {recipientMode}s found.</div>
                  ) : filteredRecipients.slice(0, 50).map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRecipient(r)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                        borderBottom: `1px solid ${theme.borderSoft}`, background: 'transparent', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{r.name || '(no name)'}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{r.email}{r.detail ? ` · ${r.detail}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(template.variables || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  Merge fields{recipientMode !== 'custom' ? ' (optional — auto-filled from the selected recipient unless overridden here)' : ''}
                </label>
                {template.variables.map(v => (
                  <div key={v.name} style={{ marginBottom: 7 }}>
                    <input
                      style={inputStyle}
                      placeholder={`{{${v.name}}} — e.g. ${v.example || ''}`}
                      value={varValues[v.name] || ''}
                      onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <button onClick={sendIndividual} disabled={sending || !canSendIndividual} style={{ ...primaryBtnStyle, opacity: sending ? 0.7 : 1 }}>
              <Send size={14} /> {sending ? 'Sending…' : 'Send now'}
            </button>
            {sendResult && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: sendResult.ok ? '#16a34a' : '#dc2626' }}>{sendResult.msg}</div>}
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Audience</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: theme.textSecondary }}>
                <input type="checkbox" checked={sources.leads} onChange={e => setSources(s => ({ ...s, leads: e.target.checked }))} style={{ accentColor: theme.accentSolid }} /> Leads
              </label>
              {sources.leads && (
                <div style={{ display: 'flex', gap: 10, marginLeft: 24 }}>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={leadScope} onChange={e => setLeadScope(e.target.value)}>
                    <option value="all">All leads</option>
                    <option value="homepage">Homepage leads only</option>
                    <option value="company">Company widget leads only</option>
                  </select>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={leadUserType} onChange={e => setLeadUserType(e.target.value)}>
                    <option value="all">Homeowner & business</option>
                    <option value="homeowner">Homeowner only</option>
                    <option value="business">Cleaning business only</option>
                  </select>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: theme.textSecondary }}>
                <input type="checkbox" checked={sources.companies} onChange={e => setSources(s => ({ ...s, companies: e.target.checked }))} style={{ accentColor: theme.accentSolid }} /> Companies (subscribers)
              </label>
              {sources.companies && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.textMuted }}>
                    <input type="checkbox" checked={companyActiveOnly} onChange={e => setCompanyActiveOnly(e.target.checked)} style={{ accentColor: theme.accentSolid }} /> Active subscribers only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.textMuted }}>
                    <input type="checkbox" checked={companyLegacyNoCardOnly} onChange={e => setCompanyLegacyNoCardOnly(e.target.checked)} style={{ accentColor: theme.accentSolid }} /> Legacy no-card signups only (old free trial, never added a card)
                  </label>
                  {companyLegacyNoCardOnly && (
                    <div style={{ marginTop: 2 }}>
                      <button onClick={grantTrial} disabled={granting} style={{ ...secondaryBtnStyle, padding: '6px 12px', fontSize: 12.5, opacity: granting ? 0.7 : 1 }}>
                        {granting ? 'Granting…' : 'Grant fresh 30-day trial to this segment'}
                      </button>
                      <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 4, maxWidth: 420 }}>
                        Required for the "legacy_winback_fresh_trial" template's 30-day offer to actually be true at checkout. Do this once before sending that campaign.
                      </div>
                      {grantResult && <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600, color: grantResult.ok ? '#16a34a' : '#dc2626' }}>{grantResult.msg}</div>}
                    </div>
                  )}
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: theme.textSecondary }}>
                <input type="checkbox" checked={sources.partners} onChange={e => setSources(s => ({ ...s, partners: e.target.checked }))} style={{ accentColor: theme.accentSolid }} /> Partners
              </label>
              {sources.partners && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.textMuted, marginLeft: 24 }}>
                  <input type="checkbox" checked={partnersActiveOnly} onChange={e => setPartnersActiveOnly(e.target.checked)} style={{ accentColor: theme.accentSolid }} /> Active partners only
                </label>
              )}
            </div>

            <button onClick={runPreview} disabled={previewing} style={{ ...secondaryBtnStyle, marginBottom: 14 }}>
              <RefreshCw size={13} /> {previewing ? 'Checking…' : 'Preview audience'}
            </button>
            {preview && (
              preview.error
                ? <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 14 }}>{preview.error}</div>
                : (
                  <div style={{ background: theme.contentBg, border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusMd, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                    <strong>{preview.count}</strong> recipient{preview.count === 1 ? '' : 's'}
                    {preview.sample.length > 0 && <div style={{ color: theme.textMuted, marginTop: 4 }}>e.g. {preview.sample.slice(0, 5).map(s => s.email).join(', ')}{preview.count > 5 ? '…' : ''}</div>}
                  </div>
                )
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Campaign name</label>
                <input style={inputStyle} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder={template?.name || ''} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}><Calendar size={11} style={{ verticalAlign: -1 }} /> Schedule for (optional)</label>
                <input type="datetime-local" style={inputStyle} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
            </div>

            <button onClick={createCampaign} disabled={creating || !preview || preview.error || preview.count === 0} style={{ ...primaryBtnStyle, opacity: creating ? 0.7 : 1 }}>
              <Send size={14} /> {creating ? 'Scheduling…' : scheduledAt ? 'Schedule campaign' : 'Send now'}
            </button>
            {createResult && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: createResult.ok ? '#16a34a' : '#dc2626' }}>{createResult.msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

const KPI_LABELS = [
  ['total', 'Total'], ['sent', 'Sent'], ['delivered', 'Delivered'], ['opened', 'Opened'],
  ['unopened', 'Unopened'], ['bounced', 'Bounced'], ['failed', 'Failed'], ['skipped', 'Skipped'], ['complained', 'Complained'],
];

function KpiRow({ kpis }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {KPI_LABELS.map(([key, label]) => (
        <div key={key} style={{ background: theme.contentBg, border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusSm, padding: '5px 10px', fontSize: 12 }}>
          <span style={{ color: theme.textMuted, fontWeight: 600 }}>{label}</span>{' '}
          <strong style={{ color: theme.textPrimary }}>{kpis?.[key] ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS = {
  draft: '#94a3b8', scheduled: theme.accentSolid, sending: '#d97706', completed: '#16a34a', canceled: '#dc2626',
};

function CampaignsPanel({ adminKey }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminEmailCampaigns(adminKey);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error('Error loading campaigns:', err.message);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { if (adminKey) load(); }, [adminKey, load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getAdminEmailCampaign(adminKey, id);
      setDetail(res.data);
    } catch (err) {
      console.error('Error loading campaign detail:', err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this scheduled campaign? No emails will be sent.')) return;
    await cancelAdminEmailCampaign(adminKey, id);
    await load();
    setDetail(null);
  };

  if (detail) {
    return (
      <div style={{ ...cardStyle, padding: 22 }}>
        <button onClick={() => setDetail(null)} style={{ ...secondaryBtnStyle, marginBottom: 16 }}><ArrowLeft size={13} /> Back to campaigns</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: theme.textPrimary }}>{detail.campaign.name}</div>
            <div style={{ fontSize: 12.5, color: STATUS_COLORS[detail.campaign.status], fontWeight: 700, marginTop: 3, textTransform: 'uppercase' }}>{detail.campaign.status}</div>
          </div>
          {detail.campaign.status === 'scheduled' && (
            <button onClick={() => cancel(detail.campaign.id)} style={dangerBtnStyle}><Ban size={13} /> Cancel</button>
          )}
        </div>
        <div style={{ marginBottom: 20 }}><KpiRow kpis={detail.kpis} /></div>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recipients ({detail.sends.length})</div>
        <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: theme.radiusMd, maxHeight: 420, overflowY: 'auto' }}>
          {detail.sends.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < detail.sends.length - 1 ? `1px solid ${theme.borderSoft}` : 'none', fontSize: 13 }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.recipient_email}</span>
              <span style={{ fontSize: 11, color: theme.textMuted, textTransform: 'capitalize' }}>{s.recipient_type || ''}</span>
              <span style={pill(theme.textSecondary, theme.contentBg)}>{s.status}</span>
              {s.opened_at && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Opened</span>}
            </div>
          ))}
          {detail.sends.length === 0 && !detailLoading && <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>No sends yet.</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={load} style={{ ...secondaryBtnStyle, marginBottom: 14 }}><RefreshCw size={13} /> Refresh</button>
      {loading ? (
        <div style={{ color: theme.textMuted, fontSize: 14, padding: 20 }}>Loading…</div>
      ) : campaigns.length === 0 ? (
        <div style={{ ...cardStyle, padding: 30, textAlign: 'center', color: theme.textMuted, fontSize: 13.5 }}>No campaigns yet — create one from the Compose / Send tab.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map(c => (
            <div key={c.id} onClick={() => openDetail(c.id)} style={{ ...cardStyle, cursor: 'pointer', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.textPrimary }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{c.templateName} · {new Date(c.scheduled_at || c.created_at).toLocaleString()}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[c.status], textTransform: 'uppercase' }}>{c.status}</span>
              </div>
              <KpiRow kpis={c.kpis} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
