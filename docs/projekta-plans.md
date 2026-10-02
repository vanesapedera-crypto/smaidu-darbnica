# Smaidu Darbnīca — jaunās mājaslapas plāns

*Versija 1 · 2026-09-28*

> **Statuss (2026-09-28):** plāns apstiprināts un īstenots kodā — posmi 0–10.
> Neizdarītais: Supabase migrācijas palaišana, admin lietotāja izveide, `npm run build` un Lighthouse mērījums
> (izstrādes vidē nebija piekļuves npm reģistram un Supabase). Sk. `supabase/README.md`.
>
> Atkāpes no plāna:
> - Autentifikācija izveidota ar esošo `@supabase/supabase-js` (bez `@supabase/ssr`), validācija — bez `zod`: jaunas atkarības netika pievienotas.
> - Attēli paliek projekta mapē (`public/media`, optimizēti ar `npm run images`), jaunie augšupielādes attēli — Supabase Storage.
> - Pievienots 11. pakalpojums “Animatori un tematiskie tēli”.
> - Atsauksmes netiek izdomātas — sadaļa parādās, kad panelī pievienota pirmā īstā atsauksme.

---

## 1. Esošā projekta analīze

### 1.1 Tehnoloģijas

| Slānis | Esošais | Vērtējums |
|---|---|---|
| Ietvars | Next.js 16.3 (App Router), React 19.2, React Compiler | Moderns, paturam |
| Stils | Tailwind CSS v4, shadcn/ui (`base-luma`, Base UI) | Paturam, pārveidojam tēmu |
| Dati | Supabase (`@supabase/supabase-js`), viena tabula `bookings` | Paturam, paplašinām |
| Karuselis | `embla-carousel-react` + autoplay | Paturam |
| Lightbox | `yet-another-react-lightbox` — **instalēts, bet netiek lietots** | Izmantosim galerijā |
| Ikonas | `lucide-react` + `react-icons` (dublējas) | Atstājam tikai `lucide-react` |
| Git | 2 commit'i, `.env.local` pareizi ignorēts | OK |

### 1.2 Struktūra

```
src/
  app/
    page.tsx              ← SĀKUMLAPA = kontaktu lapas kopija (kļūda)
    admin/page.tsx        ← administrēšanas panelis
    api/bookings/route.ts        POST  – jauns pieteikums
    api/bookings/[id]/route.ts   PATCH – statusa maiņa
    programmas/, programmas/[slug]/   bērnu ballīšu katalogs (13 programmas)
    uznemumiem/           korporatīvie pasākumi (Navbar renderēts 2×)
    telpu-noma/, par-mums/, kontakti/, pieteikt/
  components/  home/ contact/ gallery/ programs/ about/ admin/ layout/ ui/
  data/
    programs.ts           visa programmu informācija (1021 rinda, cietkodēta)
    programs.ts.save      vecs dublikāts
    galleries.ts          ģenerēts ar scripts/generate-gallery.mjs
  lib/supabase.ts         viens klients ar publisko (anon) atslēgu
public/images/            ~210 attēli (95 JPG + 118 WebP), 37 MB
```

### 1.3 Kā darbojas administrēšanas panelis

- `/admin` ir **viena** servera komponente: nolasa visu `bookings` tabulu (kārtots pēc `event_date`) un parāda tabulā.
- Vienīgā darbība — statusa maiņa (`Jauns` / `Apstiprināta` / `Atcelta`) ar `StatusSelect` → `PATCH /api/bookings/[id]` → `router.refresh()`.
- Nav izkārtojuma, navigācijas, meklēšanas, filtru vai detaļu skata (netiek rādīts ziņojums, adrese, bērnu skaits u.c.).

### 1.4 Kā tiek glabāti dati

| Dati | Kur | Rediģējams no paneļa? |
|---|---|---|
| Pieteikumi | Supabase `bookings` | Tikai statuss |
| Programmas / pakalpojumi | `src/data/programs.ts` | Nē — tikai kodā |
| Galerijas | `public/images/…` + `galleries.ts` | Nē |
| Kontakti, sociālie tīkli | Cietkodēti 6+ komponentēs | Nē |
| Komanda, atsauksmes, klienti | Komandas bildes ir; atsauksmju/klientu nav | Nē |

`bookings` kolonnas (secinātas no koda): `id, program, parent_name, phone, email, children_count, child_age, event_date, event_time, address, accept_travel_fee, location, message, status` (+ domājams `created_at`).

