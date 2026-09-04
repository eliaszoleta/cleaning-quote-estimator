-- Self-serve "buy city placement" checkout: lets a prospect pay via Stripe
-- and get provisioned as an active partner automatically, instead of an
-- admin creating the row by hand in /admin/partners. These columns are
-- written by the backend service role only (backend/src/routes/partnerCheckout.js),
-- never by the browser, so no new RLS policy is required for them.

ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ties a partner row back to the checkout session that created it, and lets
-- provisioning check "did this session already create a partner?" before
-- inserting again -- guards against the webhook and the success-page
-- verify-checkout call both firing for the same payment.
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE;
