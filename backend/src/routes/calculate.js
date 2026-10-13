const express = require('express');
const router = express.Router();
const { calculateCleaning } = require('../services/cleaningCalculation');
const { STATE_PRICING_MULTIPLIERS, STATE_AVERAGE_HOME_CLEANING_COST, STATE_NAMES } = require('../config/defaults');
const { getCompanyConfig } = require('../services/companyConfig');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { saveLead } = require('./leads');
const { sendEstimateEmail, sendPartnerLeadEmail, sendCompanyLeadEmail } = require('../services/email');
const { resolveCityForZip } = require('../services/zipCity');

const VALID_SERVICE_TYPES = [
  'home_residential', 'apartment', 'commercial', 'carpet', 'upholstery',
  'air_duct', 'dryer_vent', 'tile_grout', 'mold_remediation', 'water_damage',
];

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// This route has no authenticated req.user (companyId just arrives in the
// body, from the public embed widget or the dashboard's own Calculator
// Mode) -- so computeSubscriptionStatus's ALWAYS_ACTIVE_EMAIL bypass
// (Elias's own demo/testing account) was always being checked against
// `null` and never actually applying here, even though it correctly
// applies on GET /api/subscription/status where req.user.email is
// available. Same companyId-to-owner-email lookup trialScheduler.js
// already uses, so that demo account's own calculator works regardless of
// whether it's ever been through Checkout.
async function getOwnerEmail(companyId) {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(companyId);
    if (error) return null;
    return data?.user?.email || null;
  } catch (err) {
    console.warn('getOwnerEmail failed:', err.message);
    return null;
  }
}

// req.body.partnerInfo is whatever the browser's own (client-side, anon-key)
// partner match produced -- never trust its .email for anything that sends
// mail, or anyone could POST directly to this endpoint with a fabricated
// partnerInfo.email and get us to send an arbitrary "new lead" email to any
// address, using our domain's sending reputation. This re-looks-up the
// partner by id against our own database and only ever sends to the
// business_email on file there (not personal_email, which is only for
// /client login and never used for lead forwarding), only if that partner
// is still active.
async function getVerifiedPartnerEmail(partnerId) {
  if (!partnerId) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('partners')
      .select('business_email, active')
      .eq('id', partnerId)
      .eq('active', true)
      .maybeSingle();
    return data?.business_email || null;
  } catch (err) {
    console.warn('getVerifiedPartnerEmail failed:', err.message);
    return null;
  }
}

// Same table logBannerEvent() in partnerLookup.js writes impression/call_click
// rows to (from the browser, anon key) -- this is the backend's equivalent
// for the one event type that only ever happens server-side.
async function logLeadEmailEvent(partnerId) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('partner_banner_events').insert({ partner_id: partnerId, event_type: 'lead_email' });
  } catch (err) {
    console.warn('logLeadEmailEvent failed:', err.message);
  }
}

// ─── Public calculator daily limit ─────────────────────────────────────────
// The free, unbranded calculator (homepage, state/city/service pages) is
// meant for a homeowner pricing their own one-off job. A cleaning business
// using it instead of subscribing to run unlimited internal estimates
// defeats the entire point of the $25/mo plan, so anyone who answers
// LeadCaptureStep's "I am a..." question as "Cleaning business / cleaner"
// gets capped at PUBLIC_BUSINESS_DAILY_LIMIT free estimates per calendar day.
//
// That self-reported answer used to be the ONLY thing this gate looked at --
// attempts recorded as "Homeowner" were never counted at all. That meant the
// entire limit was an honor-system checkbox: a business just answering
// "Homeowner" on every attempt got unlimited free estimates with zero
// enforcement, same ip/email/phone and all. Every attempt (either answer) is
// now recorded and counted, with a separate, higher PUBLIC_TOTAL_DAILY_LIMIT
// applied regardless of role -- strict for a declared business (still just
// PUBLIC_BUSINESS_DAILY_LIMIT), but a genuine homeowner comparing a couple
// of services in one sitting still isn't blocked, while someone running the
// same identifier through repeatedly -- whatever they answer -- eventually
// is. Never applies when companyId is set (a company's own embedded widget
// or their dashboard's Calculator Mode -- both already gated on an active
// subscription above, not this).
const PUBLIC_BUSINESS_DAILY_LIMIT = 2;
const PUBLIC_TOTAL_DAILY_LIMIT = 4;

