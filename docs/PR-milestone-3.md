# PR · Milestone 3 — Intake & onboarding

## What changed
- **Migration 0003**: trigger auto-creates the four intake blocks per client (+ backfill); client role may SUBMIT their own blocks (`pending/submitted` only — validation states are unreachable from the client, enforced in RLS `with check`); `client-media` storage bucket (public read, authenticated write) + client media insert policy.
- **Client onboarding** (`/app/onboarding`): the four blocks (details, brand, content, photos) as forms driven by a single field config (`lib/intake.ts`). File fields upload straight to Supabase Storage from the browser and store public URLs in the payload. Validated blocks lock; rejected blocks show "Resubmit".
- **Studio review** (`/studio/clients/[id]/intake`): payload viewer per block with Validate / Reject actions (staff-only via RLS).
- Server actions validate payloads with **zod** before writing.

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open (by design)
- The client dashboard "progress card" links here; a fancier progress meter can ride along with M4.
- Uploads via the browser go direct to Storage (no resize) — the **resize + WebP on write** pipeline is the M4 media endpoint, used by the CMS.
