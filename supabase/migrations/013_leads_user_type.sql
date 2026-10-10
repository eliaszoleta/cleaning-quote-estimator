-- Lets a visitor tell us whether they're a homeowner or a cleaning
-- business/cleaner at the lead-capture step, so the admin and company lead
-- dashboards can filter one from the other instead of everyone piling into
-- one undifferentiated list.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE leads ADD CONSTRAINT leads_user_type_check
  CHECK (user_type IS NULL OR user_type IN ('homeowner', 'business'));
