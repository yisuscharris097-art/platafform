# PR · Milestone 9 — Survey

## What changed
- **Migration 0007**: `survey_responses` (answers jsonb, score, recommended_plan as `client_tier`), staff-select / owner-all RLS; inserts only via the API with the service role.
- **`/api/survey`** ingest for the Framer survey webhook: zod validation, optional `x-survey-secret` shared secret, same rate-limit + salted-IP treatment as `/api/collect`. Simple additive scoring with tier thresholds (starter <30 ≤ signature <60 ≤ flagship) — returns `{ score, recommended_plan }` so the survey can show the result inline.
- **Admin view** (`/studio/surveys`): responses with scores, **filterable by recommended plan**, nav entry.

## Verified
- `pnpm typecheck` + `pnpm build` clean.

## Still open
- Scoring thresholds are placeholders — tune once real responses arrive.
- README milestone checklist updated to complete.
