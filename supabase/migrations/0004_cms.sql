-- ═══════════════════════════════════════════════════════════════════════════
-- Milestone 4 · CMS — draft/publish model + client editing rights
--   • site_sections.draft holds unpublished edits; Publish copies draft→content.
--   • Every client gets a site + the nine sections automatically.
--   • The client role can edit their own sections/listings/integrations and
--     stamp last_published_at. Tier feature-gates live server-side.
-- ═══════════════════════════════════════════════════════════════════════════

alter table site_sections
  add column if not exists draft jsonb,
  add column if not exists draft_updated_at timestamptz;

-- Auto-create site + sections for every client
create or replace function create_site_for_client() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  insert into sites (client_id) values (new.id)
  on conflict (client_id) do nothing
  returning id into sid;
  if sid is null then
    select id into sid from sites where client_id = new.id;
  end if;
  insert into site_sections (site_id, kind, position, enabled)
  values
    (sid, 'hero', 0, true), (sid, 'listings', 1, true), (sid, 'about', 2, true),
    (sid, 'areas', 3, false), (sid, 'testimonials', 4, false), (sid, 'faq', 5, false),
    (sid, 'journal', 6, false), (sid, 'valuation', 7, false), (sid, 'contact', 8, true)
  on conflict (site_id, kind) do nothing;
  return new;
end $$;

create trigger clients_site_trg
  after insert on clients
  for each row execute function create_site_for_client();

-- Backfill sites + sections for existing clients
insert into sites (client_id)
select id from clients on conflict (client_id) do nothing;

insert into site_sections (site_id, kind, position, enabled)
select s.id, k.kind, k.pos,
       k.kind in ('hero','listings','about','contact')
from sites s
cross join (values
  ('hero'::section_kind,0),('listings',1),('about',2),('areas',3),('testimonials',4),
  ('faq',5),('journal',6),('valuation',7),('contact',8)
) as k(kind, pos)
on conflict (site_id, kind) do nothing;

-- ─── Client editing rights ─────────────────────────────────────────────────
create policy sections_client_update on site_sections for update
  using (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(app_private.site_client(site_id))
  );

create policy sites_client_publish on sites for update
  using (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(client_id)
  );

create policy listings_client_all on listings for all
  using (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(client_id)
  )
  with check (app_private.can_view_client(client_id));

create policy integrations_client_all on integrations for all
  using (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(client_id)
  )
  with check (app_private.can_view_client(client_id));
