# PR · Milestone 6 — Payments

## What changed
- **Provider interface** (`lib/payments/types.ts`) exactly per brief §5 — the entity decision is a config change (`PAYMENT_PROVIDER`), never a rewrite. Provider-specific types live only in `lib/payments/stripe/`.
- **Stripe adapter (Route A)**: raw REST (form-encoded fetch, no SDK churn); one-time Checkout with `invoice_id` metadata, monthly care via subscription Checkout, Billing Portal, and **manual `Stripe-Signature` verification** (HMAC-SHA256, timing-safe compare).
- **Webhook** (`/api/payments/webhook`): `checkout.session.completed` → mark invoice paid (**idempotent** — only transitions once) → **`writeCommissionEntries`**; `invoice.paid` (care) → insert paid `care_monthly` invoice + reset failure count; `invoice.payment_failed` → increment counter and **flag at 2 consecutive failures — suspension stays a human decision** (never automatic).
- **Commission engine** (`lib/commissions.ts`): every paid invoice evaluates `commission_rules` **active at the paid date** (historic entries never change); beneficiaries resolved by role (partner → `originated_by`; developer/owner → all users of that role); integer-cents math with `floor`.
- **Client billing** (`/app/billing`): invoice list, **Pay now** → provider checkout, **billing portal** button once a Stripe customer exists.
- **Studio invoices** (`/studio/clients/[id]/invoices`): create deposit/balance/renewal/change-order (owner-only via RLS), amounts entered in USD stored as cents, billing-flagged badge.
- **Publish gate from M4 now has teeth**: unpaid `balance` blocks publishing; paying via webhook unblocks automatically.

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open (by design)
- Route B adapter (Paddle/Lemon Squeezy) when the entity decision lands.
- Resend notices on invoice creation/failure (env documented).
- Commission rules editor UI + statements → M7 (engine already live).
