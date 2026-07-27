-- Milestone 9 · Survey — ingest from the Framer survey webhook.
create table survey_responses (
  id               uuid primary key default gen_random_uuid(),
  respondent_name  text,
  respondent_email text,
  brokerage        text,
  market           text,
  answers          jsonb not null default '{}',
  score            int,
  recommended_plan client_tier,
  source           text not null default 'framer',
  created_at       timestamptz not null default now()
);
create index survey_responses_created_idx on survey_responses (created_at desc);

alter table survey_responses enable row level security;
create policy survey_staff_select on survey_responses for select using (app_private.is_staff());
create policy survey_owner_all    on survey_responses for all    using (app_private.is_owner());
-- inserts arrive via /api/survey with the service role.
