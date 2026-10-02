# Smaidu Darbnīca — mājaslapa

Next.js 16 (App Router) + Supabase + Tailwind CSS 4.
Publiskā mājaslapa uzņēmumu klientiem un administrēšanas panelis `/admin`.

## Palaišana

```bash
npm install
cp .env.example .env.local   # un ievadiet Supabase datus
npm run dev                  # http://localhost:3000
```

Pirms produkcijas: `npm run build && npm start`. Datubāzes uzstādīšana — [supabase/README.md](supabase/README.md).

| Komanda | Ko dara |
|---|---|
| `npm run dev` | Izstrādes serveris |
| `npm run build` | Produkcijas būvējums |
| `npm run lint` / `npm run typecheck` | Koda pārbaudes |
| `npm run images` | Optimizē fotogrāfijas no `media-src/` uz `public/media/` |
| `npm run seed` | Ģenerē `supabase/seed.sql` no noklusējuma satura |

## Struktūra

```
src/
  app/
    (site)/            publiskā mājaslapa (kopīgs Navbar + Footer)
      page.tsx           sākumlapa
      pakalpojumi/       uzņēmumu pakalpojumi + [slug] lapas
      privatpersonam/    bērnu ballītes, telpu noma, rezervācijas forma
      galerija/ par-mums/ kontakti/ privatuma-politika/
    admin/
      login/             pieteikšanās
      (panel)/           aizsargātās paneļa lapas
        page.tsx           pieteikumi (bookings)
        [entity]/          universāls saraksts + rediģēšana (pakalpojumi, atsauksmes, klienti, komanda, SEO)
        galerija/          galerija ar masveida augšupielādi
        iestatijumi/[key]  sākumlapa, par mums, kontakti, SEO iestatījumi
      actions.ts         servera darbības (visas pārbauda requireAdmin)
    api/bookings/        pieteikumu API (POST publisks, PATCH tikai adminam)
    sitemap.ts robots.ts
  proxy.ts             /admin aizsardzība un sesijas atjaunošana
  components/
    site/              publiskās vietnes komponentes
    admin/             paneļa komponentes
  lib/
    content/           satura tipi, noklusējuma saturs, Supabase vaicājumi
    admin/             paneļa lauku un satura veidu konfigurācija
    auth.ts seo.ts schema.ts pricing.ts validation.ts
  data/media.json      optimizēto attēlu manifests (ģenerēts)
public/media/          optimizētās fotogrāfijas
supabase/              migrācijas un seed
```

## Kā darbojas saturs

1. Publiskās lapas nolasa saturu no Supabase (`lib/content/queries.ts`).
2. Ja tabula nav pieejama, tiek rādīts noklusējuma saturs no `lib/content/defaults` — lapa nekad "nenokrīt".
3. Lapas ir statiski ģenerētas un kešotas (`revalidate = 3600`). Saglabājot izmaiņas panelī,
   tiek izsaukts `revalidatePath`, tāpēc izmaiņas redzamas uzreiz.

## Jaunu fotogrāfiju pievienošana

- **Panelī:** Galerija → "Pievienot attēlus". Attēli tiek samazināti pārlūkā un saglabāti Supabase Storage.
- **Projektā:** ielieciet oriģinālus `media-src/<albums>/`, aprakstiet albumu `scripts/media-albums.json`, palaidiet `npm run images`.

## Dizaina sistēma

Krāsas un tipogrāfija — `src/app/globals.css` (`--brand` #FFD54A, `--ink` #1F2937).
Dzeltenais netiek lietots kā teksta krāsa uz balta fona (kontrasts), tikai kā fons, ikonas un akcenti.
