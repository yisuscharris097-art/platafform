-- ═══════════════════════════════════════════════════════════════════════════
-- Milestone 3 · Intake & onboarding
--   • Every new client automatically gets the four intake blocks.
--   • The client role may SUBMIT their own blocks (payload + pending→submitted).
--     Validation (validated/rejected) stays staff-only.
--   • Storage bucket for client uploads (photos, logos, brand manuals).
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-create the four blocks per client
create or replace function create_intake_blocks() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into intake_blocks (client_id, block)
  values (new.id, 'details'), (new.id, 'brand'), (new.id, 'content'), (new.id, 'photos')
  on conflict (client_id, block) do nothing;
  return new;
end $$;

create trigger clients_intake_blocks_trg
  after insert on clients
  for each row execute function create_intake_blocks();

-- Backfill for clients created before this migration
insert into intake_blocks (client_id, block)
select c.id, b.block
from clients c
cross join (values ('details'::intake_block_kind), ('brand'), ('content'), ('photos')) as b(block)
on conflict (client_id, block) do nothing;

-- Client may submit their own blocks, but can never self-validate.
create policy intake_client_submit on intake_blocks for update
  using (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(client_id)
  )
  with check (status in ('pending', 'submitted'));

-- Client may register media rows for their own uploads
create policy media_client_insert on media for insert
  with check (
    app_private.current_user_role() = 'client'
    and app_private.can_view_client(client_id)
  );

-- Storage bucket for client uploads (public read; writes via authenticated)
insert into storage.buckets (id, name, public)
values ('client-media', 'client-media', true)
on conflict (id) do nothing;

create policy client_media_read on storage.objects for select
  using (bucket_id = 'client-media');
create policy client_media_write on storage.objects for insert
  with check (bucket_id = 'client-media' and auth.role() = 'authenticated');
