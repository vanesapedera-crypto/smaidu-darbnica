-- Izbraukuma ballītēm automātiski aprēķinātie ceļa izdevumi (Pasta iela 25, Tukums → adrese, turp un atpakaļ).
alter table public.bookings add column if not exists travel_km numeric(7, 1);
alter table public.bookings add column if not exists travel_cost numeric(8, 2);
