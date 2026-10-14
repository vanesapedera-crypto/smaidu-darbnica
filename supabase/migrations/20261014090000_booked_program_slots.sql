-- Programmām ar konkrētiem laikiem (PROGRAM_SLOTS failā src/lib/bookings.ts, piem. Ziemassvētki Dobelē):
-- jau rezervētie laiki formā "2026-12-14 09:00" — tikai laiki, bez klientu datiem.
create or replace function public.booked_program_slots(prog text)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct event_date::date::text || ' ' || left(event_time::text, 5)
  from public.bookings
  where program = prog
    and event_date is not null
    and event_time is not null
    and event_time::text <> ''
    and coalesce(status, 'Jauns') <> 'Atcelta';
$$;

revoke all on function public.booked_program_slots(text) from public;
grant execute on function public.booked_program_slots(text) to anon, authenticated;
