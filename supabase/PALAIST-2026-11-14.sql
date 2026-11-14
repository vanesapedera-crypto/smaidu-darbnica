-- =====================================================================
-- Pieteikumus nedzēš nekad (2026-11-14): tikai statuss "Atcelta" (atceltie) vai arhīvs (notikušie).
-- Noņem dzēšanas tiesības — bez DELETE politikas datubāze dzēšanu neatļauj nevienam (arī administratorei).
-- Palaist var atkārtoti.
-- =====================================================================
drop policy if exists "bookings_admin_delete" on public.bookings;
-- =====================================================================
-- Kas piedalās pasākumā — un vai var: katram pievienotajam komandas loceklim atbilde "Varu" / "Nevaru".
-- push_subscriptions — telefona paziņojumi (SD Admin lietotne sākuma ekrānā).
-- Palaist var atkārtoti.
-- =====================================================================

create table if not exists public.booking_staff (
  booking_id   uuid not null references public.bookings (id) on delete cascade,
  email        text not null,
  name         text not null,
  status       text not null default 'gaida' check (status in ('gaida', 'var', 'nevar')),
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  primary key (booking_id, email)
);
alter table public.booking_staff enable row level security;

-- Administratore — visu; komandas loceklis redz un atbild tikai uz saviem ierakstiem; kalendāru redzošie redz statusus
drop policy if exists "booking_staff_admin_all" on public.booking_staff;
create policy "booking_staff_admin_all" on public.booking_staff
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "booking_staff_team_read" on public.booking_staff;
create policy "booking_staff_team_read" on public.booking_staff
  for select to authenticated using (public.has_section('kalendars') or lower(email) = lower(auth.jwt() ->> 'email'));
drop policy if exists "booking_staff_self_answer" on public.booking_staff;
create policy "booking_staff_self_answer" on public.booking_staff
  for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email       text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_own" on public.push_subscriptions;
create policy "push_own" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Paziņojumus sūta serveris administratores vārdā (piešķirot) vai komandas locekļa vārdā (atbildot "Nevaru" — administratorei)
drop policy if exists "push_team_read" on public.push_subscriptions;
create policy "push_team_read" on public.push_subscriptions
  for select to authenticated using (public.is_team());

-- Administratores paziņojumu adreses (lai komandas atbilde "Nevaru" sasniegtu administratori)
create or replace function public.admin_push_subscriptions()
returns table (endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public
as $$
  select s.endpoint, s.p256dh, s.auth from public.push_subscriptions s
  where s.user_id in (select user_id from public.admins) and public.is_team();
$$;
grant execute on function public.admin_push_subscriptions() to authenticated;
