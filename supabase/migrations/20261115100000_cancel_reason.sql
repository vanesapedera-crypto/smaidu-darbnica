-- Atcelšanas iemesls (panelī pie atceltajām rezervācijām). Palaist var atkārtoti.
alter table public.bookings add column if not exists cancel_reason text;
