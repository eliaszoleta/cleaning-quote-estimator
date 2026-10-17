import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Paintbrush, SlidersHorizontal, Code2,
  UserPlus, Settings, Loader2, Check, LogOut, AlertCircle, Save, HelpCircle,
  Globe, X, CalendarClock, Zap, ChevronDown,
} from 'lucide-react';
import { useCompanyConfig } from '../../hooks/useCompanyConfig';
import { getSubscriptionStatus, verifyCheckout, postCheckout, postPortal } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import OverviewTab from './tabs/OverviewTab';
import BrandingTab from './tabs/BrandingTab';
import ServicesTab from './tabs/ServicesTab';
import LeadsTab from './tabs/LeadsTab';
import SettingsTab from './tabs/SettingsTab';
import HelpTab from './tabs/HelpTab';
import RunEstimateTab from './tabs/RunEstimateTab';

// Real flag glyphs, not the 🇺🇸/🇨🇦/🇬🇧/🇦🇺 emoji previously used as the
// <option> text -- those rendered fine on Android (where the mobile
// screenshot that drove this fix was taken) but as blank space or a bare
// "CA"/"GB" text fallback on several desktop OS/browser combos (Windows in
// particular ships without a flag-emoji font by default), so the same
// country switcher looked broken on desktop while working on mobile.
// Hand-drawn, simplified inline SVGs instead of an external flag-icon CDN
// or npm package -- renders identically everywhere with no network
// dependency, consistent with how every other icon in this header
// (lucide-react) is already self-contained. Not pixel-accurate flags (the
// UK/AU crosses and the CA maple leaf are simplified down to something
// legible at ~16px), just recognizable at the size this is actually shown.
function CountryFlag({ country, size = 16 }) {
  const h = size * 0.72;
  const common = { width: size, height: h, viewBox: '0 0 20 15', style: { borderRadius: 2, flexShrink: 0, display: 'block' } };
  if (country === 'CA') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#fff" />
      <rect width="5" height="15" fill="#D80621" />
      <rect x="15" width="5" height="15" fill="#D80621" />
      <path d="M10 3l.8 2.1 2-.9-.6 2 1.8.3-1.5 1.3.9 1.9-2-.6.1 2-1.5-1.3-1.5 1.3.1-2-2 .6.9-1.9-1.5-1.3 1.8-.3-.6-2 2 .9z" fill="#D80621" />
    </svg>
  );
  if (country === 'GB') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#00247D" />
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 L20 15 M20 0 L0 15" stroke="#CF142B" strokeWidth="1.2" />
      <path d="M10 0 V15 M0 7.5 H20" stroke="#fff" strokeWidth="5" />
      <path d="M10 0 V15 M0 7.5 H20" stroke="#CF142B" strokeWidth="3" />
    </svg>
  );
  if (country === 'AU') return (
    <svg {...common}>
      <rect width="20" height="15" fill="#00247D" />
      <path d="M0 0 L10 7.5 M10 0 L0 7.5" stroke="#fff" strokeWidth="1.4" />
      <path d="M0 0 L10 7.5 M10 0 L0 7.5" stroke="#CF142B" strokeWidth="0.6" />
      <path d="M5 0 V7.5 M0 3.75 H10" stroke="#fff" strokeWidth="2.2" />
      <path d="M5 0 V7.5 M0 3.75 H10" stroke="#CF142B" strokeWidth="1.2" />
      <circle cx="4" cy="11.5" r="1.1" fill="#fff" />
      <circle cx="14" cy="4" r="0.8" fill="#fff" />
      <circle cx="16.5" cy="7" r="0.8" fill="#fff" />
      <circle cx="17.5" cy="11" r="0.8" fill="#fff" />
      <circle cx="13.5" cy="12.5" r="0.6" fill="#fff" />
    </svg>
  );
  // US (and the fallback for an unrecognized/undefined country, same as
  // every country-aware piece of this app already defaulting to US).
  return (
    <svg {...common}>
      <rect width="20" height="15" fill="#fff" />
      <g fill="#B22234">
        <rect y="0" width="20" height="1.15" />
        <rect y="2.3" width="20" height="1.15" />
        <rect y="4.6" width="20" height="1.15" />
        <rect y="6.9" width="20" height="1.15" />
        <rect y="9.2" width="20" height="1.15" />
        <rect y="11.5" width="20" height="1.15" />
        <rect y="13.8" width="20" height="1.15" />
      </g>
      <rect width="8" height="8.1" fill="#3C3B6E" />
    </svg>
  );
}

