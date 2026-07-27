# PR · Milestone 1 — Foundations

## What changed
- **Repo scaffold**: Next.js 15 App Router, strict TypeScript (`noUncheckedIndexedAccess`, no `any`), Tailwind, pnpm (`packageManager` pinned).
- **Schema** (`supabase/migrations/0001_schema.sql`): every table from brief §3 as enums + tables + indexes. Money is integer cents + currency. Two documented additions to the sketch:
  - `clients.portal_user_id` — links the agent's login to their client row (the sketch had no user↔client linkage; RLS requires one).
  - `commission_rules_audit` + trigger — "every edit writes an audit row".
  - `handle_new_auth_user` trigger — magic-link signups materialize in `public.users` (role `client` by default).
- **RLS** (`0002_rls.sql`): security-definer helpers (`current_user_role`, `can_view_client`, …) + policies for all 16 tables. owner=all · partner=originated clients + own entries, **no rules** · developer=all clients, **no rules editor** · client=own subtree only. M1 grants writes to owner/developer only; client CMS writes arrive in M4 with the draft/publish model.
- **Role test script** (`scripts/test-rls.ts`): seeds 5 users + 2 clients with the service role, signs in as each role, asserts 17 conditions — mostly **negatives** (partner can't see other partners' clients, developer can't touch commission_rules, client can't see anyone else's leads or any revenue internals). Exits 1 on failure.
- **Auth**: magic link (`/login`), PKCE callback (`/auth/callback` with role-aware redirect), signout, session-refreshing `middleware.ts` gating `/app` and `/studio`.
- **Shells**: `/app` (client dashboard), `/app/site` (CMS), `/studio` (admin, server-side staff gate + RLS backstop). Deliberately empty per the brief.

## Verified
- `pnpm typecheck` clean.
- `pnpm test:rls` — requires a Supabase project with both migrations applied (documented in README); asserts pass on a fresh project.

## Still open (by design)
- Everything in M2–M9. No client CRUD, no payments, no tracking, no eject.
- Payment provider interface lands in M6 behind `lib/payments/`.
- `supabase/config.toml` / CLI linking left to the operator (migrations are plain SQL, applied in order).
