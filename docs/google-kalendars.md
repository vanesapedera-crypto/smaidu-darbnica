# Google kalendāra savienošana

Pēc savienošanas apstiprinātās rezervācijas tiek ieliktas **tieši jūsu Google kalendārā**. Jūs esat notikuma īpašniece. Google kalendārā varat nospiest **Edit** un labot visu: tekstu, laiku, vietu un viesus (darbinieces). Izmaiņas Google pats nosūta viesiem.

Kamēr savienojums nav izveidots, viss strādā kā līdz šim, ar ielūgumiem.

Iestatīšana jāveic vienu reizi, un tā aizņem apmēram 15 minūtes. Visu dariet ar to Google kontu, kura kalendārā jāparādās rezervācijām, piemēram, smaidu.darbniica@gmail.com.

---

## 1. Google Cloud projekts

1. Atveriet **https://console.cloud.google.com** un ielogojieties.
2. Augšā spiediet projekta izvēlni (blakus "Google Cloud"), tad **New Project**.
   Nosaukums: `Smaidu Darbnica`. Spiediet **Create** un pēc tam izvēlieties šo projektu.

## 2. Ieslēgt Google Calendar API

1. Kreisajā izvēlnē atveriet **APIs & Services → Library**.
2. Meklējiet **Google Calendar API**, atveriet to un spiediet **Enable**.

## 3. Piekrišanas ekrāns (OAuth consent screen)

1. Atveriet **APIs & Services → OAuth consent screen**. Jaunākajā versijā tas saucas **Google Auth Platform → Branding**.
2. Ja jautā "Get started", aizpildiet laukus:
   - **App name:** `Smaidu Darbnīca`
   - **User support email:** jūsu e-pasts
   - **Audience:** **External**
   - **Contact information:** jūsu e-pasts
3. Saglabājiet.
4. Sadaļā **Audience** pie **Test users** spiediet **Add users** un pievienojiet savu Gmail adresi.

   Ja atstāsiet lietotni testa režīmā, Google savienojumu atslēgs pēc 7 dienām. Tāpēc vēlāk tajā pašā lapā spiediet **Publish app** (statuss "In production"). Google var parādīt brīdinājumu, ka lietotne nav pārbaudīta. Tas ir normāli, jo to lietojat tikai jūs.

## 4. Pieteikšanās atslēga (OAuth Client ID)

1. Atveriet **APIs & Services → Credentials**. Jaunākajā versijā tas saucas **Google Auth Platform → Clients**.
2. Spiediet **Create credentials → OAuth client ID** (vai **Create client**).
3. **Application type:** **Web application**, **Name:** `Smaidu Darbnica`.
4. Pie **Authorized redirect URIs** spiediet **Add URI** un ielīmējiet tieši šo:

   ```
   https://www.smaidudarbnica.lv/api/google/callback
   ```

5. Spiediet **Create**. Parādīsies divas vērtības: **Client ID** un **Client secret**.
   Tās **nesūtiet nevienam**, arī man ne. Tās vajadzīgas tikai nākamajā solī.

## 5. Vērtības Vercel iestatījumos

1. Atveriet **vercel.com → projekts → Settings → Environment Variables**.
2. Pievienojiet divus mainīgos (Environment: **Production**):

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | Client ID no 4. soļa |
   | `GOOGLE_CLIENT_SECRET` | Client secret no 4. soļa |

3. Saglabājiet un atveriet **Deployments → pēdējais → ⋯ → Redeploy**, lai mainīgie stātos spēkā.

## 6. SQL Supabase

Supabase atveriet **SQL Editor** un palaidiet failu
`supabase/migrations/20261018090000_google_calendar.sql`. Tas izveido tabulu, kurā glabājas savienojums. To var lasīt tikai administrators.

## 7. Savienošana panelī

1. Atveriet **smaidudarbnica.lv/admin**.
2. Augšā ir lodziņš **"Google kalendārs"**. Spiediet **"Savienot ar Google kalendāru"**.
3. Izvēlieties savu Google kontu un atļaujiet piekļuvi kalendāram. Ja Google brīdina, ka lietotne nav pārbaudīta, spiediet **Advanced → Go to Smaidu Darbnīca**.
4. Panelī parādīsies uzraksts **"Google kalendārs: savienots"**.

---

## Kā tas strādā pēc savienošanas

- **Apstiprinot** rezervāciju panelī, notikums parādās jūsu kalendārā. Kristīne, vadītāja un telpu kopēja (ja rezervācija ir mūsu telpās) saņem ielūgumu no jūsu konta.
- **Labojot** notikumu Google kalendārā (Edit → Save), Google pajautā, vai paziņot viesiem. Izvēlieties **Send**.
- **Atceļot** apstiprinātu rezervāciju panelī (statuss "Atcelta"), notikums no kalendāra tiek noņemts automātiski, un viesi saņem paziņojumu. Ja rezervāciju atceļ pats klients, notikums kalendārā jāizdzēš ar roku, un par to atnāk e-pasts.
- **Agrāk apstiprinātas rezervācijas** (pirms savienošanas) var ielikt kalendārā ar pogu **"Ielikt Google kalendārā"** atvērtā pieteikumā. Klientam nekas netiek sūtīts. Veco ielūgumu pēc tam izdzēsiet.
- **Atvienot** var panelī ar pogu "Atvienot". Pēc tam notikumi atkal aiziet kā ielūgumi.
