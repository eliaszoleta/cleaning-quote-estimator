const axios = require('axios');
const { stateNameFromCode } = require('../data/partnerCityTiers');
const { sendTemplatedEmail } = require('./emailTemplates');

// Lead capture (LeadCaptureStep.js) tells visitors "we'll email your
// estimate" -- this is what actually makes that true. Sends via Resend
// (a transactional email API) rather than raw SMTP or Hostinger's Email
// API: SMTP got blocked by Railway's outbound network restrictions, and
// Hostinger's customer-facing API token (hPanel > API) turned out to be
// for their general hosting/VPS/domains API, not the separate Email API
// -- there's no self-service token for that from a normal account. Resend
// is purpose-built for this exact "app sends transactional email" case.
//
// Template is deliberately plain (no gradients, no colored button blocks,
// no rounded "card" containers) -- that marketing-template look is exactly
// what pushes transactional mail into Gmail's Promotions tab. Styled to
// read like a receipt/confirmation instead.
//
// Confirmed in practice: sendWebsiteRequestReceivedEmail started landing in
// Promotions, and moved to Primary after (a) giving it a personalized
// action/reference point instead of being purely "no action needed" with
// nothing but a generic homepage link, and (b) toning down the copy --
// dropping exclamation points and phrasing like "Thanks for applying...!"
// that reads as a marketing auto-responder. No setting here can force
// Primary placement (that's Gmail's own sender-reputation + content ML,
// outside this codebase's control), but matching every other template's
// plain, specific, low-enthusiasm style is the best lever available when
// writing a new one.

const RESEND_API_BASE = 'https://api.resend.com';

const SERVICE_LABELS = {
  home_residential: 'House Cleaning',
  apartment: 'Apartment Cleaning',
  commercial: 'Commercial Cleaning',
  carpet: 'Carpet Cleaning',
  upholstery: 'Upholstery Cleaning',
  air_duct: 'Air Duct Cleaning',
  dryer_vent: 'Dryer Vent Cleaning',
  tile_grout: 'Tile & Grout Cleaning',
  mold_remediation: 'Mold Remediation',
  water_damage: 'Water Damage Restoration',
  airbnb: 'Airbnb/Vacation Rental Cleaning',
  post_construction: 'Post-Construction Cleaning',
};

// Subject lines only -- every other service's SERVICE_LABELS entry is plain
// "[X] Cleaning" wording, but airbnb's is 'Airbnb/Vacation Rental Cleaning':
// a trademarked travel brand name plus "Vacation Rental", both strong
// signal words Gmail's classifier associates with the Promotions/Travel
// category (that's reportedly why these were the only estimate emails a
// user saw land there instead of the inbox). The body/UI label stays the
// full descriptive text -- this only swaps what goes in the subject line.
const SUBJECT_SERVICE_LABELS = { ...SERVICE_LABELS, airbnb: 'Vacation Rental Cleaning' };

