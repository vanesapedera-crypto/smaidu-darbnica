-- 1) Komandas grafiks
create table if not exists public.team_events (
  id          uuid primary key default gen_random_uuid(),
  event_date  date not null,
  time        text,
  title       text not null,
  place       text,
  team        text,
  details     text,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.team_events enable row level security;

drop policy if exists "team_events_read" on public.team_events;
create policy "team_events_read" on public.team_events
  for select to authenticated using (public.is_admin() or (published and public.has_section('kalendars')));
drop policy if exists "team_events_admin_write" on public.team_events;
create policy "team_events_admin_write" on public.team_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Grafiks 28.11.–20.12.2026 (visi — paslēpti, kamēr nav pārbaudīti)
insert into public.team_events (event_date, time, title, place, team, details)
select v.event_date::date, v.time, v.title, v.place, v.team, v.details from (values
  ('2026-11-28', '16.00–16.30', 'Jūrmalas atklāšana', 'Jūrmala', 'Gunta, Madara K., Agija, Madara R. (Olafs)', 'Braucam ar busiņu.'),
  ('2026-11-28', '18.00', 'Izrāde „Dāvanu recepte”', '', 'Agija, Madara K., Madara R., Gunta, Juris, Mārtiņš, Rihards, Niks', ''),
  ('2026-11-29', '17.00', 'Olaines egles iedegšana', 'Olaine', 'Keita, Madara R. (rūķis), Madara K., Gunta', ''),
  ('2026-12-04', '15.30', 'Egles iedegšana', 'Cīravas kultūras nams', 'Madara R., Agija', ''),
  ('2026-12-04', '18.00', 'Madonas egles iedegšana', 'Madona', 'Madara K., Gunta, Aivars, Keita (Olafs)', ''),
  ('2026-12-05', '11.30', 'Izrāde „Dāvanu recepte”', 'Bauska', 'Katrīna, Keita, Juris, Madara K., Gunta, Agija, Rihards, Niks, Mārtiņš', 'Izbraucam plkst. 6.00.'),
  ('2026-12-05', '16.00–18.30', 'Jūrmalas atklāšanas pasākums', 'Jūrmala', 'Madara K., Gunta, Keita (Olafs līdz 21.00)', ''),
  ('2026-12-05', '18.30–21.00', 'Jūrmalas atklāšanas pasākums — rotaļuzvedums', 'Jūrmala', 'Agija, Dana', 'Novadu rotaļuzvedumu 1x.'),
  ('2026-12-05', '18.00', 'Nīcas egles iedegšana', 'Nīca', 'Madara R., Ramona', '14.00 — izbraukšana no Tukuma. Video zvans vai satikšanās — ko darīs!!'),
  ('2026-12-06', '18.00', 'Egles iedegšana', 'Ozolnieku tautas nams', 'Agija, Madara K.', ''),
  ('2026-12-11', '18.00–21.00', 'Jūrmala', 'Jūrmala', 'Gunta, Madara R., Keita', ''),
  ('2026-12-11', 'vakarā', 'Uzstādīšana Dobeles dzirnavnieka pasākumam', 'Dobele', 'Agija, Madara K., Mārtiņš', ''),
  ('2026-12-12', '9.30–12.00', 'Dobeles dzirnavnieka pasākums — izrāde “Dāvanu recepte”', 'Dobele, Dobeles Sporta halle', 'Agija, Madara K., Gunta, Keita, Juris, Mārtiņš, Niks, Rihards', ''),
  ('2026-12-12', 'no rīta', 'Brauc sagatavoties pasākumam', 'Rīga, “Padejosim” telpas', 'Kristīne, Madara R., Vanesa', ''),
  ('2026-12-12', '15.00–18.00', 'Izrāde “Dāvanu recepte” + radošās darbnīcas', 'Rīga, “Padejosim”', 'Gunta, Madara R., Madara K., Keita, Katrīna, Agija, Uģis, Vanesa, Rihards, Niks, Megija, Maija', 'Gunta pēc izrādes brauc prom. Darbnīcu sadalījumu precizēsim pirmdien.
Pēc pasākuma visu novācam, sapakojam un braucam uz Liepāju. Tur uzstādāmies un paliekam pa nakti.'),
  ('2026-12-12', '16.00–18.00', 'ALTUM pasākums', '', 'Anita, Juris, Kristīne', 'Vēl jāizdomā programma un jānosūta piedāvājums.'),
  ('2026-12-13', 'laiki jāprecizē', 'Divas izrādes “Dāvanu recepte” + radošās darbnīcas + Olafs', 'Liepāja', 'Keita, Katrīna, Megija, Maija, Uģis, Mārtiņš, Niks, Rihards, Gunta, Madara R., Madara K., Agija', 'Pārbraucienu detaļas vēl precizēsim.'),
  ('2026-12-14', '9.00–10.00', 'Sesava', 'Sesava', 'Juris, Agija', 'Bērni 3–4 gadu vecumā. Programma — 30 minūtes.'),
  ('2026-12-14', '10.30–11.30', 'Eleja', 'Eleja', 'Juris, Agija', 'Programma — 30 minūtes.'),
  ('2026-12-14', '12.00–13.00', 'Lielplatone', 'Lielplatone', 'Juris, Agija', '2 grupiņas.'),
  ('2026-12-14', '16.30 un 17.40', 'Rūķis + Ziemassvētku vecītis', 'Jelgava, bērnudārzs', 'Madara R., Uģis', ''),
  ('2026-12-15', '9.30–10.30 un 11.30–12.30', 'Ziemassvētku pasākumi', 'Dobele, “Pilsētas māja”', 'Vanesa, Agija', ''),
  ('2026-12-15', '12.00–12.40', 'Ziemassvētku rotaļuzvedums — 135 bērni', 'Kandava, Skolas iela 10', 'Gunta, Madara K.', ''),
  ('2026-12-16', '9.30–10.30', 'Ziemassvētku pasākums', 'Dobele, “Pilsētas māja”', 'Agija, Vanesa', ''),
  ('2026-12-16', '16.30', 'Rūķis + Ziemassvētku vecītis', 'Sloka, bērnudārzs', 'Gunta, Uģis', ''),
  ('2026-12-16', '17.00–19.00', 'Rotaļuzvedums + radošās darbnīcas', 'Jūrmalas slimnīca', 'Agija, Madara K., Madara R.', ''),
  ('2026-12-17', '16.00 un 17.00', 'Ziemassvētku pasākumi', 'Rīga, bērnudārzs, Eiženijas iela 8', 'Agija, Agris (Ziemassvētku vecītis)', ''),
  ('2026-12-18', '10.00–11.30', 'Jelgavas pansionāts', 'Jelgavas pansionāts', 'Gunta, Madara R., Juris', ''),
  ('2026-12-18', '10.00–11.30', 'Smaidu darbnīca', 'Smaidu darbnīca', 'Madara K., Agija', ''),
  ('2026-12-18', '16.00 un 17.00', 'Rūķis + Ziemassvētku vecītis', 'Rīga, bērnudārzs', 'Agris, Diāna', ''),
  ('2026-12-18', '18.00', 'Jaunā izrāde', 'Pastende', 'Madara K., Madara R., Gunta, Juris, grupa, Rihards, Niks, Mārtiņš, Vanesa', ''),
  ('2026-12-18', '18.00–21.00', 'Jūrmala', 'Jūrmala', 'Agija, Keita, Dana', ''),
  ('2026-12-19', '10.00–13.00', 'Zabbix pasākums', 'Akropoles kino', 'Vanesa, Keita, Agija, Madara R., Juris', '2 rūķi + sejiņu apgleznošana + Ziemassvētku vecītis.'),
  ('2026-12-19', '12.00–14.30', 'Koncerts/izrāde bērniem', 'Bauska', 'Madara K., Gunta; Katrīna — Olafs', '12.00–12.30 — koncerts/izrāde bērniem 3–4 gadu vecumā.
14.00–14.30 — koncerts/izrāde vai aktivitātes bērniem 5–7 gadu vecumā.
Abas programmas Lielajā zālē. Pēc katras — paciņu saņemšana pie Ziemassvētku vecīša Izstāžu zālē.'),
  ('2026-12-19', 'izbraukšana 14.30', 'Pārbrauciens Bauska → Jūrmala', 'Bauska → Jūrmala', 'Mārtiņš — šoferis; Madara K. un Gunta — pasažieres', 'Mārtiņš paņem Madaru K. un Guntu Bauskā un ved uz Jūrmalu. Tikmēr Jūrmalā grupa skaņojas.'),
  ('2026-12-19', '16.00–16.30', 'Muzikālais uzvedums “Iemirdzies”', 'Jūrmala', 'Madara K., Gunta, grupa', ''),
  ('2026-12-19', '16.30–21.00', 'Rūķošanās', 'Jūrmala', 'Madara R., Agija, Keita', ''),
  ('2026-12-20', '13.00 un 15.00', 'Rīgas satiksmes pasākums', '', 'Agija, Vanesa, Sandra, Anita', 'Četras radošās darbnīcas — katrā 3 rūķi: vēstuļu rakstīšana, saldējuma darbnīca, eglīšu rotājumu veidošana, Ziemassvētku keksiņu dekorēšana.
Pirms dāvaniņu dalīšanas — 3 aktivitātes ar 2 rūķiem un Ziemassvētku vecīti, pēc tam dāvaniņu dalīšana.
Kopā nepieciešami 16 cilvēki. Šobrīd sarakstā 4 — vēl vajag 12 cilvēkus.'),
  ('2026-12-20', '13.00', 'STIGA pasākums — jaunā izrāde', 'Slampe', 'Gunta, Madara K., Madara R., Uģis, Mārtiņš, grupa, Niks', '')
) as v(event_date, time, title, place, team, details)
where not exists (select 1 from public.team_events);

-- 2) Sezonas darbnīcām un pakalpojumiem
alter table public.workshops add column if not exists season text not null default 'all';
alter table public.cost_items add column if not exists season text not null default 'all';

-- 3) Automātiska prezentācija no klienta izvēles
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

-- 4) Cenas lapai "Salikt piedāvājumu"
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
    -- Telpas noma izrādei: summa ar PVN, kā ievadīta likmēs (piem. no 300 €)
    'venueMin', (select venue_min from s),
    'minTotal', round((select min_total * vat_k from s), 2),
    'peakPercent', (select peak_percent from s),
    'decorPerWorkshop', round((select decor * vat_k from s), 2),
    'workshops', coalesce((
      select jsonb_agg(jsonb_build_object('id', ws.id, 'title', ws.title, 'description', ws.description, 'image', ws.image, 'season', ws.season,
        'perPerson', round(ws.cost * (select k from s), 2)) order by ws.title)
      from ws where not exists (select 1 from public.cost_items c where c.kind = 'activity' and lower(c.title) = lower(ws.title))), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'description', c.description, 'image', c.image, 'season', c.season,
        'unit', c.unit,
        -- Izrādēm ievada cenu klientam bez PVN (bez uzcenojuma), pārējiem — izmaksas (ar uzcenojumu)
        'price', round(c.cost * (select case when c.title ilike '%izrād%' then vat_k else k end from s), 2)) order by c.sort, c.title)
      from public.cost_items c where c.kind = 'activity'), '[]'::jsonb)
  );
