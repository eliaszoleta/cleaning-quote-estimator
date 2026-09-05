const axios = require('axios');

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

const RESEND_API_BASE = 'https://api.resend.com';

const SERVICE_LABELS = {
  home_residential: 'House Cleaning',
  apartment: 'Apartment Cleaning',
  commercial: 'Commercial Cleaning',
  carpet: 'Carpet Cleaning',
  air_duct: 'Air Duct Cleaning',
  dryer_vent: 'Dryer Vent Cleaning',
  tile_grout: 'Tile & Grout Cleaning',
  mold_remediation: 'Mold Remediation',
  water_damage: 'Water Damage Restoration',
};

function fmtMoney(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function fmtAdjustment(adj) {
  if (adj.low === 0 && adj.high === 0) return 'Included';
  if (adj.low < 0 || adj.high < 0) return `−${fmtMoney(Math.abs(adj.low))} – −${fmtMoney(Math.abs(adj.high))}`;
  return `${fmtMoney(adj.low)} – ${fmtMoney(adj.high)}`;
}

// Mirrors ResultsScreen's own "Price breakdown" table -- same rows,
// same total, so the email matches what was actually shown on-screen
// instead of just repeating the headline range.
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
    partner.phone ? `Phone: ${partner.phone}` : '',
    partner.website ? `Website: <a href="${partner.website}" style="color:#2563eb;">${partner.website.replace(/^https?:\/\//, '')}</a>` : '',
  ].filter(Boolean).join('<br>');

  return `
    <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Recommended cleaner near you</p>
    <p style="font-size:15px;color:#111111;font-weight:600;margin:0 0 4px;">${partner.business_name}</p>
    <p style="font-size:14px;color:#333333;line-height:1.7;margin:0;">${lines}</p>`;
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
function buildText({ name, serviceType, result, companyConfig, partner }) {
  const {
    totalLow, totalHigh, stateName, unit,
    adjustments = [], recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
  } = result;

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const firstName = (name || '').trim().split(' ')[0] || 'there';

  const lines = [
    `Hi ${firstName},`,
    '',
    `Here's your ${serviceLabel.toLowerCase()} estimate${stateName ? ` for ${stateName}` : ''}:`,
    '',
    `${fmtMoney(totalLow)} - ${fmtMoney(totalHigh)} ${unit === 'per_month' ? 'per month' : 'per visit'}`,
  ];

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
    if (partner.phone) lines.push(`Phone: ${partner.phone}`);
    if (partner.website) lines.push(`Website: ${partner.website}`);
  } else {
    const ctaText = companyConfig?.ctaButtonText || 'Get an exact quote';
    const ctaUrl = companyConfig?.ctaButtonUrl || 'https://www.cleanestimator.com';
    lines.push('', `${ctaText}: ${ctaUrl}`);
    if (companyConfig?.ctaPhone) lines.push(`Or call ${companyConfig.ctaPhone}`);
  }

  lines.push(
    '',
    "This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.",
    `${brandName} - cleanestimator.com`
  );

  return lines.join('\n');
}