// Discount (recurring-frequency %) now lives inside Services & Pricing, the
// embed code now lives inside Branding (right after the live preview it
// already shows), and Subscription now lives inside Settings as a third
// sub-section alongside Account and API Keys -- all three used to be their
// own nav tab. Folding them into the tab they're actually about (or, for
// Subscription, the tab billing/account management already lives under)
// cuts the nav down without losing anything.
const NAV = [
  { id: 'overview',      Icon: LayoutDashboard,   label: 'Dashboard' },
  { id: 'services',      Icon: SlidersHorizontal,  label: 'Services' },
  { id: 'leads',         Icon: UserPlus,           label: 'Leads' },
  { id: 'branding',      Icon: Paintbrush,         label: 'Branding' },
  { id: 'help',          Icon: HelpCircle,         label: 'Help & Docs' },
  { id: 'settings',      Icon: Settings,           label: 'Settings' },
];

const WALKTHROUGH_URL = '/book-a-call';

// Shown instead of the dashboard whenever subStatus.active is false --
// neither Widget Mode nor Calculator Mode render behind this. Account
// activation now only ever happens through Stripe Checkout (see
// subscription.js's POST /checkout and companyConfig.js's
// getOrCreateCompanyConfig), so simply never completing it -- closing the
// tab, declining, re-visiting an old signup-confirmation link -- used to
// still land someone in a fully working dashboard with a free no-card
// trial quietly already running. This, plus the matching server-side
// check in calculate.js, closes that off: no checkout, no calculator.
function ActivationGate({ subStatus, onLogout }) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  const isPastDue = subStatus.status === 'past_due';
  const isNeverActivated = subStatus.status === 'requires_trial_setup';
  // Legacy no-card trial, still within its real remaining days -- distinct
  // from isNeverActivated (no trial started at all) and isExpiredTrial
  // below (no days left). Only the dashboard login is gated here; the
  // account's own already-live public widget keeps working normally for
  // these same remaining days (see subscriptionStatus.js).
  const isNoCardTrial = !!subStatus.needsCardForTrial;
  // Legacy no-card trial that ran out with no card ever added -- distinct
  // from a canceled paying subscription (subStatus.status === 'canceled'),
  // which falls through to the generic copy below instead, since that's a
  // different situation (they were already paying and chose to stop).
  const isExpiredTrial = subStatus.status === 'expired';

  const handleAction = async () => {
    setLoadingAction(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = isPastDue ? await postPortal(token) : await postCheckout(token);
      window.location.href = res.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingAction(false);
    }
  };

  const title = isNoCardTrial ? 'Add a payment method' : isExpiredTrial ? 'Your trial has expired' : isNeverActivated ? 'Activate your account' : isPastDue ? 'Update your payment method' : 'Reactivate your account';
  const body = isNoCardTrial
    ? `You have ${subStatus.daysLeft} day${subStatus.daysLeft === 1 ? '' : 's'} left on your free trial. Add a card to keep it running — you won't be charged until your trial actually ends.`
    : isExpiredTrial
    ? 'Your 30-day free trial has ended with no card on file, so your calculator is paused. Subscribe for $25/month to activate your account.'
    : isNeverActivated
    ? 'Your calculator is ready, but checkout was never finished. Activate your account to start your 30-day free trial.'
    : isPastDue
    ? 'Your last payment failed. Update your payment method to keep your calculator running.'
    : 'Your subscription has ended. Reactivate to get back into your calculator.';
  const cta = isNoCardTrial ? 'Add payment method — keep my trial' : isExpiredTrial ? 'Subscribe — $25/month' : isPastDue ? 'Update payment method' : isNeverActivated ? 'Activate — start free trial' : 'Reactivate my account';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -160, right: -100, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0) 70%)', pointerEvents: 'none' }} aria-hidden="true" />
      <div style={{ background: 'white', borderRadius: 22, padding: '52px 44px', maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Zap size={28} color="#2563eb" strokeWidth={1.8} />
        </div>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>{title}</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{body}</p>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13, fontWeight: 500 }}>⚠ {error}</div>
        )}
        <button
          onClick={handleAction}
          disabled={loadingAction}
          style={{ width: '100%', padding: '13px 0', borderRadius: 8, border: 'none', background: loadingAction ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 700, fontSize: 15, cursor: loadingAction ? 'not-allowed' : 'pointer', boxShadow: loadingAction ? 'none' : '0 4px 16px rgba(37,99,235,0.3)' }}
        >
          {loadingAction ? 'Redirecting…' : `${cta} →`}
        </button>
        <button onClick={onLogout} style={{ marginTop: 16, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  );
}

