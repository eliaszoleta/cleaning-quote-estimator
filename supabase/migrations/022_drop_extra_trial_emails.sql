-- Drops the trial-lifecycle emails down to just one touchpoint during the
-- trial itself (the day-7 "have you run your first estimate yet?" check-in,
-- key: trial_checkin_1) plus payment_failed and subscription_canceled,
-- which already exist as separate templates and are untouched by this
-- migration. With a card required up front, the day-14/21 check-ins and
-- the day-28 "ending soon" reminder no longer serve their original purpose
-- (nudging someone to manually subscribe before access cuts off -- Stripe
-- just charges the card automatically now), the legacy "trial ended /
-- widget paused" email only ever applied to the old no-card flow, and the
-- "trial converted to paid" confirmation was judged unnecessary alongside
-- the simplified set. The app code backing these five (trialScheduler.js,
-- the customer.subscription.updated webhook handler, and their
-- send*Email wrappers) has already been removed -- this just cleans up
-- the now-orphaned rows so they don't linger in the Email Marketing tab.
DELETE FROM email_templates
WHERE key IN ('trial_ending_soon', 'trial_checkin_2', 'trial_checkin_3', 'trial_converted', 'trial_ended');
