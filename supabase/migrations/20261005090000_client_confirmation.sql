-- Klienta apstiprinājums.
-- Kad administrators panelī apstiprina rezervāciju, klientam aiziet e-pasts ar pogu "Apstiprinu rezervāciju".
-- Poga atver lapu /rezervacija/<id>?k=<žetons>; nospiežot tur "Apstiprinu", rezervācijā ierakstās apstiprināšanas laiks.
-- Ja klients 3 dienu laikā nav apstiprinājis, panelis to izceļ un komandai aiziet atgādinājums.

-- Katram pieteikumam savs nejaušs žetons (bez tā saiti nevar uzminēt)
alter table public.bookings add column if not exists confirm_token text default replace(gen_random_uuid()::text, '-', '');
update public.bookings set confirm_token = replace(gen_random_uuid()::text, '-', '') where confirm_token is null;
-- Kad klientam nosūtīts apstiprinājuma e-pasts, kad viņš apstiprināja, kad komandai nosūtīts atgādinājums
alter table public.bookings add column if not exists confirmation_sent_at timestamptz;
alter table public.bookings add column if not exists client_confirmed_at  timestamptz;
alter table public.bookings add column if not exists client_reminded_at   timestamptz;

-- Rezervācijas dati klientam pēc saites (id + žetons). Ar p_confirm = true — atzīmē, ka klients apstiprināja.
-- Atgriež tikai to, ko klients pats jau zina (datums, laiks, vieta, programma, vārds).
create or replace function public.client_booking(p_id uuid, p_token text, p_confirm boolean default false)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  fresh boolean := false;
begin
  select * into b from public.bookings where id = p_id and confirm_token = p_token and coalesce(p_token, '') <> '';
  if not found then
    return json_build_object('found', false);
  end if;
  if p_confirm and b.status = 'Apstiprināta' and b.client_confirmed_at is null then
    update public.bookings set client_confirmed_at = now() where id = b.id returning * into b;
    fresh := true;
  end if;
  return json_build_object(
    'found', true,
    'status', b.status,
    'confirmed_at', b.client_confirmed_at,
    'just_confirmed', fresh,
    'event_date', b.event_date,
    'event_time', b.event_time,
    'location', b.location,
    'address', b.address,
    'program', b.program,
    'name', b.parent_name
  );
end;
$$;

revoke all on function public.client_booking(uuid, text, boolean) from public;
grant execute on function public.client_booking(uuid, text, boolean) to anon, authenticated;

-- Ikdienas pārbaude: rezervācijas, kurām apstiprinājuma e-pasts nosūtīts pirms vairāk nekā 3 dienām,
-- bet klients vēl nav apstiprinājis. Katru atzīmē kā "atgādināts" (lai atgādinājums aiziet tikai vienreiz)
-- un atgriež tikai pasākumu datumus — bez klientu datiem.
create or replace function public.remind_unconfirmed_bookings()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  dates json;
begin
  with due as (
    update public.bookings
    set client_reminded_at = now()
    where status = 'Apstiprināta'
      and client_confirmed_at is null
      and client_reminded_at is null
      and confirmation_sent_at is not null
      and confirmation_sent_at < now() - interval '3 days'
      and (event_date is null or event_date::date >= current_date)
    returning event_date
  )
  select coalesce(json_agg(event_date order by event_date), '[]'::json) into dates from due;
  return dates;
end;
$$;

revoke all on function public.remind_unconfirmed_bookings() from public;
grant execute on function public.remind_unconfirmed_bookings() to anon, authenticated;
