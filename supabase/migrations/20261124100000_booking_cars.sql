-- Transports: ar kuru mašīnu (kurš vada) brauc uz pasākumu un cik ceļa izdevumi viņam pienākas.
-- Parasti viena mašīna; lieliem pasākumiem var vairākas. Palaist var atkārtoti.
create table if not exists public.booking_cars (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  driver      text not null,      -- e-pasts (komanda) vai "x:Vārds"
  driver_name text not null,
  amount      numeric,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists booking_cars_booking on public.booking_cars (booking_id);
alter table public.booking_cars enable row level security;
drop policy if exists "booking_cars_managers" on public.booking_cars;
create policy "booking_cars_managers" on public.booking_cars for all to authenticated using (public.is_manager()) with check (public.is_manager());
