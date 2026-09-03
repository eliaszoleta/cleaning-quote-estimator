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

function buildHtml({ name, serviceType, priceLow, priceHigh, state, companyConfig }) {
  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
  const brandName = companyConfig?.companyName || 'Clean Estimator';
  const accent = companyConfig?.primaryColor || '#2563eb';
  const firstName = (name || '').trim().split(' ')[0] || 'there';

  const ctaUrl = companyConfig?.ctaButtonUrl || 'https://www.cleanestimator.com';
  const ctaText = companyConfig?.ctaButtonText || 'Get an Exact Quote';
  const ctaPhone = companyConfig?.ctaPhone || '';

  return `
<div style="max-width:480px;margin:40px auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="text-align:center;margin-bottom:28px;">
    <table style="margin:0 auto;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:32px;height:32px;background:linear-gradient(135deg,${accent},#1d4ed8);border-radius:8px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:700;">✦</td>
        <td style="padding-left:10px;font-weight:800;font-size:17px;color:#0f172a;">${brandName}</td>
      </tr>
    </table>
  </div>

  <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid ${accent};border-radius:14px;padding:36px 32px;text-align:center;">
    <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 8px;">Hi ${firstName}, here's your estimate</h1>
    <p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;">For ${serviceLabel.toLowerCase()}${state ? ` in ${state}` : ''}:</p>

    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:800;color:${accent};">${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}</div>
      <div style="font-size:12.5px;color:#94a3b8;margin-top:4px;">Estimated price range</div>
    </div>

    <a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;">
      ${ctaText} →
    </a>
    ${ctaPhone ? `<p style="font-size:13px;color:#64748b;margin:16px 0 0;">Or call ${ctaPhone}</p>` : ''}

    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">
      This is an estimate only — actual pricing may vary based on your home's condition and specific requirements.
    </p>
  </div>
</div>`;
}

// Fire-and-forget from the caller's perspective: never throws, returns
// false (and logs why) instead so a missing config or a delivery failure
// never breaks the /api/calculate response.
async function sendEstimateEmail({ to, name, serviceType, priceLow, priceHigh, state, companyConfig }) {
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
        subject: `Your ${SERVICE_LABELS[serviceType] || 'cleaning'} estimate: ${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}`,
        html: buildHtml({ name, serviceType, priceLow, priceHigh, state, companyConfig }),
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
