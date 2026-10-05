-- Klients no savas saites var rezervāciju vai nu apstiprināt, vai atcelt — bet tikai vienreiz.
-- Pēc lēmuma (apstiprināts vai atcelts) saite vairs neko nemaina: vēlāk atcelt var tikai sazinoties ar mums.

alter table public.bookings add column if not exists client_cancelled_at timestamptz;

-- Rezervācijas dati klientam pēc saites (id + žetons) un viņa lēmums:
--   p_action = 'view'    — tikai nolasa;
--   p_action = 'confirm' — klients apstiprina;
--   p_action = 'cancel'  — klients atceļ (statuss kļūst "Atcelta", laiks atkal ir brīvs).
-- Lēmumu pieņem tikai tad, ja rezervācija ir apstiprināta no mūsu puses un klients vēl nav ne apstiprinājis, ne atcēlis.
-- Atgriež tikai to, ko klients pats ir iesniedzis (izmaksu aprēķinam un pārskatam).
create or replace function public.client_booking_action(p_id uuid, p_token text, p_action text default 'view')
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  did text := '';
begin
  select * into b from public.bookings where id = p_id and confirm_token = p_token and coalesce(p_token, '') <> '';
  if not found then
    return json_build_object('found', false);
  end if;
  if b.status = 'Apstiprināta' and b.client_confirmed_at is null and b.client_cancelled_at is null then
    if p_action = 'confirm' then
      update public.bookings set client_confirmed_at = now() where id = b.id returning * into b;
      did := 'confirmed';
    elsif p_action = 'cancel' then
      update public.bookings set client_cancelled_at = now(), status = 'Atcelta' where id = b.id returning * into b;
      did := 'cancelled';
    end if;
  end if;
  return json_build_object(
    'found', true,
    'status', b.status,
    'confirmed_at', b.client_confirmed_at,
    'cancelled_at', b.client_cancelled_at,
    'did', did,
    'event_date', b.event_date,
    'event_time', b.event_time,
    'location', b.location,
    'address', b.address,
    'program', b.program,
    'name', b.parent_name,
    'children_count', b.children_count,
    'child_age', b.child_age,
    'message', b.message,
    'travel_km', b.travel_km,
    'travel_cost', b.travel_cost
  );
end;
$$;

revoke all on function public.client_booking_action(uuid, text, text) from public;
grant execute on function public.client_booking_action(uuid, text, text) to anon, authenticated;