> Supabase shēmu un RLS politikas tieši pārbaudīt nevarēju (tīkla piekļuve no datora uz Supabase šajā sesijā bloķēta). Pirms migrācijām lūgšu shēmas eksportu vai pārbaudīšu to ar piekļuvi.

### 1.5 Atrastās problēmas

**Kritiskas (drošība, jālabo pirmās):**
1. **`/admin` nav aizsargāts** — jebkurš, kurš zina adresi, redz klientu vārdus, telefonus un e-pastus.
2. **`PATCH /api/bookings/[id]` nav autentifikācijas** — jebkurš var mainīt jebkura pieteikuma statusu.
3. Tā kā panelis lasa ar publisko atslēgu, RLS politikām jāļauj anonīmai lomai **lasīt un labot** `bookings` — tātad dati, visticamāk, ir pieejami arī tieši caur Supabase REST API. Tas ir personas datu (VDAR) risks.
4. Pieteikumu API nav validācijas un aizsardzības pret surogātpastu.

**Funkcionālas:**
- Sākumlapa (`app/page.tsx`) rāda kontaktus; `Hero`, `Features` komponentes netiek lietotas; `CTASection.tsx` ir tukšs.
- `/uznemumiem` renderē Navbar divreiz.
- `galleries.ts` neatbilst reālajām mapēm (atslēgas pēc slug, ceļi uz neeksistējošām mapēm `feja/`, `glittera/`); vairākām programmām galerija tukša. `ProgramGallery` minē failu nosaukumus `1.webp…8.webp`.
- `BookingForm`: cenu loģika cietkodēta ar slug'iem, kas neatbilst datiem (`gabbys-dollhouse` ≠ `gabbys-dollhouse-ballite`, `eksperimentu-sovs` ≠ `eksperimentu-ballite`), dubults lauks "Programma", `alert()` paziņojumi, nav obligāto lauku pārbaudes; forma paredzēta tikai bērnu ballītēm (vecāka vārds, bērnu vecums) — uzņēmumiem nederīga.
- Pretrunīgi izbraukuma nosacījumi: "+10%" programmas lapā, "15 € piemaksa" formā.

**Veiktspēja un SEO:**
- Fonti ielādēti ar `subsets: ["latin"]` — **bez `latin-ext`**, tāpēc latviešu burti (ā, ē, š, ž…) tiek zīmēti ar citu fontu. Ielādēti 3 fonti, lietots 1.
- Nav `sitemap`, `robots`, Open Graph, Schema.org; metadati tikai vienā vietā.
- Daļa JPG ir 500+ KB; `telpu-noma/tmp` — dublikāti; 18 `.DS_Store`.
- **Mape `public/images/corporate` ir tukša** — uzņēmumu pakalpojumiem pašlaik nav fotogrāfiju.

**Dizains:** rozā akcenti (26 vietās), emocijzīmes virsrakstos, bērnišķīgs tonis — neatbilst jaunajām zīmola prasībām.

### 1.6 Ko izmantosim atkārtoti

| Daļa | Kā |
|---|---|
| Supabase projekts + `bookings` tabula | Paturam, paplašinām ar B2B laukiem |
| `/admin` + `StatusSelect` + `PATCH` API | Paplašinām (izkārtojums, sadaļas), nepārrakstām |
| `POST /api/bookings` | Paturam, pievienojam validāciju |
| `BookingForm` | Paliek privātpersonu sadaļai; cenas pārnesam uz datiem |
| `programs.ts` saturs | Kļūst par sākuma datiem (seed) DB tabulai |
| Visas esošās fotogrāfijas | Importējam galerijā ar kategorijām |
| `GalleryCarousel` (Embla), `yet-another-react-lightbox` | Galerijai |
| `ui/*` (button, input, label, textarea, select) | Pārstilizējam ar jaunajām krāsām |
| `Navbar`, `Footer`, `MapSection`, `SocialSection` | Pārveidojam dizainu, struktūru saglabājam |
| `CorporateEvents` teksti | Saturs B2B pakalpojumu lapām |
| `generate-gallery.mjs` ideja | Aizstāj ar seed/optimizācijas skriptu |

---

## 2. Kā izmantosim esošo administrēšanas paneli

Panelis paliek **`/admin`** tajā pašā Next.js projektā ar tiem pašiem principiem (servera komponentes lasa no Supabase, klienta komponentes veic izmaiņas, `router.refresh()`).

