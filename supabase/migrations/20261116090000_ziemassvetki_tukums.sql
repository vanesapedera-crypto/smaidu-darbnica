-- Jauna programma "Ziemassvētki Smaidu Darbnīcā" — kopija no "Ziemassvētki “Pilsētas mājā” Dobelē",
-- cena 295 € līdz 15 bērniem (+8 € par katru nākamo). Lapa: /izklaides-programmas/ziemassvetki-tukums. Palaist var atkārtoti.
insert into public.services (slug, audience, title, excerpt, intro, body, highlights, suitable_for, activities, pricing, pricing_note, faq,
  age, duration, participants, icon, hero_image, albums, seasons, sort, published, seo_title, seo_description)
select 'ziemassvetki-tukums', audience, 'Ziemassvētki Smaidu Darbnīcā', excerpt, intro, body, highlights, suitable_for, activities,
  jsonb_set(pricing, '{0,options,0,price}', '295'::jsonb), pricing_note, faq,
  age, duration, participants, icon, hero_image, albums, seasons, sort + 5, published,
  'Ziemassvētki bērniem Smaidu Darbnīcā Tukumā',
  'Maģisks Ziemassvētku piedzīvojums bērniem Smaidu Darbnīcā Tukumā: satikšanās ar rūķiem, spīdīgo nūjiņu deja, Ziemassvētku rotājuma pagatavošana. 1 stunda.'
from public.services
where slug = 'ziemassvetki-dobele'
  and not exists (select 1 from public.services where slug = 'ziemassvetki-tukums');
