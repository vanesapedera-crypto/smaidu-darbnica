-- Radošajām darbnīcām: pašizmaksu 1 personai var ievadīt uzreiz (bez izejmateriāliem un aprēķina). Palaist var atkārtoti.
alter table public.workshops add column if not exists fixed_cost numeric;
