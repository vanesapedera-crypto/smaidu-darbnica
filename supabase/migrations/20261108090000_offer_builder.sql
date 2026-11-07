-- =====================================================================
-- Piedāvājuma izveide (kalkulators):
--   cost_items     — izmaksu katalogs: papildu aktivitātes un citi izdevumi ar mērvienību
--   calc_settings  — likmes (animatori, uzcenojums, PVN, ceļš); maina tikai administratore
--   offers.calc    — piedāvājuma aprēķina dati (lai to var atvērt un labot vēlreiz, un izveidot PDF)
--   + sākuma saraksts: radošās darbnīcas un papildu aktivitātes (cenas jāievada panelī).
-- Jāpalaiž PĒC 20261107130000_workshops.sql. Palaist var atkārtoti.
-- =====================================================================

create table if not exists public.cost_items (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'activity' check (kind in ('activity', 'expense')),
  title       text not null,
  unit        text not null default 'hour' check (unit in ('hour', 'person', 'piece', 'fixed')),
  cost        numeric not null default 0,
  notes       text,
  sort        int not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.cost_items enable row level security;
drop policy if exists "cost_items_read" on public.cost_items;
create policy "cost_items_read" on public.cost_items
  for select to authenticated using (public.has_section('piedavajumi') or public.has_section('darbnicas'));
drop policy if exists "cost_items_insert" on public.cost_items;
create policy "cost_items_insert" on public.cost_items
  for insert to authenticated with check (public.is_manager() and public.has_section('piedavajumi'));
drop policy if exists "cost_items_update" on public.cost_items;
create policy "cost_items_update" on public.cost_items
  for update to authenticated
  using (public.is_manager() and public.has_section('piedavajumi'))
  with check (public.is_manager() and public.has_section('piedavajumi'));
drop policy if exists "cost_items_admin_delete" on public.cost_items;
create policy "cost_items_admin_delete" on public.cost_items
  for delete to authenticated using (public.is_admin());

create table if not exists public.calc_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.calc_settings enable row level security;
drop policy if exists "calc_settings_read" on public.calc_settings;
create policy "calc_settings_read" on public.calc_settings
  for select to authenticated using (public.has_section('piedavajumi'));
drop policy if exists "calc_settings_admin_write" on public.calc_settings;
create policy "calc_settings_admin_write" on public.calc_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.calc_settings (id, data)
values (1, '{"animatorHour": 0, "animatorFixed": 0, "markup": 0, "vat": 21}')
on conflict (id) do nothing;

alter table public.offers add column if not exists calc jsonb;

-- Sākuma saraksts (tikai tie, kuru vēl nav)
insert into public.workshops (title, items)
select t, '[]'::jsonb
from unnest(array['Kroņi', '3D puzles', 'Tējnīca', 'SPA zona', 'Kroņi un zobeni', 'Piespraudes', 'Sveču darbnīca', 'Feju nūjiņas']) as t
where not exists (select 1 from public.workshops w where lower(w.title) = lower(t));

insert into public.cost_items (kind, title, unit, sort)
select 'activity', v.title, v.unit, v.sort
from (values
  ('Balonu locīšana', 'hour', 10),
  ('Glitera tetovējumi', 'hour', 20),
  ('Svētku mirdzumiņš', 'hour', 30),
  ('Sejas apgleznošana', 'hour', 40),
  ('Lielie burbuļi', 'hour', 50),
  ('Mazuļu stūrītis', 'hour', 60),
  ('Lielformāta spēles', 'piece', 70)
) as v(title, unit, sort)
where not exists (select 1 from public.cost_items c where lower(c.title) = lower(v.title));

-- Prezentācijai: apraksts un foto katrai darbnīcai un aktivitātei
alter table public.workshops add column if not exists description text;
alter table public.workshops add column if not exists image text;
alter table public.cost_items add column if not exists description text;
alter table public.cost_items add column if not exists image text;

-- Prezentāciju foto: publiskajā krātuvē "media", mapē prezentacijas/ — augšupielādē arī vadība
drop policy if exists "media_team_insert" on storage.objects;
create policy "media_team_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media' and (storage.foldername(name))[1] = 'prezentacijas'
    and public.is_manager() and (public.has_section('piedavajumi') or public.has_section('darbnicas'))
  );
