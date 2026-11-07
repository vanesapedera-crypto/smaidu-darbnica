-- =====================================================================
-- Komandas piekļuve panelim + scenāriju arhīvs + piedāvājumi klientiem
--
-- Lomas:
--   owner    — administratore (tabula public.admins, kā līdz šim): redz, maina un dzēš visu
--   manager  — Kristīne: pieteikumi un kalendārs (skatīt), piedāvājumi, standarta piedāvājumi,
--              scenāriji, klientu vēsture (pievienot un labot, bet ne dzēst)
--   viewer   — Keita: kalendārs, standarta piedāvājumi (skatīt), scenāriji (skatīt un pievienot)
--   animator — Gunta, Agija, Madara K, Madara R: tāpat kā viewer
--
-- Dzēst ierakstus var tikai administratore. Pieteikumus labot, saturu, cenas un
-- iestatījumus mainīt — arī tikai administratore (esošās public.is_admin() politikas nemainās).
-- Palaist var atkārtoti (arī ja iepriekšējā versija jau palaista).
-- =====================================================================

-- 1. Komandas locekļi ---------------------------------------------------
create table if not exists public.team_access (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null,
  created_at timestamptz not null default now()
);
alter table public.team_access enable row level security;
alter table public.team_access drop constraint if exists team_access_role_check;
alter table public.team_access add constraint team_access_role_check check (role in ('manager', 'viewer', 'animator'));

create or replace function public.team_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.admins where user_id = auth.uid()) then 'owner'
    else (select role from public.team_access where user_id = auth.uid())
  end;
$$;
grant execute on function public.team_role() to anon, authenticated;

create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public
as $$ select public.team_role() is not null; $$;
grant execute on function public.is_team() to anon, authenticated;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.team_role() in ('owner', 'manager'), false); $$;
grant execute on function public.is_manager() to anon, authenticated;

drop policy if exists "team_access_admin_all" on public.team_access;
create policy "team_access_admin_all" on public.team_access
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "team_access_self_read" on public.team_access;
create policy "team_access_self_read" on public.team_access
  for select to authenticated using (user_id = auth.uid());

-- Administrators pievieno komandas locekli pēc e-pasta (lietotājam jau jābūt izveidotam
-- Supabase → Authentication → Users → Add user).
create or replace function public.grant_team_access(p_email text, p_name text, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Tikai administrators var piešķirt piekļuvi';
  end if;
  if p_role not in ('manager', 'viewer', 'animator') then
    raise exception 'Nezināma loma';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if uid is null then
    raise exception 'LIETOTAJS_NAV_ATRASTS';
  end if;
  insert into public.team_access (user_id, email, name, role)
  values (uid, lower(trim(p_email)), nullif(trim(p_name), ''), p_role)
  on conflict (user_id) do update set email = excluded.email, name = excluded.name, role = excluded.role;
end;
$$;
grant execute on function public.grant_team_access(text, text, text) to authenticated;

-- 2. Pieteikumus komanda var tikai LASĪT (labošana paliek administratoram) --
drop policy if exists "bookings_team_select" on public.bookings;
create policy "bookings_team_select" on public.bookings
  for select to authenticated using (public.is_team());

-- 3. Izrāžu scenāriju arhīvs ------------------------------------------
create table if not exists public.scripts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  year        int,
  notes       text,
  file_path   text,
  file_name   text,
  file_size   bigint,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.scripts enable row level security;
drop policy if exists "scripts_team_read" on public.scripts;
create policy "scripts_team_read" on public.scripts
  for select to authenticated using (public.is_team());
-- Pievienot var visa komanda, labot — administratore un vadība, dzēst — tikai administratore
drop policy if exists "scripts_manager_write" on public.scripts;
drop policy if exists "scripts_team_insert" on public.scripts;
create policy "scripts_team_insert" on public.scripts
  for insert to authenticated with check (public.is_team());
drop policy if exists "scripts_manager_update" on public.scripts;
create policy "scripts_manager_update" on public.scripts
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
drop policy if exists "scripts_admin_delete" on public.scripts;
create policy "scripts_admin_delete" on public.scripts
  for delete to authenticated using (public.is_admin());

-- 4. Piedāvājumi (klientiem un standarta) ------------------------------
create table if not exists public.offers (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'client' check (kind in ('client', 'template')),
  client_name    text,
  contact_person text,
  contact_email  text,
  title          text not null,
  offer_date     date,
  season         text,
  services       text,
  price          text,
  status         text,
  body           text,
  notes          text,
  file_path      text,
  file_name      text,
  file_size      bigint,
  template_id    uuid references public.offers (id) on delete set null,
  created_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists offers_client_idx on public.offers (lower(client_name));
alter table public.offers enable row level security;
-- Klientu piedāvājumus redz administratore un vadība; standarta piedāvājumus (kind = 'template') — visa komanda.
-- Pievienot un labot — administratore un vadība, dzēst — tikai administratore.
drop policy if exists "offers_manager_all" on public.offers;
drop policy if exists "offers_read" on public.offers;
create policy "offers_read" on public.offers
  for select to authenticated using (public.is_manager() or (kind = 'template' and public.is_team()));
drop policy if exists "offers_manager_insert" on public.offers;
create policy "offers_manager_insert" on public.offers
  for insert to authenticated with check (public.is_manager());
drop policy if exists "offers_manager_update" on public.offers;
create policy "offers_manager_update" on public.offers
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
drop policy if exists "offers_admin_delete" on public.offers;
create policy "offers_admin_delete" on public.offers
  for delete to authenticated using (public.is_admin());

-- 5. Privāta failu krātuve (scenāriji un piedāvājumu faili) -------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('team-files', 'team-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Mapes: scenariji/… — lasa un pievieno visa komanda; standarta/… — lasa visa komanda;
--        piedavajumi/… — tikai administratore un vadība.
-- Faila nomaiņa (vecā faila noņemšana) atļauta vadībai; pašus ierakstus dzēš tikai administratore.
drop policy if exists "team_files_read" on storage.objects;
create policy "team_files_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'team-files'
    and (public.is_manager() or ((storage.foldername(name))[1] in ('scenariji', 'standarta') and public.is_team()))
  );
drop policy if exists "team_files_insert" on storage.objects;
create policy "team_files_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'team-files'
    and (public.is_manager() or ((storage.foldername(name))[1] = 'scenariji' and public.is_team()))
  );
drop policy if exists "team_files_update" on storage.objects;
create policy "team_files_update" on storage.objects
  for update to authenticated using (bucket_id = 'team-files' and public.is_manager());
drop policy if exists "team_files_delete" on storage.objects;
create policy "team_files_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'team-files' and public.is_manager());
