-- Rewrites the Stripe-trial-era reminder emails (plus adds a new
-- trial_converted template) to match the internal-first product pivot
-- (see CompanyLanding.js: "unlimited, instant, on-screen estimates" is
-- now the primary pitch, with the embeddable widget as an included but
-- optional bonus -- these four templates were still written entirely
-- from the old "get the widget on your site" framing).
--
-- UPDATE, not just relying on ensureSeeded() re-running: that function
-- upserts with ignoreDuplicates: true specifically so it never clobbers
-- an admin''s saved edit in the Email Marketing tab -- which also means
-- it will never pick up this content change on its own for a key that
-- already exists in the table. trial_converted is new, so ensureSeeded()
-- would insert it on next boot regardless, but it''s included here too
-- (ON CONFLICT DO NOTHING) so it''s live immediately rather than waiting
-- on a deploy restart.

UPDATE email_templates SET
  name = $body$Trial ending soon$body$,
  subject = $body$Your Clean Estimator trial ends in {{daysLeftText}} — here's what happens next$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your free Clean Estimator trial ends in <strong>{{daysLeftText}}</strong>. After that, the card on file will be charged $25 for your first month, and your account just keeps running exactly as it has — unlimited internal estimates whenever you need them, plus your embedded widget if you're using one.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    No action needed if you're planning to continue. If you'd rather not, you can cancel anytime before then from your billing page.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View my billing →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Questions about pricing or anything else? Just reply — a real person reads these.
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

Your free Clean Estimator trial ends in {{daysLeftText}}. After that, the card on file will be charged $25 for your first month, and your account just keeps running exactly as it has -- unlimited internal estimates whenever you need them, plus your embedded widget if you're using one.

No action needed if you're planning to continue. If you'd rather not, you can cancel anytime before then from your billing page:
https://www.cleanestimator.com/company?tab=subscription

Questions about pricing or anything else? Just reply -- a real person reads these.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"companyName","example":"Sparkle Clean Co"},{"name":"daysLeftText","example":"2 days"}]'::jsonb,
  updated_at = now()
WHERE key = 'trial_ending_soon';

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

UPDATE email_templates SET
  name = $body$Trial check-in — day 14$body$,
  subject = $body$Two weeks in — make sure your pricing is dialed in$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Two weeks into your trial. One thing worth checking if you haven't yet: your <strong>markup and minimum charges</strong> in the Services &amp; Pricing tab. Clean Estimator starts you off with researched, location-adjusted base pricing — but your markup is what makes sure every number actually matches your real costs and margin.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=services" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Check my pricing →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If you're also running the embedded widget on your site, every completed estimate shows up automatically in your Leads tab, with the visitor's full contact info.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Questions about either (or anything else)? Just reply — a real person reads these.
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

Two weeks into your trial. One thing worth checking if you haven't yet: your markup and minimum charges in the Services & Pricing tab. Clean Estimator starts you off with researched, location-adjusted base pricing -- but your markup is what makes sure every number actually matches your real costs and margin.

https://www.cleanestimator.com/company?tab=services

If you're also running the embedded widget on your site, every completed estimate shows up automatically in your Leads tab, with the visitor's full contact info.

Questions about either (or anything else)? Just reply -- a real person reads these.

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb,
  updated_at = now()
WHERE key = 'trial_checkin_2';

UPDATE email_templates SET
  name = $body$Trial check-in — day 21$body$,
  subject = $body$About a week left on your trial$body$,
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day trial wraps up in about a week. After that, the card on file will be charged $25/month automatically and your account just keeps running — no action needed if you're planning to stick around.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If it's been useful, great — you'll get one more heads-up closer to the date. If you've hit a snag or have pricing questions, reply and I'll help sort it out before the trial ends. And if it's not a fit, you can cancel anytime from your billing page, no hard feelings.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">View my billing →</a>
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

Your 30-day trial wraps up in about a week. After that, the card on file will be charged $25/month automatically and your account just keeps running -- no action needed if you're planning to stick around.

If it's been useful, great -- you'll get one more heads-up closer to the date. If you've hit a snag or have pricing questions, reply and I'll help sort it out before the trial ends. And if it's not a fit, you can cancel anytime from your billing page, no hard feelings.

https://www.cleanestimator.com/company?tab=subscription

Clean Estimator - cleanestimator.com$body$,
  variables = '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb,
  updated_at = now()
WHERE key = 'trial_checkin_3';

INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'trial_converted',
  $body$Trial converted to paid$body$,
  'lifecycle',
  $body$You're all set — your trial just converted to a paid plan$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day free trial just ended, and your card was charged $25 for your first month. Nothing else changes — Clean Estimator keeps running exactly as it has, with unlimited internal estimates whenever you need them.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Manage billing →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Thanks for sticking with it — if there's anything we can do better, just reply.
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

Your 30-day free trial just ended, and your card was charged $25 for your first month. Nothing else changes -- Clean Estimator keeps running exactly as it has, with unlimited internal estimates whenever you need them.

Manage your billing or cancel anytime here:
https://www.cleanestimator.com/company?tab=subscription

Thanks for sticking with it -- if there's anything we can do better, just reply.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

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
