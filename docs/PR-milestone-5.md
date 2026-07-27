# PR · Milestone 5 — Tracking & leads

## What changed
- **`/api/collect`**: zod-validated events, CORS for cross-origin static sites, per-IP rate limiting (fixed window, in-memory per instance), and **no raw IPs stored — sha256 with a rotating daily salt** (`COLLECT_IP_SALT`, brief §8). Client resolved by slug (cached), events inserted via service role. Device from UA, country from Vercel geo header.
- **`/api/leads`**: form submissions from client sites (either email or phone required), same CORS/rate-limit/hash treatment, also records a `form_submit` event.
- **Snippet** (`public/collect.js`): one `<script data-client="slug">` tag works on **both hosting targets** — pageview, `tel:` → call_click, WhatsApp click, `[data-listing-id]` → listing_view, `[data-gallery]` → gallery_open; sessions via sessionStorage, UTM captured, `sendBeacon` with fetch fallback.
- **Client dashboard** (`/app`): last-30-days visitors (distinct sessions), pageviews, top pages, top listings (addresses resolved), referrers, unread-leads count, and a copy-paste snippet block.
- **Leads inbox** (`/app/leads`): unread badges, mark-as-read (RLS policy in migration 0005), **CSV export** (`/api/leads/export`, RLS-scoped, proper quoting).

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open (by design)
- The in-memory rate limiter is per-instance; swap for Upstash/KV if traffic grows.
- Events dashboard for the studio side can reuse these queries later.
