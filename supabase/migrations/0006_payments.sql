-- Milestone 6 · Payments
--   • Stripe customer linkage + billing failure tracking on clients.
--   • Two consecutive failed care payments FLAG the client (a human decides
--     about suspension — never automatic, brief §5).

alter table clients
  add column if not exists stripe_customer_id text,
  add column if not exists billing_flagged boolean not null default false,
  add column if not exists billing_failed_count int not null default 0;
