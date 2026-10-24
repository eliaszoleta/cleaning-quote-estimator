-- Replaces activation_reminder's "activation was never finished, so your
-- 30-day trial hasn't started" framing with a softer "didn't quite finish,
-- no rush" version, and drops the {{signupDateSuffix}} reference from the
-- body copy (still computed/passed on every send -- see email.js's
-- sendActivationReminderEmail -- just no longer used in this wording).
-- UPDATE, not just relying on ensureSeeded() re-running: see migration
-- 019's note -- that function never touches a key that already has a row.
UPDATE email_templates SET
  html_body = $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Looks like you started setting up a Clean Estimator account but didn't quite finish — no rush, just didn't want you to miss out on the free trial.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Once it's set up, you get unlimited, instant, accurate price estimates for every job you quote — plus a free embeddable calculator widget for your own website if you want leads coming in from there too.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Pick up right where you left off whenever you're ready, it only takes a minute.
  </p>

  <p style="margin:0 0 24px;">
    <a href="https://www.cleanestimator.com/company" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Finish setting up my account →</a>
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your 30-day trial doesn't start until you do, so nothing's running out in the meantime.
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    If you ran into an issue or just changed your mind, just reply and let me know — happy to help.
  </p>

  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  text_body = $body$Hi {{companyName}},

Looks like you started setting up a Clean Estimator account but didn't quite finish — no rush, just didn't want you to miss out on the free trial.

Once it's set up, you get unlimited, instant, accurate price estimates for every job you quote — plus a free embeddable calculator widget for your own website if you want leads coming in from there too.

Pick up right where you left off whenever you're ready, it only takes a minute.

Finish setting up my account:
https://www.cleanestimator.com/company

Your 30-day trial doesn't start until you do, so nothing's running out in the meantime.

If you ran into an issue or just changed your mind, just reply and let me know — happy to help.

Clean Estimator - cleanestimator.com$body$,
  updated_at = now()
WHERE key = 'activation_reminder';
