# Invoicing & Payments — Stripe Connect Plan

Status: **Planning only — nothing built yet.** Written 2026-10-28 to save context before building. Pick this back up by re-reading this file, not by re-deriving the conversation.

## The goal

Let a cleaning company take an estimate they ran in Clean Estimator, turn it into a real invoice, send it to their client, and get paid online — without Clean Estimator ever touching or holding the client's money.

## The core decision (confirmed with the user)

**Stripe Connect.** Each cleaning company connects their own Stripe account (one-time onboarding). When their client pays an invoice, the money goes straight to *that company's* bank account — never to Clean Estimator's Stripe balance. Clean Estimator is purely the software that generates the invoice and hands off the payment button; Stripe does the actual money movement and compliance (KYC, bank verification, 1099s, etc.).

This also solves a second concern the user raised: the invoice email does **not** come from `cleanestimator.com`. Stripe sends the invoice email itself, on behalf of the connected account, displaying that company's own business name/logo (set once in their Stripe branding settings during onboarding). So the client sees "ABC Cleaning Co." sent it, not Clean Estimator.

Rejected alternative: payments landing in Clean Estimator's own Stripe account and being paid out to companies manually/periodically. Explicitly ruled out — too much liability and bookkeeping, and defeats the user's stated goal of staying out of the money-handling business entirely.

## Open decisions — still need the user's answer before/while building

These were asked but never confirmed due to a tool issue dropping the user's answers mid-session. Re-ask before starting the corresponding piece of work:

1. **Payment methods for v1** — card only, or card + ACH (bank transfer) from day one?
   - Recommendation: card only for v1 (simpler, fewer edge cases — ACH takes days to settle and can fail after the fact). Adding ACH later is low-effort since it's the same Stripe Invoice object, just another `payment_method_types` entry.
2. **Platform fee** — does Clean Estimator take a small % cut of each invoice paid (via Stripe's `application_fee_amount`), or $0 (invoicing is just a feature of the existing $25/mo plan)?
   - Recommendation: $0 for v1. Keeps the pitch simple ("we never touch your client's money, no cut taken") and avoids extra disclosure/fee-logic complexity while this is new. Can be added later without restructuring anything — it's one parameter on invoice creation.
3. **Onboarding UX** — Stripe-hosted redirect flow (simplest, bounces the user to a Stripe page and back) vs. Stripe's embedded Connect components (onboarding form renders inside our own dashboard UI, more polished, more build effort).
   - Recommendation: hosted redirect for v1. Standard, fast to build, easy to upgrade to embedded later without changing the underlying account model.

## What already exists in this codebase (relevant to this build)

- Stripe is already integrated for the company's own $25/mo subscription billing — see `backend/src/routes/subscription.js` (Checkout Sessions, Billing Portal, a webhook handler already listening for `stripe-signature` events) and `backend/src/services/subscriptionStatus.js`.
- Company data is stored as a JSON blob in a `config` column (Supabase), not dedicated columns — e.g. `config.subscription.stripeCustomerId`. New Connect fields should follow the same pattern: something like `config.connectAccount = { stripeAccountId, onboardingComplete, chargesEnabled, payoutsEnabled }`.
- Dashboard tabs live in `frontend/src/components/dashboard/tabs/` (e.g. `SubscriptionTab.js`, `ServicesTab.js`) — a new `InvoicesTab.js` (or similar) fits this pattern, plus probably a small "Connect your Stripe account" prompt/banner, likely surfaced from `SettingsTab.js` or `SubscriptionTab.js` since that's where billing-adjacent company config already lives.
- The estimate result screen is `frontend/src/components/calculator/ResultsScreen.js` — this is where a "Convert to Invoice" button would be added (only inside the authenticated dashboard/internal-estimator context, never on the public free calculator — the public calculator has no client Stripe account to attach the invoice to).
- Backend routes are flat files per feature in `backend/src/routes/` (`subscription.js`, `leads.js`, `booking.js`, etc.) — a new `invoices.js` (and maybe a separate `connectAccount.js` or folded into it) fits this pattern.

## High-level architecture

### 1. Connect account creation & onboarding
- New backend endpoint: `POST /api/company/connect/onboard` — creates a Stripe Connect **Express** account (recommended account type: lets Stripe host the onboarding UI/dashboard, least work for us, standard choice for this kind of platform) tied to the company, stores `stripeAccountId` on `config.connectAccount`.
- Returns a Stripe-hosted **Account Link** URL; frontend redirects the user there. Stripe collects business info, bank account, identity verification.
- Stripe redirects back to a `return_url` in our dashboard (e.g. `/company?tab=settings&connect=success`) and a `refresh_url` if the link expires mid-flow.
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
- Whether Express accounts (recommended above) support all needed branding customization for the invoice emails, or whether that requires Standard accounts (more setup burden on the company, full Stripe dashboard access). Express should be sufficient for logo/business name on hosted invoices — confirm against current Stripe docs when building, since this is exactly the kind of detail that drifts over time.
- Tax handling on invoices (sales tax / GST / VAT per the existing per-country work in this codebase) — out of scope for this plan, flag separately if the user wants it.
