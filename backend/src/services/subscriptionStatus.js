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

  // New CC-required trial — trialType:'stripe' means the account was created after the
  // CC-required trial was introduced. Must complete Stripe checkout first.
  if (sub.trialType === 'stripe') {
    return { active: false, status: 'requires_trial_setup', daysLeft: 7, currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
  }

  // Legacy: free trial started without CC (existing accounts — keep 30-day window)
  if (trialStart) {
    const daysElapsed = (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed < TRIAL_DAYS) {
      return { active: true, status: 'trialing', daysLeft: Math.ceil(TRIAL_DAYS - daysElapsed), currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
    }
    return { active: false, status: 'expired', daysLeft: 0, currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
  }

  // New account: no Stripe subscription and no trial started yet
  return { active: false, status: 'requires_trial_setup', daysLeft: 7, currentPeriodEnd: null, stripeCustomerId: null, stripeSubscriptionId: null };
}

module.exports = { computeSubscriptionStatus };
