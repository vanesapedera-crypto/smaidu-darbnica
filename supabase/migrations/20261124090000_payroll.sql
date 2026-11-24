-- =====================================================================
-- Algas: par katru pasākumu katram dalībniekam — alga un ceļa izdevumi (ievada ar roku vai no standarta cenas).
-- pay_rates — standarta alga vienam cilvēkam pēc programmas (atslēga: programmas slug vai "telpu-noma" / "uznemums" / "default").
-- Redz un labo tikai administratore un vadība (Kristīne). Palaist var atkārtoti.
-- =====================================================================
create table if not exists public.payroll (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  person     text not null,           -- e-pasts (komanda) vai "x:Vārds" (ārējais palīgs)
  name       text not null,
  pay        numeric,
  travel     numeric,
  updated_at timestamptz not null default now(),
  primary key (booking_id, person)
);
alter table public.payroll enable row level security;
drop policy if exists "payroll_managers" on public.payroll;
create policy "payroll_managers" on public.payroll for all to authenticated using (public.is_manager()) with check (public.is_manager());

create table if not exists public.pay_rates (
  key        text primary key,
  title      text not null,
  amount     numeric,
  updated_at timestamptz not null default now()
);
alter table public.pay_rates enable row level security;
drop policy if exists "pay_rates_managers" on public.pay_rates;
create policy "pay_rates_managers" on public.pay_rates for all to authenticated using (public.is_manager()) with check (public.is_manager());
