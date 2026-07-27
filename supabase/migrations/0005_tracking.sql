-- Milestone 5 · Tracking & leads
-- The client can mark their own leads read (inbox). Event/lead INSERTS come
-- exclusively from /api/collect and /api/leads via the service role.

create policy leads_client_update on leads for update
  using (app_private.can_view_client(client_id))
  with check (app_private.can_view_client(client_id));
