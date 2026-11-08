-- =====================================================================
-- Prezentācijas klientiem (bez cenām): izvēlētās radošās darbnīcas un aktivitātes.
-- Jāpalaiž PĒC 20261108100000_materials.sql. Palaist var atkārtoti.
-- =====================================================================
create table if not exists public.presentations (
  id            uuid primary key default gen_random_uuid(),
  client_name   text not null,
  title         text,
  event_date    date,
  place         text,
  children      int,
  hours         numeric,
  workshop_ids  uuid[] not null default '{}',
  activity_ids  uuid[] not null default '{}',
  intro         text,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.presentations enable row level security;
drop policy if exists "presentations_read" on public.presentations;
create policy "presentations_read" on public.presentations
  for select to authenticated using (public.has_section('piedavajumi'));
drop policy if exists "presentations_insert" on public.presentations;
create policy "presentations_insert" on public.presentations
  for insert to authenticated with check (public.is_manager() and public.has_section('piedavajumi'));
drop policy if exists "presentations_update" on public.presentations;
create policy "presentations_update" on public.presentations
  for update to authenticated
  using (public.is_manager() and public.has_section('piedavajumi'))
  with check (public.is_manager() and public.has_section('piedavajumi'));
drop policy if exists "presentations_admin_delete" on public.presentations;
create policy "presentations_admin_delete" on public.presentations
  for delete to authenticated using (public.is_admin());