function startOfTodayISO() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// One indexed count query per identifier actually present (ip is always
// present; email/phone only when LeadCaptureStep collected them) rather
// than a single OR'd query -- simpler to keep correct than hand-building a
// PostgREST .or() filter string out of user-supplied values, and the
// identifier columns are each individually indexed with created_at for
// exactly this lookup (see the migration). Blocks if ANY identifier alone
// already shows the day's limit -- matching by ip catches someone who
// skips email/phone on a later attempt, matching by email/phone catches
// someone switching networks (and thus IP) between attempts. Two counts per
// identifier: a business-only count (for the strict, role-declared limit)
// and a total count across both roles (for the role-independent ceiling).
async function publicDailyLimitReached({ ip, email, phone }) {
  const supabase = getSupabase();
  if (!supabase) return { blocked: false, businessLimited: false }; // no DB configured (local dev) -- never block
  const since = startOfTodayISO();
  try {
    const identifiers = [['ip', ip], ['email', email], ['phone', phone]].filter(([, value]) => !!value);
    const counts = await Promise.all(
      identifiers.map(async ([column, value]) => {
        const countQuery = (extra) => {
          let q = supabase.from('public_estimate_attempts').select('id', { count: 'exact', head: true }).gte('created_at', since).eq(column, value);
          return extra ? q.eq('user_type', extra) : q;
        };
        const [totalRes, businessRes] = await Promise.all([countQuery(), countQuery('business')]);
        // supabase-js doesn't throw on an API-level error (bad key, missing
        // table/column, etc.) -- it resolves with { error, count: null } --
        // so this has to be checked explicitly or a real misconfiguration
        // would silently read as "0 attempts so far" forever instead of
        // ever surfacing in the logs.
        if (totalRes.error) console.warn(`publicDailyLimitReached(${column} total) query failed:`, totalRes.error.message);
        if (businessRes.error) console.warn(`publicDailyLimitReached(${column} business) query failed:`, businessRes.error.message);
        return { total: totalRes.error ? 0 : (totalRes.count || 0), business: businessRes.error ? 0 : (businessRes.count || 0) };
      })
    );
    const businessLimited = counts.some(c => c.business >= PUBLIC_BUSINESS_DAILY_LIMIT);
    const totalLimited = counts.some(c => c.total >= PUBLIC_TOTAL_DAILY_LIMIT);
    return { blocked: businessLimited || totalLimited, businessLimited };
  } catch (err) {
    console.warn('publicDailyLimitReached check failed:', err.message);
    return { blocked: false, businessLimited: false }; // fail open -- a DB hiccup shouldn't block a real visitor
  }
}

async function recordPublicEstimateAttempt({ ip, email, phone, userType }) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('public_estimate_attempts').insert({ ip: ip || null, email: email || null, phone: phone || null, user_type: userType || null });
    if (error) console.warn('recordPublicEstimateAttempt insert failed:', error.message);
  } catch (err) {
    console.warn('recordPublicEstimateAttempt failed:', err.message);
  }
}

