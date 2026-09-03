const nodemailer = require('nodemailer');

// Lead capture (LeadCaptureStep.js) tells visitors "we'll email your
// estimate" -- this is what actually makes that true. Uses plain SMTP
// (Hostinger) rather than a third-party email API since the domain's
// mailbox is already paid for and already used for Supabase Auth emails.

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

let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transporter;
}

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
// false (and logs why) instead so a missing SMTP config or a delivery
// failure never breaks the /api/calculate response.
async function sendEstimateEmail({ to, name, serviceType, priceLow, priceHigh, state, companyConfig }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('sendEstimateEmail skipped: SMTP not configured (SMTP_HOST/PORT/USER/PASS)');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${companyConfig?.companyName || 'Clean Estimator'}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your ${SERVICE_LABELS[serviceType] || 'cleaning'} estimate: ${fmtMoney(priceLow)} – ${fmtMoney(priceHigh)}`,
      html: buildHtml({ name, serviceType, priceLow, priceHigh, state, companyConfig }),
    });
    return true;
  } catch (err) {
    console.warn('sendEstimateEmail failed:', err.message);
    return false;
  }
}

module.exports = { sendEstimateEmail };
