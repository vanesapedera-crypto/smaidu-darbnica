# Supabase uzstādīšana

Veicams vienu reizi, pirms jaunā mājaslapa tiek palaista produkcijā.
Līdz tam mājaslapa strādā ar noklusējuma saturu no `src/lib/content/defaults`,
bet administrēšanas panelis bez migrācijas nedarbosies.

## 1. Migrācija (drošība + satura tabulas)

Supabase → **SQL Editor** → ielīmējiet un palaidiet **pēc kārtas** abus failus:

```
supabase/migrations/20260928120000_admin_security_and_content.sql
supabase/migrations/20260929090000_service_seasons.sql
supabase/migrations/20261001090000_booking_travel.sql
supabase/migrations/20261003090000_booked_venue_slots.sql
supabase/migrations/20261008090000_booked_venue_slots_fixed_venues.sql
```

Tas:

- pievieno jaunus laukus esošajai `bookings` tabulai (esošie pieteikumi paliek);
- **noņem vecās `bookings` piekļuves politikas** un atļauj pieteikumus lasīt/labot tikai administratoram;
- izveido tabulas `services`, `gallery_images`, `testimonials`, `clients`, `team_members`, `page_seo`, `site_settings`, `admins`;
- izveido publisku attēlu krātuvi `media`.

Skriptu var palaist atkārtoti.

## 2. Sākuma dati (seed)

SQL Editor → palaidiet `supabase/seed.sql`.
Tas ievieto pakalpojumus, programmas, galeriju, komandu, klientus un lapu tekstus.
Esošie ieraksti netiek pārrakstīti.

Ja maināt noklusējuma saturu kodā, seed failu var ģenerēt no jauna: `npm run seed`.

## 3. Administratora konts

1. **Authentication → Users → Add user** — ievadiet e-pastu un paroli (atzīmējiet *Auto Confirm User*).
2. SQL Editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'jusu-epasts@example.com';
   ```

3. Ieteicams: **Authentication → Sign In / Providers → Email** izslēgt *Allow new users to sign up*.

Panelis: `/admin` (pieteikšanās `/admin/login`).

## Pārbaude

- Atveriet `/admin` bez pieteikšanās → jāpāradresē uz `/admin/login`.
- Nosūtiet testa pieteikumu no `/kontakti` → tam jāparādās panelī.