function buildHtml({ name, serviceType, result, companyConfig, partner }) {
  const {
    totalLow, totalHigh, stateName, unit,
    adjustments = [], keyFactors = [],
    recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
  } = result;

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const firstName = (name || '').trim().split(' ')[0] || 'there';

  const recurringLine = (recurringMonthlyLow && unit !== 'per_month')
    ? `<p style="font-size:13px;color:#666666;margin:4px 0 0;">Recurring: ${fmtMoney(recurringMonthlyLow)} – ${fmtMoney(recurringMonthlyHigh)}/visit${recurringAnnualSavings ? ` · Save ~${fmtMoney(recurringAnnualSavings)}/year` : ''}</p>`
    : '';

  const bottomHtml = partner
    ? buildPartnerSection(partner)
    : buildGenericCta({
        ctaUrl: companyConfig?.ctaButtonUrl || 'https://www.cleanestimator.com',
        ctaText: companyConfig?.ctaButtonText || 'Get an exact quote',
        ctaPhone: companyConfig?.ctaPhone || '',
      });

  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi ${firstName},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 4px;">Here's your ${serviceLabel.toLowerCase()} estimate${stateName ? ` for ${stateName}` : ''}:</p>

  <p style="font-size:24px;font-weight:700;margin:10px 0 0;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)} <span style="font-size:13px;font-weight:400;color:#666666;">${unit === 'per_month' ? 'per month' : 'per visit'}</span></p>
  ${recurringLine}

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 6px;">Price breakdown</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e0e0e0;">
    ${buildBreakdownRows(adjustments)}
    <tr>
      <td style="padding:8px 0 0;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;">Estimated total</td>
      <td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:14px;border-top:1px solid #e0e0e0;white-space:nowrap;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)}</td>
    </tr>
  </table>
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
async function sendEstimateEmail({ to, name, serviceType, result, companyConfig, partner }) {
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
        subject: `Your ${SERVICE_LABELS[serviceType] || 'cleaning'} estimate is ready`,
        html: buildHtml({ name, serviceType, result, companyConfig, partner }),
        text: buildText({ name, serviceType, result, companyConfig, partner }),
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

function buildPartnerWelcomeText({ businessName, cities }) {
  const cityList = fmtCityList(cities);
  return [
    `Congratulations, ${businessName}!`,
    '',
    `You're officially a Clean Estimator partner in ${cityList}. Your listing is live now -- on the results card, the floating banner, and the estimate email in every city you bought.`,
    '',
    'Next: set up your dashboard',
    "Go to https://www.cleanestimator.com/client and sign up with this same email address to unlock your KPI dashboard -- impressions, calls, and click-through-rate for every city.",
    '',
    'Clean Estimator - cleanestimator.com',
  ].join('\n');
}

function buildPartnerWelcomeHtml({ businessName, cities }) {
  const cityList = fmtCityList(cities);
  return `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Congratulations, ${businessName}!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You're officially a Clean Estimator partner in <strong>${cityList}</strong>. Your listing is live now — on the results card, the floating banner, and the estimate email in every city you bought.
  </p>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Next: set up your dashboard</p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Go to <a href="https://www.cleanestimator.com/client" style="color:#2563eb;">cleanestimator.com/client</a> and sign up with this same email address to unlock your KPI dashboard — impressions, calls, and click-through-rate for every city.
  </p>

  <p style="margin:8px 0 0;">
    <a href="https://www.cleanestimator.com/client" style="color:#2563eb;font-size:14px;font-weight:600;">Set up my dashboard →</a>
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>`;
}

// Sent right after a self-serve "buy city placement" checkout provisions a
// new active partner (backend/src/routes/partnerCheckout.js) -- the in-app
// success page shows the same congrats + /client instructions, but a
// buyer who closes that tab before it loads (or never sees it, e.g. the
// webhook provisioned them after they'd already navigated away) would
// otherwise have no way to find out their listing is live or how to get
// dashboard access. Fire-and-forget, same as sendEstimateEmail.
async function sendPartnerWelcomeEmail({ to, businessName, cities }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('sendPartnerWelcomeEmail skipped: Resend not configured (RESEND_API_KEY)');
    return false;
  }
  if (!to) {
    console.warn('sendPartnerWelcomeEmail skipped: no recipient email');
    return false;
  }

  const fromAddress = RESEND_FROM_EMAIL || 'info@cleanestimator.com';

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [to],
        subject: `Welcome to the Clean Estimator Partner Program, ${businessName}!`,
        html: buildPartnerWelcomeHtml({ businessName, cities }),
        text: buildPartnerWelcomeText({ businessName, cities }),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendPartnerWelcomeEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

const TIMELINE_LABELS = {
  asap: 'ASAP',
  week: 'This week',
  month: 'This month',
  planning: 'Just planning',
};

function buildLeadContactLines({ leadEmail, leadPhone, zip, timeline }) {
  return [
    leadEmail ? `Email: ${leadEmail}` : null,
    leadPhone ? `Phone: ${leadPhone}` : null,
    zip ? `ZIP: ${zip}` : null,
    timeline ? `Timeline: ${TIMELINE_LABELS[timeline] || timeline}` : null,
  ].filter(Boolean);
}

function buildPartnerLeadText({ leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, zip, timeline }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, zip, timeline });

  return [
    'New lead in your area!',
    '',
    `${name} just got a ${serviceLabel.toLowerCase()} estimate on Clean Estimator: ${fmtMoney(priceLow)} - ${fmtMoney(priceHigh)}.`,
    '',
    'Contact info:',
    ...contactLines.map(l => `  ${l}`),
    '',
    'Reply to this email to reach them directly, or use the contact info above.',
    '',
    "They opted in to be connected with a local cleaning professional -- that's you, as our exclusive partner in this area.",
    '',
    'Clean Estimator - cleanestimator.com',
  ].join('\n');
}

function buildPartnerLeadHtml({ leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, zip, timeline }) {
  const name = leadName || 'A visitor';
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const contactLines = buildLeadContactLines({ leadEmail, leadPhone, zip, timeline });

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
async function sendPartnerLeadEmail({ partnerEmail, leadName, leadEmail, leadPhone, serviceType, priceLow, priceHigh, zip, timeline }) {
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
  const args = { leadName, serviceType, priceLow, priceHigh, leadEmail, leadPhone, zip, timeline };

  try {
    await axios.post(
      `${RESEND_API_BASE}/emails`,
      {
        from: `Clean Estimator <${fromAddress}>`,
        to: [partnerEmail],
        // Lets the partner just hit "reply" in their inbox to reach the
        // lead directly, without ever needing to copy the contact info out.
        reply_to: leadEmail || undefined,
        subject: `New ${SERVICE_LABELS[serviceType] || 'cleaning'} lead in your area`,
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

module.exports = { sendEstimateEmail, sendPartnerWelcomeEmail, sendPartnerLeadEmail };
