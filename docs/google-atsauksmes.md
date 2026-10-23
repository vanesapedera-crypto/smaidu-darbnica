# Google atsauksmes mājaslapā

Mājaslapa var rādīt Smaidu Darbnīcas Google atsauksmes (kopējo vērtējumu un līdz 5 atsauksmēm, ko izvēlas Google)
lapās **Atsauksmes** un **Izklaides programmas**. Tam vajag Google Places API atslēgu. Kamēr atslēgas nav, sadaļa vienkārši netiek rādīta.

Atslēgu izveidojiet pati un **nesūtiet nevienam**.

## 1. Places API ieslēgšana

1. Atveriet **https://console.cloud.google.com** un augšā izvēlieties projektu **Smaidu Darbnica** (to pašu, kas Google kalendāram).
2. **APIs & Services → Library** → meklējiet **Places API (New)** → **Enable**.
3. Ja Google prasa **norēķinu kontu (Billing)** — pievienojiet to. Mājaslapa atsauksmes ielādē reizi diennaktī (ap 30 pieprasījumiem mēnesī),
   tas ir krietni zem Google bezmaksas mēneša limita.

## 2. API atslēga

1. **APIs & Services → Credentials → Create credentials → API key**.
2. Atslēgas iestatījumos (**Edit API key**) sadaļā **API restrictions** izvēlieties **Restrict key** un atzīmējiet tikai **Places API (New)**. Saglabājiet.
3. Nokopējiet atslēgu.

## 3. Vercel

1. **vercel.com → projekts → Settings → Environment Variables** → pievienojiet:
   `GOOGLE_PLACES_API_KEY` = nokopētā atslēga (Environment: Production).
2. **Deployments → pēdējais → ⋯ → Redeploy**.

Pēc tam atveriet **smaidudarbnica.lv/atsauksmes** — augšā jāparādās Google vērtējumam un atsauksmēm. Atsauksmes atjaunojas reizi diennaktī.
