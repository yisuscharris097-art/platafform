-- ═══════════════════════════════════════════════════════════════════════════
-- Milestone 1 · RLS (brief §4). Four roles enforced at the database:
--   owner     → everything
--   partner   → only clients they originated + their own commission entries
--   developer → all clients (no commission rules editor)
--   client    → only their own row and its children; never revenue internals
-- Write policies FIRST, test with scripts/test-rls.ts before building UI.
-- M1 grants staff writes (owner/developer). Client/CMS writes arrive in M4.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Helper functions (security definer so they can read users under RLS) ──
create schema if not exists app_private;

create or replace function app_private.current_user_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function app_private.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'owner')
$$;

create or replace function app_private.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users
                 where id = auth.uid() and role in ('owner','partner','developer'))
$$;

create or replace function app_private.can_write_client() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users
                 where id = auth.uid() and role in ('owner','developer'))
$$;

create or replace function app_private.can_view_client(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case (select role from public.users where id = auth.uid())
    when 'owner'     then true
    when 'developer' then true
    when 'partner'   then exists (select 1 from public.clients c
                                  where c.id = cid and c.originated_by = auth.uid())
    when 'client'    then exists (select 1 from public.clients c
                                  where c.id = cid and c.portal_user_id = auth.uid())
    else false
  end
$$;

create or replace function app_private.site_client(sid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select client_id from public.sites where id = sid
$$;

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- ─── Enable RLS everywhere ─────────────────────────────────────────────────
alter table organizations          enable row level security;
alter table users                  enable row level security;
alter table clients                enable row level security;
alter table sites                  enable row level security;
alter table site_sections          enable row level security;
alter table listings               enable row level security;
alter table media                  enable row level security;
alter table integrations           enable row level security;
alter table leads                  enable row level security;
alter table events                 enable row level security;
alter table intake_blocks          enable row level security;
alter table review_rounds          enable row level security;
alter table invoices               enable row level security;
alter table commission_rules       enable row level security;
alter table commission_entries     enable row level security;
alter table commission_rules_audit enable row level security;

-- ─── users ─────────────────────────────────────────────────────────────────
create policy users_select_self  on users for select using (id = auth.uid());
create policy users_select_owner on users for select using (app_private.is_owner());
create policy users_update_self  on users for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from users u where u.id = auth.uid()));
create policy users_all_owner    on users for all    using (app_private.is_owner());

-- ─── organizations ─────────────────────────────────────────────────────────
create policy orgs_select_staff on organizations for select using (app_private.is_staff());
create policy orgs_all_owner    on organizations for all    using (app_private.is_owner());

-- ─── clients ───────────────────────────────────────────────────────────────
create policy clients_select on clients for select using (app_private.can_view_client(id));
create policy clients_insert on clients for insert with check (app_private.can_write_client());
create policy clients_update on clients for update using (app_private.can_write_client());
create policy clients_delete on clients for delete using (app_private.is_owner());

-- ─── client children: visible iff the parent client is visible ─────────────
create policy sites_select on sites for select using (app_private.can_view_client(client_id));
create policy sites_write  on sites for all
  using (app_private.can_write_client() and app_private.can_view_client(client_id))
  with check (app_private.can_write_client());

create policy sections_select on site_sections for select
  using (app_private.can_view_client(app_private.site_client(site_id)));
create policy sections_write on site_sections for all
  using (app_private.can_write_client())
  with check (app_private.can_write_client());

create policy listings_select on listings for select using (app_private.can_view_client(client_id));
create policy listings_write  on listings for all
  using (app_private.can_write_client()) with check (app_private.can_write_client());

create policy media_select on media for select using (app_private.can_view_client(client_id));
create policy media_write  on media for all
  using (app_private.can_write_client()) with check (app_private.can_write_client());

create policy integrations_select on integrations for select using (app_private.can_view_client(client_id));
create policy integrations_write  on integrations for all
  using (app_private.can_write_client()) with check (app_private.can_write_client());

create policy leads_select on leads for select using (app_private.can_view_client(client_id));
-- inserts arrive via /api/collect with the service role (bypasses RLS); the
-- client marks leads read in a later milestone.

create policy events_select on events for select using (app_private.can_view_client(client_id));
-- inserts via service role only.

create policy intake_select on intake_blocks for select using (app_private.can_view_client(client_id));
create policy intake_write  on intake_blocks for all
  using (app_private.can_write_client()) with check (app_private.can_write_client());

create policy reviews_select on review_rounds for select using (app_private.can_view_client(client_id));
create policy reviews_write  on review_rounds for all
  using (app_private.can_write_client()) with check (app_private.can_write_client());

create policy invoices_select on invoices for select using (app_private.can_view_client(client_id));
create policy invoices_write  on invoices for all
  using (app_private.is_owner()) with check (app_private.is_owner());

-- ─── commissions: rules are owner-only, entries visible to their beneficiary ─
create policy rules_owner_all on commission_rules for all
  using (app_private.is_owner()) with check (app_private.is_owner());

create policy entries_owner_all   on commission_entries for all
  using (app_private.is_owner()) with check (app_private.is_owner());
create policy entries_select_own  on commission_entries for select
  using (beneficiary_user_id = auth.uid());

create policy audit_owner_select on commission_rules_audit for select
  using (app_private.is_owner());
