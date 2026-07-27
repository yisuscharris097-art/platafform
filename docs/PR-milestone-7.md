# PR · Milestone 7 — Commissions

## What changed
- **Rules editor** (`/studio/commissions`, owner-only — server redirect + RLS): create rule versions (revenue kind × beneficiary role × percent, stored as **bps**) with `effective_from`/`effective_to`. "Close today" stamps `effective_to` instead of mutating — history is immutable. The **audit trail** (from the M1 trigger) renders below the table.
- **Statements** (`/studio/commissions/statements`): per-beneficiary cards of **owed vs paid**, full entry table. RLS does the scoping — the owner sees everyone, a partner/developer opening the same page sees only their own entries. Owner can **mark entries paid** (pending→paid only).
- Engine already landed in M6 (`lib/commissions.ts`); this milestone gives it its UI. Entries evaluate the rules **active at the invoice's paid date**, so editing rules never rewrites history.

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open (by design)
- Revenue view (build revenue vs recurring vs hard costs vs margin, owner-only) — can ride with real Stripe data once live.
- Per-client scope on rules (`scope` column exists, global for now).
