// Single source of truth for the Clean Estimator ($25/mo) subscription's
// free-trial length. Two separate numbers, deliberately not one constant:
//
// - NEW_TRIAL_DAYS: what every FRESH Stripe trial grant uses today -- a
//   brand-new signup (subscription.js's POST /checkout, case 3) and the
//   admin's "grant a fresh trial" legacy win-back flow (same route, the
//   winbackTrialEligible branch). Changed 2026-10-27 from 30 to 14.
// - LEGACY_TRIAL_DAYS: the old no-card trial length. Stays at its
//   original 30 on purpose -- those trials already started under that
//   30-day promise back when the product had no mandatory Stripe Checkout
//   at signup, and this never retroactively shortens a trial someone's
//   already partway through. Nothing grants a NEW legacy trial anymore
//   (see subscriptionStatus.js's own comment on trialStartedAt), so this
//   only ever counts down trials that already exist.
const NEW_TRIAL_DAYS = 14;
const LEGACY_TRIAL_DAYS = 30;

module.exports = { NEW_TRIAL_DAYS, LEGACY_TRIAL_DAYS };