// POST /api/calculate
router.post('/', async (req, res) => {
  const { serviceType, zip, state, serviceDetails, companyId, leadInfo, partnerInfo } = req.body;

  // Validate
  if (!serviceType || !VALID_SERVICE_TYPES.includes(serviceType)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing serviceType' });
  }
  if (!zip && !state) {
    return res.status(400).json({ success: false, error: 'zip or state is required' });
  }

  try {
    // Load company config if companyId provided
    let companyConfig = {};
    if (companyId) {
      try { companyConfig = (await getCompanyConfig(companyId)) || {}; } catch {}
      // Real enforcement, not just a dashboard banner: an account that
      // hasn't completed Stripe Checkout (or whose subscription has since
      // lapsed) never gets a working calculator -- neither the public
      // embed widget nor the dashboard's own Calculator Mode, both of
      // which route through this same endpoint with companyId set. Without
      // this, removing the old no-card auto-trial (see
      // companyConfig.js's getOrCreateCompanyConfig) would still leave an
      // unactivated account free to calculate forever, just without the
      // trial clock -- an even bigger loophole than the one it replaces.
      const ownerEmail = await getOwnerEmail(companyId);
      if (!computeSubscriptionStatus(companyConfig, ownerEmail).active) {
        // subscriptionInactive lets CleaningCalculator.js tell this apart
        // from a generic error -- shown as a plain, customer-safe inline
        // message on the embedded widget (a stranger visiting a company's
        // site shouldn't see "please subscribe"), but as a clear "Calculator
        // paused, please subscribe" popup when it's the account owner
        // hitting this from their own dashboard's Calculator Mode.
        return res.status(402).json({ success: false, subscriptionInactive: true, error: 'This estimator is temporarily unavailable. Please contact the business directly.' });
      }
    } else {
      const ip = req.ip || req.socket?.remoteAddress || null;
      const { blocked, businessLimited } = await publicDailyLimitReached({ ip, email: leadInfo?.email || null, phone: leadInfo?.phone || null });
      if (blocked) {
        return res.status(429).json({
          success: false,
          limitReached: true,
          error: businessLimited
            ? `Cleaning businesses are limited to ${PUBLIC_BUSINESS_DAILY_LIMIT} free estimates per day on this tool.`
            : `You've reached today's limit of ${PUBLIC_TOTAL_DAILY_LIMIT} free estimates on this tool. Need unlimited estimates for your business? Clean Estimator is $25/month with a 30-day free trial.`,
        });
      }
    }

    const result = await calculateCleaning(
      { serviceType, zip: zip || null, state: state || null, serviceDetails: serviceDetails || {} },
      companyConfig
    );

    // Save lead / send the estimate email based on email alone -- the
    // lead-capture form marks name as optional (no `required` attribute,
    // labeled "(optional)"), so gating on both silently dropped this whole
    // block whenever a visitor left name blank. sendEstimateEmail's own
    // buildHtml already falls back to "there" when name is missing.
    if (leadInfo && leadInfo.email) {
      try {
        await saveLead({
          companyId: companyId || null,
          name: leadInfo.name || null,
          email: leadInfo.email,
          phone: leadInfo.phone || null,
          serviceType,
          zip: zip || null,
          state: result.state,
          estimatedPriceLow: result.totalLow,
          estimatedPriceHigh: result.totalHigh,
          timeline: leadInfo.timeline || null,
          preferredContact: leadInfo.preferredContact || null,
          userType: leadInfo.userType || null,
          serviceDetails: serviceDetails || {},
          customAnswers: leadInfo.customAnswers || {},
        });
      } catch (leadErr) {
        console.warn('Lead save failed (non-critical):', leadErr.message);
      }

      // Reply-to on the visitor's estimate email, so hitting "Reply" reaches
      // the company directly -- uses the company-chosen lead-notification
      // address, never the Supabase Auth signup email (that's just a login
      // credential, not something to expose to visitors or route mail to).
      const leadNotificationEmail = companyConfig.leadNotificationEmail || null;

      // Fire-and-forget: sendEstimateEmail never throws, so this never
      // blocks or breaks the response on email delivery. Passes the full
      // result (breakdown, key factors, recurring pricing) and the
      // already-resolved partner match so the email mirrors exactly what
      // the results page showed, not just the top-line price range.
      sendEstimateEmail({
        to: leadInfo.email,
        name: leadInfo.name,
        serviceType,
        result,
        companyConfig,
        partner: partnerInfo || null,
        replyTo: leadNotificationEmail || undefined,
      }).catch(err => console.error('Estimate email failed:', err.message));

      // Forward the same lead to the matched partner, if any -- the
      // lead-capture form already tells visitors "we'll connect you with
      // local cleaning professionals," so this makes that a proactive
      // handoff instead of just a passive listing they might not click.
      if (partnerInfo && partnerInfo.id) {
        const partnerIdForLead = partnerInfo.id;
        getVerifiedPartnerEmail(partnerIdForLead)
          .then(async partnerEmail => {
            if (!partnerEmail) {
              // partnerInfo.id didn't resolve to a currently-active partner
              // with a business_email on file -- logged so this is
              // diagnosable from server logs instead of just "no email
              // arrived" with no trace of why.
              console.warn(`Partner lead email skipped: partner ${partnerIdForLead} not found, inactive, or missing business_email`);
              return;
            }
            // Resolved here (not before res.json above) so a slow/failed ZIP
            // lookup can never delay the visitor's own response -- this only
            // affects the partner's email, sent well after the response
            // already went out. Prefers an explicit serviceDetails.city (a
            // scoped-widget visitor who was actually asked) over the ZIP
            // guess, same priority as the admin homepage-leads panel.
            const leadCity = serviceDetails?.city || await resolveCityForZip(zip);
            const sent = await sendPartnerLeadEmail({
              partnerEmail,
              leadName: leadInfo.name,
              leadEmail: leadInfo.email,
              leadPhone: leadInfo.phone,
              serviceType,
              priceLow: result.totalLow,
              priceHigh: result.totalHigh,
              city: leadCity,
              state: result.state,
              zip: zip || null,
              timeline: leadInfo.timeline || null,
              adjustments: result.adjustments,
              keyFactors: result.keyFactors,
              serviceDetails: serviceDetails || {},
            });
            // Logged as a partner_banner_events row (same table/pattern as
            // banner impressions and call-button taps) so it shows up
            // alongside those in the partner's KPI dashboard. Only counted
            // on an actual successful send, not just an attempt.
            if (sent) await logLeadEmailEvent(partnerIdForLead);
            else console.warn(`Partner lead email send failed for partner ${partnerIdForLead} (see sendPartnerLeadEmail warning above)`);
          })
          .catch(err => console.error('Partner lead email failed:', err.message));
      } else {
        // No client-supplied partner match at all -- either there's
        // genuinely no active partner in this visitor's city, or the
        // browser's own geolocation/Supabase lookup (partnerLookup.js)
        // didn't resolve one in time. Can't tell which from here, but at
        // least this is now visible in server logs instead of a lead
        // silently never reaching a partner with no trace of why.
        console.log(`No partner match on this lead (serviceType=${serviceType}, state=${result.state || state || 'unknown'})`);
      }

      // Notify the company (embed subscriber) about leads on their own
      // widget -- previously the only way to find out was checking the
      // Leads tab manually. Sent to the address they configured in
      // Branding > Lead Notifications, never the Auth signup email (see
      // leadNotificationEmail above -- same reasoning).
      if (companyId) {
        if (leadNotificationEmail) {
          // Same fire-and-forget/non-blocking city resolution as the
          // partner email above -- wrapped in an async IIFE since this
          // call site (unlike the partner one) isn't already inside an
          // async function to await within.
          (async () => {
            const leadCity = serviceDetails?.city || await resolveCityForZip(zip);
            await sendCompanyLeadEmail({
              to: leadNotificationEmail,
              companyName: companyConfig.companyName || 'Clean Estimator',
              leadName: leadInfo.name,
              leadEmail: leadInfo.email,
              leadPhone: leadInfo.phone,
              serviceType,
              priceLow: result.totalLow,
              priceHigh: result.totalHigh,
              city: leadCity,
              state: result.state,
              zip: zip || null,
              timeline: leadInfo.timeline || null,
              adjustments: result.adjustments,
              keyFactors: result.keyFactors,
              serviceDetails: serviceDetails || {},
            });
          })().catch(err => console.error('Company lead email failed:', err.message));
        } else {
          console.warn(`Company lead email skipped: no leadNotificationEmail configured for company ${companyId}`);
        }
      }
    }

    // Only counts toward the daily cap once the calculation actually
    // succeeded -- a request that errored out before this point never
    // got a usable estimate, so it shouldn't cost the visitor one of
    // their free attempts. Recorded for every public attempt now, not
    // just ones self-declared "business" -- see publicDailyLimitReached.
    if (!companyId) {
      const ip = req.ip || req.socket?.remoteAddress || null;
      recordPublicEstimateAttempt({ ip, email: leadInfo?.email || null, phone: leadInfo?.phone || null, userType: leadInfo?.userType || null })
        .catch(err => console.warn('recordPublicEstimateAttempt failed:', err.message));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculation error:', err.message, err.stack);
    res.status(500).json({ success: false, error: 'Calculation failed. Please try again.' });
  }
});

// GET /api/calculate/state-data
router.get('/state-data', (req, res) => {
  const data = Object.entries(STATE_PRICING_MULTIPLIERS).map(([abbr, mult]) => ({
    abbr,
    name: STATE_NAMES[abbr] || abbr,
    multiplier: mult,
    averageHomeCost: STATE_AVERAGE_HOME_CLEANING_COST[abbr] || null,
  }));
  res.json({ success: true, data });
});

module.exports = router;