Pievienosim:

1. **Pieteikšanās** — Supabase Auth (e-pasts + parole), `@supabase/ssr` sesija sīkdatnēs, `/admin/login`, aizsardzība ar Next.js starpprogrammatūru (`proxy.ts` Next 16 versijā). *Šis ir vienīgais "absolūti nepieciešamais" jaunums — bez tā panelis nav drošs.*
2. **`app/admin/layout.tsx`** ar sānjoslu. Esošā pieteikumu tabula kļūst par sadaļu **Pieteikumi** (`/admin` → tā pati tabula + filtri, B2B/privāti, detaļu skats).
3. Jaunas sadaļas pēc tā paša parauga (saraksts → forma):
   - Pakalpojumi · Galerija · Atsauksmes · Klienti (logo) · Komanda · Sākumlapa · Kontakti · SEO
4. Rakstīšana notiek caur **Server Actions** ar pārbaudītu sesiju (nevis publisku atslēgu). Esošais `PATCH` maršruts tiek aizsargāts un saglabāts.
5. Attēlu augšupielāde uz Supabase Storage (`media` krātuve), automātiski nolasa izmērus.
6. Pēc saglabāšanas — `revalidatePath()`, lai publiskā lapa atjaunojas uzreiz, bet parasti tiek pasniegta no kešatmiņas (ātri).

---

## 3. Nepieciešamās izmaiņas (kopsavilkums)

- Drošība: auth, RLS politikas, API validācija (zod), honeypot + ātruma ierobežojums formām.
- Saturs no cietkoda → Supabase tabulās (ar seed skriptu, lai nekas nepazūd).
- Jauna dizaina sistēma (krāsas, tipogrāfija, komponentes).
- Jauna publiskā lapu struktūra, orientēta uz uzņēmumiem.
- B2B pieprasījuma forma (tie paši `bookings` + jauni lauki).
- SEO slānis, veiktspējas optimizācija.
- Satīrīšana: `programs.ts.save`, `telpu-noma/tmp`, `.DS_Store`, neizmantotās komponentes, `react-icons`, lieki fonti.

---

## 4. Jaunā mājaslapas struktūra

### 4.1 Lapas un URL

| URL | Lapa | Piezīme |
|---|---|---|
| `/` | Sākumlapa | Hero, CTA, pakalpojumi, kāpēc mēs, skaitļi, klientu logo, atsauksmes, galerija, kontaktu bloks |
| `/pakalpojumi` | Pakalpojumu katalogs (uzņēmumiem) | |
| `/pakalpojumi/komandas-saliedesana` | | Katram pakalpojumam atsevišķa lapa: hero, apraksts, kam piemērots, kā notiek, ko iekļauj, galerija, atsauksme, BUJ, CTA |
| `/pakalpojumi/sporta-speles` | | |
| `/pakalpojumi/uznemumu-pasakumi` | | |
| `/pakalpojumi/vasaras-pasakumi` | | |
| `/pakalpojumi/ziemassvetku-pasakumi` | | |
| `/pakalpojumi/radosas-darbnicas` | | |
| `/pakalpojumi/lielformata-speles` | | |
| `/pakalpojumi/burbulu-sovi` | | |
| `/pakalpojumi/seju-apgleznosana` | | |
| `/pakalpojumi/bernu-zona` | | Bērnu zona uzņēmumu pasākumos |
| `/privatpersonam` | Bērnu ballītes (sekundāra sadaļa) | Esošās 13 programmas |
| `/privatpersonam/[slug]` | Programmas lapa | |
| `/privatpersonam/telpu-noma` | Telpu noma | |
| `/privatpersonam/pieteikt` | Esošā ballītes forma | |
| `/galerija` | Galerija ar kategorijām | Lightbox, lazy loading |
| `/par-mums` | Pieredze, komanda, vērtības, klienti | |
| `/kontakti` | B2B pieprasījuma forma, karte, sociālie tīkli | |
| `/privatuma-politika` | Obligāti, jo forma vāc personas datus | |
| `/admin/*` | Panelis | `noindex` |

**Pāradresācijas (301):** `/programmas` → `/privatpersonam`, `/programmas/:slug` → `/privatpersonam/:slug`, `/uznemumiem` → `/pakalpojumi`, `/telpu-noma` → `/privatpersonam/telpu-noma`, `/pieteikt` → `/privatpersonam/pieteikt`. Tā nezaudēsim esošās saites.

