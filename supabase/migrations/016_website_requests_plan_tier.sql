-- Adds a plan_tier to website_requests so the "Get a Website" offer can be
-- sold at 3 different price points instead of one flat $249/mo:
--   starter ($97/mo)  -- website + quote form with email alerts
--   growth  ($179/mo) -- + AI chatbot with conversation-summary email alerts
--   pro     ($249/mo) -- + business phone number + lead app (all chatbot
--                        conversations, texts and inquiries live there,
--                        reply/call back from it, calls route there)
-- Defaults to 'pro' so every row created before this migration (all of
-- which were sold at the old flat $249/mo) keeps reporting the price they
-- actually agreed to, and so the admin's manual-add path (which doesn't
-- collect a tier) still lands on a sane value.

ALTER TABLE website_requests ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'pro';

ALTER TABLE website_requests DROP CONSTRAINT IF EXISTS website_requests_plan_tier_check;
ALTER TABLE website_requests ADD CONSTRAINT website_requests_plan_tier_check
  CHECK (plan_tier IN ('starter', 'growth', 'pro'));
