// The 3 plans offered on WebsiteSubscription.js (/website-for-cleaning-companies).
// Each tier is additive -- Growth includes everything in Starter, Pro
// includes everything in Growth -- so `features` lists everything that
// plan gets, not just what's new, while `addedFeatures` calls out only the
// delta for the "what's new at this tier" copy on the comparison card.
//
// Keep these prices in sync with the backend copies of this same table:
//   backend/src/routes/websiteRequest.js (PLAN_TIERS)
//   backend/src/routes/admin.js (WEBSITE_TIER_PRICES)
export const WEBSITE_PLAN_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    tagline: 'A real website with leads landing in your inbox',
    addedFeatures: [
      'A professional cleaning website, built and hosted for you',
      'A quote request form built into your site',
      'Instant email alert the moment any form is submitted',
    ],
    features: [
      'A professional cleaning website, built and hosted for you',
      'A quote request form built into your site',
      'Email alert for every single form submission -- no lead sits unseen',
      'Mobile-friendly design, a domain of your choice, fully managed hosting',
      'Priority support for ongoing changes -- text, photos, new pages',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 179,
    tagline: 'Add an AI chatbot that works the site while you work the job',
    recommended: true,
    includesLabel: 'All in Starter, plus:',
    addedFeatures: [
      'An AI chatbot that answers visitor questions and supports customers, even after hours',
      'Email alert with a summary of every chat conversation, so you know what each visitor needed',
    ],
    features: [
      'Everything in Starter',
      'An AI chatbot on your site that can support customers and answer questions 24/7',
      'Email alert summarizing every chat conversation -- what they asked, what they need',
      'Quote form submissions still land in your inbox instantly too',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 249,
    tagline: 'Every lead -- chat, text, or call -- in one app, ready to answer',
    includesLabel: 'All in Starter and Growth, plus:',
    addedFeatures: [
      'A dedicated business phone number',
      'A lead app where every chat, text, and inquiry lives -- reply or call back right from it',
      'Calls route straight to the app, ready to be answered',
    ],
    features: [
      'Everything in Growth',
      'A dedicated business phone number for your cleaning company',
      'A lead app where every chatbot conversation, text message, and inquiry lives in one place',
      'Reply to any conversation, or call a lead back, right from the app',
      'Calls route straight to the app -- ready to be answered, wherever you are',
    ],
  },
];

export function getTierById(id) {
  return WEBSITE_PLAN_TIERS.find(t => t.id === id) || null;
}
