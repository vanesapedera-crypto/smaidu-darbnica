-- =====================================================================
-- Komandas piekļuve ar ķeksīšiem: katram cilvēkam — kuras sadaļas viņš redz.
--
-- Sadaļas (team_access.sections):
--   rezervacijas    — pieteikumu saraksts (tikai skatīt)
--   kalendars       — kalendārs (tikai skatīt)
--   piedavajumi     — piedāvājumi klientiem
--   klientu_vesture — klientu vēsture
--   standarta       — standarta piedāvājumi
--   scenariji       — izrāžu scenāriji (skatīt un pievienot)
--   piekluve        — komandas piekļuves pārvaldība
-- "Var labot" (role = 'manager'): labot piedāvājumus, standarta piedāvājumus un scenārijus
-- tajās sadaļās, kuras cilvēks redz. Dzēst ierakstus var tikai administratore.
-- Administratore (public.admins) redz visu. Palaist var atkārtoti.
-- Jāpalaiž PĒC 20261107090000_team_access.sql.
-- =====================================================================

alter table public.team_access add column if not exists sections text[] not null default '{kalendars}';

-- Esošajiem: tās pašas sadaļas, kas līdz šim bija pēc lomas (tikai, ja vēl nav iestatītas)
update public.team_access
set sections = case role
  when 'manager' then '{rezervacijas,kalendars,piedavajumi,klientu_vesture,standarta,scenariji,piekluve}'::text[]
  else '{kalendars,standarta,scenariji}'::text[]
end
where sections = '{kalendars}';

create or replace function public.has_section(s text)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin()
      or exists (select 1 from public.team_access where user_id = auth.uid() and s = any (sections));
$$;
grant execute on function public.has_section(text) to anon, authenticated;

-- Komandas piekļuvi pārvalda administratore un tie, kam ir sadaļa "piekluve"
drop policy if exists "team_access_admin_all" on public.team_access;
drop policy if exists "team_access_manage" on public.team_access;
create policy "team_access_manage" on public.team_access
  for all to authenticated using (public.has_section('piekluve')) with check (public.has_section('piekluve'));

drop function if exists public.grant_team_access(text, text, text);
create or replace function public.grant_team_access(p_email text, p_name text, p_role text, p_sections text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  allowed text[] := '{rezervacijas,kalendars,piedavajumi,klientu_vesture,standarta,scenariji,piekluve}';
begin
  if not public.has_section('piekluve') then
    raise exception 'Nav tiesību pārvaldīt komandas piekļuvi';
  end if;
  if p_role not in ('manager', 'viewer', 'animator') then
    raise exception 'Nezināma loma';
  end if;
  if not (coalesce(p_sections, '{}') <@ allowed) then
    raise exception 'Nezināma sadaļa';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if uid is null then
    raise exception 'LIETOTAJS_NAV_ATRASTS';
  end if;
  if exists (select 1 from public.admins where user_id = uid) then
    raise exception 'Administratores tiesības šeit mainīt nevar';
  end if;
  insert into public.team_access (user_id, email, name, role, sections)
  values (uid, lower(trim(p_email)), nullif(trim(p_name), ''), p_role, coalesce(p_sections, '{}'))
  on conflict (user_id) do update
    set email = excluded.email, name = coalesce(excluded.name, team_access.name), role = excluded.role, sections = excluded.sections;
end;
$$;
grant execute on function public.grant_team_access(text, text, text, text[]) to authenticated;

-- Pieteikumi: lasīt var, ja redz kalendāru vai pieteikumus (labo tikai administratore — esošās politikas)
drop policy if exists "bookings_team_select" on public.bookings;
create policy "bookings_team_select" on public.bookings
  for select to authenticated using (public.has_section('kalendars') or public.has_section('rezervacijas'));

-- Scenāriji
drop policy if exists "scripts_team_read" on public.scripts;
create policy "scripts_team_read" on public.scripts
  for select to authenticated using (public.has_section('scenariji'));
drop policy if exists "scripts_team_insert" on public.scripts;
create policy "scripts_team_insert" on public.scripts
  for insert to authenticated with check (public.has_section('scenariji'));
drop policy if exists "scripts_manager_update" on public.scripts;
create policy "scripts_manager_update" on public.scripts
  for update to authenticated
  using (public.is_manager() and public.has_section('scenariji'))
  with check (public.is_manager() and public.has_section('scenariji'));

-- Piedāvājumi
drop policy if exists "offers_read" on public.offers;
create policy "offers_read" on public.offers
  for select to authenticated using (
    public.has_section('piedavajumi') or public.has_section('klientu_vesture')
    or (kind = 'template' and public.has_section('standarta'))
  );
drop policy if exists "offers_manager_insert" on public.offers;
create policy "offers_manager_insert" on public.offers
  for insert to authenticated with check (
    public.is_manager() and (public.has_section('piedavajumi') or (kind = 'template' and public.has_section('standarta')))
  );
drop policy if exists "offers_manager_update" on public.offers;
create policy "offers_manager_update" on public.offers
  for update to authenticated
  using (public.is_manager() and (public.has_section('piedavajumi') or (kind = 'template' and public.has_section('standarta'))))
  with check (public.is_manager() and (public.has_section('piedavajumi') or (kind = 'template' and public.has_section('standarta'))));

-- Faili
drop policy if exists "team_files_read" on storage.objects;
create policy "team_files_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'team-files' and (
      ((storage.foldername(name))[1] = 'scenariji' and public.has_section('scenariji'))
      or ((storage.foldername(name))[1] = 'standarta' and (public.has_section('standarta') or public.has_section('piedavajumi')))
      or ((storage.foldername(name))[1] = 'piedavajumi' and (public.has_section('piedavajumi') or public.has_section('klientu_vesture')))
    )
  );
drop policy if exists "team_files_insert" on storage.objects;
create policy "team_files_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'team-files' and (
      ((storage.foldername(name))[1] = 'scenariji' and public.has_section('scenariji'))
      or (public.is_manager() and (public.has_section('piedavajumi') or public.has_section('standarta')))
    )
  );
