-- =====================================================================
-- Izejmateriāli: fiksēta cena par iepakojumu/komplektu, vienā vietā.
-- Darbnīcas materiālu rindā glabā tikai { materialId, qty } — qty: cik bērniem pietiek 1 iepakojums.
-- Esošās rindas (ar nosaukumu un cenu) pārvērš par izejmateriāliem.
-- Jāpalaiž PĒC 20261108090000_offer_builder.sql. Palaist var atkārtoti.
-- =====================================================================

create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       numeric not null default 0,
  pack        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.materials enable row level security;
drop policy if exists "materials_read" on public.materials;
create policy "materials_read" on public.materials
  for select to authenticated using (public.has_section('darbnicas') or public.has_section('piedavajumi'));
drop policy if exists "materials_insert" on public.materials;
create policy "materials_insert" on public.materials
  for insert to authenticated with check (public.is_manager() and public.has_section('darbnicas'));
drop policy if exists "materials_update" on public.materials;
create policy "materials_update" on public.materials
  for update to authenticated
  using (public.is_manager() and public.has_section('darbnicas'))
  with check (public.is_manager() and public.has_section('darbnicas'));
drop policy if exists "materials_admin_delete" on public.materials;
create policy "materials_admin_delete" on public.materials
  for delete to authenticated using (public.is_admin());

-- Esošās darbnīcu rindas → izejmateriāli
insert into public.materials (name, price)
select distinct on (lower(trim(i->>'name'))) trim(i->>'name'), coalesce(nullif(i->>'price', '')::numeric, 0)
from public.workshops w, jsonb_array_elements(w.items) i
where coalesce(trim(i->>'name'), '') <> '' and not (i ? 'materialId')
  and not exists (select 1 from public.materials m where lower(m.name) = lower(trim(i->>'name')));

update public.workshops w
set items = coalesce((
  select jsonb_agg(
    case when i ? 'materialId' then i
         else jsonb_build_object('materialId', m.id, 'qty', i->'qty') end)
  from jsonb_array_elements(w.items) i
  left join public.materials m on lower(m.name) = lower(trim(i->>'name'))
  where i ? 'materialId' or m.id is not null
), '[]'::jsonb)
where exists (select 1 from jsonb_array_elements(w.items) i where not (i ? 'materialId'));
