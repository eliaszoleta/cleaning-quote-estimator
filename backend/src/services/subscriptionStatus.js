const TRIAL_DAYS = 30; // Legacy: for existing accounts that started a free trial without CC

function computeSubscriptionStatus(config) {
  const sub = config.subscription || {};
  const trialStart = sub.trialStartedAt ? new Date(sub.trialStartedAt) : null;

  if (sub.stripeSubscriptionId) {
    if (sub.status === 'trialing') {
      const daysLeft = sub.currentPeriodEnd
        ? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
      return {
        active: true,
        status: 'trialing',
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        daysLeft,
        currentPeriodEnd: sub.currentPeriodEnd || null,
        stripeCustomerId: sub.stripeCustomerId || null,
        stripeSubscriptionId: sub.stripeSubscriptionId,
      };
    }
    if (sub.status === 'active') {
      return {
        active: true,
        status: sub.cancelAtPeriodEnd ? 'active_canceling' : 'active',
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        daysLeft: null,
        currentPeriodEnd: sub.currentPeriodEnd || null,
        stripeCustomerId: sub.stripeCustomerId || null,
        stripeSubscriptionId: sub.stripeSubscriptionId,
      };
    }
    if (sub.status === 'past_due' || sub.status === 'unpaid') {
      return { active: false, status: 'past_due', daysLeft: null, currentPeriodEnd: sub.currentPeriodEnd || null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: sub.stripeSubscriptionId };
    }
    if (sub.status === 'canceled') {
      return { active: false, status: 'canceled', daysLeft: null, currentPeriodEnd: sub.currentPeriodEnd || null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: sub.stripeSubscriptionId };
    }
    return { active: false, status: sub.status || 'inactive', daysLeft: null, currentPeriodEnd: sub.currentPeriodEnd || null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: sub.stripeSubscriptionId };
  }

  // trialStartedAt is the only trial mechanism now (30-day, no card) --
  // company.js sets this on first login and no longer ever writes
  // trialType:'stripe'. Checked ahead of that legacy flag on purpose: an
  // account created under the old CC-required flow (trialType:'stripe',
  // no trialStartedAt) that later got backfilled a trialStartedAt (e.g.
  // via a one-off SQL fix) must not get stuck re-reading the stale
  // trialType flag forever -- trialStartedAt being present always wins.
  if (trialStart) {
    const daysElapsed = (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed < TRIAL_DAYS) {
      return { active: true, status: 'trialing', daysLeft: Math.ceil(TRIAL_DAYS - daysElapsed), currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
    }
    return { active: false, status: 'expired', daysLeft: 0, currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
  }

  // Old CC-required trial flag, from before this account ever got a
  // trialStartedAt -- shouldn't happen for any account touched by the
  // backfill (company.js's GET handler, or the one-off SQL fix), but
  // covers anything that somehow still only has this and nothing else.
  if (sub.trialType === 'stripe') {
    return { active: false, status: 'requires_trial_setup', daysLeft: 7, currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
  }

  // New account: no Stripe subscription and no trial started yet
  return { active: false, status: 'requires_trial_setup', daysLeft: 7, currentPeriodEnd: null, stripeCustomerId: null, stripeSubscriptionId: null };
}

module.exports = { computeSubscriptionStatus };
