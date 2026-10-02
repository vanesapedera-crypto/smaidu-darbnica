-- =====================================================================
-- Smaidu Darbnīca — drošība un satura tabulas
--
-- Palaišana: Supabase → SQL Editor → ielīmēt visu failu → Run.
-- Skripts ir drošs atkārtotai palaišanai (if not exists / or replace).
-- Esošie dati `bookings` tabulā netiek dzēsti.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Administratori
--    Piekļuvi panelim iegūst tikai lietotāji, kas pievienoti šai tabulai.
--    Lietotāju izveido: Authentication → Users → Add user.
--    Tad:  insert into public.admins (user_id) select id from auth.users where email = '...';
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Politiku nav: tabulu nevar lasīt ne anonīmi, ne parasti lietotāji.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;


-- Kopīga funkcija updated_at laukam
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. Pieteikumi (esošā tabula) — jauni lauki uzņēmumu pieprasījumiem
-- ---------------------------------------------------------------------
alter table public.bookings add column if not exists created_at    timestamptz default now();
alter table public.bookings add column if not exists inquiry_type  text default 'private';
alter table public.bookings add column if not exists company_name  text;
alter table public.bookings add column if not exists contact_role  text;
alter table public.bookings add column if not exists participants  integer;
alter table public.bookings add column if not exists event_type    text;
alter table public.bookings add column if not exists event_city    text;
alter table public.bookings add column if not exists budget_range  text;
alter table public.bookings add column if not exists service_slug  text;
alter table public.bookings add column if not exists consent       boolean default false;
alter table public.bookings add column if not exists admin_notes   text;
alter table public.bookings alter column status set default 'Jauns';

alter table public.bookings enable row level security;

-- Noņem VISAS iepriekšējās politikas (to nosaukumi nav zināmi), jo tās
-- visticamāk ļāva anonīmam lietotājam lasīt un labot pieteikumus.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'bookings' loop
    execute format('drop policy %I on public.bookings', p.policyname);
  end loop;
end $$;

-- Ikviens var iesniegt jaunu pieteikumu (tikai ar statusu "Jauns")
create policy "bookings_insert_public" on public.bookings
  for insert to anon, authenticated
  with check (coalesce(status, 'Jauns') = 'Jauns');

-- Lasīt, labot un dzēst var tikai administrators
create policy "bookings_admin_select" on public.bookings
  for select to authenticated using (public.is_admin());
create policy "bookings_admin_update" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings_admin_delete" on public.bookings
  for delete to authenticated using (public.is_admin());


-- ---------------------------------------------------------------------
-- 3. Satura tabulas
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  audience        text not null default 'business' check (audience in ('business', 'private')),
  title           text not null,
  excerpt         text not null default '',
  intro           text not null default '',
  body            text not null default '',
  highlights      jsonb not null default '[]',
  suitable_for    jsonb not null default '[]',
  activities      jsonb not null default '[]',
  pricing         jsonb not null default '[]',
  pricing_note    text not null default '',
  faq             jsonb not null default '[]',
  age             text not null default '',
  duration        text not null default '',
  participants    text not null default '',
  icon            text not null default 'Sparkles',
  hero_image      text not null default '',
  albums          jsonb not null default '[]',
  seasons         jsonb not null default '[]',
  sort            integer not null default 100,
  published       boolean not null default true,
  seo_title       text not null default '',
  seo_description text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (audience, slug)
);

create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  src        text not null,
  alt        text not null default '',
  album      text not null default '',
  category   text not null default '',
  width      integer,
  height     integer,
  blur       text,
  sort       integer not null default 100,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gallery_images_album_idx on public.gallery_images (album);

create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  role       text not null default '',
  company    text not null default '',
  text       text not null,
  logo       text not null default '',
  sort       integer not null default 100,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo       text not null default '',
  url        text not null default '',
  sort       integer not null default 100,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null default '',
  bio        text not null default '',
  photo      text not null default '',
  sort       integer not null default 100,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_seo (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,
  title       text not null default '',
  description text not null default '',
  og_image    text not null default '',
  noindex     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);


-- updated_at trigeri un RLS visām satura tabulām
do $$
declare t text;
begin
  foreach t in array array['services','gallery_images','testimonials','clients','team_members','page_seo','site_settings'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s_admin_all" on public.%1$s', t);
    execute format('create policy "%1$s_admin_all" on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Publiski lasāms tikai publicētais saturs
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services for select to anon, authenticated using (published);

drop policy if exists "gallery_images_public_read" on public.gallery_images;
create policy "gallery_images_public_read" on public.gallery_images for select to anon, authenticated using (published);

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials for select to anon, authenticated using (published);

drop policy if exists "clients_public_read" on public.clients;
create policy "clients_public_read" on public.clients for select to anon, authenticated using (published);

drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read" on public.team_members for select to anon, authenticated using (published);

drop policy if exists "page_seo_public_read" on public.page_seo;
create policy "page_seo_public_read" on public.page_seo for select to anon, authenticated using (true);

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select to anon, authenticated using (true);


-- ---------------------------------------------------------------------
-- 4. Attēlu krātuve (augšupielādes no administrēšanas paneļa)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update set public = true;

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
