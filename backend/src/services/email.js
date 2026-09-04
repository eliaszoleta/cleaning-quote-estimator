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
        subject: `Your ${SERVICE_LABELS[serviceType] || 'cleaning'} estimate: ${fmtMoney(result.totalLow)} – ${fmtMoney(result.totalHigh)}`,
        html: buildHtml({ name, serviceType, result, companyConfig, partner }),
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.warn('sendEstimateEmail failed:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    return false;
  }
}

module.exports = { sendEstimateEmail };
