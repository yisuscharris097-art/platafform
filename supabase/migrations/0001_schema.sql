-- ═══════════════════════════════════════════════════════════════════════════
-- Milestone 1 · Schema (brief §3). Shape preserved; documented additions:
--   • clients.portal_user_id — links the agent's login (role 'client') to their
--     client row. The sketch had no user↔client linkage; RLS needs one.
--   • commission_rules_audit — "every edit writes an audit row" (brief §3).
--   • public.users is auto-created from auth.users via trigger (magic link).
-- Money is integer cents + currency code. No floats anywhere.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type user_role          as enum ('owner','partner','developer','client');
create type client_tier        as enum ('starter','signature','flagship');
create type client_status      as enum ('lead','onboarding','building','review','live','churned');
create type host_target        as enum ('vercel','cloudflare');
create type section_kind       as enum ('hero','listings','about','areas','testimonials','faq','journal','valuation','contact');
create type integration_provider as enum ('ga4','meta_pixel','gtm','calendly','idx','webhook');
create type event_type         as enum ('pageview','listing_view','gallery_open','call_click','whatsapp_click','form_submit');
create type intake_block_kind  as enum ('details','brand','content','photos');
create type intake_status      as enum ('pending','submitted','validated','rejected');
create type invoice_kind       as enum ('deposit','balance','care_monthly','renewal','change_order');
create type invoice_status     as enum ('draft','open','paid','void','uncollectible');
create type commission_entry_status as enum ('pending','paid','void');

-- ─── Core ───────────────────────────────────────────────────────────────────
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text,
  role            user_role not null default 'client',
  organization_id uuid references organizations(id),
  created_at      timestamptz not null default now()
);

create table clients (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  display_name   text not null,
  brokerage      text,
  license_states text[] not null default '{}',
  market         text,
  tier           client_tier not null default 'starter',
  status         client_status not null default 'lead',
  primary_domain text,
  host_target    host_target not null default 'cloudflare',
  originated_by  uuid references users(id),
  portal_user_id uuid unique references users(id),   -- documented addition
  launched_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table sites (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null unique references clients(id) on delete cascade,
  template          text not null default 'default',
  theme_tokens      jsonb not null default '{}',
  deploy_hook_url   text,
  last_published_at timestamptz
);

create table site_sections (
  id       uuid primary key default gen_random_uuid(),
  site_id  uuid not null references sites(id) on delete cascade,
  kind     section_kind not null,
  position int not null default 0,
  enabled  boolean not null default true,
  content  jsonb not null default '{}',
  unique (site_id, kind)
);

create table listings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  address     text not null,
  city        text,
  state       text,
  price_cents bigint,
  beds        numeric(3,1),
  baths       numeric(3,1),
  sqft        int,
  status      text not null default 'active',
  mls_id      text,
  featured    boolean not null default false,
  position    int not null default 0,
  gallery     jsonb not null default '[]',
  created_at  timestamptz not null default now()
);
create index listings_client_idx on listings (client_id, position);

create table media (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  storage_path text not null,
  kind         text not null default 'photo',
  width        int,
  height       int,
  alt          text,
  bytes        bigint,
  created_at   timestamptz not null default now()
);
create index media_client_idx on media (client_id);

create table integrations (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  provider  integration_provider not null,
  config    jsonb not null default '{}',
  enabled   boolean not null default false,
  unique (client_id, provider)
);

create table leads (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  message    text,
  intent     text,
  listing_id uuid references listings(id) on delete set null,
  source     text,
  utm        jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index leads_client_idx on leads (client_id, created_at desc);

create table events (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  session_id text,
  type       event_type not null,
  path       text,
  listing_id uuid references listings(id) on delete set null,
  referrer   text,
  utm        jsonb not null default '{}',
  country    text,
  device     text,
  created_at timestamptz not null default now()
);
create index events_client_time_idx on events (client_id, created_at desc);

create table intake_blocks (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  block        intake_block_kind not null,
  status       intake_status not null default 'pending',
  payload      jsonb not null default '{}',
  validated_at timestamptz,
  unique (client_id, block)
);

create table review_rounds (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  round       int not null default 1,
  notes       jsonb not null default '[]',
  approved_at timestamptz,
  unique (client_id, round)
);

create table invoices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  kind         invoice_kind not null,
  amount_cents bigint not null check (amount_cents >= 0),
  currency     text not null default 'usd',
  status       invoice_status not null default 'open',
  stripe_id    text,
  due_at       timestamptz,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index invoices_client_idx on invoices (client_id, created_at desc);

-- ─── Commissions: data, never hardcoded (brief §3) ─────────────────────────
create table commission_rules (
  id               uuid primary key default gen_random_uuid(),
  scope            text not null default 'global',
  revenue_kind     invoice_kind not null,
  beneficiary_role user_role not null,
  percent_bps      int not null check (percent_bps between 0 and 10000),
  effective_from   date not null,
  effective_to     date,
  created_by       uuid references users(id),
  created_at       timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table commission_entries (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null references invoices(id) on delete cascade,
  beneficiary_user_id uuid not null references users(id),
  rule_id             uuid not null references commission_rules(id),
  amount_cents        bigint not null,
  status              commission_entry_status not null default 'pending',
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index commission_entries_beneficiary_idx on commission_entries (beneficiary_user_id);

create table commission_rules_audit (
  id         uuid primary key default gen_random_uuid(),
  rule_id    uuid not null,
  action     text not null,          -- 'insert' | 'update' | 'delete'
  changed_by uuid,
  old_row    jsonb,
  new_row    jsonb,
  changed_at timestamptz not null default now()
);

create or replace function audit_commission_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into commission_rules_audit (rule_id, action, changed_by, old_row, new_row)
  values (
    coalesce(new.id, old.id),
    lower(tg_op),
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger commission_rules_audit_trg
  after insert or update or delete on commission_rules
  for each row execute function audit_commission_rules();

-- ─── Auth → app users bridge (magic link creates auth.users rows) ──────────
create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
