-- Kad klientam nosūtīts atsauksmes pieprasījums (panelī poga "Pieprasīt atsauksmi")
alter table public.bookings add column if not exists review_requested_at timestamptz;
