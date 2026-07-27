# PR · Milestone 2 — Studio admin

## What changed
- **Client list** (`/studio`): tier, status, host target, domain, last publish (from `sites.last_published_at`) and **MRR** (sum of paid `care_monthly` invoices in the current calendar month, per client). Empty-state points at the seed.
- **Pipeline board** (`/studio/pipeline`): six status columns (`lead → churned`), client cards linking to the editor.
- **Client CRUD**: `/studio/clients/new` and `/studio/clients/[id]` with a shared form. Server actions validate with **zod** before touching the database (brief §8) and rely on RLS for authorization — a `partner` gets a clean error, not a bypass.
- **Seed** (`pnpm seed`): idempotent, loads the two existing sites — **Andrea Larsen** (flagship · Vercel) and **LuxeShots** (signature · Cloudflare) — each with a site row and one paid care invoice so the MRR column shows real numbers. Domains are marked placeholders to edit in the UI.

## Verified
- `pnpm typecheck` clean · `pnpm build` compiles.
- Writes gated by RLS from M1 (owner/developer only) — covered by `pnpm test:rls`.

## Still open (by design)
- Revenue view (owner-only P&L) — arrives with real invoice flows in M6.
- Commission rules editor + statements — M7.
- Survey responses — M9.
- Client detail beyond the edit form (deploy state, intake) — M3/M4.
