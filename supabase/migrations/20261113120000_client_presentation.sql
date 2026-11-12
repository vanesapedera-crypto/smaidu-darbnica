-- =====================================================================
-- Lapa "Salikt piedāvājumu": kad klients nosūta pieteikumu, sistēma pati izveido prezentāciju
-- (sadaļā "Prezentācijas") ar izvēlētajām darbnīcām un aktivitātēm — to pārbauda un nosūta klientam PDF.
-- Jāpalaiž PĒC 20261108110000_presentations.sql. Palaist var atkārtoti.
-- =====================================================================

create or replace function public.create_client_presentation(
  p_client text, p_title text, p_date date, p_place text, p_children int, p_hours numeric,
  p_workshops uuid[], p_activities uuid[], p_intro text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if coalesce(trim(p_client), '') = '' then
    raise exception 'Nav norādīts klients';
  end if;
  -- Aizsardzība pret surogātpastu: ne vairāk kā 30 šādu prezentāciju stundā
  if (select count(*) from public.presentations where created_by = 'klients (salikt)' and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Pārāk daudz pieprasījumu';
  end if;
  insert into public.presentations (client_name, title, event_date, place, children, hours, workshop_ids, activity_ids, intro, created_by)
  values (
    left(trim(p_client), 160),
    left(p_title, 200),
    p_date,
    left(p_place, 200),
    case when p_children between 1 and 100000 then p_children end,
    case when p_hours between 0 and 24 then p_hours end,
    coalesce(array(select w.id from public.workshops w where w.id = any(coalesce(p_workshops, '{}'))), '{}'),
    coalesce(array(select c.id from public.cost_items c where c.id = any(coalesce(p_activities, '{}')) and c.kind = 'activity'), '{}'),
    left(p_intro, 3000),
    'klients (salikt)'
  )
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.create_client_presentation(text, text, date, text, int, numeric, uuid[], uuid[], text) to anon, authenticated;
