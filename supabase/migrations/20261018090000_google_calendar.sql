-- Savienojums ar administratora Google kalendāru (panelī "Savienot ar Google kalendāru"):
-- atjaunošanas žetons, ar kuru mājaslapa ieliek apstiprinātās rezervācijas administratora kalendārā.
-- Lasīt un mainīt var tikai administrators.
create table if not exists public.google_calendar (
  id int primary key default 1 check (id = 1),
  email text,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar enable row level security;

drop policy if exists "google_calendar admin" on public.google_calendar;
create policy "google_calendar admin" on public.google_calendar
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
