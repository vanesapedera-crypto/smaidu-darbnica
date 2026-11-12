-- =====================================================================
-- Publiskā lapa "Salikt piedāvājumu" (/uznemumiem/salikt): klients atzīmē darbnīcas un aktivitātes
-- un redz aptuveno cenu ar PVN. Funkcija atdod TIKAI gatavas cenas klientam (pašizmaksa un materiāli nav redzami).
-- Rāda darbnīcas un aktivitātes, kurām panelī ievadīta cena (> 0). Palaist var atkārtoti.
-- =====================================================================

create or replace function public.configurator_prices()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select
      (1 + coalesce(nullif(data->>'markup', '')::numeric, 0) / 100) * (1 + coalesce(nullif(data->>'vat', '')::numeric, 21) / 100) as k,
      coalesce(nullif(data->>'animatorHour', '')::numeric, 0) as animator_hour,
      coalesce(nullif(data->>'perAnimator', '')::numeric, 15) as per_animator
    from public.calc_settings
    where id = 1
  ),
  ws as (
    select w.id, w.title, w.description, w.image,
      coalesce(sum(
        coalesce(m.price, nullif(i->>'price', '')::numeric, 0)
        / (case when nullif(i->>'qty', '')::numeric > 0 then nullif(i->>'qty', '')::numeric else 1 end)
      ), 0) as cost
    from public.workshops w
    left join lateral jsonb_array_elements(case when jsonb_typeof(w.items) = 'array' then w.items else '[]'::jsonb end) i on true
    left join public.materials m on m.id::text = i->>'materialId'
    group by w.id
  )
  select jsonb_build_object(
    'factor', (select k from s),
    'animatorHour', round((select animator_hour * k from s), 2),
    'perAnimator', (select per_animator from s),
    'workshops', coalesce((
      select jsonb_agg(jsonb_build_object('id', ws.id, 'title', ws.title, 'description', ws.description, 'image', ws.image,
        'perPerson', round(ws.cost * (select k from s), 2)) order by ws.title)
      from ws where ws.cost > 0), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'description', c.description, 'image', c.image,
        'unit', c.unit, 'price', round(c.cost * (select k from s), 2)) order by c.sort, c.title)
      from public.cost_items c where c.kind = 'activity' and c.cost > 0), '[]'::jsonb)
  );
$$;

grant execute on function public.configurator_prices() to anon, authenticated;
