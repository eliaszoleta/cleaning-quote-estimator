const express = require('express');
const router = express.Router();
const { calculateCleaning } = require('../services/cleaningCalculation');
const { STATE_PRICING_MULTIPLIERS, STATE_AVERAGE_HOME_CLEANING_COST, STATE_NAMES, COUNTRIES } = require('../config/defaults');
const { getCompanyConfig } = require('../services/companyConfig');
const { computeSubscriptionStatus } = require('../services/subscriptionStatus');
const { saveLead } = require('./leads');
const { sendEstimateEmail, sendPartnerLeadEmail, sendCompanyLeadEmail } = require('../services/email');
const { resolveCityForZip } = require('../services/zipCity');

const VALID_SERVICE_TYPES = [
  'home_residential', 'apartment', 'commercial', 'carpet', 'upholstery',
  'air_duct', 'dryer_vent', 'tile_grout', 'mold_remediation', 'water_damage',
  'airbnb', 'post_construction',
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
// Flat limit: PUBLIC_DAILY_LIMIT free estimates per calendar day on the
// free, unbranded calculator (homepage, state/city/service pages), tracked
// by IP address only -- applies to every visitor, regardless of how
// LeadCaptureStep's "I am a..." question was answered. The whole point of
// the $25/mo Internal Estimator plan is unlimited calculations for a
// cleaning business's own quoting; without some limit, a business could
// just keep using the free consumer-facing tool instead of ever
// subscribing.
//
// This used to be scoped to a self-reported "Cleaning business" answer
// only, matched against ip/email/phone -- but that made the whole thing an
// honor-system checkbox (answer "Homeowner" instead and the limit never
// applied, same identifiers and all). Flat and IP-only is simpler and
// closes that loophole; the tradeoff is a shared IP (an office, a NAT'd
// household) hits the same cap together, which is an acceptable edge case
// for a free tool protecting a $25/mo plan. Never applies when companyId
// is set (a company's own embedded widget or their dashboard's Calculator
// Mode -- both already gated on an active subscription above, not this).
const PUBLIC_DAILY_LIMIT = 2;

// req.ip (via Express's trust-proxy hop count, set to 1 in index.js) isn't
// reliable for this app's actual path: the frontend's Vercel rewrite
// proxies /api/* to this Railway service, which is a SECOND hop on top of
// Railway's own ingress proxy -- but trust-proxy=1 only trusts one hop, so
// req.ip ends up reading the wrong entry out of X-Forwarded-For (an edge
// node's address rather than the visitor's), and since Vercel's edge has
// many nodes with no session affinity, that value can differ between
// requests from the exact same visitor. That silently defeated the
// public-daily-limit check below -- every attempt looked like it came
// from a "new" IP with zero prior attempts, so it never actually blocked
// anyone. Reading X-Forwarded-For directly and taking its first entry
// (the original client, which every hop after it only ever appends to,
// never rewrites) sidesteps the hop-count guesswork entirely, regardless
// of how many proxies sit in front of this service.
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || null;
}

// Backstop for tryRecordPublicEstimateAttempt below -- this limit is
// explicitly a "must never silently stop working" requirement (it protects
// the paid Internal Estimator plan from being replaced by the free public
// tool), so the DB-backed check failing open on ANY error -- missing
// Supabase config, a migration that was never run, a transient network
// blip, anything -- is not an acceptable failure mode; it previously meant
// a real production incident (the limit silently stopped applying at all)
// surfaced only as a console.warn nobody was watching. This in-process Map
// is the fallback enforcement for exactly that gap: it doesn't survive a
// restart and doesn't synchronize across multiple server instances the way
// the DB check does, but on this app's actual single-instance Railway
// deployment it's a real, continuously-enforced cap, not just a log line.
// Used only when the DB-backed check can't be reached at all -- when it's
// reachable, it stays the primary (and more accurate/synchronized) source
// of truth.
const fallbackPublicAttempts = new Map(); // 'ip:<ip>' | 'device:<id>' -> { day: 'YYYY-MM-DD', count }

// Checked (and recorded) against BOTH identifiers when both are present --
// blocked if EITHER is already at the limit, same OR logic as the DB-backed
// path below. This is what actually closes the "just switch VPN servers"
// bypass: the IP-keyed entry resets to a fresh count on a new IP, but the
// device-keyed entry (backed by a persisted localStorage id, see
// deviceId.js) doesn't, so the visitor is still capped by whichever of the
// two they didn't also rotate.
function fallbackCheckAndRecord(ip, deviceId) {
  if (!ip && !deviceId) return true; // no identifier to check -- never block
  const today = new Date().toISOString().slice(0, 10);
  const keys = [];
  if (ip) keys.push(`ip:${ip}`);
  if (deviceId) keys.push(`device:${deviceId}`);
  for (const key of keys) {
    const entry = fallbackPublicAttempts.get(key);
    if (entry && entry.day === today && entry.count >= PUBLIC_DAILY_LIMIT) return false;
  }
  for (const key of keys) {
    const entry = fallbackPublicAttempts.get(key);
    if (!entry || entry.day !== today) {
      fallbackPublicAttempts.set(key, { day: today, count: 1 });
    } else {
      entry.count += 1;
    }
  }
  return true;
}

