import React, { useState, useEffect } from 'react';
import { UserPlus, CalendarDays, DollarSign, Inbox, SlidersHorizontal, Code2, HelpCircle, Zap, Check, MapPin, Palette, PlayCircle, Receipt } from 'lucide-react';
import CountryFlag from '../CountryFlag';
import { getCompanyLeads, getCompanyEstimateRuns } from '../../../utils/api';
import { supabase } from '../../../lib/supabase';
import { formatPrice, formatPriceRange, serviceTypeLabel, formatDateTime, currencySymbolForCountry } from '../../../utils/formatters';
import { COLORS, RADIUS, SHADOWS } from '../../../styles/theme';

// Same 4 options as the header's country switcher (CompanyDashboard.js) --
// just the full name here, since that switcher already handles the
// flag/abbreviation treatment for its own pill.
const COUNTRY_NAMES = { US: 'United States', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia' };

export default function OverviewTab({ config, user }) {
  // Lead rows never stored a currencySymbol of their own -- derived from
  // the viewing company's own country setting instead (see
  // currencySymbolForCountry's own comment).
  const currencySymbol = currencySymbolForCountry(config?.country);
  // Same isMobile pattern as CompanyDashboard.js/BrandingTab.js -- the stat
  // grid below used to rely on CSS auto-fit alone (minmax(190px, 1fr)),
  // which on a ~360-400px-wide phone only has room for one 190px+ column,
  // stacking all 5 cards in a single column. Forcing an explicit 2-column
  // grid under 768px fits 2 per row regardless of exact device width.
  // matchMedia, not a raw 'resize' listener -- see CompanyDashboard.js for
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

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  // Total + this-month count of this company's successful /api/calculate
  // runs (internal Calculator Mode and the embedded widget combined). Added
  // alongside the leads-based stats below because a company using Clean
  // Estimator purely internally -- the primary pitch -- otherwise shows up
  // nowhere at all: no email captured, so nothing in `leads` either.
  const [estimateRuns, setEstimateRuns] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => { loadLeads(); loadEstimateRuns(); }, []);

  const loadLeads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getCompanyLeads(token);
      setLeads(res.data || []);
    } catch {} finally {
      setLoadingLeads(false);
    }
  };

  const loadEstimateRuns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await getCompanyEstimateRuns(token);
      setEstimateRuns(res.data || { total: 0, thisMonth: 0 });
    } catch {}
  };

  const recentLeads = leads.slice(0, 5);
  const thisMonth = leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 86400000));
  // Commercial leads are quoted as a recurring MONTHLY total, every other
  // service as a flat one-time price (see calculateCommercial's unit:
  // 'per_month' vs. everything else's unit: 'flat') -- averaging those
  // together would blend two different units into one number that means
  // nothing (a single $6,000/mo commercial lead could make a company's
  // typical $150 house-cleaning lead look like it averages $1,000+). This
  // stat is scoped to one-time-quote leads only, which is what "Avg
  // Estimate" reads as to someone scanning the dashboard.
  const oneTimeLeads = leads.filter(l => l.service_type !== 'commercial');
  const avgEstimate = oneTimeLeads.length > 0
    ? oneTimeLeads.reduce((s, l) => s + ((l.estimated_price_low || 0) + (l.estimated_price_high || 0)) / 2, 0) / oneTimeLeads.length
    : 0;

  const stats = [
    { label: 'Estimates Run',  value: estimateRuns.total,                                        Icon: Zap,         color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Total Leads',    value: leads.length,                                              Icon: UserPlus,    color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'This Month',     value: thisMonth.length,                                          Icon: CalendarDays, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Avg Estimate',   value: avgEstimate > 0 ? formatPrice(avgEstimate, currencySymbol) : '—',         Icon: DollarSign,  color: '#d97706', bg: '#fffbeb' },
    // The real country flag (same artwork as the header's switcher), not a
    // generic globe icon -- a flag reads as the country itself at a glance,
    // which a globe never could since it's the same icon regardless of
    // which country's actually selected.
    { label: 'Account Country', value: COUNTRY_NAMES[config?.country] || 'United States',          Icon: (props) => <CountryFlag country={config?.country} size={props.size} />, color: '#0891b2', bg: '#ecfeff' },
  ];

  // Setup checklist -- shown until every required step is done, then
  // disappears entirely (classic onboarding-checklist UX) so it doesn't
  // permanently clutter a returning, fully-set-up user's dashboard. Each
  // step reads a real signal off config/estimateRuns/leads rather than a
  // separate "onboarding progress" flag that could drift out of sync with
  // what the account has actually done.
  const checklistSteps = [
    { label: 'Set your service area',       done: (config?.serviceStates?.length || 0) > 0, href: '?tab=services', Icon: MapPin },
    { label: 'Add your branding',           done: !!config?.logo,                            href: '?tab=branding', Icon: Palette },
    // '' resolves to a bare /company link (not /company?tab=...) -- Calculator
    // Mode is CompanyDashboard.js's own default viewMode, not a URL-addressable
    // tab, so this is how you land there instead of back on this Overview tab.
    { label: 'Run your first estimate',     done: estimateRuns.total > 0,                     href: '', Icon: PlayCircle },
  ];
  const requiredDone = checklistSteps.filter(s => s.done).length;
  const showChecklist = requiredDone < checklistSteps.length;
  // Embedding the widget is a bonus step, not required -- the primary pitch
  // is internal-only use, so it's shown as an optional nudge once the three
  // required steps above are complete, not blocking the checklist from
  // disappearing.
  const widgetEmbedded = leads.length > 0;

  const quickActions = [
    { label: 'Services & Pricing', href: '?tab=services',      Icon: SlidersHorizontal },
    { label: 'Branding & Embed Code', href: '?tab=branding',   Icon: Code2       },
    { label: 'All Leads',          href: '?tab=leads',         Icon: UserPlus    },
    { label: 'Help & Docs',        href: '?tab=help',                           Icon: HelpCircle  },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, marginBottom: 2, letterSpacing: '-0.3px' }}>
          Dashboard Overview
        </h2>
        <p style={{ color: COLORS.body, fontSize: 14 }}>
          Welcome back{config?.companyName ? `, ${config.companyName}` : ''}.
        </p>
      </div>

      {/* "Coming soon" teaser -- not a real feature yet (see
          docs/invoicing-stripe-connect-plan.md), just a heads-up so
          companies know it's on the way. Static for now, no dismiss state
          -- revisit once the feature actually ships (either replace this
          with the real entry point, or remove it). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #ddd6fe', borderRadius: 7, padding: '16px 20px', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 38, height: 38, borderRadius: 7, background: 'white', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: SHADOWS.sm }}>
          <Receipt size={18} strokeWidth={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>Invoicing &amp; Direct Payments</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: 'white', border: '1px solid #ddd6fe', borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Coming Soon</span>
          </div>
          <p style={{ fontSize: 12.5, color: COLORS.body, margin: 0 }}>
            Turn an estimate into a real invoice, send it to your client, and get paid straight to your own bank account — or just download a PDF copy if you'd rather send it and collect payment yourself.
          </p>
        </div>
      </div>

      {/* Setup checklist -- the only thing a brand-new account saw before
          this was an all-zero stat grid and a one-time "check Help & Docs"
          popup, with no guided next step. Disappears once the required
          steps are done so it never clutters a returning, set-up account. */}
      {showChecklist && (
        <div style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, padding: '20px 22px', marginBottom: 20, boxShadow: SHADOWS.sm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Get set up</h3>
            <span style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: 600 }}>{requiredDone} of {checklistSteps.length} done</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checklistSteps.map(({ label, done, href, Icon }) => (
              <a
                key={label}
                href={done ? undefined : `/company${href}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 7,
                  border: `1.5px solid ${done ? COLORS.border : COLORS.primary}`,
                  background: done ? COLORS.surfaceMuted : COLORS.primaryMuted,
                  textDecoration: 'none', cursor: done ? 'default' : 'pointer',
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#16a34a' : 'white', border: done ? 'none' : `1.5px solid ${COLORS.primary}`,
                }}>
                  {done ? <Check size={13} color="white" strokeWidth={3} /> : <Icon size={12} color={COLORS.primary} strokeWidth={2.3} />}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: done ? COLORS.muted : COLORS.ink, textDecoration: done ? 'line-through' : 'none' }}>
                  {label}
                </span>
              </a>
            ))}
            {!widgetEmbedded && (
              <a href="/company?tab=branding" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 7, border: `1.5px dashed ${COLORS.border}`, textDecoration: 'none' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: `1.5px solid ${COLORS.border}` }}>
                  <Code2 size={12} color={COLORS.muted} strokeWidth={2.3} />
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.body }}>
                  Optional: embed the calculator widget on your website too
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: isMobile ? 10 : 14, marginBottom: 24 }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.sm, padding: isMobile ? '14px 14px' : '18px 20px', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = SHADOWS.md; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOWS.sm; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: 7, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 10 : 14 }}>
              <Icon size={isMobile ? 16 : 18} strokeWidth={2.1} />
            </div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, color: COLORS.ink, marginBottom: 8 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: COLORS.body, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, padding: '20px 22px', marginBottom: 20, boxShadow: SHADOWS.sm }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: COLORS.ink }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {quickActions.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={`/company${href}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', border: `1.5px solid ${COLORS.border}`, borderRadius: 7,
                textDecoration: 'none', color: COLORS.ink, fontWeight: 600, fontSize: 13.5,
                background: COLORS.surface, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.background = COLORS.primaryMuted; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; }}
            >
              <span style={{ width: 30, height: 30, borderRadius: 7, background: COLORS.primaryMuted, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} strokeWidth={2.1} />
              </span>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent leads */}
      <div style={{ background: COLORS.surface, borderRadius: 7, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: SHADOWS.sm }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${COLORS.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Recent Leads</h3>
          <a href="/company?tab=leads" style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}>View all →</a>
        </div>

        {loadingLeads ? (
          <div style={{ padding: 32, textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>Loading leads…</div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 7, background: COLORS.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Inbox size={24} color={COLORS.muted} />
            </div>
            <div style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 6, fontSize: 15 }}>No leads yet</div>
            <p style={{ color: COLORS.muted, fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
              Embed your estimator on your website to start capturing leads automatically.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Service', 'Estimate', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{l.name || '(No name)'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{serviceTypeLabel(l.service_type, config?.country)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                    {l.estimated_price_low && l.estimated_price_high
                      ? formatPriceRange(l.estimated_price_low, l.estimated_price_high, l.service_type, currencySymbol)
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8' }}>{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
