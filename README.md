# Relay Studios Platform

Operating system for a studio that sells websites to real estate agents.
Two faces: the **client** (dashboard, CMS, invoices) and the **studio**
(pipeline, deploys, revenue, commissions). Built per `docs/` brief, one
milestone per pull request.

## Stack
Next.js 15 (App Router, strict TS) · Tailwind · Supabase (Postgres, Auth
magic-link, Storage, RLS) · Stripe (M6) · Resend (M6) · Vercel (this app).

## Local setup

```bash
# 1. Install deps (pnpm via corepack; `npx pnpm` also works without sudo)
corepack enable   # may need sudo once
pnpm install

# 2. Create a FRESH Supabase project, then apply migrations in order:
#    supabase/migrations/0001_schema.sql
#    supabase/migrations/0002_rls.sql
#    (SQL editor paste, or `supabase db push` with the CLI linked)

# 3. Environment
cp .env.example .env.local   # fill Supabase URL + anon + service role keys

# 4. Prove the security model BEFORE building UI (brief §4)
pnpm test:rls

# 5. Run
pnpm dev
```

First user: sign in via magic link, then promote yourself in SQL:
`update users set role = 'owner' where email = 'you@studio.com';`

## Hosting architecture (brief §2)
- **A — this platform** → Vercel project (dashboard, API, CMS, admin).
- **B — Flagship client sites** → separate multi-tenant Vercel project (ISR).
- **C — Starter/Signature sites** → Cloudflare Pages, static export; forms and
  tracking POST back to this platform's API.
- Set the Vercel **on-demand usage budget hard cap on day one** (image
  optimization is the runaway meter).
- `scripts/eject.ts` (M8) makes the "client owns their code" contract true.

## Deploy (this repo → new Vercel project)
Import the repo in Vercel → framework Next.js → set the three Supabase env
vars + `NEXT_PUBLIC_SITE_URL` → deploy. Add the production URL to Supabase
Auth → URL configuration (redirect URLs).

## Milestones — all delivered (one commit + PR doc each, see `docs/`)
- [x] M1 Foundations — schema, RLS + role test script, magic-link auth, surface shells
- [x] M2 Studio admin — client CRUD, pipeline, seed (Andrea Larsen · LuxeShots)
- [x] M3 Intake — four blocks, uploads, validate/reject
- [x] M4 CMS — draft/publish + diff, deploy hooks, media pipeline (sharp→WebP), listings, integrations
- [x] M5 Tracking & leads — /api/collect, snippet, dashboard, inbox + CSV
- [x] M6 Payments — provider interface, Stripe Route A, webhooks, publish gate, care flags
- [x] M7 Commissions — rules editor (owner) + statements, engine on paid invoices
- [x] M8 Eject — standalone repo generator (`pnpm eject --client=slug`)
- [x] M9 Survey — Framer webhook ingest + admin view
