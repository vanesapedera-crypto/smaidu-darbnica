-- Programmām ar laika logiem dienā (DAY_RULES failā src/lib/bookings.ts, piem. Ziemassvētki bērnudārzā 14. decembrī):
-- jau rezervētie laiki ar izvēlēto variantu formā "2026-12-14 10:00|Tikai Rūķis" — bez klientu datiem.
create or replace function public.booked_program_variants(prog text)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select event_date::date::text || ' ' || left(event_time::text, 5) || '|' || coalesce(substring(message from 'Izvēle: ([^\n]+)'), '')
  from public.bookings
  where program = prog
    and event_date is not null
    and event_time is not null
    and event_time::text <> ''
    and coalesce(status, 'Jauns') <> 'Atcelta';
$$;

revoke all on function public.booked_program_variants(text) from public;
grant execute on function public.booked_program_variants(text) to anon, authenticated;
