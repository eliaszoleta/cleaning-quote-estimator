-- Rewrites the day-7 trial check-in email to match the internal-first
-- product pivot (see CompanyLanding.js: "unlimited, instant, on-screen
-- estimates" is now the primary pitch, with the embeddable widget as an
-- included but optional bonus -- this template was still written entirely
-- from the old "get the widget on your site" framing), and adds the new
-- payment_failed template.
--
-- UPDATE, not just relying on ensureSeeded() re-running: that function
-- upserts with ignoreDuplicates: true specifically so it never clobbers
-- an admin''s saved edit in the Email Marketing tab -- which also means
-- it will never pick up this content change on its own for a key that
-- already exists in the table.
--
-- The other three trial reminder emails this migration originally also
-- rewrote here (trial_ending_soon, trial_checkin_2, trial_checkin_3) plus
-- the trial_converted template it added were since dropped entirely --
-- see migration 022, which removes those rows rather than updating them.

UPDATE email_templates SET
  name = $body$Trial check-in — day 7$body$,
  subject = $body$Have you run your first estimate yet?$body$,
  html_body = $body$
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

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

You're about a week into your free trial — just checking in.

The fastest way to see the value: open Calculator Mode and run a real quote for a job you're pricing this week. It takes about 10 seconds and gives you an accurate, consistent number instead of going off gut feel.

https://www.cleanestimator.com/company

Want leads coming from your website too? That's included on the same plan -- grab the embed code from the bottom of the Branding tab whenever you're ready.

If anything's confusing or not working the way you expected, just reply to this email or check the Help & Docs tab — happy to help.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb,
  updated_at = now()
WHERE key = 'trial_checkin_1';

-- New: payment-failed notification. invoice.payment_failed used to only
-- write status=past_due to the DB with zero customer communication -- a
-- declined card silently locked the dashboard (computeSubscriptionStatus
-- treats past_due as inactive immediately) and the owner only found out
-- by logging back in.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'payment_failed',
  $body$Payment failed$body$,
  'lifecycle',
  $body$Your Clean Estimator payment didn't go through$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    We tried to charge your card for Clean Estimator and it didn't go through. Your account is <strong>paused</strong> until this is resolved — no estimates can be run until your payment method is updated.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Update payment method →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

We tried to charge your card for Clean Estimator and it didn't go through. Your account is paused until this is resolved -- no estimates can be run until your payment method is updated.

Update your payment method here:
https://www.cleanestimator.com/company?tab=subscription

If this was a one-time card issue, updating it should get you back up and running right away. Questions? Just reply.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
