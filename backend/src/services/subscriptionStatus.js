const TRIAL_DAYS = 30;

function computeSubscriptionStatus(config) {
  const sub = config.subscription || {};
  const trialStart = sub.trialStartedAt ? new Date(sub.trialStartedAt) : null;

  if (sub.stripeSubscriptionId) {
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

  if (trialStart) {
    const daysElapsed = (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed < TRIAL_DAYS) {
      return { active: true, status: 'trialing', daysLeft: Math.ceil(TRIAL_DAYS - daysElapsed), currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
    }
    return { active: false, status: 'expired', daysLeft: 0, currentPeriodEnd: null, stripeCustomerId: sub.stripeCustomerId || null, stripeSubscriptionId: null };
  }

  return { active: true, status: 'trialing', daysLeft: TRIAL_DAYS, currentPeriodEnd: null, stripeCustomerId: null, stripeSubscriptionId: null };
}

module.exports = { computeSubscriptionStatus };