// Sweeps stale entries once an hour so this Map doesn't grow unbounded
// across days -- .unref() so this timer never keeps the process alive on
// its own (matters for graceful shutdown / test runs importing this file).
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [key, entry] of fallbackPublicAttempts) {
    if (entry.day !== today) fallbackPublicAttempts.delete(key);
  }
}, 60 * 60 * 1000).unref();

// Was two separate round trips -- a SELECT count to check the limit, then
// (after the whole calculation ran) a plain INSERT to record the attempt --
// with nothing synchronizing them. Two requests from the same visitor
// fired close together (just normal rapid "New Estimate" clicking, no
// special timing needed) could each run their SELECT before either INSERT
// had landed, so both saw the same under-the-limit count and passed --
// in practice letting a visitor through for 3+ "free" estimates against a
// limit of 2. record_public_estimate_attempt (see migration 025) does the
// check and the insert in one atomic DB call, serialized per-IP via an
// advisory lock, so this can't happen anymore. Returns true if this
// attempt was allowed (and is now recorded), false if the limit was
// already hit. deviceId (see deviceId.js on the frontend) is a second,
// independent identifier -- a persisted localStorage value, not derived
// from the request -- checked and recorded alongside ip so that switching
// VPN servers (a fresh IP, same browser/localStorage) doesn't reset the
// count. Blocked if EITHER identifier is already at the limit.
async function tryRecordPublicEstimateAttempt(ip, deviceId) {
  const supabase = getSupabase();
  // No DB configured at all (local dev, or a genuine misconfiguration in
  // production) -- previously always allowed; now still enforces the cap
  // via the in-process fallback instead of leaving this completely open.
  if (!supabase) return fallbackCheckAndRecord(ip, deviceId);
  if (!ip && !deviceId) return true; // no identifier to check -- never block
  try {
    const { data, error } = await supabase.rpc('record_public_estimate_attempt', { p_ip: ip, p_limit: PUBLIC_DAILY_LIMIT, p_device_id: deviceId || null });
    // supabase-js doesn't throw on an API-level error (bad key, function
    // not migrated yet, etc.) -- it resolves with { error, data: null } --
    // so this has to be checked explicitly or a real misconfiguration
    // would silently read as "always allowed" forever instead of ever
    // surfacing in the logs.
    if (error) {
      console.warn('tryRecordPublicEstimateAttempt failed, using in-process fallback limiter:', error.message);
      return fallbackCheckAndRecord(ip, deviceId);
    }
    return data !== false;
  } catch (err) {
    console.warn('tryRecordPublicEstimateAttempt failed, using in-process fallback limiter:', err.message);
    return fallbackCheckAndRecord(ip, deviceId);
  }
}

// Every successful companyId-scoped calculation -- internal Calculator Mode
// and the embedded widget both set companyId, so this is a holistic "this
// account used Clean Estimator" count, not just widget leads. Without this,
// a company using the tool purely internally (the primary pitch -- see
// CompanyLanding.js) left zero trace anywhere, so the dashboard had no way
// to reflect real usage for exactly the use case it's sold on. Read back by
// leads.js's GET /company/estimate-runs for OverviewTab's stat.
async function recordCompanyEstimateRun(companyId, serviceType) {
  const supabase = getSupabase();
  if (!supabase || !companyId) return;
  try {
    const { error } = await supabase.from('company_estimate_runs').insert({ company_id: companyId, service_type: serviceType || null });
    if (error) console.warn('recordCompanyEstimateRun insert failed:', error.message);
  } catch (err) {
    console.warn('recordCompanyEstimateRun failed:', err.message);
  }
}

