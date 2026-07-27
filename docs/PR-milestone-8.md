# PR · Milestone 8 — Eject

## What changed
- **`pnpm eject --client=<slug>`** (`scripts/eject.ts`): reads the client's content from Postgres with the service role and writes a **standalone Next.js repo** under `ejects/<slug>/`:
  - `content/*.json` — client, sections (live content only), listings, theme committed as local data
  - `public/media/*` — every storage-hosted image **downloaded** and URLs rewritten to local paths
  - `next.config.mjs` with `output: 'export'` — builds to static `/out`, hostable anywhere
  - minimal renderer (`app/page.jsx`), README, `.gitignore`
  - zipped to `ejects/<slug>.zip`
- No database, no platform dependency — the "client owns their code" contract is now true. `ejects/` is gitignored.

## Verified
- `pnpm typecheck` clean. (Runtime run requires the Supabase project + real content.)

## Still open (by design)
- The standalone renderer is intentionally plain — a handoff artifact, not the flagship template. Swapping in the real template repo per tier is a later refinement.