$$;

grant execute on function public.configurator_prices() to anon, authenticated;

-- 5) Papildu aktivitātes (cenas ievada 💰 Cenas → Pakalpojumi). Tējnīca un SPA zona — aktivitātes, nevis darbnīcas:
--    klientu saitē darbnīca, kuras nosaukums sakrīt ar aktivitāti, netiek rādīta.
insert into public.cost_items (kind, title, unit, sort, season)
select 'activity', v.title, 'hour', v.sort, 'all'
from (values
  ('Pārsteiguma tēls', 5),
  ('Tējnīca', 15),
  ('SPA zona', 16),
  ('Glitera spīdumi sejiņai', 25),
  ('Slaima ballīte', 55),
  ('Putu ballīte', 56)
) as v(title, sort)
where not exists (select 1 from public.cost_items c where lower(c.title) = lower(v.title));

-- 6) Radošās darbnīcas (materiālus un cenas ievada 💰 Cenas → Radošās darbnīcas).
--    Esošās pārsauc, lai nebūtu dublikātu (materiāli saglabājas).
update public.workshops set title = 'Kroņu darbnīca' where lower(title) = 'kroņi'
  and not exists (select 1 from public.workshops w where lower(w.title) = 'kroņu darbnīca');
update public.workshops set title = 'Fejas nūjiņas' where lower(title) = 'feju nūjiņas'
  and not exists (select 1 from public.workshops w where lower(w.title) = 'fejas nūjiņas');
update public.workshops set title = 'Sveču dekorēšanas darbnīca' where lower(title) = 'sveču darbnīca'
  and not exists (select 1 from public.workshops w where lower(w.title) = 'sveču dekorēšanas darbnīca');

insert into public.workshops (title, items, season)
select v.title, '[]'::jsonb, v.season
from (values
  ('Piparkūku dekorēšana', 'xmas'),
  ('Slaimu veidošana', 'all'),
  ('Keksiņu dekorēšana', 'all'),
  ('Piparkūku krāsošana', 'xmas'),
  ('Kroņu darbnīca', 'all'),
  ('Fejas nūjiņas', 'all'),
  ('Virtuļu darbnīca', 'all'),
  ('T-kreklu darbnīca', 'all'),
  ('Eglīšu rotājumi', 'xmas'),
  ('Nospiedumu glezna', 'all'),
  ('Koka vilciņu darbnīca', 'all'),
  ('Piekariņu darbnīca', 'all'),
  ('Aploksnītes', 'all'),
  ('Rokassprādzes', 'all'),
  ('Sveču dekorēšanas darbnīca', 'all')
) as v(title, season)
where not exists (select 1 from public.workshops w where lower(w.title) = lower(v.title));
