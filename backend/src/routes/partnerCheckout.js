const express = require('express');
const router = express.Router();
const { getCityTier, stateNameFromCode } = require('../data/partnerCityTiers');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const MAX_CITIES = 10;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Re-derives { city, stateCode, stateName, tier, price } for every requested
// city server-side -- never trusts a client-supplied price, so a tampered
// request can't buy a major-city placement at the minor-city rate.
function resolveCities(rawCities) {
  if (!Array.isArray(rawCities) || rawCities.length === 0) {
    return { error: 'Select at least one city' };
  }
  if (rawCities.length > MAX_CITIES) {
    return { error: `You can select up to ${MAX_CITIES} cities per order` };
  }
  const seen = new Set();
  const resolved = [];
  for (const raw of rawCities) {
    const city = (raw?.city || '').trim();
    const stateCode = (raw?.stateCode || '').trim().toUpperCase();
    if (!city || !stateCode) return { error: 'Each city needs a city and state' };
    const dedupeKey = `${stateCode}|${city.toLowerCase()}`;
    if (seen.has(dedupeKey)) return { error: `${city}, ${stateCode} was selected twice` };
    seen.add(dedupeKey);
    const tier = getCityTier(city, stateCode);
    if (!tier) return { error: `We don't have pricing on file for ${city}, ${stateCode} yet -- please apply manually instead` };
    resolved.push({ city, stateCode, stateName: stateNameFromCode(stateCode), tier: tier.tier, price: tier.price });
  }
  return { cities: resolved };
}

// POST /api/partner-checkout/checkout -- public, no auth (buyer isn't a
// logged-in company user yet). Creates one Stripe subscription checkout
// session with one line item per city, priced from our own city-tier data.
router.post('/checkout', async (req, res) => {
  const { business_name, address, phone, email, website, logo_url, cities } = req.body || {};

  if (!business_name || !business_name.trim()) return res.status(400).json({ success: false, error: 'Business name is required' });
  if (!email || !email.trim()) return res.status(400).json({ success: false, error: 'Email is required' });
  if (!phone || !phone.trim()) return res.status(400).json({ success: false, error: 'Phone is required' });

  const { cities: resolvedCities, error: cityError } = resolveCities(cities);
  if (cityError) return res.status(400).json({ success: false, error: cityError });

  try {
    const stripe = getStripe();

    const lineItems = resolvedCities.map(c => ({
      price_data: {
        currency: 'usd',
        product_data: { name: `Clean Estimator City Placement — ${c.city}, ${c.stateCode}` },
        unit_amount: c.price * 100,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: email.trim(),
      success_url: `${FRONTEND_URL}/buy-city-placement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/buy-city-placement`,
      metadata: {
        type: 'partner_placement',
        business_name: business_name.trim(),
        address: (address || '').trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: (website || '').trim(),
        logo_url: (logo_url || '').trim(),
        cities: JSON.stringify(resolvedCities.map(c => [c.city, c.stateCode])),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Partner checkout error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to create checkout session' });
  }
});

// Creates the partners + partner_locations rows for a paid session, unless
// they already exist (checked via stripe_checkout_session_id, which has a
// UNIQUE constraint) -- shared by verify-checkout (the primary activation
// path, called right after Stripe redirects the buyer back) and the webhook
// (a backup in case the browser tab closes before that call completes).
async function provisionPartner(session) {
  const meta = session.metadata || {};
  if (meta.type !== 'partner_placement') return null;

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('partners')
    .select('*')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();
  if (existing) return existing;

  let cities;
  try {
    cities = JSON.parse(meta.cities || '[]');
  } catch {
    cities = [];
  }
  if (!Array.isArray(cities) || cities.length === 0) {
    console.error(`provisionPartner: no cities in metadata for session ${session.id}`);
    return null;
  }

  const sub = session.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  const { data: partner, error: insertErr } = await supabase
    .from('partners')
    .insert({
      business_name: meta.business_name,
      address: meta.address || null,
      phone: meta.phone || null,
      email: meta.email || null,
      website: meta.website || null,
      logo_url: meta.logo_url || null,
      active: true,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscriptionId,
      stripe_checkout_session_id: session.id,
    })
    .select()
    .single();

  if (insertErr) {
    // Unique violation on stripe_checkout_session_id means another
    // concurrent call (webhook + verify-checkout racing) already inserted it.
    if (insertErr.code === '23505') {
      const { data: raceWinner } = await supabase
        .from('partners')
        .select('*')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle();
      return raceWinner || null;
    }
    console.error(`provisionPartner: partner insert failed for session ${session.id}:`, insertErr.message);
    throw insertErr;
  }

  const locationRows = cities.map(([city, stateCode]) => ({
    partner_id: partner.id,
    city,
    state: stateNameFromCode(stateCode),
  }));
  const { error: locErr } = await supabase.from('partner_locations').insert(locationRows);
  if (locErr) console.error(`provisionPartner: location insert failed for partner ${partner.id}:`, locErr.message);

  console.log(`Provisioned partner ${partner.id} (${partner.business_name}) for session ${session.id}, ${locationRows.length} location(s)`);
  return partner;
}

// POST /api/partner-checkout/verify-checkout -- primary activation path,
// called by the success page right after Stripe redirects the buyer back.
router.post('/verify-checkout', async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });

    if (session.metadata?.type !== 'partner_placement') {
      return res.status(400).json({ success: false, error: 'Not a partner placement session' });
    }
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.json({ success: true, data: { paid: false } });
    }

    const partner = await provisionPartner(session);
    if (!partner) return res.status(500).json({ success: false, error: 'Payment succeeded but activation failed -- contact support' });

    res.json({
      success: true,
      data: {
        paid: true,
        businessName: partner.business_name,
        email: partner.email,
      },
    });
  } catch (err) {
    console.error('Partner verify-checkout error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to verify checkout session' });
  }
});

// ─── Webhook handler (backup activation path) ─────────────────────────────────

async function handlePartnerCheckoutEvent(event) {
  if (event.type !== 'checkout.session.completed') return;
  const session = event.data.object;
  if (session.mode !== 'subscription') return;
  if (session.metadata?.type !== 'partner_placement') return;

  const stripe = getStripe();
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['subscription'] });
  await provisionPartner(fullSession);
}

async function webhookHandler(req, res) {
  const secret = process.env.STRIPE_PARTNER_WEBHOOK_SECRET;
  let event;
  try {
    if (secret) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Partner webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    await handlePartnerCheckoutEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error(`Partner webhook handler error for ${event.type}:`, err.message);
    res.status(500).send(`Webhook handler failed: ${err.message}`);
  }
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
