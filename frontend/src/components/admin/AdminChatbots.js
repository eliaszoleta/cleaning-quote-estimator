import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Bot, Plus, X, Copy, Check, Trash2, Pause, Play, Users } from 'lucide-react';
import { getAdminChatbots, createAdminChatbot, updateAdminChatbot, deleteAdminChatbot, getAdminChatbotLeads } from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';
import { useConfirm } from '../dashboard/ConfirmDialog';
import { theme, cardStyle, inputStyle, labelStyle, secondaryBtnStyle, primaryBtnStyle, dangerBtnStyle, pill, avatarGradient, PageHeader } from './adminTheme';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://www.cleanestimator.com';
const API_URL = process.env.REACT_APP_API_URL || 'https://api.cleanestimator.com';

const EMPTY_FORM = { business_name: '', prompt_info: '', lead_alert_email: '', from_name: '' };

function embedSnippet(chatbotId) {
  return `<script src="${SITE_URL}/chat-widget.js" data-chatbot-id="${chatbotId}" data-api-url="${API_URL}" async></script>`;
}

// Growth/Pro-tier AI chatbots (see migration 017) -- one row per client,
// each with its own business info (folded into the system prompt), lead
// alert email, and "From" display name so alerts show up as that client's
// business rather than Clean Estimator. One shared widget bundle serves
// every row here; the only thing that differs per client is this config
// and the chatbotId in their copy-pasted embed snippet. Mirrors
// AdminWebsiteRequests.js's list/detail/add-form pattern.
export default function AdminChatbots({ adminKey }) {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirm();
  // Same mobile master-detail fix as AdminWebsiteRequests.js -- show one
  // pane at a time on a phone instead of squeezing a fixed-400px detail
  // panel and the list side by side.
  // matchMedia, not a raw 'resize' listener -- see AdminDashboard.js for
  // why (mobile Chrome's address-bar collapse on scroll fires 'resize'
  // and can flip a width-based flag mid-scroll).
  const mobileQuery = () => window.matchMedia('(max-width: 768px)');
  const [isMobile, setIsMobile] = useState(() => mobileQuery().matches);
  useEffect(() => {
    const mq = mobileQuery();
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const loadChatbots = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await getAdminChatbots(key);
      const loaded = res.data || [];
      setChatbots(loaded);
      setSelected(prev => prev || (loaded.length > 0 ? loaded[0] : null));
    } catch (err) {
      console.error('Error loading chatbots:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (adminKey) loadChatbots(adminKey); }, [adminKey, loadChatbots]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      business_name: selected.business_name || '',
      prompt_info: selected.prompt_info || '',
      lead_alert_email: selected.lead_alert_email || '',
      from_name: selected.from_name || '',
    });
    setSaved(false);
    setCopied(false);
    setLeads([]);
    setLeadsLoading(true);
    getAdminChatbotLeads(adminKey, selected.id)
      .then(res => setLeads(res.data || []))
      .catch(err => console.error('Error loading chatbot leads:', err.message))
      .finally(() => setLeadsLoading(false));
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyUpdate = (id, patch) => {
    setChatbots(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    setSelected(prev => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const saveForm = async () => {
    if (!selected) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await updateAdminChatbot(adminKey, selected.id, form);
      applyUpdate(selected.id, res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save chatbot:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const nextStatus = selected.status === 'active' ? 'paused' : 'active';
    try {
      const res = await updateAdminChatbot(adminKey, selected.id, { status: nextStatus });
      applyUpdate(selected.id, res.data);
    } catch (err) {
      console.error('Failed to toggle chatbot status:', err.message);
    }
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!addForm.business_name.trim() || !addForm.lead_alert_email.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await createAdminChatbot(adminKey, {
        business_name: addForm.business_name.trim(),
        prompt_info: addForm.prompt_info.trim(),
        lead_alert_email: addForm.lead_alert_email.trim(),
        from_name: addForm.from_name.trim() || undefined,
      });
      setChatbots(prev => [res.data, ...prev]);
      setSelected(res.data);
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
    } catch (err) {
      setAddError(err.message || 'Failed to create chatbot');
    } finally {
      setAdding(false);
    }
  };

  const deleteChatbot = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: `Delete ${selected.business_name}'s chatbot?`,
      message: "This removes the chatbot config and every lead/conversation it's captured. The embed snippet on their site will stop working. There's no undo.",
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAdminChatbot(adminKey, selected.id);
      setChatbots(prev => prev.filter(c => c.id !== selected.id));
      setSelected(null);
    } catch (err) {
      console.error('Failed to delete chatbot:', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const copyEmbed = () => {
    if (!selected) return;
    navigator.clipboard?.writeText(embedSnippet(selected.id)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  const dirty = selected && (
    form.business_name !== (selected.business_name || '') ||
    form.prompt_info !== (selected.prompt_info || '') ||
    form.lead_alert_email !== (selected.lead_alert_email || '') ||
    form.from_name !== (selected.from_name || '')
  );

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: theme.contentBg }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHeader
          icon={Bot}
          title="AI Chatbots"
          subtitle="Growth/Pro-tier chatbots -- one per client, each with its own business info, lead alert email, and embeddable widget code."
          actions={
            <button onClick={() => { setAddForm(EMPTY_FORM); setAddError(null); setShowAddForm(true); }} style={primaryBtnStyle}>
              <Plus size={15} /> Add Chatbot
            </button>
          }
        />

        {showAddForm && (
          <div style={{ ...cardStyle, border: '1.5px solid rgba(79,70,229,0.3)', padding: '22px 26px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary }}>Add Chatbot</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Creates a new chatbot config. You'll get its embed snippet right after.</div>
              </div>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={submitAddForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Business Name *</label>
                  <input required style={inputStyle} value={addForm.business_name} onChange={e => setAddForm(f => ({ ...f, business_name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Lead Alert Email *</label>
                  <input required type="email" style={inputStyle} value={addForm.lead_alert_email} onChange={e => setAddForm(f => ({ ...f, lead_alert_email: e.target.value }))} placeholder="leads@theirbusiness.com" />
                </div>
                <div>
                  <label style={labelStyle}>From Name (optional)</label>
                  <input style={inputStyle} value={addForm.from_name} onChange={e => setAddForm(f => ({ ...f, from_name: e.target.value }))} placeholder="Defaults to business name" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business Info (used to answer questions)</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} value={addForm.prompt_info} onChange={e => setAddForm(f => ({ ...f, prompt_info: e.target.value }))} placeholder="Services offered, service area, hours, pricing notes, anything the chatbot should know about this business…" />
                </div>
              </div>
              {addError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: theme.radiusMd, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{addError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={adding} style={{ ...primaryBtnStyle, padding: '10px 20px', fontSize: 13.5, opacity: adding ? 0.7 : 1 }}>
                  {adding ? 'Creating…' : 'Create Chatbot'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ ...secondaryBtnStyle, padding: '10px 20px', fontSize: 13.5 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, height: isMobile ? 'auto' : 'calc(100vh - 170px)' }}>
          {/* Chatbot list */}
          <div style={{ flex: 1, display: isMobile && selected ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.2px' }}>Chatbots ({chatbots.length})</h2>
              <button onClick={() => loadChatbots(adminKey)} style={secondaryBtnStyle}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: 14 }}>Loading…</div>
            ) : chatbots.length === 0 ? (
              <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Bot size={24} color={theme.accentSolid} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.textSecondary, marginBottom: 5 }}>No chatbots yet</div>
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', maxWidth: 300, margin: 0 }}>Add one for each Growth/Pro client, then paste their embed snippet on their site.</p>
              </div>
            ) : (
              <div style={{ ...cardStyle, flex: 1, overflowY: 'auto' }}>
                {chatbots.map((c, i) => {
                  const isSelected = selected?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelected(c)}
                      style={{
                        padding: '13px 18px', borderBottom: i < chatbots.length - 1 ? `1px solid ${theme.borderSoft}` : 'none',
                        cursor: 'pointer', background: isSelected ? '#eef2ff' : 'transparent',
                        display: 'flex', gap: 13, alignItems: 'center', transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: avatarGradient(c.business_name || c.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                        {c.business_name ? c.business_name[0].toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: theme.textPrimary, marginBottom: 2 }}>{c.business_name}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lead_alert_email}</div>
                      </div>
                      <div style={pill(c.status === 'active' ? '#16a34a' : theme.textMuted, c.status === 'active' ? '#16a34a18' : `${theme.textMuted}18`)}>
                        {c.status === 'active' ? 'Active' : 'Paused'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chatbot detail panel */}
          {selected && (
            <div style={{ ...cardStyle, width: isMobile ? '100%' : 400, padding: '20px 20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: avatarGradient(selected.business_name || selected.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>
                    {selected.business_name ? selected.business_name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: theme.textPrimary, marginBottom: 2 }}>{selected.business_name}</h3>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>Created {formatDateTime(selected.created_at)}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <button
                onClick={toggleStatus}
                style={{ ...secondaryBtnStyle, justifyContent: 'center', width: '100%',
                  color: selected.status === 'active' ? '#dc2626' : '#16a34a',
                  borderColor: selected.status === 'active' ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)',
                  background: selected.status === 'active' ? '#fef2f2' : '#f0fdf4' }}
              >
                {selected.status === 'active' ? <><Pause size={13} /> Pause Chatbot</> : <><Play size={13} /> Reactivate Chatbot</>}
              </button>

              <div>
                <label style={labelStyle}>Business Name</label>
                <input style={inputStyle} value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Lead Alert Email</label>
                <input type="email" style={inputStyle} value={form.lead_alert_email} onChange={e => setForm(f => ({ ...f, lead_alert_email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>From Name (shows on lead alert emails instead of "Clean Estimator")</label>
                <input style={inputStyle} value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder={selected.business_name} />
              </div>
              <div>
                <label style={labelStyle}>Business Info / Prompt</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }} value={form.prompt_info} onChange={e => setForm(f => ({ ...f, prompt_info: e.target.value }))} placeholder="Services offered, service area, hours, pricing notes…" />
              </div>
              <button
                onClick={saveForm}
                disabled={saving || !dirty}
                style={{ ...primaryBtnStyle, width: '100%', justifyContent: 'center', opacity: (saving || !dirty) ? 0.5 : 1 }}
              >
                {saving ? 'Saving…' : saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
              </button>

              <div style={{ paddingTop: 4, borderTop: `1px solid ${theme.borderSoft}` }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 7px' }}>Embed Code</div>
                <p style={{ fontSize: 11.5, color: theme.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>Paste this anywhere on their website -- the chat bubble appears automatically.</p>
                <div style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: theme.textSecondary, wordBreak: 'break-all', marginBottom: 8 }}>
                  {embedSnippet(selected.id)}
                </div>
                <button onClick={copyEmbed} style={{ ...secondaryBtnStyle, width: '100%', justifyContent: 'center' }}>
                  {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy Embed Code'}
                </button>
              </div>

              <div style={{ paddingTop: 4, borderTop: `1px solid ${theme.borderSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '12px 0 7px' }}>
                  <Users size={13} color={theme.textMuted} />
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Captured Leads ({leads.length})</div>
                </div>
                {leadsLoading ? (
                  <div style={{ fontSize: 12.5, color: theme.textMuted, padding: '8px 0' }}>Loading…</div>
                ) : leads.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: theme.textMuted, padding: '8px 0' }}>No leads captured yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {leads.map(lead => (
                      <div key={lead.id} style={{ background: theme.contentBg, borderRadius: theme.radiusMd, padding: '9px 11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.textPrimary }}>{lead.name}</span>
                          <span style={{ fontSize: 11, color: theme.textMuted }}>{formatDateTime(lead.updated_at)}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 1 }}>{lead.phone}</div>
                        {lead.last_summary && (
                          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{lead.last_summary}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={deleteChatbot}
                disabled={deleting}
                style={{ width: '100%', ...dangerBtnStyle, justifyContent: 'center', padding: '9px 0', opacity: deleting ? 0.6 : 1, cursor: deleting ? 'default' : 'pointer' }}
              >
                <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}
