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
    subject: 'Your Clean Estimator account is ready — start pricing jobs instantly',
    variables: [
      { name: 'embedCode', example: '<iframe ...>...</iframe>' },
      { name: 'embedCodeHtml', example: '(HTML-escaped embed code, for the &lt;pre&gt; block)' },
      { name: 'statusLine', example: 'Your account is live and your 30-day free trial has started.' },
    ],
    text: [
      'Welcome to Clean Estimator!',
      '',
      "{{statusLine}} Clean Estimator is your internal pricing tool: log in, switch to Calculator Mode, and run instant, accurate price estimates for your own quoting — no price range shown to a customer, nothing to manage as a lead, just a fast number you can trust.",
      '',
      'Open my calculator →',
      'https://www.cleanestimator.com/company',
      '',
      'Got a result you want a teammate to see? Click "Email to Coworker" on the results screen and it goes straight to their inbox.',
      '',
      "Want to capture leads from your website too? The same plan already includes a white-labeled, embeddable calculator widget for your site — here's your embed code:",
      '',
      '{{embedCode}}',
      '',
      "Paste that anywhere in your website's HTML — a Custom HTML / Embed block in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.",
      '',
      "If you do use it: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.",
      '',
      'Want to set your business name, colors, and which services you offer first? All in your dashboard:',
      'https://www.cleanestimator.com/company?tab=branding',
      '',
      'New to Clean Estimator? Log in to your dashboard and open the Help & Docs tab — it walks through how pricing is calculated (with the real data behind it) and answers to the most common questions:',
      'https://www.cleanestimator.com/company?tab=help',
      '',
      'You can always get this same embed code later from the Branding tab.',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Welcome to Clean Estimator!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    {{statusLine}} Clean Estimator is your internal pricing tool: log in, switch to <strong>Calculator Mode</strong>, and run instant, accurate price estimates for your own quoting — no price range shown to a customer, nothing to manage as a lead, just a fast number you can trust.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Open my calculator →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
    Got a result you want a teammate to see? Click <strong>“Email to Coworker”</strong> on the results screen and it goes straight to their inbox.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Want to capture leads from your website too? The same plan already includes a white-labeled, embeddable calculator widget for your site — here's your embed code:
  </p>

  <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-family:'Menlo','Monaco',monospace;font-size:11.5px;line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-all;margin:0 0 20px;">{{embedCodeHtml}}</pre>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Paste that anywhere in your website's HTML — a <strong>Custom HTML / Embed block</strong> in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If you do use it: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 8px;">
    Want to set your business name, colors, and which services you offer first? All in your <a href="https://www.cleanestimator.com/company?tab=branding" style="color:#2563eb;font-weight:700;">dashboard</a>.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:20px 0 20px;">
    New to Clean Estimator? Open the <a href="https://www.cleanestimator.com/company?tab=help" style="color:#2563eb;font-weight:700;">Help &amp; Docs</a> tab in your dashboard — it walks through how pricing is calculated (with the real data behind it) and answers to the most common questions.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    You can always get this same embed code later from the <strong>Branding</strong> tab.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'subscription_reactivated',
    // Sent instead of company_welcome for a cancel-then-resubscribe cycle
    // (see sendSubscriptionReactivatedEmail in email.js for the full
    // reasoning) -- a returning customer already knows what Calculator Mode
    // is and already has their embed code, so this is deliberately short:
    // confirm the account's back, confirm nothing was lost, link back in.
    // Subject written as a flat status statement from the start (not a
    // "Welcome back!" hook) -- the same lesson already learned twice this
    // cycle on activation_reminder and legacy_calculator_mode_reminder,
    // both of which landed in Gmail's Promotions tab on a more
    // announcement-style first subject and had to be rewritten.
    name: 'Subscription reactivated (welcome back)',
    subject: 'Your Clean Estimator subscription is active again',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "Your Clean Estimator subscription is active again, and everything's picked up right where you left it -- your branding, services, and pricing settings are all still exactly as you had them.",
      '',
      'Open my calculator →',
      'https://www.cleanestimator.com/company',
      '',
      "If you had the embeddable calculator widget on your own website, nothing there needs to change -- it's the same embed code as before, still on the Branding tab whenever you need it:",
      'https://www.cleanestimator.com/company?tab=branding',
      '',
      "It's $25/month, same plan as before. Reply to this email if anything looks off or you run into any trouble getting back in.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your Clean Estimator subscription is active again, and everything's picked up right where you left it — your branding, services, and pricing settings are all still exactly as you had them.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Open my calculator →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If you had the embeddable calculator widget on your own website, nothing there needs to change — it's the same embed code as before, still on the <a href="https://www.cleanestimator.com/company?tab=branding" style="color:#2563eb;font-weight:700;">Branding tab</a> whenever you need it.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    It's $25/month, same plan as before. Reply to this email if anything looks off or you run into any trouble getting back in.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'activation_reminder',
    name: 'Activation reminder — activation never finished',
    // Rewritten after both prior versions ("You're one step away..." and
    // "Still want to try...?") landed in Gmail's Promotions tab -- same
    // lesson already proven on website_request_received (see email.js's
    // top-of-file comment): a question-y, "come back" subject line reads
    // as a marketing nudge to Gmail's classifier. Dropped the hook-style
    // subject for a flat status statement, and added a real, specific
    // reference (the actual signup date) instead of generic "no rush"
    // filler -- the same two levers (personalized reference + toned-down
    // copy) that moved that other template to Primary.
    //
    // The CTA itself briefly went to a plain inline link on the theory
    // that the button was also part of the problem, but every other
    // lifecycle email in this file (company_welcome, trial_checkin_1,
    // payment_failed, subscription_canceled, etc.) uses this exact same
    // solid-color button with no Promotions-tab issue -- the subject line
    // was the actual cause, so the button is back, matching that
    // established style for consistency.
    subject: 'Your Clean Estimator account setup is incomplete',
    // signupDateSuffix carries its own leading " on <date>" (or '' with no
    // date) rather than a bare date, so a blank merge field -- e.g. a
    // manual send from the admin dashboard's Compose/Send tab with nothing
    // typed into it -- still reads as a complete sentence instead of
    // "...was created on , but checkout..." (what actually shipped once,
    // from exactly that path, before this was caught).
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'signupDateSuffix', example: ' on October 14, 2026' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      "You started setting up a Clean Estimator account{{signupDateSuffix}}, but activation was never finished, so your 30-day trial hasn't started and your calculator isn't active.",
      '',
      'Finish account setup:',
      'https://www.cleanestimator.com/company',
      '',
      "Once it's done, you'll have unlimited price estimates for every job you quote, plus an embeddable calculator widget for your own website if you want it.",
      '',
      "Reply to this email if anything got in the way -- happy to help.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You started setting up a Clean Estimator account{{signupDateSuffix}}, but activation was never finished, so your 30-day trial hasn't started and your calculator isn't active.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Finish account setup →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Once it's done, you'll have unlimited price estimates for every job you quote, plus an embeddable calculator widget for your own website if you want it.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Reply to this email if anything got in the way — happy to help.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'trial_checkin_1',
    name: 'Trial check-in — day 7',
    subject: 'Have you run your first estimate yet?',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "You're about a week into your free trial — just checking in.",
      '',
      "The fastest way to see the value: open Calculator Mode and run a real quote for a job you're pricing this week. It takes about 10 seconds and gives you an accurate, consistent number instead of going off gut feel.",
      '',
      'https://www.cleanestimator.com/company',
      '',
      "Want leads coming from your website too? That's included on the same plan -- grab the embed code from the bottom of the Branding tab whenever you're ready.",
      '',
      "If anything's confusing or not working the way you expected, just reply to this email or check the Help & Docs tab — happy to help.",
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
    The fastest way to see the value: open <strong>Calculator Mode</strong> and run a real quote for a job you're pricing this week. It takes about 10 seconds and gives you an accurate, consistent number instead of going off gut feel.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Run an estimate →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Want leads coming from your website too? That's included on the same plan — grab the embed code from the bottom of the Branding tab whenever you're ready.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If anything's confusing or not working the way you expected, just reply to this email or check the Help &amp; Docs tab — happy to help.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'legacy_trial_expired_winback',
    name: 'Legacy trial expired (win-back)',
    subject: "Your Clean Estimator trial ended — everything's still here",
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'serviceListText', example: 'house cleaning, apartment, commercial, carpet, upholstery, air duct, dryer vent, tile & grout, mold remediation, water damage, Airbnb turnover, and post-construction' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      "Your Clean Estimator trial ended, but your account isn't gone -- everything's exactly where you left it.",
      '',
      "A quick reminder of what you get back: instant, on-screen pricing across every service we offer -- {{serviceListText}} -- so you're never quoting a job from memory or a spreadsheet.",
      '',
      "We've also just finished re-verifying every pricing table against current published cost data, state by state, so the numbers you'd be quoting are as accurate as they've ever been.",
      '',
      'Restart my subscription:',
      'https://www.cleanestimator.com/company',
      '',
      "It's $25/month, same plan as before -- no setup, no new onboarding. Answer a few quick questions about a job and get a real number in seconds, not minutes of guesswork.",
      '',
      "If something didn't work for you the first time, just reply and tell us -- we'd genuinely like to know.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your Clean Estimator trial ended, but your account isn't gone — everything's exactly where you left it.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    A quick reminder of what you get back: instant, on-screen pricing across every service we offer — {{serviceListText}} — so you're never quoting a job from memory or a spreadsheet.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We've also just finished re-verifying every pricing table against current published cost data, state by state, so the numbers you'd be quoting are as accurate as they've ever been.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Restart my subscription →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    It's $25/month, same plan as before — no setup, no new onboarding. Answer a few quick questions about a job and get a real number in seconds, not minutes of guesswork.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If something didn't work for you the first time, just reply and tell us — we'd genuinely like to know.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'legacy_calculator_mode_reminder',
    // Not sent automatically by any code path -- unlike every other entry
    // in this file, this one exists purely to be seeded into the DB and
    // picked for a manual campaign (Email Marketing tab's Compose/Send or
    // Campaigns panel) targeting the "Legacy no-card signups only" audience
    // filter (see emailMarketing.js's resolveAudience). That segment is
    // accounts from before Stripe Checkout became mandatory at signup, back
    // when the product was pitched mainly as the embeddable website widget
    // -- Calculator Mode (unlimited on-screen pricing with no website or
    // embed required) didn't exist yet at signup time for this group, so
    // the whole point of this email is reintroducing it, not just winning
    // back a lapsed trial (that's legacy_trial_expired_winback, below).
    // Original subject ("Clean Estimator now works without a website too")
    // landed in Gmail's Promotions tab -- same documented lesson as
    // activation_reminder (see its comment above): a feature-announcement-
    // style subject reads as a marketing nudge to Gmail's classifier.
    // Replaced with the same two proven levers that moved that other
    // template to Primary -- a flat, factual status statement instead of a
    // hook, and a real personalized reference (the actual signup date,
    // already computed server-side as signupDateSuffix) right in the
    // subject itself rather than buried in the body.
    name: 'Legacy no-card signups — Calculator Mode reminder',
    subject: 'Your Clean Estimator account{{signupDateSuffix}}',
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'signupDateSuffix', example: ' on October 14, 2026' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      "You signed up for Clean Estimator{{signupDateSuffix}}. Back then, it was pitched mainly as an embeddable price calculator for your website -- so if you never got a website set up (or it's been a while), there's a good chance the account's just been sitting there since.",
      '',
      "Since you signed up, we've added a second way to use it: Calculator Mode. No website, no embed code, nothing to set up -- just log in, answer a few quick questions about a job, and get an accurate, consistent price on screen in seconds. It's built for pricing jobs yourself, not managing leads.",
      '',
      'Try Calculator Mode:',
      'https://www.cleanestimator.com/company',
      '',
      "The embeddable widget is still part of the same plan too, whenever you do have a website -- same account, same login, nothing to redo.",
      '',
      "It's $25/month flat, with a 30-day free trial if you haven't already used yours. Reply to this email if you have any questions -- happy to help.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You signed up for Clean Estimator{{signupDateSuffix}}. Back then, it was pitched mainly as an embeddable price calculator for your website — so if you never got a website set up (or it's been a while), there's a good chance the account's just been sitting there since.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Since you signed up, we've added a second way to use it: <strong>Calculator Mode</strong>. No website, no embed code, nothing to set up — just log in, answer a few quick questions about a job, and get an accurate, consistent price on screen in seconds. It's built for pricing jobs yourself, not managing leads.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Try Calculator Mode →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    The embeddable widget is still part of the same plan too, whenever you do have a website — same account, same login, nothing to redo.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    It's $25/month flat, with a 30-day free trial if you haven't already used yours. Reply to this email if you have any questions — happy to help.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'legacy_winback_fresh_trial',
    // Same "not auto-triggered, seeded for a manual campaign" shape as
    // legacy_calculator_mode_reminder above, targeting the same "Legacy no-
    // card signups only" audience filter -- but this one is specifically for
    // accounts whose old no-card trial already ran its full 30 days, never
    // got a card added, and (per the request that created this template)
    // never received the Calculator Mode pitch either. The subject is
    // written flat and factual from the start (no "come back!" hook) --
    // already learned the hard way on legacy_calculator_mode_reminder's
    // first subject, which landed in Promotions and had to be rewritten.
    //
    // IMPORTANT: this template's "new 30-day trial" claim is only true if
    // the admin has clicked "Grant fresh 30-day trial to this segment" on
    // the Compose/Send panel first (POST /companies/grant-legacy-winback-
    // trial, see emailMarketing.js) -- that sets
    // config.subscription.winbackTrialEligible, which is what makes
    // subscription.js's checkout route actually grant 30 days instead of
    // charging immediately (a legacy trial that's already fully elapsed
    // otherwise gets zero trial days on resubscribe, same as any other
    // resubscribe). Sending this email without granting that first makes
    // the subject line a promise the product won't keep.
    name: 'Legacy no-card signups — fresh 30-day trial win-back',
    subject: 'Your Clean Estimator account is eligible for a new 30-day trial',
    variables: [
      { name: 'companyName', example: 'Sparkle Clean Co' },
      { name: 'signupDateSuffix', example: ' on October 14, 2026' },
    ],
    text: [
      'Hi {{companyName}},',
      '',
      "You signed up for Clean Estimator{{signupDateSuffix}}, and your free trial ran out before you got much chance to use it.",
      '',
      "Since you signed up, we've also added Calculator Mode -- an on-screen, unlimited pricing tool for your own quoting. No website or embed code required; log in, answer a few quick questions about a job, and get an accurate, consistent price in seconds. (If you do have a website, the embeddable calculator widget is still part of the same plan.)",
      '',
      "And we've reset your trial too: your account now qualifies for a brand-new 30-day free trial, the same as a first-time signup.",
      '',
      'Start my new trial:',
      'https://www.cleanestimator.com/company',
      '',
      "It's $25/month after the trial. Reply to this email if you have any questions -- happy to help.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You signed up for Clean Estimator{{signupDateSuffix}}, and your free trial ran out before you got much chance to use it.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Since you signed up, we've also added <strong>Calculator Mode</strong> — an on-screen, unlimited pricing tool for your own quoting. No website or embed code required; log in, answer a few quick questions about a job, and get an accurate, consistent price in seconds. (If you do have a website, the embeddable calculator widget is still part of the same plan.)
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    And we've reset your trial too: your account now qualifies for a brand-new 30-day free trial, the same as a first-time signup.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Start my new trial →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    It's $25/month after the trial. Reply to this email if you have any questions — happy to help.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'payment_failed',
    name: 'Payment failed',
    subject: "Your Clean Estimator payment didn't go through",
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "We tried to charge your card for Clean Estimator and it didn't go through. Your account is paused until this is resolved -- no estimates can be run until your payment method is updated.",
      '',
      'Update your payment method here:',
      'https://www.cleanestimator.com/company?tab=settings&amp;section=subscription',
      '',
      "If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We tried to charge your card for Clean Estimator and it didn't go through. Your account is <strong>paused</strong> until this is resolved — no estimates can be run until your payment method is updated.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=settings&amp;section=subscription" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Update payment method →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'subscription_canceled',
    name: 'Subscription canceled (win-back)',
    subject: 'Sorry to see you go — your Clean Estimator subscription has ended',
    variables: [{ name: 'companyName', example: 'Sparkle Clean Co' }],
    text: [
      'Hi {{companyName}},',
      '',
      "Your Clean Estimator subscription has been canceled, and your account is no longer active -- no more estimates can be run until you resubscribe.",
      '',
      "If something didn't work for you, we'd genuinely like to know -- just reply and tell us what happened.",
      '',
      'Changed your mind? You can restart anytime, same price, same plan:',
      'https://www.cleanestimator.com/company?tab=settings&amp;section=subscription',
      '',
      'Thanks for giving it a try.',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your Clean Estimator subscription has been canceled, and your account is no longer active — no more estimates can be run until you resubscribe.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If something didn't work for you, we'd genuinely like to know — just reply and tell us what happened.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=settings&amp;section=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Restart my subscription →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Thanks for giving it a try.
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
  {
    key: 'booking_confirmation',
    name: 'Booking confirmation (book-a-call)',
    subject: "You're booked! Your call is confirmed for {{dateTimeText}}",
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'dateTimeText', example: 'Tuesday, October 21, 2026 at 2:00 PM CDT' },
      { name: 'meetLink', example: 'https://meet.google.com/abc-defg-hij' },
      { name: 'cancelUrl', example: 'https://www.cleanestimator.com/cancel-booking?token=abc123' },
    ],
    text: [
      'Hi {{name}},',
      '',
      "You're all set! Your call is confirmed for:",
      '{{dateTimeText}}',
      '',
      "How to join (it's simple, no downloads or accounts needed):",
      '1. A few minutes before your call, click this link: {{meetLink}}',
      '2. Click "Join now" -- it opens right in your web browser',
      '3. When your browser asks, click "Allow" so it can turn on your camera and microphone',
      '',
      "That's it! You'll be connected and ready to talk.",
      '',
      'Need to cancel or reschedule? {{cancelUrl}}',
      '',
      'See you then!',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">You're all set, {{name}}!</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 6px;">Your call is confirmed for:</p>
  <p style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 22px;">{{dateTimeText}}</p>

  <p style="margin:0 0 22px;">
    <a href="{{meetLink}}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:8px;">Join the video call →</a>
  </p>

  <p style="font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 10px;">How to join (it's simple)</p>
  <ol style="font-size:14px;line-height:1.8;margin:0 0 22px;padding-left:20px;">
    <li>A few minutes before your call, click the green button above (or this link: <a href="{{meetLink}}" style="color:#2563eb;">{{meetLink}}</a>)</li>
    <li>Click <strong>"Join now"</strong> -- it opens right in your web browser, no account or download needed</li>
    <li>When your browser asks, click <strong>"Allow"</strong> so it can turn on your camera and microphone</li>
  </ol>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">That's it — you'll be connected and ready to talk.</p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Need to cancel or reschedule? <a href="{{cancelUrl}}" style="color:#2563eb;">Click here</a>.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'booking_reminder_24h',
    name: 'Booking reminder — 24 hours before',
    subject: 'Reminder: your call is tomorrow — {{dateTimeText}}',
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'dateTimeText', example: 'Tuesday, October 21, 2026 at 2:00 PM CDT' },
      { name: 'meetLink', example: 'https://meet.google.com/abc-defg-hij' },
      { name: 'cancelUrl', example: 'https://www.cleanestimator.com/cancel-booking?token=abc123' },
    ],
    text: [
      'Hi {{name}},',
      '',
      'Just a reminder -- your call is coming up:',
      '{{dateTimeText}}',
      '',
      'When it starts, click this link to join: {{meetLink}}',
      '(It opens right in your browser -- no download or account needed. Just click "Join now" and allow your camera/microphone.)',
      '',
      'Need to cancel or reschedule? {{cancelUrl}}',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Reminder, {{name}} — your call is tomorrow</p>

  <p style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 22px;">{{dateTimeText}}</p>

  <p style="margin:0 0 22px;">
    <a href="{{meetLink}}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:8px;">Join the video call →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;color:#555555;margin:0 0 20px;">
    When it's time, just click the button above, then click <strong>"Join now"</strong> -- no download or account needed, your browser handles everything.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Need to cancel or reschedule? <a href="{{cancelUrl}}" style="color:#2563eb;">Click here</a>.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'booking_reminder_3h',
    name: 'Booking reminder — 3 hours before',
    subject: 'Reminder: your call is in a few hours — {{dateTimeText}}',
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'dateTimeText', example: 'Tuesday, October 21, 2026 at 2:00 PM CDT' },
      { name: 'meetLink', example: 'https://meet.google.com/abc-defg-hij' },
      { name: 'cancelUrl', example: 'https://www.cleanestimator.com/cancel-booking?token=abc123' },
    ],
    text: [
      'Hi {{name}},',
      '',
      'Your call is in a few hours:',
      '{{dateTimeText}}',
      '',
      'When it starts, click this link to join: {{meetLink}}',
      '(It opens right in your browser -- no download or account needed. Just click "Join now" and allow your camera/microphone.)',
      '',
      'Need to cancel or reschedule? {{cancelUrl}}',
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Reminder, {{name}} — your call is in a few hours</p>

  <p style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 22px;">{{dateTimeText}}</p>

  <p style="margin:0 0 22px;">
    <a href="{{meetLink}}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:8px;">Join the video call →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;color:#555555;margin:0 0 20px;">
    When it's time, just click the button above, then click <strong>"Join now"</strong> -- no download or account needed, your browser handles everything.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Need to cancel or reschedule? <a href="{{cancelUrl}}" style="color:#2563eb;">Click here</a>.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
  {
    key: 'booking_reminder_30m',
    name: 'Booking reminder — 30 minutes before',
    subject: 'Starting soon: your call is in 30 minutes',
    variables: [
      { name: 'name', example: 'Jane' },
      { name: 'dateTimeText', example: 'Tuesday, October 21, 2026 at 2:00 PM CDT' },
      { name: 'meetLink', example: 'https://meet.google.com/abc-defg-hij' },
      { name: 'cancelUrl', example: 'https://www.cleanestimator.com/cancel-booking?token=abc123' },
    ],
    text: [
      'Hi {{name}},',
      '',
      'Your call starts in about 30 minutes:',
      '{{dateTimeText}}',
      '',
      'Click this link to join: {{meetLink}}',
      '(It opens right in your browser -- no download or account needed. Just click "Join now" and allow your camera/microphone.)',
      '',
      "Running late or need to cancel? {{cancelUrl}}",
      '',
      'Clean Estimator - cleanestimator.com',
    ].join('\n'),
    html: `
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:16px;font-weight:700;margin:0 0 16px;">Starting soon, {{name}} — your call is in 30 minutes</p>

  <p style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 22px;">{{dateTimeText}}</p>

  <p style="margin:0 0 22px;">
    <a href="{{meetLink}}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:8px;">Join the video call →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;color:#555555;margin:0 0 20px;">
    Just click the button above, then click <strong>"Join now"</strong> -- no download or account needed, your browser handles everything.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Running late or need to cancel? <a href="{{cancelUrl}}" style="color:#2563eb;">Click here</a>.
  </p>
  ${FOOTER_HTML}
</div>`,
  },
];
