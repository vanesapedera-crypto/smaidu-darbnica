-- Telpu nomas aizņemtie laiki: neskaita programmas, kas notiek citā noteiktā vietā
-- (sk. FIXED_VENUES failā src/lib/bookings.ts, piem. “Pilsētas māja” Dobelē) — tās neaizņem mūsu telpas.
create or replace function public.booked_venue_slots(day date)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct left(event_time::text, 5)
  from public.bookings
  where event_date::date = day
    and event_time is not null
    and event_time::text <> ''
    and coalesce(location, '') not in ('Izbraukums', '“Pilsētas māja” Dobelē')
    and coalesce(inquiry_type, 'private') = 'private'
    and coalesce(status, 'Jauns') <> 'Atcelta';
$$;
