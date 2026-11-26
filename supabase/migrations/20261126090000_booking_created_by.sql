-- Kurš pievienoja rezervāciju panelī ("Vanesa", "Kristīne"); mājaslapas pieteikumiem — null
alter table public.bookings add column if not exists created_by text;