Navigācija: **Pakalpojumi · Par mums · Galerija · Klienti (enkurs) · Privātpersonām · Kontakti** + dzeltena poga **"Pieprasīt piedāvājumu"**.

### 4.2 Dizaina sistēma

| Tokens | Vērtība | Lietojums |
|---|---|---|
| `--brand` | `#FFD54A` | CTA pogas, ikonas, akcenti, hover, grafiskie elementi |
| `--brand-strong` | `#F5C518` | Pogas hover/aktīvs stāvoklis |
| `--ink` | `#1F2937` | Teksts, navigācija, kājene, tumšās sadaļas |
| `--muted` | `#6B7280` | Sekundārais teksts |
| `--surface` | `#F6F7F9` | Sadaļu foni |
| `--white` | `#FFFFFF` | |

- **Pieejamība:** dzeltenais teksts uz balta fona neatbilst WCAG kontrastam, tāpēc dzelteno lietojam kā **fonu ar tumšu tekstu**, pasvītrojumu vai akcentu uz tumša fona — nevis kā teksta krāsu uz balta. Saites: tumšs teksts ar dzeltenu pasvītrojumu/hover.
- **Tipogrāfija:** viens mainīga svara fonts ar `latin-ext` (piedāvājums: *Manrope* virsrakstiem un tekstam), lieli, cieši virsraksti, daudz baltās vietas, 12 kolonnu režģis, maks. platums ~1280 px.
- **Animācijas:** vieglas CSS pārejas + `IntersectionObserver` "parādīšanās" efekti, hover uz kartītēm, gluda lightbox — bez smagām animāciju bibliotēkām; tiek ievērots `prefers-reduced-motion`.
- **Mobilais vispirms:** visi bloki projektēti no 360 px platuma; lipīga CTA poga telefonā.
- Bez emocijzīmēm un raibām krāsām; ikonas — vienota `lucide` līniju kopa.

---

## 5. Datubāzes izmaiņas (Supabase)

Visas izmaiņas kā SQL migrācijas failos `supabase/migrations/` (versiju kontrolē).

**5.1 `bookings` — paplašinām, neko nedzēšot**
```
+ inquiry_type     text  default 'private'   -- 'business' | 'private'
+ company_name     text
+ contact_role     text                       -- amats
+ participants     int                        -- dalībnieku skaits
+ event_type       text
+ event_city       text
+ budget_range     text
+ service_slug     text                       -- no kura pakalpojuma nāca
+ consent          boolean                    -- piekrišana datu apstrādei
+ admin_notes      text
+ created_at       timestamptz default now()  -- ja vēl nav
```
Esošās kolonnas (`parent_name` u.c.) paliek; B2B formā `parent_name` = kontaktpersona.

**5.2 Jaunas tabulas**

| Tabula | Galvenie lauki |
|---|---|
| `services` | `slug, audience ('business'/'private'), title, excerpt, body (jsonb bloki), hero_image, highlights jsonb, pricing jsonb, activities jsonb, faq jsonb, age, duration, sort, published, seo_title, seo_description, og_image` |
| `gallery_images` | `path, alt, category, service_id?, width, height, blur, sort, published` |
| `testimonials` | `author, role, company, text, rating?, logo_path?, service_id?, sort, published` |
| `clients` | `name, logo_path, url?, sort, published` |
| `team_members` | `name, role, bio, photo, sort, published` |
| `site_settings` | `key, value jsonb` — kontakti, sociālie tīkli, sākumlapas bloki (hero, kāpēc mēs, skaitļi), noklusējuma SEO |
| `page_seo` | `path, title, description, og_image, noindex` — manuāla pārrakstīšana |

**5.3 Drošība (RLS)**
- Publiski (`anon`): tikai `SELECT` uz `published = true` saturu; `INSERT` uz `bookings` (caur servera API).
- `bookings` lasīšana/labošana un viss satura rakstīšana — tikai autentificētam administratoram.
- Storage `media`: publiska lasīšana, augšupielāde tikai administratoram.

**5.4 Datu migrācija:** skripts `scripts/seed.mjs` pārnes `programs.ts` → `services` (private), esošās bildes → Storage + `gallery_images` ar kategorijām pēc mapēm, komandu → `team_members`, kontaktus → `site_settings`. Pēc pārbaudes `programs.ts` un `galleries.ts` tiek izņemti.

