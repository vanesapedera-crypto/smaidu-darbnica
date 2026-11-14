-- =====================================================================
-- Atgādinājumi komandai pirms pasākuma: no rīta ("Šodien …") un ~3 stundas pirms sākuma.
-- Supabase ik pēc 15 minūtēm izsauc mājaslapas adresi /api/cron/staff-reminders (pg_cron + pg_net),
-- tā pati izlemj, kam jau ir pienācis laiks. Palaist var atkārtoti.
-- =====================================================================

alter table public.booking_staff add column if not exists reminded_day_at timestamptz;
alter table public.booking_staff add column if not exists reminded_3h_at  timestamptz;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule('sd-staff-reminders');
exception when others then null;
end $$;

select cron.schedule(
  'sd-staff-reminders',
  '*/15 * * * *',
  $$ select net.http_get('https://www.smaidudarbnica.lv/api/cron/staff-reminders') $$
);
