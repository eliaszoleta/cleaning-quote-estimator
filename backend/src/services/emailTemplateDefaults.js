// Seed content for the app's "lifecycle" emails -- the ones triggered
// automatically by app events (trial reminders, welcome emails, website
// request status changes) rather than sent manually from the admin's Email
// Marketing tab. These used to be hardcoded template-literal functions in
// email.js; now they're the one-time seed rows for the editable
// email_templates table (see emailTemplates.js's ensureSeeded), identified
// by `key` so code can still look them up and render them without a
// hardcoded copy of the content living here forever -- once seeded, an
// admin edit in the UI is what actually ships, this file is only ever
// consulted again as a fallback if the DB row is somehow missing.
//
// Each template's HTML/text body uses {{varName}} tokens, substituted by
// emailTemplates.js's render() at send time. Keep these in sync with what
// each send*Email call site in email.js actually passes -- the variables
// array here is documentation shown in the admin editor, not validated
// against the call site.

const FOOTER_HTML = `
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>`;

module.exports = [
  {
    key: 'partner_welcome',
    name: 'Partner welcome',
    subject: 'Welcome to the Clean Estimator Partner Program, {{businessName}}!',
    variables: [
      { name: 'businessName', example: 'Sparkle Clean Co' },
      { name: 'cityList', example: 'Austin, TX and Round Rock, TX' },
    ],
    text: [
      'Congratulations, {{businessName}}!',
      '',
      "You're officially a Clean Estimator partner in {{cityList}}. Your listing is live now -- on the results card, the floating banner, and the estimate email in every city you bought.",
      '',
      'Next: set up your dashboard',
      "Go to https://www.cleanestimator.com/client and sign up with this same email address to unlock your KPI dashboard -- impressions, calls, and click-through-rate for every city.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Congratulations, {{businessName}}!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You're officially a Clean Estimator partner in <strong>{{cityList}}</strong>. Your listing is live now — on the results card, the floating banner, and the estimate email in every city you bought.
  </p>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Next: set up your dashboard</p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Go to <a href="https://www.cleanestimator.com/client" style="color:#2563eb;">cleanestimator.com/client</a> and sign up with this same email address to unlock your KPI dashboard — impressions, calls, and click-through-rate for every city.
  </p>

  <p style="margin:8px 0 0;">
    <a href="https://www.cleanestimator.com/client" style="color:#2563eb;font-size:14px;font-weight:600;">Set up my dashboard →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'company_welcome',
    name: 'Company welcome / embed code',
    subject: "Your Clean Estimator account is ready — here's your embed code",
    variables: [
      { name: 'embedCode', example: '<iframe ...>...</iframe>' },
      { name: 'embedCodeHtml', example: '(HTML-escaped embed code, for the &lt;pre&gt; block)' },
    ],
    text: [
      'Welcome to Clean Estimator!',
      '',
      "Your account is live and your embedded estimator is ready to go right now — 30-day free trial, no credit card needed. Here's your embed code:",
      '',
      '{{embedCode}}',
      '',
      "Paste that anywhere in your website's HTML — a Custom HTML / Embed block in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.",
      '',
      "Two things are already working, no setup needed: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.",
      '',
      'Before you paste it, you may want to set your business name, colors, and which services you offer — all in your dashboard:',
      'https://www.cleanestimator.com/company?tab=branding',
      '',
      'New to Clean Estimator? Log in to your dashboard and open the Help & Docs tab — it walks through how the estimator works, how pricing is calculated (with the real data behind it), and answers to the most common questions:',
      'https://www.cleanestimator.com/company?tab=help',
      '',
      'You can always get this same code later from the Embed Widget tab.',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Welcome to Clean Estimator!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your account is live and your embedded estimator is ready to go right now — 30-day free trial, no credit card needed. Here's your embed code:
  </p>

  <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-family:'Menlo','Monaco',monospace;font-size:11.5px;line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-all;margin:0 0 20px;">{{embedCodeHtml}}</pre>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Paste that anywhere in your website's HTML — a <strong>Custom HTML / Embed block</strong> in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Two things are already working, no setup needed: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Before you paste it, you may want to set your business name, colors, and which services you offer — all in your dashboard.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=branding" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Set up my dashboard →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    New to Clean Estimator? Open the <a href="https://www.cleanestimator.com/company?tab=help" style="color:#2563eb;font-weight:700;">Help &amp; Docs</a> tab in your dashboard — it walks through how the estimator works, how pricing is calculated (with the real data behind it), and answers to the most common questions.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    You can always get this same code later from the <strong>Embed Widget</strong> tab.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_ending_soon',
    name: 'Trial ending soon',
    subject: 'Your Clean Estimator trial ends in {{daysLeftText}}',
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'daysLeftText', example: '2 days' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      'Your free Clean Estimator trial ends in {{daysLeftText}}. After that, your embedded estimator will pause on your website until you subscribe.',
      '',
      'Subscribe now to keep it running without interruption:',
      'https://www.cleanestimator.com/company?tab=subscription',
      '',
      'No action needed if you plan to subscribe before then -- this is just a heads up.',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your free Clean Estimator trial ends in <strong>{{daysLeftText}}</strong>. After that, your embedded estimator will pause on your website until you subscribe.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Subscribe now →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    No action needed if you already plan to subscribe before then — this is just a heads up.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_checkin_1',
    name: 'Trial check-in — day 7',
    subject: "How's Clean Estimator working out so far?",
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "You're about a week into your free trial — just checking in.",
      '',
      "If you've already got the cleaning cost estimator live on your site, awesome. If you haven't gotten around to it yet, it's a quick copy-paste — grab the code from the Embed Your Widget tab in your dashboard.",
      '',
      "If anything's confusing or not working the way you expected, just reply to this email or check the Help & Docs tab — happy to help.",
      '',
      'https://www.cleanestimator.com/company',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You're about a week into your free trial — just checking in.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If you've already got the cleaning cost estimator live on your site, awesome. If you haven't gotten around to it yet, it's a quick copy-paste — grab the code from the Embed Your Widget tab in your dashboard.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If anything's confusing or not working the way you expected, just reply to this email or check the Help &amp; Docs tab — happy to help.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Go to my dashboard →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_checkin_2',
    name: 'Trial check-in — day 14',
    subject: 'Two weeks in — a couple of things worth checking out',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "Two weeks into your trial. A couple of things worth a look if you haven't found them yet:",
      '',
      "- Branding tab -- set your logo, colors, and call-to-action so the cleaning cost estimator looks like it's actually yours",
      "- Leads tab -- every completed estimate lands here automatically, with the visitor's full contact info and price",
      '',
      'Questions about either (or anything else)? Just reply -- a real person reads these.',
      '',
      'https://www.cleanestimator.com/company?tab=help',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
    Two weeks into your trial. A couple of things worth a look if you haven't found them yet:
  </p>

  <ul style="font-size:14px;line-height:1.7;margin:0 0 20px;padding-left:20px;">
    <li><strong>Branding tab</strong> — set your logo, colors, and call-to-action so the cleaning cost estimator looks like it's actually yours</li>
    <li><strong>Leads tab</strong> — every completed estimate lands here automatically, with the visitor's full contact info and price</li>
  </ul>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Questions about either (or anything else)? Just reply — a real person reads these.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=help" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Open Help &amp; Docs →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_checkin_3',
    name: 'Trial check-in — day 21',
    subject: 'About a week left on your trial',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "Your 30-day trial wraps up in about a week -- flagging it now so it doesn't catch you off guard.",
      '',
      "If it's been useful, no action needed -- we'll send the official heads-up closer to the date. If you've hit a snag or have pricing questions, reply and I'll help sort it out before the trial ends.",
      '',
      'https://www.cleanestimator.com/company',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day trial wraps up in about a week — flagging it now so it doesn't catch you off guard.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If it's been useful, no action needed — we'll send the official heads-up closer to the date. If you've hit a snag or have pricing questions, reply and I'll help sort it out before the trial ends.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View my dashboard →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_ended',
    name: 'Trial ended / widget paused',
    subject: 'Your Clean Estimator widget has been paused',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "Your 30-day free Clean Estimator trial has ended, and your embedded estimator is now paused on your website -- visitors will see a paused notice instead of the estimator until you subscribe.",
      '',
      'Subscribe now to turn it back on:',
      'https://www.cleanestimator.com/company?tab=subscription',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day free Clean Estimator trial has ended, and your embedded estimator is now <strong>paused</strong> on your website — visitors will see a paused notice instead of the estimator until you subscribe.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Subscribe to reactivate →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'account_deletion_scheduled',
    name: 'Account deletion scheduled',
    subject: 'Your Clean Estimator account deletion is scheduled',
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'scheduledForText', example: 'November 9, 2026' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      "We've received your request to delete your Clean Estimator account. Your account, leads, and settings are scheduled to be permanently deleted on {{scheduledForText}} (30 days from today).",
      '',
      "Your embedded estimator has been paused in the meantime, but nothing has been deleted yet -- you can still log in any time before then to change your mind.",
      '',
      'Changed your mind? Log in and click "Cancel Deletion" in Settings:',
      'https://www.cleanestimator.com/company?tab=settings',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We've received your request to delete your Clean Estimator account. Your account, leads, and settings are scheduled to be permanently deleted on <strong>{{scheduledForText}}</strong> (30 days from today).
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your embedded estimator has been paused in the meantime, but nothing has been deleted yet — you can still log in any time before then to change your mind.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=settings" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Log in to cancel deletion →</a>
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'website_request_received',
    name: 'Website request received',
    subject: 'We got your request, {{business}}',
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'business', example: 'Sparkle Clean Co' },
    ],
    text: [
      'Hi {{name}},',
      '',
      'Got your request for a website for {{business}}. We\'re building your sample now and will send a link to review it in a few days.',
      '',
      'No action needed from you right now -- just reply to this email anytime if you have a question.',
      '',
      'Clean Estimator',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{name}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Got your request for a website for {{business}}. We're building your sample now and will send a link to review it in a few days.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    No action needed from you right now -- just reply to this email anytime if you have a question.
  </p>

  <p style="font-size:13px;color:#555555;line-height:1.6;margin:28px 0 0;">
    Clean Estimator
  </p>
</div>`,
  },
  {
    key: 'website_sample_ready',
    name: 'Website sample ready',
    subject: 'Your website for {{business}} is ready',
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'business', example: 'Sparkle Clean Co' },
      { name: 'sampleUrl', example: 'https://sample.cleanestimator.com/sparkle-clean-co' },
      { name: 'approvalUrl', example: 'https://www.cleanestimator.com/website-approval/abc123' },
    ],
    text: [
      'Hi {{name}},',
      '',
      'Your free cleaning website for {{business}} is ready to review.',
      '',
      'Take a look: {{sampleUrl}}',
      '',
      "Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat $249/month, cancel anytime.",
      '',
      'Review & approve: {{approvalUrl}}',
      '',
      "No obligation — if it's not for you, just ignore this and nothing happens.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{name}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your free cleaning website for <strong>{{business}}</strong> is ready to review.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{sampleUrl}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View your website →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat $249/month, cancel anytime.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{approvalUrl}}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Review &amp; approve →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    No obligation — if it's not for you, just ignore this and nothing happens.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'website_subscription_confirmed',
    name: 'Website subscription confirmed',
    subject: "You're all set, {{business}}! Your cleaning website is confirmed",
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'business', example: 'Sparkle Clean Co' },
      { name: 'trialDays', example: '60' },
      { name: 'monthlyPriceText', example: '$249' },
    ],
    text: [
      'Hi {{name}},',
      '',
      "You're all set! Your cleaning website for {{business}} is approved and your subscription is active.",
      '',
      "Your first {{trialDays}} days are completely free. After that, you'll be billed {{monthlyPriceText}}/month flat — cancel anytime.",
      '',
      "We'll be in touch shortly to finish setting up your live site and domain.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{name}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You're all set! Your cleaning website for <strong>{{business}}</strong> is approved and your subscription is active.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your first {{trialDays}} days are completely free. After that, you'll be billed {{monthlyPriceText}}/month flat — cancel anytime.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We'll be in touch shortly to finish setting up your live site and domain.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
];