### SEO (automātiska ģenerēšana)
- `generateMetadata()` katrai lapai: `title` = `seo_title` vai `"{nosaukums} | Smaidu Darbnīca"`; `description` = `seo_description` vai `excerpt` saīsināts līdz ~155 zīmēm.
- Open Graph + Twitter kartītes; OG attēls no hero bildes.
- `app/sitemap.ts` (dinamiski no DB), `app/robots.ts`, kanoniskās saites, `lang="lv"`.
- Schema.org JSON-LD: `Organization`/`LocalBusiness`, `Service` katram pakalpojumam, `BreadcrumbList`, `FAQPage`.

### Veiktspēja (mērķis Lighthouse 95+)
- Servera komponentes pēc noklusējuma, klienta JS tikai interaktīvajām daļām.
- `next/image` (AVIF/WebP, `sizes`, blur placeholder, lazy loading), hero attēls ar `priority`.
- Statiska ģenerēšana + `revalidatePath` pēc admin izmaiņām (kešatmiņa).
- Viens fonts caur `next/font` (self-hosted, `display: swap`).
- Produkcijas būvējumā CSS/JS tiek minificēts automātiski; Tailwind izmet neizmantotās klases.

---

## 6. Darbu secība

| # | Posms | Rezultāts |
|---|---|---|
| 0 | **Drošība un satīrīšana** | Admin pieteikšanās, RLS, aizsargāts API; lieko failu dzēšana; salabota fontu kodēšana |
| 1 | **DB migrācijas + seed** | Jaunās tabulas, esošais saturs pārnests, nekas nav zaudēts |
| 2 | **Dizaina sistēma** | Krāsas, tipogrāfija, pogas, kartītes, sadaļu komponentes, animāciju utilītas |
| 3 | **Izkārtojums** | Jauns Navbar (+ mobilā izvēlne), Footer, pāradresācijas |
| 4 | **Sākumlapa** | Visi bloki no `site_settings` |
| 5 | **Pakalpojumi** | Katalogs + 10 B2B lapas (viena veidne) |
| 6 | **Galerija** | Kategorijas, lightbox, lazy loading, attēlu optimizācija |
| 7 | **Par mums, Kontakti, B2B forma** | Forma → `bookings`; karte; sociālie tīkli; privātuma politika |
| 8 | **Privātpersonām** | Esošās programmas un `BookingForm` jaunajā dizainā |
| 9 | **Admin paplašināšana** | Sadaļas: pakalpojumi, galerija, atsauksmes, klienti, komanda, sākumlapa, kontakti, SEO |
| 10 | **SEO** | Metadati, sitemap, robots, Schema.org, OG |
| 11 | **Testēšana** | Lighthouse (mobilais/dators), pieejamība, telefoni, formas, pāradresācijas |
| 12 | **Publicēšana** | Vides mainīgie, domēns, Search Console |

Katra posma beigās — īss pārskats un iespēja apskatīt rezultātu, pirms turpinu.

---

## 7. Jautājumi, kas jāizlemj pirms/sākot darbu

1. **Hostings:** vai lapa tiks izvietota Vercel (Next.js attēlu optimizācija strādā uzreiz)? Cits hostings var prasīt citu attēlu risinājumu.
2. **Webnode lapas adrese** — no tās pārņemšu tekstus (pieredze, vērtības, pakalpojumu apraksti).
3. **Fotogrāfijas uzņēmumu pakalpojumiem** — `corporate` mape ir tukša; esošās bildes ir galvenokārt no bērnu ballītēm. Premium B2B dizainam vajadzīgas vismaz 10–20 kvalitatīvas bildes no korporatīvajiem pasākumiem.
4. **Klientu logo un atsauksmes** — vai tādas ir (un vai klientiem ir atļauja tās publicēt)?
5. **Paziņojumi par jauniem pieteikumiem** — vai sūtīt e-pastu uz `smaidudarbnica@gmail.com` (piem., caur Resend)?
6. **Administratori** — cik cilvēkiem vajadzīga piekļuve panelim?
7. **Privātpersonu cenu kalkulators** — paturēt formā vai rādīt tikai cenu tabulas?
8. **Supabase shēma** — lūdzu, apstipriniet, ka drīkstu pārbaudīt/mainīt RLS politikas (vai atsūtiet shēmas eksportu).
