-- New: "checkout never finished" nudge, sent ~12 hours after signup to any
-- account still sitting at status 'requires_trial_setup' (shows up in the
-- admin Companies list as "Not started") -- see
-- trialScheduler.js's checkActivationReminders. Nothing emailed these
-- accounts before; they just sat there until the owner noticed in the admin
-- panel and followed up manually.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'activation_reminder',
  $body$Activation reminder — checkout never finished$body$,
  'lifecycle',
  $body$You're one step away from your free Clean Estimator trial$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    You created a Clean Estimator account, but checkout was never finished — so your 30-day free trial hasn't actually started yet, and your calculator isn't active.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    It only takes a minute: add a card to activate your account, and you won't be charged anything for 30 days.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Finish setting up my trial →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If you ran into an issue or changed your mind, just reply and let me know — happy to help.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

You created a Clean Estimator account, but checkout was never finished -- so your 30-day free trial hasn't actually started yet, and your calculator isn't active.

It only takes a minute: add a card to activate your account, and you won't be charged anything for 30 days.

Finish setting up my trial:
https://www.cleanestimator.com/company

If you ran into an issue or changed your mind, just reply and let me know -- happy to help.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
