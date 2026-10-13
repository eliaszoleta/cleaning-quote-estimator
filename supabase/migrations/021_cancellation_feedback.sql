-- Captures the "before you go" feedback SubscriptionTab.js's Manage Billing
-- button now asks for before handing off to Stripe's hosted Billing Portal.
-- That portal is a black box this app can't inject custom UI into (no
-- stripe.billingPortal.configurations.create() call exists anywhere in this
-- repo, and Stripe doesn't expose a webhook that distinguishes "they opened
-- the portal to update a card" from "they opened it to cancel"), so this is
-- asked up front, before the redirect, rather than captured reactively --
-- the closest this codebase can get to retention-flow feedback without
-- owning the cancellation UI itself. Submitting is optional; skipping
-- proceeds straight to the portal either way.
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  TEXT REFERENCES cleaning_company_configs(company_id) ON DELETE SET NULL,
  reason      TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cancellation_feedback_company_id_idx ON cancellation_feedback(company_id);

-- No RLS policies beyond enabling it -- same as every other backend-only
-- table in this app: only ever touched via the service-role key, never the
-- anon key.
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- New: win-back email sent from customer.subscription.deleted,
-- inviting feedback and a restart link, since no cancellation email
-- existed at all before this.
INSERT INTO email_templates (key, name, category, subject, html_body, text_body, variables)
VALUES (
  'subscription_canceled',
  $body$Subscription canceled (win-back)$body$,
  'lifecycle',
  $body$Sorry to see you go — your Clean Estimator subscription has ended$body$,
  $body$
<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <p style="font-size:14px;margin:0 0 20px;">Hi {{companyName}},</p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your Clean Estimator subscription has been canceled, and your account is no longer active — no more estimates can be run until you resubscribe.
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
    If something didn't work for you, we'd genuinely like to know — just reply and tell us what happened.
  </p>

  <p style="margin:0 0 20px;">
    <a href="https://www.cleanestimator.com/company?tab=subscription" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">Restart my subscription →</a>
  </p>

  <p style="font-size:13px;color:#666666;line-height:1.6;margin:0 0 20px;">
    Thanks for giving it a try.
  </p>
  
  <p style="font-size:12px;color:#999999;line-height:1.6;margin:28px 0 0;border-top:1px solid #e0e0e0;padding-top:16px;">
    Clean Estimator · <a href="https://www.cleanestimator.com" style="color:#999999;">cleanestimator.com</a>
  </p>
</div>$body$,
  $body$Hi {{companyName}},

Your Clean Estimator subscription has been canceled, and your account is no longer active -- no more estimates can be run until you resubscribe.

If something didn't work for you, we'd genuinely like to know -- just reply and tell us what happened.

Changed your mind? You can restart anytime, same price, same plan:
https://www.cleanestimator.com/company?tab=subscription

Thanks for giving it a try.

Clean Estimator - cleanestimator.com$body$,
  '[{"name":"companyName","example":"Sparkle Clean Co"}]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
