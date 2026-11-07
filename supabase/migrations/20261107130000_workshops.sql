-- =====================================================================
-- Radošās darbnīcas: pašizmaksas aprēķins (materiāli → cena vienai personai).
-- Jaunā sadaļa "darbnicas" komandas piekļuves ķeksīšos.
-- Jāpalaiž PĒC 20261107120000_team_sections.sql. Palaist var atkārtoti.
-- =====================================================================

create table if not exists public.workshops (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  notes        text,
  -- [{ "name": "Krāsas", "qty": 20, "price": 12.5 }] — qty: cik personām pietiek iepirktais daudzums
  items        jsonb not null default '[]',
  participants int,
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.workshops enable row level security;

drop policy if exists "workshops_read" on public.workshops;
create policy "workshops_read" on public.workshops
  for select to authenticated using (public.has_section('darbnicas'));
drop policy if exists "workshops_insert" on public.workshops;
create policy "workshops_insert" on public.workshops
  for insert to authenticated with check (public.is_manager() and public.has_section('darbnicas'));
drop policy if exists "workshops_update" on public.workshops;
create policy "workshops_update" on public.workshops
  for update to authenticated
  using (public.is_manager() and public.has_section('darbnicas'))
  with check (public.is_manager() and public.has_section('darbnicas'));
drop policy if exists "workshops_admin_delete" on public.workshops;
create policy "workshops_admin_delete" on public.workshops
  for delete to authenticated using (public.is_admin());

-- Ķeksīšos atļautās sadaļas + "darbnicas"
create or replace function public.grant_team_access(p_email text, p_name text, p_role text, p_sections text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  allowed text[] := '{rezervacijas,kalendars,piedavajumi,klientu_vesture,standarta,scenariji,darbnicas,piekluve}';
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

-- Vadībai (Kristīnei) sadaļu ieslēdz uzreiz
update public.team_access
set sections = array_append(sections, 'darbnicas')
where role = 'manager' and not ('darbnicas' = any (sections));