// UK pilot (Oct 2026) -- real UK trade terminology, not a translation (see
// the matching comment on frontend/src/utils/formatters.js's
// serviceTypeLabel for the sourcing). country defaults undefined so every
// existing call site (every one of them, pre-UK-pilot) renders
// byte-identical to before this function existed.
const UK_SERVICE_LABEL_OVERRIDES = {
  apartment: 'Flat Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};
// Australia pilot (Nov 2026) -- see formatters.js's matching comment.
const AU_SERVICE_LABEL_OVERRIDES = {
  apartment: 'Unit Cleaning',
  mold_remediation: 'Mould Removal',
  post_construction: 'After Builders Clean',
};
const COUNTRY_SERVICE_LABEL_OVERRIDES = { GB: UK_SERVICE_LABEL_OVERRIDES, AU: AU_SERVICE_LABEL_OVERRIDES };
function getServiceLabel(serviceType, country) {
  const overrides = COUNTRY_SERVICE_LABEL_OVERRIDES[country];
  if (overrides && overrides[serviceType]) return overrides[serviceType];
  return SERVICE_LABELS[serviceType] || serviceType;
}
function getSubjectServiceLabel(serviceType, country) {
  const overrides = COUNTRY_SERVICE_LABEL_OVERRIDES[country];
  if (overrides && overrides[serviceType]) return overrides[serviceType];
  return SUBJECT_SERVICE_LABELS[serviceType] || serviceType;
}

// Natural-reading short names for the "we cover these services" sentence in
// the legacy-trial win-back email (see sendLegacyTrialExpiredEmail below).
// Derived from SERVICE_LABELS above -- the single source of truth for which
// services exist -- instead of a second hand-typed list, so a future 13th
// service only needs adding there (as every other service-aware email
// already requires) to show up here too, the same stale-count problem that
// already bit the homepage copy once. Most labels read fine with just the
// " Cleaning" suffix dropped and lowercased; the few that don't get a named
// override instead of a mechanical rule that can't guess good phrasing.
const SERVICE_LIST_OVERRIDES = {
  home_residential: 'house cleaning',
  water_damage: 'water damage',
  airbnb: 'Airbnb turnover',
};
function joinWithOxfordComma(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
function buildServiceListSentence() {
  const names = Object.entries(SERVICE_LABELS).map(
    ([key, label]) => SERVICE_LIST_OVERRIDES[key] || label.replace(/ Cleaning$/i, '').toLowerCase()
  );
  return joinWithOxfordComma(names);
}

// symbol defaults to '$' so every existing call site (every one of them,
// pre-Canada-pilot) renders byte-identical to before this parameter
// existed. A CA company's result carries currencySymbol: 'C$' (see
// calculateCleaning's return in cleaningCalculation.js).
function fmtMoney(n, symbol = '$') {
  return `${symbol}${Math.round(n).toLocaleString('en-US')}`;
}

// Normalizes any phone string to (XXX) XXX-XXXX for display in an email,
// regardless of how it was stored -- older partner rows, admin-entered
// numbers, or a lead who pasted digits some other way might not already
// be in that format even though every phone <input> in the app now
// formats as-you-type. Only reformats a clean 10-digit US number (or 11
// with a leading 1); anything else (extension, international, garbled)
// is left exactly as stored rather than risking corrupting it.
function fmtPhone(value) {
  if (!value) return value;
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Appended to lead-notification subject lines so each one is unique --
// otherwise every lead for the same service type shares the exact same
// subject text ("New House Cleaning lead on your estimator"), and Gmail
// (and most other clients) groups emails with matching subjects into one
// conversation thread, burying every lead but the first under "N more"
// instead of each landing as its own visible email.
function fmtSubjectTimestamp() {
  return new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function fmtAdjustment(adj, symbol = '$') {
  if (adj.low === 0 && adj.high === 0) return 'Included';
  if (adj.low < 0 || adj.high < 0) return `−${fmtMoney(Math.abs(adj.low), symbol)} – −${fmtMoney(Math.abs(adj.high), symbol)}`;
  return `${fmtMoney(adj.low, symbol)} – ${fmtMoney(adj.high, symbol)}`;
}

// Mirrors ResultsScreen's own "Price breakdown" table -- same rows,
// same total, so the email matches what was actually shown on-screen
// instead of just repeating the headline range. Used by the internal
// lead-notification emails (sendPartnerLeadEmail, sendCompanyLeadEmail),
// which keep their plain, undecorated style -- see buildEstimateBreakdownRows
// below for the more visually-styled version used in the actual
// customer-facing estimate email.
function buildBreakdownRows(adjustments, symbol = '$') {
  return adjustments
    .filter(a => !a.separate)
    .map(a => `
      <tr>
        <td style="padding:5px 0;color:#333333;font-size:14px;text-transform:capitalize;">${a.label}</td>
        <td style="padding:5px 0;text-align:right;font-size:14px;color:#333333;white-space:nowrap;">${fmtAdjustment(a, symbol)}</td>
      </tr>`)
    .join('');
}

// Same rows as buildBreakdownRows, but zebra-striped with dividers between
// rows -- the bordered-card look ResultsScreen's own "Price breakdown"
// table has on screen. Only used in buildHtml (sendEstimateEmail, the
// email actually handed to the person who got the estimate) -- the
// internal lead-notification templates above intentionally keep the
// plainer buildBreakdownRows look.
function buildEstimateBreakdownRows(adjustments, symbol = '$') {
  const rows = adjustments.filter(a => !a.separate);
  return rows
    .map((a, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding:10px 12px;color:#333333;font-size:13.5px;text-transform:capitalize;${i < rows.length - 1 ? 'border-bottom:1px solid #e0e0e0;' : ''}">${a.label}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13.5px;color:#333333;white-space:nowrap;${i < rows.length - 1 ? 'border-bottom:1px solid #e0e0e0;' : ''}">${fmtAdjustment(a, symbol)}</td>
      </tr>`)
    .join('');
}

function buildKeyFactors(keyFactors) {
  if (!keyFactors?.length) return '';
  const line = keyFactors.map(f => `${f.label}: ${f.impact}`.replace(/_/g, ' ')).join(' · ');
  return `<p style="font-size:13px;color:#666666;margin:12px 0 0;">${line}</p>`;
}

// Same match shown on-screen (PartnerCard.js) when the visitor's location
// matches an active partner -- passed through from the frontend's own
// match so the email never disagrees with what the results page showed.
function buildPartnerSection(partner) {
  if (!partner) return '';
  const lines = [
    partner.address || '',
    partner.phone ? `Phone: ${fmtPhone(partner.phone)}` : '',
    partner.website ? `Website: <a href="${partner.website}" style="color:#2563eb;">${partner.website.replace(/^https?:\/\//, '')}</a>` : '',
  ].filter(Boolean).join('<br>');

  return `
    <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Recommended cleaner near you</p>
    <p style="font-size:15px;color:#111111;font-weight:600;margin:0 0 4px;">${partner.business_name}</p>
    <p style="font-size:14px;color:#333333;line-height:1.7;margin:0;">${lines}</p>`;
}

// Shown instead of the generic CTA when the estimate came from a
// subscribed company's own embedded widget (as opposed to the main
// cleanestimator.com site) -- they're paying to have their business in
// front of these visitors, so their name/phone/email/logo should actually
// show up. Just phone and email as plain contact lines now, no separate
// "Schedule Free Estimate"-style link button -- the visitor already has
// their estimate by the time they see this, so a second "get an estimate"
// action read as redundant/confusing next to the Call/Email actions.
function buildCompanySection({ companyName, logo, ctaEmail, ctaPhone }) {
  const logoImg = logo ? `<img src="${logo}" alt="${companyName}" style="max-height:36px;margin:0 0 10px;display:block;">` : '';
  // tel: link -- on mobile this taps straight into the dialer instead of
  // requiring the visitor to copy/retype the number.
  const infoLines = [
    ctaPhone ? `Phone: <a href="tel:${ctaPhone}" style="color:#2563eb;">${fmtPhone(ctaPhone)}</a>` : '',
    ctaEmail ? `Email: <a href="mailto:${ctaEmail}" style="color:#2563eb;">${ctaEmail}</a>` : '',
  ].filter(Boolean).join('<br>');

  return `
    <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Contact</p>
    ${logoImg}
    <p style="font-size:15px;color:#111111;font-weight:600;margin:0 0 4px;">${companyName}</p>
    ${infoLines ? `<p style="font-size:14px;color:#333333;line-height:1.7;margin:0;">${infoLines}</p>` : ''}`;
}

function buildGenericCta({ ctaUrl, ctaText, ctaPhone }) {
  return `
    <p style="margin:24px 0 0;">
      <a href="${ctaUrl}" style="color:#2563eb;font-size:14px;font-weight:600;">${ctaText} →</a>
      ${ctaPhone ? `<br><span style="font-size:13px;color:#666666;">Or call ${ctaPhone}</span>` : ''}
    </p>`;
}

// A plain-text alternative alongside the HTML body (multipart/alternative)
// -- sending HTML-only is itself a signal Gmail's classifier associates
// with bulk/marketing mail, on top of the styling itself.
function buildText({ name, clientName, serviceType, result, companyConfig, partner, isEmbedWidget, userType }) {
  const {
    totalLow, totalHigh, suggestedPrice, stateName, city, unit,
    adjustments = [], recurringAnnualSavings, currencySymbol = '$', country,
  } = result;
  const locationLabel = city ? `${city}, ${stateName}` : stateName;
  // Every customer-estimate-email path -- the free public calculator, a
  // real visitor on a company's actual embedded widget, and RunEstimateTab's
  // "Email to Coworker" share -- shows the same low-high range + a separate
  // "Midpoint Price" line, same as Calculator Mode's own on-screen
  // breakdown. The embed-widget path showed a single collapsed midpoint
  // number instead until 2026-10-26 (reverted at the user's explicit
  // request -- a range is a more honest "this is an estimate, not a locked
  // number" signal than the disclaimer sentence alone ever was, not a less
  // honest one, and a stranger on a subscriber's widget deserves the same
  // real range a public visitor gets).
  //
  // isHomeowner is only meaningful on the public path -- LeadCaptureStep.js's
  // required "I am a..." question. A homeowner just wants the number it'll
  // cost them, so the separate "Midpoint Price" line below is dropped for
  // them -- the range breakdown and range total stay exactly as-is, this
  // only removes that one extra line. A self-identified cleaning business
  // keeps it, since they're actually pricing jobs and need somewhere to
  // land, not just a range. The embed-widget path never shows it either --
  // no midpoint number anywhere in that email, by design.
  const isHomeowner = !isEmbedWidget && userType === 'homeowner';
  const showMidpointLine = !isEmbedWidget && !isHomeowner && suggestedPrice != null;

  const serviceLabel = getServiceLabel(serviceType, country);
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const firstName = (name || '').trim().split(' ')[0] || 'there';

  const lines = [
    `Hi ${firstName},`,
    '',
  ];
  // Only set on the internal "Email to Coworker" share path (estimateShare.js)
  // -- the recipient there is a teammate, not the client themselves, so the
  // greeting above stays generic while this line is what actually tells them
  // whose estimate they're looking at.
  if (clientName) lines.push(`Client: ${clientName}`, '');

  lines.push(
    `Here's your ${serviceLabel.toLowerCase()} estimate${locationLabel ? ` for ${locationLabel}` : ''}:`,
    '',
    `${fmtMoney(totalLow, currencySymbol)} - ${fmtMoney(totalHigh, currencySymbol)} ${unit === 'per_month' ? 'per month' : 'per visit'}`,
  );

  // totalLow/High above are already the discounted recurring price when a
  // discount applies (see ResultsScreen.js's matching comment) -- restating
  // recurringMonthlyLow/High here would just repeat the same two numbers
  // under a different label. Annual savings is the one genuinely new figure.
  if (recurringAnnualSavings && unit !== 'per_month') {
    lines.push(`Recurring discount applied (save ~${fmtMoney(recurringAnnualSavings, currencySymbol)}/year)`);
  }

  lines.push('', 'Price breakdown:');
  adjustments.filter(a => !a.separate).forEach(a => {
    lines.push(`  ${a.label}: ${fmtAdjustment(a, currencySymbol)}`);
  });
  lines.push(`  Estimated total: ${fmtMoney(totalLow, currencySymbol)} - ${fmtMoney(totalHigh, currencySymbol)}`);
  if (showMidpointLine) {
    lines.push(`  Midpoint Price @ ${fmtMoney(suggestedPrice, currencySymbol)}${unit === 'per_month' ? '/mo' : ''}`);
  }
  if (isEmbedWidget) {
    // The range above already signals "this could move" better than a
    // single number ever did, but the explicit caveat is still worth
    // keeping for a stranger on a subscriber's own widget specifically --
    // they have no prior relationship with this business the way a
    // returning public-calculator visitor might.
    lines.push('  (This is an estimate, not a final quote -- the price may be higher or lower depending on the actual level of cleaning needed. We\'ll confirm the exact price when you book.)');
  }
  // Plain flag, not a computed line -- see cleaningCalculation.js's
  // comment for why this stayed lightweight for Canada, and defaults.js's
  // currency-display comment for why Australia gets the same treatment
  // (also a low, broadly-applicable GST registration threshold) while the
  // UK deliberately doesn't.
  if (country === 'CA') {
    lines.push('', '+ applicable taxes (GST/HST, varies by province)');
  } else if (country === 'AU') {
    lines.push('', '+ applicable taxes (GST)');
  }

  if (partner) {
    lines.push('', 'Recommended cleaner near you:', partner.business_name);
    if (partner.address) lines.push(partner.address);
    if (partner.phone) lines.push(`Phone: ${fmtPhone(partner.phone)}`);
    if (partner.website) lines.push(`Website: ${partner.website}`);
  } else if (companyConfig?.companyName) {
    lines.push('', 'Contact:', companyConfig.companyName);
    if (companyConfig.ctaPhone) lines.push(`Phone: ${fmtPhone(companyConfig.ctaPhone)}`);
    if (companyConfig.ctaEmail) lines.push(`Email: ${companyConfig.ctaEmail}`);
  } else {
    lines.push('', 'Get an exact quote: https://www.cleanestimator.com');
    if (companyConfig?.ctaPhone) lines.push(`Or call ${companyConfig.ctaPhone}`);
  }

  lines.push(
    '',
    "This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.",
    `${brandName} - cleanestimator.com`
  );

  return lines.join('\n');
}

function buildHtml({ name, clientName, serviceType, result, companyConfig, partner, isEmbedWidget, userType }) {
  const {
    totalLow, totalHigh, suggestedPrice, stateName, city, unit,
    adjustments = [], keyFactors = [],
    recurringAnnualSavings, currencySymbol = '$', country,
  } = result;
  // Same range-everywhere approach as buildText above -- see its matching
  // comment for why the embed-widget path no longer collapses to a single
  // midpoint number.
  // Same homeowner/business split as buildText above -- homeowner keeps
  // the full range breakdown, just without the extra "Midpoint Price" row;
  // the embed-widget path never shows that row either way.
  const isHomeowner = !isEmbedWidget && userType === 'homeowner';
  const showMidpointLine = !isEmbedWidget && !isHomeowner && suggestedPrice != null;
  // Same city-resolution ResultsScreen.js's eyebrow badge now shows --
  // see cleaningCalculation.js's own resolveCityForZip call.
  const locationLabel = city ? `${city}, ${stateName}` : stateName;

  const serviceLabel = getServiceLabel(serviceType, country);
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const firstName = (name || '').trim().split(' ')[0] || 'there';
  // Same default ResultsScreen.js falls back to when a company hasn't set
  // their own brand color -- so an email from the main cleanestimator.com
  // site (no companyConfig) still gets the same blue accent the on-screen
  // results page uses, not an uncolored default.
  const primaryColor = companyConfig?.primaryColor || '#2563eb';

  // Same "Email to Coworker" case as buildText's clientName line above --
  // shown as its own standout line rather than folded into the greeting,
  // since the greeting addresses the coworker, not the client.
  const clientLine = clientName
    ? `<p style="font-size:13px;color:#666666;margin:0 0 16px;">Client: <strong style="color:#111111;">${clientName}</strong></p>`
    : '';

  // Tinted pill (not a full-bleed color block) echoing the on-screen
  // "Recurring" badge -- color accent without the solid gradient banner
  // that's the actual thing known to push a transactional email into
  // Gmail's Promotions tab (see the file-top comment).
  // totalLow/High above are already the discounted recurring price when a
  // discount applies -- restating recurringMonthlyLow/High here would just
  // repeat the same two numbers under a different label (see
  // ResultsScreen.js's matching comment). Annual savings is the one
  // genuinely new figure this pill adds.
  const recurringLine = (recurringAnnualSavings && unit !== 'per_month')
    ? `<p style="margin:14px 0 0;"><span style="display:inline-block;background:${primaryColor}17;color:${primaryColor};padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:700;">✓ Recurring discount applied · Save ~${fmtMoney(recurringAnnualSavings, currencySymbol)}/year</span></p>`
    : '';

  const bottomHtml = partner
    ? buildPartnerSection(partner)
    : companyConfig?.companyName
    ? buildCompanySection({
        companyName: companyConfig.companyName,
        logo: companyConfig.logo,
        ctaEmail: companyConfig.ctaEmail,
        ctaPhone: companyConfig.ctaPhone,
      })
    : buildGenericCta({
        ctaUrl: 'https://www.cleanestimator.com',
        ctaText: 'Get an exact quote',
        ctaPhone: companyConfig?.ctaPhone || '',
      });

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 ${clientLine ? 4 : 20}px;">Hi ${firstName},</p>
  ${clientLine}

  <p style="font-size:14px;line-height:1.6;margin:0 0 4px;">Here's your ${serviceLabel.toLowerCase()} estimate${locationLabel ? ` for ${locationLabel}` : ''}:</p>

  <p style="font-size:30px;font-weight:800;margin:10px 0 0;color:${primaryColor};letter-spacing:-0.5px;">${fmtMoney(totalLow, currencySymbol)} – ${fmtMoney(totalHigh, currencySymbol)} <span style="font-size:13px;font-weight:400;color:#666666;">${unit === 'per_month' ? 'per month' : 'per visit'}</span>${(country === 'CA' || country === 'AU') ? ' <span style="font-size:13px;font-weight:700;color:#666666;">+ tax</span>' : ''}</p>
  ${recurringLine}

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 8px;">Price breakdown</p>
  <div style="border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${buildEstimateBreakdownRows(adjustments, currencySymbol)}
      <tr style="background:${primaryColor}0d;">
        <td style="padding:11px 12px;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;vertical-align:top;">
          Estimated total
          ${showMidpointLine ? `<div style="margin-top:3px;font-weight:400;font-size:13.5px;color:#333333;">Midpoint Price @ ${fmtMoney(suggestedPrice, currencySymbol)}${unit === 'per_month' ? '/mo' : ''}</div>` : ''}
        </td>
        <td style="padding:11px 12px;text-align:right;font-weight:700;font-size:14px;color:${primaryColor};border-top:1px solid #e0e0e0;white-space:nowrap;vertical-align:top;">
          ${fmtMoney(totalLow, currencySymbol)} – ${fmtMoney(totalHigh, currencySymbol)}
        </td>
      </tr>
      ${isEmbedWidget ? `
      <tr style="background:${primaryColor}0d;">
        <td colspan="2" style="padding:8px 12px 10px;font-size:11px;color:#888888;line-height:1.4;">This is an estimate, not a final quote — the price may be higher or lower depending on the actual level of cleaning needed. We'll confirm the exact price when you book.</td>
      </tr>` : ''}
    </table>
  </div>
  ${country === 'CA' ? '<p style="font-size:11.5px;color:#999999;margin:8px 0 0;">+ applicable taxes (GST/HST, varies by province)</p>' : ''}
  ${country === 'AU' ? '<p style="font-size:11.5px;color:#999999;margin:8px 0 0;">+ applicable taxes (GST)</p>' : ''}
  ${buildKeyFactors(keyFactors)}

  ${bottomHtml}

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.<br>
    ${brandName} · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

// Carpet cleaning and mold remediation estimate emails from the public
// homepage calculator were reported landing in Gmail's Promotions tab,
// unlike every other service. The template itself is identical across all
// 12 services (see sendEstimateEmail below) -- nothing structural singles
// these two out -- so the most likely cause is the subject line itself:
// "carpet cleaning" and "mold remediation" are two of the most heavily
// spammed home-service lead-gen categories (Angi/HomeAdvisor/Thumbtack-
// style "Your carpet cleaning quote is ready!" blasts go out at huge
// volume), which plausibly trained Gmail's classifier to associate that
// near-exact phrase pattern with Promotions more strongly than less-
// commonly-spammed categories like "house cleaning" or "tile & grout."
// Can't verify Gmail's actual model, so this leans on two concrete,
// defensible levers instead of guessing at word choice:
//   1. A real computed price in the subject ("$158-$198") is something a
//      templated bulk "quote is ready" blast never has -- those exist
//      specifically because the price ISN'T known yet. Showing the actual
//      number is a genuine point of difference from the spam pattern this
//      is plausibly being confused with, not just different wording for
//      its own sake.
//   2. Personalizing with the visitor's own first name, when they gave
//      one (the lead-capture field is optional) -- the same lever that
//      already moved sendWebsiteRequestReceivedEmail from Promotions to
//      Primary (see the file-level comment at the top of this file).
// Scoped to these two services only, matching what was actually reported;
// every other service keeps its existing subject unchanged below.
const PRICE_IN_SUBJECT_SERVICES = new Set(['carpet', 'mold_remediation']);

function buildEstimateSubject({ name, clientName, serviceType, result, isEmbedWidget }) {
  const label = getSubjectServiceLabel(serviceType, result.country) || 'cleaning';
  const firstName = (clientName || name || '').trim().split(/\s+/)[0] || '';

  // UK flat cleaning (apartment service, GB country) is rephrased on
  // request to "Your flat cleaning estimate is ready, <name>" instead of
  // the general "<Service> estimate for <name>" pattern -- scoped to this
  // one service+country combo only; every other service/country keeps the
  // phrasing below.
  if (serviceType === 'apartment' && result.country === 'GB') {
    return `Your ${label} estimate is ready${firstName ? `, ${firstName}` : ''}`;
  }
  // clientName (only ever set on the "Email to Coworker" share path -- see
  // estimateShare.js) replaces the generic subject with one that names
  // whose estimate this is, so a teammate scanning their inbox doesn't
  // have to open the email to find out.
  if (clientName) {
    return `${label} estimate for ${clientName}`;
  }
  if (PRICE_IN_SUBJECT_SERVICES.has(serviceType)) {
    // Mirrors exactly what the body actually shows -- the low-high range,
    // for every path including the embed widget now (see buildHtml/
    // buildText's matching comment for why that stopped collapsing to a
    // single midpoint number).
    const { totalLow, totalHigh, currencySymbol = '$' } = result;
    const priceText = totalLow != null && totalHigh != null ? `${fmtMoney(totalLow, currencySymbol)}–${fmtMoney(totalHigh, currencySymbol)}` : null;
    if (priceText) {
      return `${firstName ? `${firstName}, your` : 'Your'} ${label} estimate: ${priceText}`;
    }
  }
  return `Your ${label} estimate is ready${firstName ? `, ${firstName}` : ''}`;
}

// Fire-and-forget from the caller's perspective: never throws, returns
// false (and logs why) instead so a missing config or a delivery failure
// never breaks the /api/calculate response.
async function sendEstimateEmail({ to, name, clientName, serviceType, result, companyConfig, partner, replyTo, isEmbedWidget, userType }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendEstimateEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }

  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `${brandName} <${fromAddress}>`,
        to: [to],
        // On a subscribed company's widget, replies should reach the
        // company (their own inbox), not our sending address -- the From
        // address itself has to stay ours (Resend can only send through a
        // domain we've verified with SPF/DKIM; putting the company's own
        // domain there would fail authentication and get flagged as
        // spoofed), but reply_to lets "Reply" in the visitor's mail client
        // route straight to the business anyway.
        reply_to: replyTo || undefined,
        subject: buildEstimateSubject({ name, clientName, serviceType, result, isEmbedWidget }),
        html: buildHtml({ name, clientName, serviceType, result, companyConfig, partner, isEmbedWidget, userType }),
        text: buildText({ name, clientName, serviceType, result, companyConfig, partner, isEmbedWidget, userType }),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendEstimateEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

function fmtCityList(cities) {
  // cities: array of "City, ST" strings
  if (cities.length === 1) return cities[0];
  if (cities.length === 2) return `${cities[0]} and ${cities[1]}`;
  return `${cities.slice(0, -1).join(', ')}, and ${cities[cities.length - 1]}`;
}

// Sent right after a self-serve "buy city placement" checkout provisions a
// new active partner (backend/src/routes/partnerCheckout.js) -- the in-app
// success page shows the same congrats + /client instructions, but a
// buyer who closes that tab before it loads (or never sees it, e.g. the
// webhook provisioned them after they'd already navigated away) would
// otherwise have no way to find out their listing is live or how to get
// dashboard access. Fire-and-forget, same as sendEstimateEmail. Content
// lives in the editable email_templates table (key: 'partner_welcome'),
// not here -- see emailTemplates.js.
async function sendPartnerWelcomeEmail({ to, businessName, cities }) {
  const { sent } = await sendTemplatedEmail({
    template: 'partner_welcome',
    to,
    toName: businessName,
    vars: { businessName, cityList: fmtCityList(cities) },
    recipientType: 'partner',
  });
  return sent;
}

const TIMELINE_LABELS = {
  asap: 'ASAP',
  week: 'This week',
  month: 'This month',
  planning: 'Just planning',
};

function buildLeadContactLines({ leadEmail, leadPhone, city, state, zip, timeline }) {
  return [
    leadEmail ? `Email: ${leadEmail}` : null,
    leadPhone ? `Phone: ${fmtPhone(leadPhone)}` : null,
    // city only ever comes from a company-scoped calculator's dropdown (see
    // CleaningCalculator.js) -- shown here alongside state/ZIP instead of
    // only buried in the generic Service Details dump further down the
    // email. state is whatever the visitor picked on the Location step,
    // shown as the full name for readability (same as sendEstimateEmail's
    // opening line). zip is optional there (LocationStep.js only shows it
    // once a state is picked, and validates it against that state) -- so
    // it's just as often null as not; omitted here whenever it wasn't
    // collected rather than showing a blank "ZIP:" line.
    city ? `City: ${city}` : null,
    state ? `State: ${stateNameFromCode(state)}` : null,
    zip ? `ZIP: ${zip}` : null,
    timeline ? `Timeline: ${TIMELINE_LABELS[timeline] || timeline}` : null,
  ].filter(Boolean);
}

function buildPartnerLeadText({ leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, city: city || serviceDetails?.city, state, zip, timeline });

  const lines = [
    'New lead in your area!',
    '',
    `${name} just got a ${serviceLabel.toLowerCase()} estimate on Clean Estimator: ${fmtMoney(priceLow)} - ${fmtMoney(priceHigh)}.`,
    '',
    'Contact info:',
    ...contactLines.map(l => `  ${l}`),
  ];

  if (adjustments.length) {
    lines.push('', 'Price breakdown:');
    adjustments.filter(a => !a.separate).forEach(a => {
      lines.push(`  ${a.label}: ${fmtAdjustment(a)}`);
    });
    lines.push(`  Estimated total: ${fmtMoney(priceLow)} - ${fmtMoney(priceHigh)}`);
  }

  if (keyFactors.length) {
    lines.push('', `Key factors: ${keyFactors.map(f => `${f.label}: ${f.impact}`.replace(/_/g, ' ')).join(' · ')}`);
  }

  lines.push(...buildServiceDetailsText(serviceDetails));

  lines.push(
    '',
    'Reply to this email to reach them directly, or use the contact info above.',
    '',
    "They opted in to be connected with a local cleaning professional -- that's you, as our exclusive partner in this area.",
    '',
    'Clean Estimator - cleanestimator.com'
  );

  return lines.join('\n');
}

function buildPartnerLeadHtml({ leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, city: city || serviceDetails?.city, state, zip, timeline });

  // No width:100% -- that stretches the value column to the far edge of
  // the email, leaving a wide, disconnected gap between label and value.
  // Left-aligned with a little breathing room instead, so the value sits
  // right next to its label the way a normal label:value pair reads.
  const contactRows = contactLines.map(l => {
    const [label, ...rest] = l.split(': ');
    const value = rest.join(': ');
    return `
    <tr>
      <td style="padding:5px 0;color:#666666;font-size:13.5px;white-space:nowrap;">${label}</td>
      <td style="padding:5px 0 5px 14px;text-align:left;font-size:13.5px;color:#111111;font-weight:600;">${value}</td>
    </tr>`;
  }).join('');

  const breakdownHtml = adjustments.length ? `
  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Price breakdown</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e0e0e0;">
    ${buildBreakdownRows(adjustments)}
    <tr>
      <td style="padding:8px 0 0;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;">Estimated total</td>
      <td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;white-space:nowrap;">${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}</td>
    </tr>
  </table>
  ${buildKeyFactors(keyFactors)}` : '';

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New lead in your area!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${name}</strong> just got a ${serviceLabel.toLowerCase()} estimate on Clean Estimator: <strong>${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}</strong>.
  </p>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Contact info</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">
    ${contactRows}
  </table>
  ${breakdownHtml}
  ${buildServiceDetailsHtml(serviceDetails)}

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Reply to this email to reach them directly, or use the contact info above.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    They opted in to be connected with a local cleaning professional — that's you, as our exclusive partner in this area.<br>
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

// Sent to the matched partner the moment a visitor in their (exclusive)
// city opts in for their estimate email -- turns the partnership from
// "shows up passively on the results page/banner/email" into an actual
// warm lead landing in the partner's inbox, ready to call or reply to.
// Fire-and-forget, same as the other partner emails; only called from
// calculate.js when partnerInfo is present and has an email on file.
// Includes the same full price breakdown/key factors/service details as
// sendCompanyLeadEmail, not just the top-line range -- a partner deciding
// whether to call back needs the same context a subscribed company gets.
async function sendPartnerLeadEmail({ partnerEmail, leadName, leadEmail, leadPhone, serviceType, priceLow, priceHigh, city, state, zip, timeline, adjustments, keyFactors, serviceDetails }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendPartnerLeadEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }
  if (!partnerEmail) {
    console.warn('sendPartnerLeadEmail skipped: no partner email');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';
  const args = { leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments, keyFactors, serviceDetails };

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [partnerEmail],
        // Lets the partner just hit "reply" in their inbox to reach the
        // lead directly, without ever needing to copy the contact info out.
        reply_to: leadEmail || undefined,
        subject: `New ${SUBJECT_SERVICE_LABELS[serviceType] || 'cleaning'} lead in your area — ${fmtSubjectTimestamp()}`,
        html: buildPartnerLeadHtml(args),
        text: buildPartnerLeadText(args),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendPartnerLeadEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

// Same key-formatting LeadsTab.js's detail panel applies to
// lead.service_details (insert a space before each capital, then
// capitalize every word) -- so a company sees identical labels ("Sqft
// Tier", "Cleaning Type") whether they're reading the email or the
// dashboard. Values are left exactly as stored (e.g. "under_1000",
// "one_time"), same as the dashboard.
function formatDetailKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDetailValue(v) {
  return Array.isArray(v) ? v.join(', ') : String(v);
}

// city is excluded here -- it's already shown up in the Contact info
// section (see buildLeadContactLines) alongside ZIP, so listing it again
// in this generic dump would just duplicate it.
function buildServiceDetailsText(serviceDetails) {
  const entries = Object.entries(serviceDetails || {}).filter(([k, v]) => k !== 'city' && v !== null && v !== undefined && v !== '');
  if (!entries.length) return [];
  return ['', 'Service details:', ...entries.map(([k, v]) => `  ${formatDetailKey(k)}: ${formatDetailValue(v)}`)];
}

function buildServiceDetailsHtml(serviceDetails) {
  const entries = Object.entries(serviceDetails || {}).filter(([k, v]) => k !== 'city' && v !== null && v !== undefined && v !== '');
  if (!entries.length) return '';
  const rows = entries.map(([k, v]) => `
    <tr>
      <td style="padding:5px 0;color:#666666;font-size:13.5px;white-space:nowrap;">${formatDetailKey(k)}</td>
      <td style="padding:5px 0 5px 14px;text-align:left;font-size:13.5px;color:#111111;font-weight:600;">${formatDetailValue(v)}</td>
    </tr>`).join('');
  return `
  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Service details</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">
    ${rows}
  </table>`;
}

function buildCompanyLeadText({ companyName, leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails, country, currencySymbol = '$' }) {
  const name = leadName || 'A visitor';
  const serviceLabel = getServiceLabel(serviceType, country);
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, city: city || serviceDetails?.city, state, zip, timeline });

  const lines = [
    `New lead on your ${companyName} estimator!`,
    '',
    `${name} just got a ${serviceLabel.toLowerCase()} estimate on your embedded widget: ${fmtMoney(priceLow, currencySymbol)} - ${fmtMoney(priceHigh, currencySymbol)}.`,
    '',
    'Contact info:',
    ...contactLines.map(l => `  ${l}`),
  ];

  if (adjustments.length) {
    lines.push('', 'Price breakdown:');
    adjustments.filter(a => !a.separate).forEach(a => {
      lines.push(`  ${a.label}: ${fmtAdjustment(a, currencySymbol)}`);
    });
    lines.push(`  Estimated total: ${fmtMoney(priceLow, currencySymbol)} - ${fmtMoney(priceHigh, currencySymbol)}`);
  }

  if (keyFactors.length) {
    lines.push('', `Key factors: ${keyFactors.map(f => `${f.label}: ${f.impact}`.replace(/_/g, ' ')).join(' · ')}`);
  }

  lines.push(...buildServiceDetailsText(serviceDetails));

  lines.push(
    '',
    'Reply to this email to reach them directly, or use the contact info above.',
    '',
    'Clean Estimator - cleanestimator.com'
  );

  return lines.join('\n');
}

function buildCompanyLeadHtml({ companyName, leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails, country, currencySymbol = '$' }) {
  const name = leadName || 'A visitor';
  const serviceLabel = getServiceLabel(serviceType, country);
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, city: city || serviceDetails?.city, state, zip, timeline });

  const contactRows = contactLines.map(l => {
    const [label, ...rest] = l.split(': ');
    const value = rest.join(': ');
    return `
    <tr>
      <td style="padding:5px 0;color:#666666;font-size:13.5px;white-space:nowrap;">${label}</td>
      <td style="padding:5px 0 5px 14px;text-align:left;font-size:13.5px;color:#111111;font-weight:600;">${value}</td>
    </tr>`;
  }).join('');

  const breakdownHtml = adjustments.length ? `
  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Price breakdown</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e0e0e0;">
    ${buildBreakdownRows(adjustments, currencySymbol)}
    <tr>
      <td style="padding:8px 0 0;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;">Estimated total</td>
      <td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;white-space:nowrap;">${fmtMoney(priceLow, currencySymbol)} – ${fmtMoney(priceHigh, currencySymbol)}</td>
    </tr>
  </table>
  ${buildKeyFactors(keyFactors)}` : '';

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New lead on your ${companyName} estimator!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${name}</strong> just got a ${serviceLabel.toLowerCase()} estimate on your embedded widget: <strong>${fmtMoney(priceLow, currencySymbol)} – ${fmtMoney(priceHigh, currencySymbol)}</strong>.
  </p>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Contact info</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">
    ${contactRows}
  </table>
  ${breakdownHtml}
  ${buildServiceDetailsHtml(serviceDetails)}

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Reply to this email to reach them directly, or use the contact info above.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

// Sent to a company subscriber the moment a visitor completes an estimate
// on THEIR embedded estimator widget (as opposed to sendEstimateEmail,
// which goes to the visitor themselves). Reply-to is the lead's own email
// so the company can just hit reply, same pattern as sendPartnerLeadEmail.
// Fire-and-forget, called from calculate.js whenever companyId is present.
async function sendCompanyLeadEmail({ to, companyName, leadName, leadEmail, leadPhone, serviceType, priceLow, priceHigh, suggestedPrice, city, state, zip, timeline, adjustments, keyFactors, serviceDetails, country, currencySymbol }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendCompanyLeadEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }
  if (!to) {
    console.warn('sendCompanyLeadEmail skipped: no recipient email');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';
  const args = { companyName, leadName, serviceType, priceLow, priceHigh, suggestedPrice, leadEmail, leadPhone, city, state, zip, timeline, adjustments, keyFactors, serviceDetails, country, currencySymbol };

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [to],
        reply_to: leadEmail || undefined,
        subject: `New ${getSubjectServiceLabel(serviceType, country) || 'cleaning'} lead on your estimator — ${fmtSubjectTimestamp()}`,
        html: buildCompanyLeadHtml(args),
        text: buildCompanyLeadText(args),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendCompanyLeadEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

// ─── Company welcome email ──────────────────────────────────────────────────

// Keep this iframe/script string identical to the "Standard iFrame" snippet
// EmbedTab.js generates (same id convention, same resize-listener script) --
// this is the one place outside the dashboard that hands a company their
// embed code, and it should never drift from what "Copy Code" gives them.
function buildEmbedIframeCode(companyId) {
  const iframeId = `cleancalc-iframe-${companyId}`;
  return `<iframe
  id="${iframeId}"
  src="https://www.cleanestimator.com/embed?company=${companyId}"
  width="100%"
  height="700"
  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"
  title="Cleaning Cost Estimator"
  loading="lazy">
</iframe>
<script>
  (function(){
    var iframe=document.getElementById('${iframeId}');
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='cleancalc-resize'&&e.source===iframe.contentWindow){
        iframe.style.height=Math.max(e.data.height,300)+'px';
      }
    });
  })();
</script>`;
}

// Sent once, the moment a company's config row is first created (see
// company.js's GET /:id handler) -- i.e. right after they confirm their
// email and log in for the first time. Points them at Calculator Mode (the
// account's main pitch) and gets their embed code in front of them too,
// instead of relying on them to find the Branding tab themselves.
// Fire-and-forget, same pattern as the other company emails.
// `subject` is overridable so the same content can be reused for a
// one-off manual broadcast to existing accounts (see admin.js's
// trial-email preview/send routes) with wording suited to "your trial is
// already active" rather than "your account was just created". `statusLine`
// defaults to the normal "trial just started" framing, but subscription.js's
// checkout webhook overrides it for a reactivation (expired/canceled
// account completing checkout with no trial attached -- card charged
// immediately) so this email never falsely tells someone who was just
// charged $25 that a free trial began. Content lives in the editable
// email_templates table (key: 'company_welcome').
async function sendCompanyWelcomeEmail({ to, companyId, subject, statusLine }) {
  const code = buildEmbedIframeCode(companyId);
  const { sent } = await sendTemplatedEmail({
    template: 'company_welcome',
    to,
    vars: {
      embedCode: code,
      embedCodeHtml: code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      statusLine: statusLine || "Your account is live and your 14-day free trial has started.",
    },
    subjectOverride: subject,
    recipientType: 'company',
    recipientRef: companyId,
  });
  return sent;
}

// Sent once per cancel-then-resubscribe cycle, from the checkout webhook
// (subscription.js's checkout.session.completed handler) when a previously
// canceled account completes checkout again. Used to be handled by calling
// sendCompanyWelcomeEmail with a swapped-in statusLine ("Welcome back! Your
// subscription has been reactivated...") -- that worked, but it meant a
// returning customer got the full first-day onboarding email again: the
// "Welcome to Clean Estimator!" headline, a re-explanation of what
// Calculator Mode is, the embed code dumped inline with a full walkthrough
// of pasting it into a site. None of that is useful to someone who already
// set all of this up before; this is a short, separate note instead that
// just confirms the account is back and nothing was lost -- same branding,
// services, and (per buildEmbedIframeCode being keyed off companyId, which
// never changes) the exact same embed code as before, just linked from the
// Branding tab rather than reprinted. Deduped the same way the old
// statusLine-swap approach was -- see wasCanceled in subscription.js's
// webhook handler, which now calls this function instead for that case.
// Content lives in the editable email_templates table
// (key: 'subscription_reactivated').
async function sendSubscriptionReactivatedEmail({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'subscription_reactivated',
    to,
    toName: companyName,
    vars: { companyName: companyName || 'there' },
    recipientType: 'company',
  });
  return sent;
}

// Sent once, ~6 hours after a company's account was created if checkout
// still hasn't been completed (status stays 'requires_trial_setup' --
// see checkActivationReminders in services/trialScheduler.js). These
// accounts show up in the admin Companies list as "Not started". Deduped
// via activationReminderEmailSentAt on config.subscription. Content lives
// in the editable email_templates table (key: 'activation_reminder').
async function sendActivationReminderEmail({ to, companyName, signedUpAt }) {
  // signupDateSuffix carries its own leading " on <date>" (or '' if there's
  // no date) rather than a bare date -- so the sentence it's spliced into
  // stays grammatically correct even with nothing filled in, which matters
  // because a manual send from the admin dashboard's Compose/Send tab goes
  // straight through sendTemplatedEmail with whatever merge-field value was
  // typed (or left blank) there, bypassing this function's own fallback
  // entirely. A bare {{signupDate}} token with no admin-side default once
  // rendered as "...was created on , but checkout..." in exactly that path.
  const { sent } = await sendTemplatedEmail({
    template: 'activation_reminder',
    to,
    toName: companyName,
    vars: { companyName, signupDateSuffix: signupDateSuffix(signedUpAt) },
    recipientType: 'company',
  });
  return sent;
}

// ─── Trial check-in email ────────────────────────────────────────────────
// Just one touchpoint during the trial itself now -- day 7, a nudge to
// actually open Calculator Mode. The day-14/21 check-ins, the day-28
// "ending soon" reminder, the legacy "trial ended / widget paused" email,
// and the "trial converted to paid" confirmation were all dropped as
// redundant once the card-required Stripe trial made "subscribe before it
// ends" moot -- payment_failed and subscription_canceled below cover the
// cases that actually need a reply. Sent once, the first time a company's
// trial reaches 7 days elapsed (see checkTrialReminders in
// services/trialScheduler.js). Deduped via trialCheckin1EmailSentAt on
// config.subscription. Content lives in the editable email_templates table
// (key: 'trial_checkin_1').
async function sendTrialCheckin1Email({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'trial_checkin_1',
    to,
    toName: companyName,
    vars: { companyName },
    recipientType: 'company',
  });
  return sent;
}

// Sent from the invoice.payment_failed webhook the moment a card declines --
// computeSubscriptionStatus treats "past_due" as inactive immediately (no
// grace window in app logic), so without this the customer only finds out
// by logging back in and hitting the dashboard's ActivationGate. Deduped by
// Stripe invoice id (config.subscription.lastPaymentFailedInvoiceId), not a
// one-time flag -- Stripe's own retry schedule fires this webhook multiple
// times for the SAME invoice, which shouldn't re-send, but a genuinely new
// failed invoice next billing cycle should. Content lives in the editable
// email_templates table (key: 'payment_failed').
async function sendPaymentFailedEmail({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'payment_failed',
    to,
    toName: companyName,
    vars: { companyName },
    recipientType: 'company',
  });
  return sent;
}

// Sent once, from the customer.subscription.deleted webhook -- a genuine
// win-back touchpoint, not a reactivation-pitch send-and-forget: asks what
// went wrong and invites a reply, alongside the restart link. Deduped via
// config.subscription.cancellationEmailSentAt (webhook deliveries can
// repeat). Content lives in the editable email_templates table
// (key: 'subscription_canceled').
async function sendSubscriptionCanceledEmail({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'subscription_canceled',
    to,
    toName: companyName,
    vars: { companyName },
    recipientType: 'company',
  });
  return sent;
}

// Sent once, from trialScheduler.js's checkLegacyTrialExpired, to legacy
// no-card trial accounts once subscriptionStatus.js actually reports them
// as status: 'expired' (30 days elapsed, trialStartedAt set, never touched
// Stripe -- so there's no webhook that could ever fire for this case; it
// has to be found by scanning). Deliberately NOT sent to accounts that
// auto-converted to a paid Stripe charge -- those stay active and must
// never see "your trial expired" messaging. Deduped via
// config.subscription.legacyTrialExpiredEmailSentAt. Content lives in the
// editable email_templates table (key: 'legacy_trial_expired_winback').
async function sendLegacyTrialExpiredEmail({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'legacy_trial_expired_winback',
    to,
    toName: companyName,
    vars: { companyName, serviceListText: buildServiceListSentence() },
    recipientType: 'company',
  });
  return sent;
}

// ─── Account deletion (30-day grace period) ────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Builds the " on <date>" (or " earlier today") suffix spliced into
// activation_reminder's "You started setting up a Clean Estimator
// account{{signupDateSuffix}}..." sentence. Now that this email fires only
// ~6 hours after signup (ACTIVATION_REMINDER_DELAY_HOURS in
// trialScheduler.js), send time and signup time are almost always the same
// calendar day -- stating a full date back to someone the same afternoon
// ("...on October 14, 2026") reads oddly, so this uses "earlier today"
// whenever send and signup share a calendar day, falling back to a real
// date for the rare case they don't (e.g. a signup just before midnight).
function signupDateSuffix(signedUpAt) {
  if (!signedUpAt) return '';
  const sameDay = new Date(signedUpAt).toDateString() === new Date().toDateString();
  return sameDay ? ' earlier today' : ` on ${formatDate(signedUpAt)}`;
}

// Sent once, the moment a company requests account deletion (see company.js's
// DELETE /account handler), which now schedules a 30-day grace-period
// deletion instead of deleting immediately. Content lives in the editable
// email_templates table (key: 'account_deletion_scheduled').
async function sendAccountDeletionScheduledEmail({ to, companyName, scheduledFor }) {
  const { sent } = await sendTemplatedEmail({
    template: 'account_deletion_scheduled',
    to,
    toName: companyName,
    vars: { companyName, scheduledForText: formatDate(scheduledFor) },
    recipientType: 'company',
  });
  return sent;
}

// ─── Website request notification ──────────────────────────────────────────
// Internal-only notification the moment someone submits the "Get a
// Done-For-You Website" application (WebsiteSubscription.js's form) --
// goes to the business owner's own inbox, not the applicant (they get the
// on-page confirmation instead). Recipient is env-configurable
// (WEBSITE_REQUEST_NOTIFY_EMAIL) so it can be changed without a redeploy,
// defaulting to the owner's personal inbox. reply_to is the applicant's own
// email so replying in the inbox reaches them directly, same pattern as the
// lead-notification emails above.

function labeledRows(lines) {
  return lines.filter(Boolean).map(l => {
    const idx = l.indexOf(': ');
    const label = idx === -1 ? l : l.slice(0, idx);
    const value = idx === -1 ? '' : l.slice(idx + 2);
    return `
    <tr>
      <td style="padding:5px 0;color:#666666;font-size:13.5px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:5px 0 5px 14px;text-align:left;font-size:13.5px;color:#111111;font-weight:600;">${value}</td>
    </tr>`;
  }).join('');
}

function fmtOrDefault(v, fallback) {
  return v && String(v).trim() ? v : fallback;
}

// Always returns every domain-related field (never omits one just because
// it's blank) -- which of domain1/2/3 vs. currentWebsite applies depends on
// hasDomain, same branching the form itself uses, not a case of hiding data.
function buildWebsiteRequestDomainLines({ hasDomain, currentWebsite, domain1, domain2, domain3, facebookPage }) {
  const lines = hasDomain
    ? [
        'Already has a domain: Yes',
        `Current domain: ${fmtOrDefault(currentWebsite, 'Not provided')}`,
      ]
    : [
        'Already has a domain: No',
        `1st choice: ${fmtOrDefault(domain1, 'Not provided')}`,
        `2nd choice: ${fmtOrDefault(domain2, 'Not provided')}`,
        `3rd choice: ${fmtOrDefault(domain3, 'Not provided')}`,
      ];
  lines.push(`Facebook page: ${fmtOrDefault(facebookPage, 'None')}`);
  return lines;
}

// Every field the form collects gets its own line here, with an explicit
// "Not provided"/"None" placeholder when left blank -- so the notification
// always shows the complete shape of what was submitted, and nothing an
// applicant left blank is silently missing versus one they filled in.
//
// Deliberately omits the price ("$179/mo after the 2 free months") -- a
// real application (Oct 2026, Elevated Cleaning Solutions) landed in
// Gmail's Promotions tab, and a dollar-amount-plus-"/mo" pattern is exactly
// the kind of marketing-email signal Gmail's classifier keys on (the same
// lesson already learned twice elsewhere in this file -- see
// website_request_received and activation_reminder's history). The plan
// name alone (Starter/Growth/Pro) is all an admin needs to know which
// tier to set up in Stripe; the price is already defined server-side in
// PLAN_TIERS and doesn't need repeating here.
function fmtPlanLine({ planName }) {
  return planName ? `Plan selected: ${planName}` : null;
}

function buildWebsiteRequestText(args) {
  const { name, business, email, phone, servicesOffered, otherServices, businessAddress, serviceAreas, message, saved } = args;
  const domainLines = buildWebsiteRequestDomainLines(args);
  const planLine = fmtPlanLine(args);

  const lines = [
    ...(saved === false ? [buildNotSavedWarningText(), ''] : []),
    'New website + chatbot application!',
    '',
    `${name} (${business}) just applied for a Done-For-You cleaning website.`,
    ...(planLine ? ['', planLine] : []),
    '',
    'Contact info:',
    `  Email: ${email}`,
    `  Phone: ${fmtOrDefault(phone && fmtPhone(phone), 'Not provided')}`,
    '',
    'Business details:',
    `  Services offered: ${fmtOrDefault(servicesOffered, 'Not specified')}`,
    `  Other services: ${fmtOrDefault(otherServices, 'None')}`,
    `  Business address: ${fmtOrDefault(businessAddress, 'Not provided')}`,
    `  Service areas: ${fmtOrDefault(serviceAreas, 'Not provided')}`,
    '',
    'Domain:',
    ...domainLines.map(l => `  ${l}`),
    '',
    'Message:',
    `  ${fmtOrDefault(message, 'No additional message')}`,
    '',
    'Reply to this email to reach them directly.',
    '',
    'Clean Estimator - cleanestimator.com',
  ];

  return lines.join('\n');
}

// The not-saved warning (see POST /api/website-request's own comment on
// `saved`) deliberately isn't a colored/bordered callout box -- bold red
// text is enough to get attention without reviving the "highlighted box"
// look that got this exact email landing in Gmail's Promotions tab before
// (see buildWebsiteRequestHtml's own plan-line fix).
function buildNotSavedWarningHtml() {
  return `<p style="font-size:14px;font-weight:700;color:#dc2626;margin:0 0 20px;">⚠️ NOT SAVED -- this failed to write to the database and will NOT show up in Admin → Website Requests. Add it by hand there (the "+" button) using the details below before this gets lost.</p>`;
}

function buildNotSavedWarningText() {
  return '⚠️ NOT SAVED -- this failed to write to the database and will NOT show up in Admin -> Website Requests. Add it by hand there (the "+" button) using the details below before this gets lost.';
}

function buildWebsiteRequestHtml(args) {
  const { name, business, email, phone, servicesOffered, otherServices, businessAddress, serviceAreas, message, saved } = args;
  const domainLines = buildWebsiteRequestDomainLines(args);
  const planLine = fmtPlanLine(args);

  const contactRows = labeledRows([
    `Email: ${email}`,
    `Phone: ${fmtOrDefault(phone && fmtPhone(phone), 'Not provided')}`,
  ]);
  const businessRows = labeledRows([
    `Services offered: ${fmtOrDefault(servicesOffered, 'Not specified')}`,
    `Other services: ${fmtOrDefault(otherServices, 'None')}`,
    `Business address: ${fmtOrDefault(businessAddress, 'Not provided')}`,
    `Service areas: ${fmtOrDefault(serviceAreas, 'Not provided')}`,
  ]);
  const domainRows = labeledRows(domainLines);

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  ${saved === false ? buildNotSavedWarningHtml() : ''}
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New website + chatbot application!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${name}</strong> (${business}) just applied for a Done-For-You cleaning website.
  </p>

  ${planLine ? `<p style="font-size:14px;line-height:1.6;margin:0 0 20px;"><strong>${planLine}</strong></p>` : ''}

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Contact info</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">${contactRows}</table>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Business details</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">${businessRows}</table>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Domain</p>
  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">${domainRows}</table>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Message</p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;white-space:pre-wrap;">${fmtOrDefault(message, 'No additional message')}</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Reply to this email to reach them directly.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

async function sendWebsiteRequestNotificationEmail(args) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, WEBSITE_REQUEST_NOTIFY_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendWebsiteRequestNotificationEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';
  const notifyEmail = WEBSITE_REQUEST_NOTIFY_EMAIL || 'eliaszoleta87@gmail.com';

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [notifyEmail],
        reply_to: args.email || undefined,
        subject: `${args.saved === false ? '⚠️ NOT SAVED — ' : ''}New website application${args.planName ? ` (${args.planName})` : ''} — ${args.business || args.name} — ${fmtSubjectTimestamp()}`,
        html: buildWebsiteRequestHtml(args),
        text: buildWebsiteRequestText(args),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendWebsiteRequestNotificationEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

// Sent to the applicant right after they submit the public "Get a Website"
// form (POST /api/website-request below) -- previously that form only
// triggered the internal notification above, leaving the applicant with no
// confirmation their submission even went through until (if) a sample got
// marked ready, which can be days later. Deliberately NOT sent from the
// admin's own manual-add path (see POST /api/admin/website-requests) --
// a client an admin enters by hand wasn't necessarily told "a sample is
// coming in a few days," so that promise shouldn't go out on their behalf.
// Content lives in the editable email_templates table
// (key: 'website_request_received').
async function sendWebsiteRequestReceivedEmail({ to, name, business }) {
  const { sent } = await sendTemplatedEmail({
    template: 'website_request_received',
    to,
    toName: name,
    vars: { name, business },
    recipientType: 'other',
  });
  return sent;
}

// ─── Website-request approval flow emails ──────────────────────────────────
// Sent to the prospect themselves (not the internal notification above,
// which goes to WEBSITE_REQUEST_NOTIFY_EMAIL) as their sample moves through
// routes/websiteRequest.js and routes/admin.js's approval flow.

// Sent by PATCH /api/admin/website-requests/:id when an admin attaches a
// sample link and the request moves to 'sample_ready'. Content lives in the
// editable email_templates table (key: 'website_sample_ready').
//
// monthlyPrice is required, not defaulted here, so a missing caller-side
// price fails loudly instead of silently quoting the wrong tier -- this
// template used to hardcode "a flat $249/month" regardless of which plan
// the prospect actually applied for, which was simply wrong for anyone on
// Starter or Growth. See routes/admin.js for how the tier-correct price is
// looked up before calling this.
async function sendWebsiteSampleReadyEmail({ to, name, business, sampleUrl, approvalUrl, monthlyPrice }) {
  const { sent } = await sendTemplatedEmail({
    template: 'website_sample_ready',
    to,
    toName: name,
    vars: { name, business, sampleUrl, approvalUrl, monthlyPriceText: fmtMoney(monthlyPrice) },
    recipientType: 'other',
  });
  return sent;
}

// Sent once an admin links the client's $249/mo subscription in the admin
// panel (see PATCH /api/admin/website-requests/:id), not when the $5 fee
// itself clears -- Stripe already sends its own receipt for that charge
// automatically, so a second email at that same moment would be redundant,
// and the "2 months free, billed starting month 3" it describes isn't
// actually true yet until that subscription really exists. Content lives in
// the editable email_templates table (key: 'website_subscription_confirmed').
async function sendWebsiteSubscriptionConfirmedEmail({ to, name, business, trialDays, monthlyPrice }) {
  const { sent } = await sendTemplatedEmail({
    template: 'website_subscription_confirmed',
    to,
    toName: name,
    vars: { name, business, trialDays, monthlyPriceText: fmtMoney(monthlyPrice) },
    recipientType: 'other',
  });
  return sent;
}

// ─── Chatbot widget (Growth/Pro tier) lead alerts ──────────────────────────
// Sent exactly once per conversation, by services/chatbotSummary.js right
// after it closes a conversation out -- name, phone, AND the summary
// together in one email, not a separate "someone's chatting" alert
// followed later by a summary. Not routed through the DB-backed template
// system sendTemplatedEmail wraps -- that system is for content an admin
// edits per *marketing* campaign; here every chatbot needs its own "From"
// display name and recipient, which is plain per-row config
// (chatbots.from_name / .lead_alert_email), not template content.
//
// Deliberately not run through sendEstimateEmail's brandName pattern even
// though it's the same idea (custom display name, our own verified From
// address) -- that function is public-widget-triggered and has no
// alert-recipient concept at all, so it isn't a fit to extend.
function buildChatbotLeadAlertHtml({ chatbot, lead, summary }) {
  const phoneDisplay = fmtPhone(lead.phone);
  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New chat lead</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${lead.name}</strong> just finished chatting with your website's AI chatbot.
  </p>

  <table style="border-collapse:collapse;border-top:1px solid #e0e0e0;margin:0 0 20px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666666;font-size:13px;">Name</td><td style="padding:6px 0;font-size:13px;font-weight:600;">${lead.name}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666666;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:13px;font-weight:600;">${phoneDisplay}</td></tr>
  </table>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Conversation summary</p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;white-space:pre-wrap;">${summary}</p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    ${chatbot.business_name} · sent by your website chatbot
  </p>
</div>`;
}

function buildChatbotLeadAlertText({ chatbot, lead, summary }) {
  const phoneDisplay = fmtPhone(lead.phone);
  return [
    'New chat lead',
    '',
    `Name: ${lead.name}`,
    `Phone: ${phoneDisplay}`,
    '',
    `Summary:\n${summary}`,
    '',
    `${chatbot.business_name} · sent by your website chatbot`,
  ].join('\n');
}

async function sendChatbotLeadAlertEmail({ chatbot, lead, summary }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendChatbotLeadAlertEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }
  if (!chatbot?.lead_alert_email) {
    console.warn('sendChatbotLeadAlertEmail skipped: chatbot has no lead_alert_email configured');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';
  const fromName = chatbot.from_name || chatbot.business_name;

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `${fromName} <${fromAddress}>`,
        to: [chatbot.lead_alert_email],
        subject: `New chat lead: ${lead.name} — ${fmtSubjectTimestamp()}`,
        html: buildChatbotLeadAlertHtml({ chatbot, lead, summary }),
        text: buildChatbotLeadAlertText({ chatbot, lead, summary }),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendChatbotLeadAlertEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

// General in-app feedback from the "Send Feedback" button in the dashboard
// header (routes/company.js's POST /:id/general-feedback). Fire-and-forget
// from that route -- the submission is already saved to company_feedback
// (visible in Admin -> Feedback) regardless of whether this send succeeds,
// same "DB write is the source of truth, email is just a faster heads-up"
// pattern as sendWebsiteRequestNotificationEmail above. reply_to is set to
// the submitter's own address so replying from the inbox goes straight back
// to them, no copy-paste needed.
async function sendCompanyFeedbackEmail({ business, email, message }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, COMPANY_FEEDBACK_NOTIFY_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendCompanyFeedbackEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';
  const notifyEmail = COMPANY_FEEDBACK_NOTIFY_EMAIL || 'eliaszoleta87@gmail.com';
  const who = business ? `${business}${email ? ` (${email})` : ''}` : (email || 'A Clean Estimator user');
  const safeMessage = String(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [notifyEmail],
        reply_to: email || undefined,
        subject: `New feedback — ${business || email || 'Clean Estimator user'} — ${fmtSubjectTimestamp()}`,
        text: [
          'New feedback submitted from the dashboard.',
          '',
          `From: ${who}`,
          '',
          message,
        ].join('\n'),
        html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New feedback submitted from the dashboard</p>
  <p style="font-size:13px;color:#64748b;margin:0 0 16px;">From: ${who}</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${safeMessage}</div>
</div>`,
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendCompanyFeedbackEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

module.exports = {
  sendEstimateEmail,
  sendPartnerWelcomeEmail,
  sendPartnerLeadEmail,
  sendCompanyLeadEmail,
  sendCompanyWelcomeEmail,
  sendSubscriptionReactivatedEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendLegacyTrialExpiredEmail,
  sendTrialCheckin1Email,
  sendActivationReminderEmail,
  sendAccountDeletionScheduledEmail,
  sendWebsiteRequestNotificationEmail,
  sendWebsiteRequestReceivedEmail,
  sendWebsiteSampleReadyEmail,
  sendWebsiteSubscriptionConfirmedEmail,
  sendChatbotLeadAlertEmail,
  sendCompanyFeedbackEmail,
};
