# Invoicing & Payments — Stripe Connect Plan

Status: **Planning only — nothing built yet. All v1 decisions below are confirmed, ready to start building.** Written 2026-10-28 to save context before building. Pick this back up by re-reading this file, not by re-deriving the conversation.

## The goal

Let a cleaning company take an estimate they ran in Clean Estimator, turn it into a real invoice, send it to their client, and get paid online — without Clean Estimator ever touching or holding the client's money.

## The core decision (confirmed with the user)

**Stripe Connect.** Each cleaning company connects their own Stripe account (one-time onboarding). When their client pays an invoice, the money goes straight to *that company's* bank account — never to Clean Estimator's Stripe balance. Clean Estimator is purely the software that generates the invoice and hands off the payment button; Stripe does the actual money movement and compliance (KYC, bank verification, 1099s, etc.).

This also solves a second concern the user raised: the invoice email does **not** come from `cleanestimator.com`. Stripe sends the invoice email itself, on behalf of the connected account, displaying that company's own business name/logo (set once in their Stripe branding settings during onboarding). So the client sees "ABC Cleaning Co." sent it, not Clean Estimator.

Rejected alternative: payments landing in Clean Estimator's own Stripe account and being paid out to companies manually/periodically. Explicitly ruled out — too much liability and bookkeeping, and defeats the user's stated goal of staying out of the money-handling business entirely.

## Decisions for v1 (confirmed with the user, 2026-10-28)

1. **Payment methods: card only.** No ACH in v1 — simpler, instant, fewer edge cases (ACH takes days to settle and can fail after the fact). Adding ACH later is low-effort since it's the same Stripe Invoice object, just another `payment_method_types` entry — not a redesign.
2. **Platform fee: $0.** Clean Estimator takes no cut of invoice payments. Invoicing is just a feature of the existing $25/mo plan. Keeps the pitch simple ("we never touch your client's money, no cut taken") and avoids extra disclosure/fee-logic complexity. Can be turned on later without restructuring anything — it's one parameter (`application_fee_amount`) on invoice creation.
3. **Onboarding UX: Stripe-hosted redirect flow, using a Standard Connect account** (corrected 2026-10-28 — see §1 below for why Standard, not Express). Company clicks "Connect Stripe" in the dashboard and is sent to a Stripe-hosted page: if they already have a Stripe account, they just log in and it's linked immediately; if not, they fill out business/bank info once. Either way they're redirected back to the dashboard when done. Fastest to build; can move to Stripe's embedded onboarding components later without changing the underlying account type.

## What already exists in this codebase (relevant to this build)

- Stripe is already integrated for the company's own $25/mo subscription billing — see `backend/src/routes/subscription.js` (Checkout Sessions, Billing Portal, a webhook handler already listening for `stripe-signature` events) and `backend/src/services/subscriptionStatus.js`.
- Company data is stored as a JSON blob in a `config` column (Supabase), not dedicated columns — e.g. `config.subscription.stripeCustomerId`. New Connect fields should follow the same pattern: something like `config.connectAccount = { stripeAccountId, onboardingComplete, chargesEnabled, payoutsEnabled }`.
- Dashboard tabs live in `frontend/src/components/dashboard/tabs/` (e.g. `SubscriptionTab.js`, `ServicesTab.js`) — a new `InvoicesTab.js` (or similar) fits this pattern, plus probably a small "Connect your Stripe account" prompt/banner, likely surfaced from `SettingsTab.js` or `SubscriptionTab.js` since that's where billing-adjacent company config already lives.
- The estimate result screen is `frontend/src/components/calculator/ResultsScreen.js` — this is where a "Convert to Invoice" button would be added (only inside the authenticated dashboard/internal-estimator context, never on the public free calculator — the public calculator has no client Stripe account to attach the invoice to).
- Backend routes are flat files per feature in `backend/src/routes/` (`subscription.js`, `leads.js`, `booking.js`, etc.) — a new `invoices.js` (and maybe a separate `connectAccount.js` or folded into it) fits this pattern.

## High-level architecture

