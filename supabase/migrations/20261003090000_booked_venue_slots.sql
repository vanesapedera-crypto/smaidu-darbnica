-- Telpu nomas aizņemtie laiki: rezervācijas forma rāda tikai brīvos laikus.
--
-- Pieteikumus drīkst lasīt tikai administrators (RLS), tāpēc forma nevar pati apskatīt `bookings` tabulu.
-- Šī funkcija atgriež TIKAI aizņemtos sākuma laikus izvēlētajā datumā (piem. '14:00') — bez klientu datiem.
-- Laiks skaitās aizņemts, ja pieteikums ir mūsu telpās un nav atcelts (statuss "Jauns" vai "Apstiprināta").
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
    and coalesce(location, '') <> 'Izbraukums'
    and coalesce(inquiry_type, 'private') = 'private'
    and coalesce(status, 'Jauns') <> 'Atcelta';
$$;

revoke all on function public.booked_venue_slots(date) from public;
grant execute on function public.booked_venue_slots(date) to anon, authenticated;
