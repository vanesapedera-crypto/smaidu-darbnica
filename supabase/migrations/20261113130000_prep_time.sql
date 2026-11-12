-- =====================================================================
-- Lapa "Salikt piedāvājumu": sagatavošanās un novākšanas laiks radošajām darbnīcām un laiks ceļā; izrāžu cena bez PVN; telpas noma izrādei
-- (likme un stundas — 💰 Cenas → Pakalpojumi → likmes). Palaist var atkārtoti.
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
      coalesce(nullif(data->>'perAnimator', '')::numeric, 15) as per_animator,
      coalesce(nullif(data->>'prepHour', '')::numeric, 15) as prep_hour,
      coalesce(nullif(data->>'prepHours', '')::numeric, 1) as prep_hours,
      coalesce(nullif(data->>'travelHour', '')::numeric, 5) as travel_hour,
      coalesce(nullif(data->>'venueMin', '')::numeric, 300) as venue_min,
      coalesce(nullif(data->>'minTotal', '')::numeric, 600) as min_total,
      coalesce(nullif(data->>'peakPercent', '')::numeric, 50) as peak_percent,
      coalesce(nullif(data->>'decorPerWorkshop', '')::numeric, 30) as decor,
      1 + coalesce(nullif(data->>'vat', '')::numeric, 21) / 100 as vat_k
    from public.calc_settings
    where id = 1
  ),
  ws as (
    select w.id, w.title, w.description, w.image, w.season,
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
    'prepHour', round((select prep_hour * k from s), 2),
    'prepHours', (select prep_hours from s),
    'travelHour', round((select travel_hour * k from s), 2),
    'venueMin', round((select venue_min * vat_k from s), 2),
    'minTotal', round((select min_total * vat_k from s), 2),
    'peakPercent', (select peak_percent from s),
    'decorPerWorkshop', round((select decor * vat_k from s), 2),
    'workshops', coalesce((
      select jsonb_agg(jsonb_build_object('id', ws.id, 'title', ws.title, 'description', ws.description, 'image', ws.image, 'season', ws.season,
        'perPerson', round(ws.cost * (select k from s), 2)) order by ws.title)
      from ws where ws.cost > 0), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'description', c.description, 'image', c.image, 'season', c.season,
        'unit', c.unit,
        -- Izrādēm ievada cenu klientam bez PVN (bez uzcenojuma), pārējiem — izmaksas (ar uzcenojumu)
        'price', round(c.cost * (select case when c.title ilike '%izrād%' then vat_k else k end from s), 2)) order by c.sort, c.title)
      from public.cost_items c where c.kind = 'activity' and c.cost > 0), '[]'::jsonb)
  );
$$;

grant execute on function public.configurator_prices() to anon, authenticated;
