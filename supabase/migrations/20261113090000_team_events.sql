-- =====================================================================
-- Komandas grafiks: pasākumi, kas nav mājaslapas pieteikumi (izrādes, egļu iedegšanas u. c.).
-- Labo administratore sadaļā "Komandas grafiks"; komanda kalendārā redz tikai tos, kam ieslēgts "Rādīt kalendārā".
-- Jāpalaiž PĒC 20261107120000_team_sections.sql. Palaist var atkārtoti (pasākumus ieliek tikai, ja tabula ir tukša).
-- =====================================================================

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
