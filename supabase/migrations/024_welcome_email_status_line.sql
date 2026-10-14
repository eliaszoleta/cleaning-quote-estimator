-- Replaces company_welcome's hardcoded "Your account is live and your
-- 30-day free trial has started" opening line with a {{statusLine}}
-- variable, so the same template stays accurate for both of the two
-- situations that trigger it from subscription.js's checkout.session.completed
-- webhook:
--   - A genuinely new (or no-card-trial-with-remaining-days) Stripe trial
--     -- statusLine defaults to the original "trial has started" wording.
--   - A reactivation (an expired or canceled account completing checkout
--     again), which charges the card immediately with no trial attached --
--     previously this still said "your free trial has started", which was
--     simply false for someone who was just charged $25.
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  name = $body$Company welcome / embed code$body$,
  subject = $body$Your Clean Estimator account is ready — start pricing jobs instantly$body$,
  html_body = $body$
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

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Welcome to Clean Estimator!

{{statusLine}} Clean Estimator is your internal pricing tool: log in, switch to Calculator Mode, and run instant, accurate price estimates for your own quoting — no price range shown to a customer, nothing to manage as a lead, just a fast number you can trust.

Open my calculator →
https://www.cleanestimator.com/company

Got a result you want a teammate to see? Click "Email to Coworker" on the results screen and it goes straight to their inbox.

Want to capture leads from your website too? The same plan already includes a white-labeled, embeddable calculator widget for your site — here's your embed code:

{{embedCode}}

Paste that anywhere in your website's HTML — a Custom HTML / Embed block in Wix, Squarespace, or WordPress, or directly in your site's code if you manage it yourself. The estimator will appear right there and resize itself to fit.

If you do use it: you'll get an email the instant someone completes an estimate on your site, and every visitor gets their own follow-up email branded with your logo and phone number, not ours.

Want to set your business name, colors, and which services you offer first? All in your dashboard:
https://www.cleanestimator.com/company?tab=branding

New to Clean Estimator? Log in to your dashboard and open the Help & Docs tab — it walks through how pricing is calculated (with the real data behind it) and answers to the most common questions:
https://www.cleanestimator.com/company?tab=help

You can always get this same embed code later from the Branding tab.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"embedCode","example":"<iframe ...>...</iframe>"},{"name":"embedCodeHtml","example":"(HTML-escaped embed code, for the &lt;pre&gt; block)"},{"name":"statusLine","example":"Your account is live and your 30-day free trial has started."}]'::jsonb,
  updated_at = now()
WHERE key = 'company_welcome';
