# PR · Milestone 4 — CMS

## What changed
- **Migration 0004**: `site_sections.draft` (+`draft_updated_at`); trigger auto-creates a site + the nine sections per client (with backfill); client-role RLS for editing sections, listings and integrations, and stamping `last_published_at`.
- **Draft/publish**: editing writes to `draft`. **Publish** is explicit — shows the field-level **diff** first (`diffSection`), copies draft→content, stamps the site, and fires the Cloudflare/Vercel **deploy hook** (hook failure never loses the publish).
- **Publish gates** (server-side): the **unpaid balance invoice blocks publishing** (brief §5 — enforced in the publish path, not by memory) and **journal/valuation are Flagship-only** (checked in the server action, not just hidden).
- **Media pipeline** (`/api/media/upload`): auth + RLS membership check, then **sharp** resize (long edge ≤ 2400px) + **WebP conversion on write** — never at request time. Stored via service role, `media` row registered.
- **Listings manager** (`/app/site/listings`): add/edit/delete, mark featured, status; prices entered in USD, stored as **integer cents**.
- **Integrations tab** (`/app/site/integrations`): GA4, Meta Pixel, GTM, Calendly.

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open (by design)
- Gallery upload per listing (media endpoint is ready; UI wiring is a small follow-up).
- Drag-reorder for listings/sections (position field exists; buttons/D&D later).
- The public site renderers (targets B/C) consume `content` — separate repos.
