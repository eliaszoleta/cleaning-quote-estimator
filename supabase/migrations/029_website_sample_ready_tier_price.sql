-- Replaces website_sample_ready's hardcoded "a flat $249/month" with
-- {{monthlyPriceText}} -- this template predates the 3-tier pricing system
-- (Starter/Growth/Pro) and was never updated when it shipped, so every
-- prospect was quoted the Pro price in this email regardless of which plan
-- they actually applied for. routes/admin.js now looks up the real price
-- for the request's plan_tier before sending.
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  text_body = $body$Hi {{name}},

Your free cleaning website for {{business}} is ready to review.

Take a look: {{sampleUrl}}

Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat {{monthlyPriceText}}/month, cancel anytime.

Review & approve: {{approvalUrl}}

No obligation — if it's not for you, just ignore this and nothing happens.

Clean Estimator - cleanestimator.com$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{name}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your free cleaning website for <strong>{{business}}</strong> is ready to review.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{sampleUrl}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View your website →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Like what you see? Approve it to get started — just $5 one-time to lock in your build, then your first 2 months are completely free. After that it's a flat {{monthlyPriceText}}/month, cancel anytime.
  </p>

  <p style="margin:0 0 20px;">
    <a href="{{approvalUrl}}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Review &amp; approve →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    No obligation — if it's not for you, just ignore this and nothing happens.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  variables = '[{"name":"name","example":"Jane"},{"name":"business","example":"Sparkle Clean Co"},{"name":"sampleUrl","example":"https://sample.cleanestimator.com/sparkle-clean-co"},{"name":"approvalUrl","example":"https://www.cleanestimator.com/website-approval/abc123"},{"name":"monthlyPriceText","example":"$180"}]'::jsonb,
  updated_at = now()
WHERE key = 'website_sample_ready';