export default function CompanyDashboard({ user, onLogout }) {
  // The header below used to be a single fixed-height flex row with no
  // responsive handling at all -- logo, mode switch, walkthrough link,
  // badge, Save Changes, email, and Sign Out together run well past a
  // phone's width, forcing the whole page into horizontal scroll just to
  // reach Sign Out. isMobile drops/shrinks the non-essential pieces below
  // so everything still fits in one row (same 768px breakpoint .dash-nav
  // already uses in App.css).
  // matchMedia, not a raw 'resize' listener -- mobile Chrome's address-bar
  // collapse on scroll fires 'resize' (the layout viewport's height
  // changes) and can momentarily misreport width too, flipping this flag
  // mid-scroll on a long page. matchMedia's 'change' event only fires on
  // an actual breakpoint crossing.
  const mobileQuery = () => window.matchMedia('(max-width: 768px)');
  const [isMobile, setIsMobile] = useState(() => mobileQuery().matches);
  useEffect(() => {
    const mq = mobileQuery();
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  // Top-level switch, independent of the tab sidebar: 'widget' is today's
  // full dashboard (sidebar + tabs), 'calculator' hides all of that and
  // fills the page with nothing but the calculator itself, the same way it
  // renders on the public site -- no tab chrome, no surrounding text.
  // Calculator is the default landing view -- the internal pricing tool is
  // the primary pitch now, so that's what a company sees first on login.
  const [viewMode, setViewMode] = useState('calculator');
  // Which pane the Settings tab shows -- API Keys and Subscription both
  // moved from their own sidebar item into a sub-section of Settings, so
  // this is what deep links like ?tab=settings&section=api (or
  // &section=subscription) now target.
  const [settingsSection, setSettingsSection] = useState('account');
  const [subStatus, setSubStatus] = useState(null);
  // Distinguishes "haven't heard back yet" (subStatus still null, keep
  // showing the loading spinner) from "tried and failed" (a transient
  // network/API error) -- without this, a failed fetch would leave
  // subStatus null forever and the dashboard would spin indefinitely
  // instead of falling back to rendering normally, same as it always has.
  const [subStatusError, setSubStatusError] = useState(false);
  const [localConfig, setLocalConfig] = useState(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  // Not persisted -- meant to always show again on a fresh login (App.js
  // unmounts this whole component on logout and mounts a new one on the
  // next login, which resets this back to false), so dismissing it just
  // clears it for the rest of the current session, not permanently.
  const [websiteOfferDismissed, setWebsiteOfferDismissed] = useState(false);
  const dismissWebsiteOffer = () => setWebsiteOfferDismissed(true);
  const { config, loading, saving, saved, error, saveConfig, patchServices, refetch, justCreated } = useCompanyConfig(user.id);

  const localConfigReady = useRef(false);
  useEffect(() => {
    if (config && !localConfigReady.current) {
      localConfigReady.current = true;
      setLocalConfig({ ...config });
    }
  }, [config]);

  const update = useCallback((partial) => {
    setLocalConfig(prev => prev ? { ...prev, ...partial } : { ...partial });
  }, []);

  const handleGlobalSave = () => {
    if (localConfig) saveConfig(localConfig);
  };

  // Every auto-save (service toggles, Service Area states/cities) chains
  // onto this one queue. Both PATCH /:id/services and PUT /:id do their own
  // read-existing-then-merge-then-write server-side, so firing several of
  // these back to back -- toggling a service, removing two cities, adding
  // four more, all within a few seconds -- lets a later request read the
  // row before an earlier request's write has landed, then save from that
  // stale snapshot and silently revert it. Chaining every auto-save (across
  // both kinds) onto one promise makes each fully complete, round trip
  // included, before the next is even sent, so a rapid sequence of edits
  // always lands in the order made instead of racing each other.
  const autoSaveQueue = useRef(Promise.resolve());

  // Wraps the hook's patchServices so localConfig (what the header's Save
  // Changes button submits) reflects the just-persisted toggle too --
  // otherwise a later global save would overwrite the auto-saved change
  // with whatever stale services value localConfig still had from before
  // the toggle.
  const patchServiceToggle = useCallback((services) => {
    autoSaveQueue.current = autoSaveQueue.current.then(async () => {
      const data = await patchServices(services);
      if (data) update({ services: data.services });
    });
  }, [patchServices, update]);

  // Same immediate-save treatment as service toggles, for Service Area
  // (states + cities) -- adding a city or state via plain update() only
  // staged it in localConfig until the header's Save Changes was clicked,
  // which is exactly the "did it actually take effect?" confusion the
  // service-toggle auto-save already fixed once. saveConfig's PUT merges
  // just the given field into whatever's already saved server-side, so
  // this is safe to fire alongside the same optimistic local update().
  const autoSave = useCallback((partial) => {
    update(partial);
    autoSaveQueue.current = autoSaveQueue.current.then(() => saveConfig(partial));
  }, [update, saveConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let tab = params.get('tab');
    let section = params.get('section');
    // Subscription used to be its own top-level tab (?tab=subscription);
    // it's now a Settings sub-section. Old links still point at the old
    // URL -- sent emails, bookmarks, Stripe's own cancel/return URLs that
    // haven't rolled out everywhere yet -- so redirect those here instead
    // of silently dropping them now that 'subscription' isn't in NAV.
    if (tab === 'subscription') { tab = 'settings'; section = 'subscription'; }
    let landedOnDeepLink = false;
    if (tab && NAV.find(n => n.id === tab)) {
      setViewMode('widget');
      setActiveTab(tab);
      if (tab === 'settings' && section) setSettingsSection(section);
      landedOnDeepLink = true;
    }

    const sessionId = params.get('session_id');
    const subscribed = params.get('subscribed');
    if (sessionId && subscribed === 'true') {
      setViewMode('widget');
      setActiveTab('settings');
      setSettingsSection('subscription');
      verifyCheckoutSession(sessionId);
      landedOnDeepLink = true;
    }

    // A ?tab=... link (from a lifecycle email, a bookmark, Stripe's
    // cancel/return URL) is meant to land you on that tab ONCE -- it
    // wasn't meant to become the dashboard's new permanent address. Left
    // in place, the address bar (and any bookmark/home-screen shortcut
    // made from it) keeps that query string, so every later reload or
    // fresh login replays the same "jump into Widget Mode on this tab"
    // effect forever, instead of landing on Calculator Mode -- the actual
    // default -- the way a plain /company visit does. Scrubbing the query
    // string right after honoring it once means only the deep link itself
    // forces Widget Mode; reloading afterward (today, tomorrow, from a
    // saved shortcut) falls through to the real default.
    if (landedOnDeepLink) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSubStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);


  const loadSubStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setSubStatusError(true); return; }
      const res = await getSubscriptionStatus(token);
      setSubStatus(res.data);
    } catch (err) {
      console.warn('Could not load subscription status:', err.message);
      setSubStatusError(true);
    }
  };

  const verifyCheckoutSession = async (sessionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await verifyCheckout(token, sessionId);
      setSubStatus(res.data);
      // URL cleanup (dropping session_id/subscribed, and not re-adding
      // ?tab=settings&section=subscription) already happened synchronously
      // right after this was kicked off -- see the mount effect's own
      // replaceState and comment for why a deep link shouldn't become the
      // page's new permanent address.
    } catch (err) {
      console.warn('Checkout verification failed:', err.message);
    }
  };

  const isPaused = subStatus && !subStatus.active;
  const deletionPending = config?.pendingDeletion;
  const showWelcome = justCreated && !welcomeDismissed;

  // Also waits on subStatus before deciding what to render -- otherwise an
  // account that needs the ActivationGate below would flash the real
  // dashboard first, for however long the subscription-status request
  // takes to resolve. Falls through once subStatusError is set (a fetch
  // that failed outright), same as before this gate existed, rather than
  // spinning forever over a transient network issue.
  if (loading || (subStatus === null && !subStatusError)) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading your dashboard…</div>
      </div>
    </div>
  );

  if (subStatus && (!subStatus.active || subStatus.needsCardForTrial)) {
    return <ActivationGate subStatus={subStatus} onLogout={onLogout} />;
  }

  const tabProps = { config, saveConfig, saving, saved, error, user, subStatus, onSubRefresh: loadSubStatus };

  const TABS = {
    overview:     <OverviewTab {...tabProps} />,
    // config (not localConfig's remount-key siblings) is enough here --
    // HelpTab has no internal state tied to country, it's a pure function
    // of the country prop, so it re-renders correctly on every prop change
    // without needing a remount.
    help:         <HelpTab config={localConfig} />,
    branding:     <BrandingTab config={localConfig} update={update} autoSave={autoSave} onSave={handleGlobalSave} saving={saving} saved={saved} user={user} />,
    // Keyed on country so switching it from the header's dropdown (see
    // above) always remounts this tab fresh -- ServicesTab's own region
    // state only ever initializes once per mount (see its initialized
    // ref), so without a fresh mount here a tab left open across a header
    // country change would keep showing the old country's state/province
    // list until manually reloaded.
    services:     <ServicesTab key={localConfig?.country || 'US'} config={localConfig} update={update} patchServices={patchServiceToggle} autoSave={autoSave} />,
    leads:        <LeadsTab {...tabProps} />,
    settings:     <SettingsTab user={user} config={config} saveConfig={saveConfig} saving={saving} refetchConfig={refetch} onLogout={onLogout} section={settingsSection} onSectionChange={setSettingsSection} subStatus={subStatus} onSubRefresh={loadSubStatus} />,
  };

  const subBadge = subStatus ? (() => {
    if (subStatus.status === 'requires_trial_setup') return { label: 'Start Trial', bg: '#1e3a8a', color: '#bfdbfe' };
    if (subStatus.status === 'trialing') return { label: `Trial · ${subStatus.daysLeft}d`, bg: '#1e3a8a', color: '#bfdbfe' };
    if (subStatus.status === 'active') return { label: 'Active', bg: '#14532d', color: '#bbf7d0' };
    if (subStatus.status === 'active_canceling') return { label: 'Canceling', bg: '#78350f', color: '#fde68a' };
    if (subStatus.status === 'past_due') return { label: 'Past Due', bg: '#7f1d1d', color: '#fecaca' };
    return { label: 'Expired', bg: '#7f1d1d', color: '#fecaca' };
  })() : null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #16213b 100%)', color: 'white', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 8px' : '0 24px', position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #1e293b',
        boxShadow: '0 1px 0 #1e293b, 0 4px 20px rgba(0,0,0,0.35)',
        gap: isMobile ? 4 : 8,
      }}>
        {/* Left: logo + breadcrumb -- text dropped on mobile, same as
            Header.js's public nav, so the icon alone anchors this side. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 900 }}>✦</span>
            </div>
            {!isMobile && <span style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>Clean Estimator</span>}
          </a>
        </div>

        {/* Everything right of the logo lives in one scrollable row instead
            of 3 separate flexShrink:0 groups spread by the header's own
            space-between -- that older layout had no fallback once Widget/
            Calculator + country + the subscription badge + Save + Sign Out
            together exceeded a phone's width: nothing could shrink
            (flexShrink:0 on every group) and the header itself never
            scrolled, so whatever didn't fit (the subscription badge, most
            often) was silently clipped off the right edge of the screen
            with no way to reach it at all. overflow-x:auto here means that
            can now be reached with a swipe instead of vanishing; shrinking
            the country select to flag-only on mobile (below) means it
            usually doesn't even need to. Desktop is unaffected -- at
            >768px this row has more space than its content needs, so
            justify-content:space-between still spreads the three groups
            exactly as before and nothing ever actually scrolls. */}
        <div
          className="ce-dash-header-scroll"
          style={{
            display: 'flex', alignItems: 'center', flex: 1, minWidth: 0,
            gap: isMobile ? 10 : 0, justifyContent: isMobile ? 'flex-start' : 'space-between',
            overflowX: isMobile ? 'auto' : 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          <style>{`.ce-dash-header-scroll::-webkit-scrollbar { display: none; }`}</style>

          {/* Widget Mode / Calculator Mode switch -- Widget Mode is the full
              dashboard (sidebar + tabs) exactly as before; Calculator Mode
              drops all of that and shows nothing but the calculator,
              full-page, for running a quick internal estimate. Shorter
              labels on mobile ("Widget"/"Calculator"). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 3, flexShrink: 0 }}>
            {[
              { id: 'widget', label: isMobile ? 'Widget' : 'Widget Mode', Icon: Code2 },
              { id: 'calculator', label: isMobile ? 'Calculator' : 'Calculator Mode', Icon: Zap },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '6px 8px' : '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: viewMode === id ? '#2563eb' : 'transparent',
                  color: viewMode === id ? 'white' : '#94a3b8',
                  fontWeight: 700, fontSize: isMobile ? 11.5 : 12.5, whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Country -- which pricing data/currency/region list the calculator
              uses (see ServicesTab.js's fuller explanation). Lives in the
              header, not buried in Settings, since it's a one-time account-wide
              switch like Widget/Calculator Mode next to it, not a per-visit
              setting. Auto-saves on change, same immediate-persist treatment
              as Service Area -- a setting this consequential shouldn't need a
              separate Save Changes click to actually take effect. Flag code
              (not full name) on mobile, same space-saving as before -- the
              difference now is the flag itself is a real rendered icon
              (CountryFlag), not emoji text, so it's no longer the part that
              was silently blank on desktop. */}
          <div style={{ flexShrink: 0, position: 'relative', display: 'flex' }}>
            {/* appearance:none above strips the native dropdown arrow with
                nothing replacing it, so this read as a plain static badge
                (like the Save/Saved indicator) rather than something
                clickable. A chevron, overlaid and pointer-events:none so
                clicks still reach the <select> underneath it, restores that
                "this opens a menu" affordance without giving up the custom
                pill styling. The flag icon on the left is the same idea --
                an overlay, not part of the <option> text, since a native
                <select> can't render anything but plain text inside its own
                options regardless of what the collapsed/closed state shows. */}
            <select
              value={localConfig?.country || 'US'}
              onChange={e => autoSave({ country: e.target.value, serviceStates: [], serviceCities: [] })}
              title="Country"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '6px 20px 6px 24px' : '6px 24px 6px 28px', borderRadius: 20,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                color: 'white', fontWeight: 700, fontSize: isMobile ? 11.5 : 12.5,
                cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none',
              }}
            >
              <option value="US" style={{ color: '#111827' }}>{isMobile ? 'US' : 'United States'}</option>
              <option value="CA" style={{ color: '#111827' }}>{isMobile ? 'CA' : 'Canada'}</option>
              <option value="GB" style={{ color: '#111827' }}>{isMobile ? 'GB' : 'United Kingdom'}</option>
              <option value="AU" style={{ color: '#111827' }}>{isMobile ? 'AU' : 'Australia'}</option>
            </select>
            <div style={{ position: 'absolute', left: isMobile ? 7 : 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <CountryFlag country={localConfig?.country || 'US'} size={14} />
            </div>
            <ChevronDown
              size={13}
              style={{ position: 'absolute', right: isMobile ? 5 : 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.65)', pointerEvents: 'none' }}
            />
          </div>

          {/* Right: badge, save, user -- Schedule a Walkthrough, the Saved
              confirmation, the divider, and the email address all drop on
              mobile (promotional/secondary, not needed to use the
              dashboard); Save and Sign Out shrink to icon-only buttons. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10, flexShrink: 0 }}>
          {!isMobile && (
            <a
              href={WALKTHROUGH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pulse-cta"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)',
                color: 'white', textDecoration: 'none', fontSize: 12.5, fontWeight: 600,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            >
              <CalendarClock size={13} /> Schedule a Walkthrough
            </a>
          )}

          {subBadge && (
            <div style={{
              fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
              background: subBadge.bg, color: subBadge.color, letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}>
              {subBadge.label}
            </div>
          )}

          {viewMode === 'widget' && (
            <button
              onClick={handleGlobalSave}
              disabled={saving}
              title="Save Changes"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '7px 9px' : '7px 16px',
                background: saving ? '#334155' : '#2563eb',
                color: 'white', border: 'none', borderRadius: 7,
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13, transition: 'background 0.15s',
              }}
            >
              {saving
                ? <Loader2 size={13} className="spin" />
                : <Save size={13} />
              }
              {!isMobile && (saving ? ' Saving…' : ' Save Changes')}
            </button>
          )}

          {!isMobile && viewMode === 'widget' && saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
              <Check size={14} strokeLinecap="square" strokeLinejoin="miter" /> Saved
            </div>
          )}

          {!isMobile && <div style={{ width: 1, height: 20, background: '#1e293b', margin: '0 2px' }} />}

          {!isMobile && <span style={{ color: '#64748b', fontSize: 12 }}>{user.email}</span>}

          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: '#64748b', border: '1px solid #1e293b',
              padding: isMobile ? '6px 9px' : '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
          >
            <LogOut size={13} /> {!isMobile && 'Sign Out'}
          </button>
          </div>
        </div>
      </header>

      {viewMode === 'calculator' ? (
        /* Calculator Mode -- no sidebar, no tabs, nothing but the
           calculator itself, same as the public site. Keyed on country and
           fed localConfig (not the hook's own config), same fix as
           ServicesTab above and for the same reason: CleaningCalculator's
           own step/selection/result state only ever initializes once per
           mount, so without a fresh mount here, switching the header's
           country dropdown left this tab showing the PREVIOUS country's
           already-computed result (wrong currency, wrong region) with
           nothing on screen indicating the country actually changed.
           localConfig over config because it updates optimistically the
           instant the dropdown changes, not after the save round-trip
           resolves -- the same immediacy the dropdown itself needs to feel
           like it actually did something. */
        <RunEstimateTab key={localConfig?.country || 'US'} config={localConfig} user={user} />
      ) : (
      /* Nav -- left sidebar, sticky under the header. */
      <div className="dash-main">
        <nav className="dash-nav">
          {NAV.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`dash-nav-item${activeTab === id ? ' active' : ''}`}
            >
              <Icon size={16} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              <span>{label}</span>
              {id === 'leads' && config?.leadsCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: activeTab === 'leads' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'leads' ? 'white' : '#64748b',
                  borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {config.leadsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Pending account deletion banner */}
          {deletionPending && (
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                <AlertCircle size={15} />
                Your account is scheduled for deletion on {new Date(deletionPending.scheduledFor).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Your widget is paused in the meantime.
              </div>
              <button onClick={() => { setActiveTab('settings'); setSettingsSection('account'); }} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Cancel Deletion →
              </button>
            </div>
          )}

          {/* Subscription expired banner */}
          {!deletionPending && isPaused && (
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                <AlertCircle size={15} />
                Your widget is currently paused — {subStatus.status === 'requires_trial_setup' ? 'reload the page or reach out if this doesn\'t clear on its own' : subStatus.status === 'expired' ? 'your 30-day free trial has ended' : 'subscription issue'}.
              </div>
              <button onClick={() => { setActiveTab('settings'); setSettingsSection('subscription'); }} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                {subStatus.status === 'requires_trial_setup' ? 'Get Started →' : 'Reactivate →'}
              </button>
            </div>
          )}

          {/* Free website build cross-sell -- separate offer from the
              estimator widget itself (see WebsiteSubscription.js /
              /website-for-cleaning-companies), pitched here since a
              company already paying for the estimator is exactly who's
              likely to not have a real site yet. */}
          {!websiteOfferDismissed && (
            <div style={{ background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)', padding: '10px 44px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 16, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                <Globe size={15} style={{ flexShrink: 0 }} />
                No website yet? We'll build you a free sample — you decide if you want to keep it.
              </div>
              <a
                href="/website-for-cleaning-companies"
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: 'white', color: '#1d4ed8', padding: '6px 14px', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Build My Free Sample Site →
              </a>
              <button
                onClick={dismissWebsiteOffer}
                aria-label="Dismiss"
                style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Tab content */}
          <main className="dash-content">
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '11px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {Object.entries(TABS).map(([id, tab]) => (
              <div key={id} style={{ display: id === activeTab ? 'block' : 'none' }}>
                {tab}
              </div>
            ))}

            <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', marginTop: 32 }}>
              Need help? Email <a href="mailto:info@cleanestimator.com" style={{ color: '#2563eb' }}>info@cleanestimator.com</a>
            </p>
          </main>
        </div>
      </div>
      )}

      {/* First-time welcome pointer -- shown exactly once, on the very
          first login after signup (see the `created` comment on
          GET /api/company/:id and useCompanyConfig.js's justCreated).
          Points straight at Help & Docs rather than dumping onboarding
          content in a modal, since that tab already covers how pricing
          works and how to set everything up -- no need to duplicate it. */}
      {showWelcome && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
          onClick={() => setWelcomeDismissed(true)}
        >
          <div
            style={{ background: 'white', borderRadius: 7, padding: '32px 30px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 52, height: 52, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <HelpCircle size={26} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Welcome to Clean Estimator!</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              New here? Start with <strong>Help &amp; Docs</strong> — it walks you through how pricing works and how to set up your branding, service area, and embed code before you dive in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { setActiveTab('help'); setWelcomeDismissed(true); }}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13.5 }}
              >
                Go to Help &amp; Docs →
              </button>
              <button
                onClick={() => setWelcomeDismissed(true)}
                style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
