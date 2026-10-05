-- Adds a 'canceled' status for website_requests so an admin can cancel an
-- active client's Stripe subscription (see POST
-- /api/admin/website-requests/:id/cancel-subscription in routes/admin.js)
-- without reusing 'declined' -- that means "never became a customer," which
-- reads wrong for someone who was paying and stopped, and would muddy any
-- future reporting that wants to tell the two apart.

ALTER TABLE website_requests DROP CONSTRAINT IF EXISTS website_requests_status_check;
ALTER TABLE website_requests ADD CONSTRAINT website_requests_status_check
  CHECK (status IN ('submitted', 'sample_ready', 'approved', 'active', 'declined', 'canceled'));

ALTER TABLE website_requests ADD COLUMN IF NOT EXISTS canceled_at timestamptz;
