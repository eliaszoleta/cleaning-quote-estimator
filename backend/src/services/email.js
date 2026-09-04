const axios = require('axios');

// Lead capture (LeadCaptureStep.js) tells visitors "we'll email your
// estimate" -- this is what actually makes that true. Sends via Resend
// (a transactional email API) rather than raw SMTP or Hostinger's Email
// API: SMTP got blocked by Railway's outbound network restrictions, and
// Hostinger's customer-facing API token (hPanel > API) turned out to be
// for their general hosting/VPS/domains API, not the separate Email API
// -- there's no self-service token for that from a normal account. Resend
// is purpose-built for this exact "app sends transactional email" case.

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
    .map((a, i, arr) => `
      <tr>
        <td style="padding:9px 0;color:#374151;font-size:13.5px;text-transform:capitalize;${i < arr.length - 1 ? 'border-bottom:1px solid #f8fafc;' : ''}">${a.label}</td>
        <td style="padding:9px 0;text-align:right;font-weight:600;font-size:13.5px;color:${(a.low < 0 || a.high < 0) ? '#16a34a' : '#0f172a'};${i < arr.length - 1 ? 'border-bottom:1px solid #f8fafc;' : ''}">${fmtAdjustment(a)}</td>
      </tr>`)
    .join('');
}

function buildKeyFactors(keyFactors) {
  if (!keyFactors?.length) return '';
  const chips = keyFactors
    .map(f => `<span style="display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 11px;font-size:12px;margin:0 6px 6px 0;"><span style="color:#64748b;">${f.label}:</span> <strong style="color:#0f172a;text-transform:capitalize;">${f.impact}</strong></span>`)
    .join('');
  return `
    <div style="margin:20px 0 4px;text-align:left;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Key factors in your estimate</div>
      <div>${chips}</div>
    </div>`;
}

// Same card shown on-screen (PartnerCard.js) when the visitor's location
// matches an active partner -- passed through from the frontend's own
// match so the email never disagrees with what the results page showed.
function buildPartnerCard(partner) {
  if (!partner) return '';
  return `
    <div style="background:linear-gradient(135deg,#eff6ff,#ffffff);border:2px solid #2563eb;border-radius:14px;padding:20px 22px;margin-top:22px;text-align:left;">
      <div style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">⭐ Recommended Cleaner Near You</div>
      <div style="font-weight:800;font-size:16px;color:#0f172a;">${partner.business_name}</div>
      ${partner.address ? `<div style="font-size:13px;color:#64748b;margin-top:3px;">${partner.address}</div>` : ''}
      <div style="margin-top:14px;">
        ${partner.phone ? `<a href="tel:${partner.phone}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:9px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;margin:0 8px 8px 0;">Call ${partner.phone}</a>` : ''}
        ${partner.website ? `<a href="${partner.website}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:9px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;margin:0 8px 8px 0;">Visit Website</a>` : ''}
      </div>
    </div>`;
}

function buildGenericCta({ accent, ctaUrl, ctaText, ctaPhone }) {
  return `
    <a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;margin-top:22px;">
      ${ctaText} →
    </a>
    ${ctaPhone ? `<p style="font-size:13px;color:#64748b;margin:16px 0 0;">Or call ${ctaPhone}</p>` : ''}`;
}

function buildHtml({ name, serviceType, result, companyConfig, partner }) {
  const {
    totalLow, totalHigh, stateName, unit,
    adjustments = [], keyFactors = [],
    recurringMonthlyLow, recurringMonthlyHigh, recurringAnnualSavings,
  } = result;

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const accent = companyConfig?.primaryColor || '#2563eb';
  const firstName = (name || '').trim().split(' ')[0] || 'there';

  const recurringHtml = (recurringMonthlyLow && unit !== 'per_month')
    ? `<div style="font-size:13px;color:#64748b;margin-top:8px;">Recurring: <strong style="color:#0f172a;">${fmtMoney(recurringMonthlyLow)} – ${fmtMoney(recurringMonthlyHigh)}/visit</strong>${recurringAnnualSavings ? ` · Save ~${fmtMoney(recurringAnnualSavings)}/year` : ''}</div>`
    : '';

  const bottomHtml = partner
    ? buildPartnerCard(partner)
    : buildGenericCta({
        accent,
        ctaUrl: companyConfig?.ctaButtonUrl || 'https://www.cleanestimator.com',
        ctaText: companyConfig?.ctaButtonText || 'Get an Exact Quote',
        ctaPhone: companyConfig?.ctaPhone || '',
      });

  return `
<div style="max-width:520px;margin:40px auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="text-align:center;margin-bottom:28px;">
    <table style="margin:0 auto;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:32px;height:32px;background:linear-gradient(135deg,${accent},#1d4ed8);border-radius:8px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:700;">✦</td>
        <td style="padding-left:10px;font-weight:800;font-size:17px;color:#0f172a;">${brandName}</td>
      </tr>
    </table>
  </div>

  <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid ${accent};border-radius:14px;padding:32px;text-align:center;">
    <h1 style="font-size:19px;font-weight:800;color:#0f172a;margin:0 0 4px;">Hi ${firstName}, here's your estimate</h1>
    <p style="font-size:13.5px;color:#64748b;margin:0 0 20px;">${serviceLabel}${stateName ? ` · ${stateName}` : ''}</p>

    <div style="font-size:32px;font-weight:800;color:${accent};letter-spacing:-0.5px;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)}</div>
    <div style="font-size:12.5px;color:#94a3b8;margin-top:2px;">${unit === 'per_month' ? 'per month' : 'per visit'}</div>
    ${recurringHtml}

    <div style="text-align:left;margin-top:26px;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Price breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        ${buildBreakdownRows(adjustments)}
        <tr>
          <td style="padding:12px 0 0;font-weight:700;font-size:14.5px;color:#0f172a;border-top:1.5px solid #e2e8f0;">Estimated total</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:14.5px;color:${accent};border-top:1.5px solid #e2e8f0;">${fmtMoney(totalLow)} – ${fmtMoney(totalHigh)}</td>
        </tr>
      </table>
      ${buildKeyFactors(keyFactors)}
    </div>

    ${bottomHtml}

    <p style="font-size:12px;color:#94a3b8;margin:26px 0 0;">
      This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.
    </p>
  </div>
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
