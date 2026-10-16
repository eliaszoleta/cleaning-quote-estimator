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

function fmtMoney(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
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

function fmtAdjustment(adj) {
  if (adj.low === 0 && adj.high === 0) return 'Included';
  if (adj.low < 0 || adj.high < 0) return `−${fmtMoney(Math.abs(adj.low))} – −${fmtMoney(Math.abs(adj.high))}`;
  return `${fmtMoney(adj.low)} – ${fmtMoney(adj.high)}`;
}

// Mirrors ResultsScreen's own "Price breakdown" table -- same rows,
// same total, so the email matches what was actually shown on-screen
// instead of just repeating the headline range. Used by the internal
// lead-notification emails (sendPartnerLeadEmail, sendCompanyLeadEmail),
// which keep their plain, undecorated style -- see buildEstimateBreakdownRows
// below for the more visually-styled version used in the actual
// customer-facing estimate email.
function buildBreakdownRows(adjustments) {
  return adjustments
    .filter(a => !a.separate)
    .map(a => `
      <tr>
        <td style="padding:5px 0;color:#333333;font-size:14px;text-transform:capitalize;">${a.label}</td>
        <td style="padding:5px 0;text-align:right;font-size:14px;color:#333333;white-space:nowrap;">${fmtAdjustment(a)}</td>
      </tr>`)
    .join('');
}

// Same rows as buildBreakdownRows, but zebra-striped with dividers between
// rows -- the bordered-card look ResultsScreen's own "Price breakdown"
// table has on screen. Only used in buildHtml (sendEstimateEmail, the
// email actually handed to the person who got the estimate) -- the
// internal lead-notification templates above intentionally keep the
// plainer buildBreakdownRows look.
function buildEstimateBreakdownRows(adjustments) {
  const rows = adjustments.filter(a => !a.separate);
  return rows
    .map((a, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding:10px 12px;color:#333333;font-size:13.5px;text-transform:capitalize;${i < rows.length - 1 ? 'border-bottom:1px solid #e0e0e0;' : ''}">${a.label}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13.5px;color:#333333;white-space:nowrap;${i < rows.length - 1 ? 'border-bottom:1px solid #e0e0e0;' : ''}">${fmtAdjustment(a)}</td>
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
function buildText({ name, clientName, serviceType, result, companyConfig, partner }) {
  const {
    totalLow, totalHigh, stateName, city, unit,
    adjustments = [], recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
  } = result;
  const locationLabel = city ? `${city}, ${stateName}` : stateName;

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
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
    `${fmtMoney(totalLow)} - ${fmtMoney(totalHigh)} ${unit === 'per_month' ? 'per month' : 'per visit'}`,
  );

  if (recurringMonthlyLow && unit !== 'per_month') {
    lines.push(`Recurring: ${fmtMoney(recurringMonthlyLow)} - ${fmtMoney(recurringMonthlyHigh)}/visit${recurringAnnualSavings ? ` (save ~${fmtMoney(recurringAnnualSavings)}/year)` : ''}`);
  }

  lines.push('', 'Price breakdown:');
  adjustments.filter(a => !a.separate).forEach(a => {
    lines.push(`  ${a.label}: ${fmtAdjustment(a)}`);
  });
  lines.push(`  Estimated total: ${fmtMoney(totalLow)} - ${fmtMoney(totalHigh)}`);

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

function buildHtml({ name, clientName, serviceType, result, companyConfig, partner }) {
  const {
    totalLow, totalHigh, stateName, city, unit,
    adjustments = [], keyFactors = [],
    recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
  } = result;
  // Same city-resolution ResultsScreen.js's eyebrow badge now shows --
  // see cleaningCalculation.js's own resolveCityForZip call.
  const locationLabel = city ? `${city}, ${stateName}` : stateName;

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
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
  const recurringLine = (recurringMonthlyLow && unit !== 'per_month')
    ? `<p style="margin:14px 0 0;"><span style="display:inline-block;background:${primaryColor}17;color:${primaryColor};padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:700;">Recurring: ${fmtMoney(recurringMonthlyLow)} – ${fmtMoney(recurringMonthlyHigh)}/visit${recurringAnnualSavings ? ` · Save ~${fmtMoney(recurringAnnualSavings)}/year` : ''}</span></p>`
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

  <p style="font-size:30px;font-weight:800;margin:10px 0 0;color:${primaryColor};letter-spacing:-0.5px;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)} <span style="font-size:13px;font-weight:400;color:#666666;">${unit === 'per_month' ? 'per month' : 'per visit'}</span></p>
  ${recurringLine}

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 8px;">Price breakdown</p>
  <div style="border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${buildEstimateBreakdownRows(adjustments)}
      <tr style="background:${primaryColor}0d;">
        <td style="padding:11px 12px;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;">Estimated total</td>
        <td style="padding:11px 12px;text-align:right;font-weight:700;font-size:14px;color:${primaryColor};border-top:1px solid #e0e0e0;white-space:nowrap;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)}</td>
      </tr>
    </table>
  </div>
  ${buildKeyFactors(keyFactors)}

  ${bottomHtml}

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.<br>
    ${brandName} · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

// Fire-and-forget from the caller's perspective: never throws, returns
// false (and logs why) instead so a missing config or a delivery failure
// never breaks the /api/calculate response.
async function sendEstimateEmail({ to, name, clientName, serviceType, result, companyConfig, partner, replyTo }) {
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
        // clientName (only ever set on the "Email to Coworker" share path --
        // see estimateShare.js) replaces the generic subject with one that
        // names whose estimate this is, so a teammate scanning their inbox
        // doesn't have to open the email to find out.
        subject: clientName
          ? `${SERVICE_LABELS[serviceType] || 'Cleaning'} estimate for ${clientName}`
          : `Your ${SERVICE_LABELS[serviceType] || 'cleaning'} estimate is ready`,
        html: buildHtml({ name, clientName, serviceType, result, companyConfig, partner }),
        text: buildText({ name, clientName, serviceType, result, companyConfig, partner }),
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
        subject: `New ${SERVICE_LABELS[serviceType] || 'cleaning'} lead in your area — ${fmtSubjectTimestamp()}`,
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

function buildCompanyLeadText({ companyName, leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, city: city || serviceDetails?.city, state, zip, timeline });

  const lines = [
    `New lead on your ${companyName} estimator!`,
    '',
    `${name} just got a ${serviceLabel.toLowerCase()} estimate on your embedded widget: ${fmtMoney(priceLow)} - ${fmtMoney(priceHigh)}.`,
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
    'Clean Estimator - cleanestimator.com'
  );

  return lines.join('\n');
}

function buildCompanyLeadHtml({ companyName, leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments = [], keyFactors = [], serviceDetails }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
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
    ${buildBreakdownRows(adjustments)}
    <tr>
      <td style="padding:8px 0 0;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;">Estimated total</td>
      <td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;white-space:nowrap;">${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}</td>
    </tr>
  </table>
  ${buildKeyFactors(keyFactors)}` : '';

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New lead on your ${companyName} estimator!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${name}</strong> just got a ${serviceLabel.toLowerCase()} estimate on your embedded widget: <strong>${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}</strong>.
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
async function sendCompanyLeadEmail({ to, companyName, leadName, leadEmail, leadPhone, serviceType, priceLow, priceHigh, city, state, zip, timeline, adjustments, keyFactors, serviceDetails }) {
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
  const args = { companyName, leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, city, state, zip, timeline, adjustments, keyFactors, serviceDetails };

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [to],
        reply_to: leadEmail || undefined,
        subject: `New ${SERVICE_LABELS[serviceType] || 'cleaning'} lead on your estimator — ${fmtSubjectTimestamp()}`,
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
      statusLine: statusLine || "Your account is live and your 30-day free trial has started.",
    },
    subjectOverride: subject,
    recipientType: 'company',
    recipientRef: companyId,
  });
  return sent;
}

// Sent once, ~12 hours after a company's account was created if checkout
// still hasn't been completed (status stays 'requires_trial_setup' --
// see checkActivationReminders in services/trialScheduler.js). These
// accounts show up in the admin Companies list as "Not started". Deduped
// via activationReminderEmailSentAt on config.subscription. Content lives
// in the editable email_templates table (key: 'activation_reminder').
async function sendActivationReminderEmail({ to, companyName }) {
  const { sent } = await sendTemplatedEmail({
    template: 'activation_reminder',
    to,
    toName: companyName,
    vars: { companyName },
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

// ─── Account deletion (30-day grace period) ────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
function fmtPlanLine({ planName, planPrice }) {
  return planName ? `Plan selected: ${planName} ($${planPrice}/mo after the 2 free months)` : null;
}

function buildWebsiteRequestText(args) {
  const { name, business, email, phone, servicesOffered, otherServices, businessAddress, serviceAreas, message } = args;
  const domainLines = buildWebsiteRequestDomainLines(args);
  const planLine = fmtPlanLine(args);

  const lines = [
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

function buildWebsiteRequestHtml(args) {
  const { name, business, email, phone, servicesOffered, otherServices, businessAddress, serviceAreas, message } = args;
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
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">New website + chatbot application!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    <strong>${name}</strong> (${business}) just applied for a Done-For-You cleaning website.
  </p>

  ${planLine ? `<p style="font-size:14px;line-height:1.6;margin:0 0 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;"><strong>${planLine}</strong></p>` : ''}

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
        subject: `New website application${args.planName ? ` (${args.planName})` : ''} — ${args.business || args.name} — ${fmtSubjectTimestamp()}`,
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
async function sendWebsiteSampleReadyEmail({ to, name, business, sampleUrl, approvalUrl }) {
  const { sent } = await sendTemplatedEmail({
    template: 'website_sample_ready',
    to,
    toName: name,
    vars: { name, business, sampleUrl, approvalUrl },
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

module.exports = {
  sendEstimateEmail,
  sendPartnerWelcomeEmail,
  sendPartnerLeadEmail,
  sendCompanyLeadEmail,
  sendCompanyWelcomeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendTrialCheckin1Email,
  sendActivationReminderEmail,
  sendAccountDeletionScheduledEmail,
  sendWebsiteRequestNotificationEmail,
  sendWebsiteRequestReceivedEmail,
  sendWebsiteSampleReadyEmail,
  sendWebsiteSubscriptionConfirmedEmail,
  sendChatbotLeadAlertEmail,
};