// POST /api/calculate
router.post('/', async (req, res) => {
  const { serviceType, zip, state, serviceDetails, companyId, leadInfo, partnerInfo, country, deviceId } = req.body;

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
    // Hoisted above the companyId block (not just declared inside it) so
    // the lead-notification fallback further down can reuse this same
    // lookup instead of hitting the Supabase admin API a second time.
    let ownerEmail = null;
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
      ownerEmail = await getOwnerEmail(companyId);
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
      // Public calculator pages (cleanestimator.com's own homepage/landing
      // pages) now expose the same US/CA/GB/AU country picker a subscriber
      // sets in their dashboard header -- see CleaningCalculator.js's
      // publicCountry state. No companyConfig to read it from here, so it
      // arrives directly in the body instead; validated against the real
      // supported-country list rather than trusted outright, since this is
      // a public, unauthenticated endpoint. Falls back to US for anything
      // unrecognized (an older cached frontend bundle sending no country
      // at all included), matching every other country-aware surface's
      // default.
      companyConfig = { country: COUNTRIES[country] ? country : 'US' };

      const ip = getClientIp(req);
      // Checks the limit and records this attempt in one atomic DB call --
      // see tryRecordPublicEstimateAttempt's own comment for why this isn't
      // two separate steps anymore. Deliberately runs (and counts) before
      // calculateCleaning rather than after it succeeds, unlike the old
      // record-on-success design: that ordering is what let the race happen
      // in the first place, and a genuine calculateCleaning failure after a
      // valid, already-validated serviceType/zip/state is rare enough that
      // costing a visitor one of their two attempts on it is an acceptable
      // tradeoff for actually closing the loophole.
      // Defensive against a malformed/oversized value (this is a public,
      // unauthenticated endpoint) -- a real deviceId is always a short
      // UUID-ish string from deviceId.js, never anything close to this.
      const safeDeviceId = typeof deviceId === 'string' && deviceId.length > 0 && deviceId.length <= 100 ? deviceId : null;
      if (!(await tryRecordPublicEstimateAttempt(ip, safeDeviceId))) {
        return res.status(429).json({
          success: false,
          limitReached: true,
          error: `This tool is limited to ${PUBLIC_DAILY_LIMIT} free estimates per day. Need unlimited estimates for your business? Clean Estimator is $25/month with a 30-day free trial.`,
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
      // the company directly. Prefers the company-chosen lead-notification
      // address from Branding, but falls back to the owner's own signup
      // email when that field was never set -- previously this fell
      // straight to null with no fallback at all, which silently skipped
      // the internal lead-alert email entirely (see sendCompanyLeadEmail
      // below) and left the visitor's reply-to as the generic
      // info@cleanestimator.com instead of reaching the business.
      const leadNotificationEmail = companyConfig.leadNotificationEmail || ownerEmail || null;

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
        // Tells buildText/buildHtml whether this is a real visitor on a
        // company's actual embedded widget (real companyId here always
        // means that -- this route's lead-capture flow is never reached
        // from RunEstimateTab's internal tool, which skips lead capture
        // entirely) -- single-midpoint style -- or the free public
        // calculator (no companyId) -- original low–high range style.
        // Never assume a "the embeddable calculator should..." request
        // also means the public homepage calculator -- they're different
        // products with different audiences.
        isEmbedWidget: !!companyId,
        // Only meaningful on the public path (isEmbedWidget false) --
        // LeadCaptureStep.js's required "I am a..." question. A homeowner
        // just wants to know what it'll cost them, so the separate
        // "Midpoint Price" line is dropped for them (the
        // range + full breakdown stays -- just not that one extra line);
        // a self-identified cleaning business still gets it, since they're
        // actually pricing their own jobs and the range alone doesn't tell
        // them where to land.
        userType: leadInfo.userType || null,
      }).catch(err => console.error('Estimate email failed:', err.message));

      // Forward the same lead to the matched partner, if any -- the
      // lead-capture form already tells visitors "we'll connect you with
      // local cleaning professionals," so this makes that a proactive
      // handoff instead of just a passive listing they might not click.
      // Only ever for a self-identified homeowner (LeadCaptureStep.js's
      // required "I am a..." question) -- a self-identified cleaning
      // business isn't a prospective customer for one of our local
      // partners, so forwarding their contact info as a "lead" would be
      // meaningless at best. The recommended-partner card/section shown to
      // the visitor themselves (EstimateSentScreen.js, and the partner
      // section inside their own estimate email) is a separate thing and
      // deliberately NOT gated on userType -- see each of those for why.
      if (leadInfo.userType === 'homeowner' && partnerInfo && partnerInfo.id) {
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
      } else if (leadInfo.userType !== 'homeowner') {
        console.log(`Partner lead forwarding skipped -- userType is '${leadInfo.userType || 'unset'}', not 'homeowner' (serviceType=${serviceType})`);
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
              suggestedPrice: result.suggestedPrice,
              city: leadCity,
              state: result.state,
              zip: zip || null,
              timeline: leadInfo.timeline || null,
              adjustments: result.adjustments,
              keyFactors: result.keyFactors,
              serviceDetails: serviceDetails || {},
              country: companyConfig.country,
              currencySymbol: result.currencySymbol,
            });
          })().catch(err => console.error('Company lead email failed:', err.message));
        } else {
          console.warn(`Company lead email skipped: no leadNotificationEmail configured for company ${companyId}`);
        }
      }
    }

    // The public daily limit was already checked and recorded in one
    // atomic call above (tryRecordPublicEstimateAttempt). Company-side
    // usage tracking (for the dashboard's own stats, not an enforced
    // limit) happens here at the end instead.
    if (companyId) {
      recordCompanyEstimateRun(companyId, serviceType).catch(err => console.warn('recordCompanyEstimateRun failed:', err.message));
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