### 1. Connect account creation & onboarding
- Account type: **Standard** (not Express — corrected 2026-10-28). Standard accounts use Stripe's OAuth-style "Connect with Stripe" flow: if the company already has a Stripe account, they just **log in** with their existing credentials and that real, already-verified account gets linked — no re-entering business/bank info. If they've never used Stripe before, the same button lets them sign up fresh (one-time business + bank info, which is a legal KYC requirement of any payment processor, not something we're adding). Express was the wrong call in the original draft of this plan — it's built for platforms onboarding businesses from scratch and doesn't support "log into your existing account" the way Standard's OAuth flow does. Standard also keeps us further out of the connected account's day-to-day (support, dashboard access) — a better fit for the "stay out of the money-handling business" goal.
- New backend endpoint: `POST /api/company/connect/onboard` — starts the Standard OAuth flow (`https://connect.stripe.com/oauth/authorize?...` or the current equivalent — verify against live Stripe docs when building, this surface shifts) tied to the company, stores `stripeAccountId` on `config.connectAccount` once authorized.
- Stripe redirects back to a `redirect_uri` in our dashboard (e.g. `/company?tab=settings&connect=success`) with an authorization code we exchange server-side for the connected account ID.
- Webhook: listen for `account.updated` events to track `charges_enabled` / `payouts_enabled` / `details_submitted` on that connected account, update `config.connectAccount` accordingly. Until `charges_enabled` is true, the "Convert to Invoice" button stays disabled with a "Finish connecting Stripe" prompt.

### 2. Estimate → Invoice flow
- On `ResultsScreen.js` (dashboard/internal-estimator context only): a **"Create Invoice"** button next to the existing result.
- Clicking it opens an edit step — *not* a direct conversion — because the calculator shows a price **range**, and an invoice needs one firm number. This edit step should let the company:
  - See the range and pick/type the final price (pre-filled with, e.g., the midpoint, but editable).
  - Optionally edit/add line-item descriptions (service type, any adjustments already shown as line items in the estimate can carry over as invoice line items).
  - Enter/confirm the client's name, email, and the amount due / due date.
- Submitting creates a real Stripe Invoice **on behalf of the connected account** (`stripe.invoices.create({...}, { stripeAccount: company.connectAccount.stripeAccountId })` — using Connect's "direct charge" pattern so the invoice and its payout genuinely belong to the connected account, not a destination-charge pass-through).
- Stripe auto-emails the hosted invoice (with its own PDF) to the client, using that connected account's branding.
- Webhook: listen for `invoice.paid` (and `invoice.payment_failed`) scoped to connected accounts, to update invoice status in our own records so the dashboard can show "Paid" / "Sent" / "Overdue" without polling Stripe.

### 3. Data model additions (Supabase)
- `config.connectAccount` on the companies row: `{ stripeAccountId, chargesEnabled, payoutsEnabled, detailsSubmitted, onboardedAt }`.
- A new `invoices` table (not just JSON-in-config, since this needs to be queried/listed): `id, company_id, stripe_invoice_id, client_name, client_email, amount, currency, status, service_type, created_at, paid_at, estimate_snapshot (jsonb, the original range/inputs for reference)`.

### 4. New dashboard UI
- `InvoicesTab.js` — list of sent invoices with status (Draft/Sent/Paid/Overdue), link to the hosted Stripe invoice page.
- A Connect status banner (in Settings or Subscription tab) — "Connect your Stripe account to send invoices" with a button, or "✓ Connected — payouts go to [bank ending in ••1234]" once done.

## Build order (once open decisions above are answered)

1. Backend: Connect account creation endpoint + Account Link + `account.updated` webhook handling + `config.connectAccount` storage.
2. Dashboard: Settings/Subscription tab banner + "Connect Stripe" button + return-from-onboarding handling.
3. Backend: `invoices` table migration + invoice-creation endpoint (Stripe Invoice API, scoped to the connected account) + `invoice.paid`/`invoice.payment_failed` webhook handling.
4. Frontend: "Create Invoice" button + price/line-item edit step on `ResultsScreen.js` (dashboard context only).
5. Frontend: `InvoicesTab.js` list view.
6. End-to-end test in Stripe test mode: onboard a test connected account, create a test invoice, pay it with a Stripe test card, confirm webhook updates status and the test payout shows on the connected account (not the platform account).

## Things to double-check before shipping (not yet researched)

- Stripe Connect platform agreement / ToS acceptance requirements on the platform account (Stripe requires platforms to accept Connect's terms; may need a one-time dashboard step on the Clean Estimator Stripe account itself, separate from any code).
- Confirm current Stripe docs for the exact Standard OAuth flow (`connect.stripe.com/oauth/authorize` or whatever it's called by the time this is built) and branding-customization options for hosted invoice emails — this surface shifts over time, verify when building rather than trusting this doc.
- Tax handling on invoices (sales tax / GST / VAT per the existing per-country work in this codebase) — out of scope for this plan, flag separately if the user wants it.

## 7. "How Invoicing Works" page (dashboard-facing, plain language)

The user's own framing (2026-10-28): companies using this feature are trusting it with real money, and most are not technical — they need to understand the mechanics in plain terms before they'll trust it enough to connect their bank account. This page should live inside the dashboard (not the public marketing site) near wherever the "Connect Stripe" button lives, and/or be linked from that button itself ("How does this work?").

Draft copy below, ready to drop into a page once the feature ships — written in the same plain, non-technical style used to explain this to the user during planning:

> ### How getting paid through Clean Estimator works
>
> **Short version: your clients' payments go straight to your own bank account. We never touch your money — Stripe does the actual payment handling, the same way it does for thousands of other businesses.**
>
> **1. You connect your own Stripe account (one-time, ~2 minutes).**
> Click "Connect Stripe" in your dashboard. If you already have a Stripe account, you just log in — nothing to fill out. If you don't have one yet, Stripe will ask for your business and bank info once, the same as setting up any payment processor like Square or PayPal for the first time.
>
> **2. You turn an estimate into an invoice.**
> Run an estimate like normal, then hit "Create Invoice." Since an estimate shows a price range, you'll confirm the final number before it becomes a real invoice.
>
> **3. We hand it to Stripe — Stripe sends it to your client.**
> The invoice email comes from Stripe, showing your business name and logo (not "Clean Estimator"). Your client sees a professional invoice with a "Pay Now" button — no accounts or signups needed on their end.
>
> **4. Your client pays, the money goes straight to you.**
> When they pay, the money is deposited directly into your connected bank account. It never passes through Clean Estimator — we don't hold it, see it, or take a cut.
>
> **5. Your dashboard updates automatically.**
> Once Stripe confirms the payment, your invoice list updates to "Paid" — no need to check manually.
>
> **Is this safe?** Stripe is used by millions of businesses worldwide (including large companies like Amazon and Shopify) and is fully PCI-compliant, meaning card details are never seen by us or stored on our servers. Clean Estimator only ever sees that an invoice was sent and whether it's been paid — never your client's card number or your bank details.

Add to the build order above: once the core feature (steps 1–6) is working end-to-end, write this page as a real React page component (follow `MethodologyPage.js` as the structural/tone precedent — same plain-language, FAQ-friendly style already used for `/how-we-calculate-prices`), link it from the Connect-Stripe banner/button, and decide placement (dedicated route vs. an expandable section inline in Settings).
