-- Pakalpojumu sezonas lapā "Uzņēmumiem": "ziema" | "vasara" | "visu-gadu".
-- Viens pakalpojums var būt vairākās sezonās (piem. radošās darbnīcas — ziemā un vasarā).
alter table public.services add column if not exists seasons jsonb not null default '[]';

-- Esošajiem (jau ievietotajiem) noklusējuma pakalpojumiem aizpilda sezonas.
-- Tikai tur, kur sezonas vēl nav iestatītas — panelī veiktās izmaiņas netiek pārrakstītas.
update public.services s
set seasons = v.seasons::jsonb
from (values
  ('komandas-saliedesana',  '["visu-gadu"]'),
  ('sporta-speles',         '["vasara","visu-gadu"]'),
  ('uznemumu-pasakumi',     '["visu-gadu"]'),
  ('vasaras-pasakumi',      '["vasara"]'),
  ('ziemassvetku-pasakumi', '["ziema"]'),
  ('radosas-darbnicas',     '["ziema","vasara"]'),
  ('lielformata-speles',    '["vasara"]'),
  ('burbulu-sovi',          '["vasara"]'),
  ('seju-apgleznosana',     '["vasara","visu-gadu"]'),
  ('bernu-zona',            '["visu-gadu"]'),
  ('animatori-un-teli',     '["ziema","visu-gadu"]')
) as v(slug, seasons)
where s.audience = 'business' and s.slug = v.slug and s.seasons = '[]'::jsonb;
