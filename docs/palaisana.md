# Mājaslapas palaišana (Vercel + Supabase + smaidudarbnica.lv)

Secība ir svarīga: vispirms datubāze, tad Vercel, beigās domēns.
Līdz 4. solim vecā lapa strādā kā līdz šim.

---

## 1. Supabase — datubāze (~10 min)

Atveriet savu Supabase projektu → **SQL Editor** → **New query**.
Katru failu atveriet projekta mapē (piem. ar TextEdit), nokopējiet visu saturu, ielīmējiet un spiediet **Run**:

1. `supabase/migrations/20260928120000_admin_security_and_content.sql`
2. `supabase/migrations/20260929090000_service_seasons.sql`
3. `supabase/migrations/20261001090000_booking_travel.sql`
4. `supabase/migrations/20261003090000_booked_venue_slots.sql` (telpu nomas brīvie laiki rezervācijas formā)
5. `supabase/seed.sql`

Katram jābeidzas ar "Success. No rows returned". Ja parādās kļūda — nofotografējiet to un atsūtiet.

## 2. Supabase — jūsu administratora konts

1. **Authentication → Users → Add user → Create new user**: jūsu e-pasts + parole, atzīmējiet **Auto Confirm User**.
2. **SQL Editor** → ielīmējiet (ar savu e-pastu) → **Run**:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'JUSU-EPASTS@example.com';
   ```

3. **Authentication → Sign In / Providers → Email** → izslēdziet **Allow new users to sign up**
   (lai neviens cits nevar izveidot kontu).

## 3. Vercel — lapas publicēšana (~15 min)

Ieteicamais veids ir caur GitHub — tad katra turpmākā izmaiņa publicējas automātiski.

1. Izveidojiet kontu **github.com** (ja nav) un jaunu **privātu** repozitoriju `smaidu-darbnica`.
2. Termināļa logā projekta mapē:

   ```bash
   git add -A
   git commit -m "Jaunā mājaslapa"
   git branch -M main
   git remote add origin https://github.com/JUSU-LIETOTAJS/smaidu-darbnica.git
   git push -u origin main
   ```

3. **vercel.com** → pieslēdzieties ar GitHub → **Add New → Project** → izvēlieties `smaidu-darbnica` → **Import**.
4. Pirms **Deploy** atveriet **Environment Variables** un pievienojiet:

   | Nosaukums | Vērtība |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | tā pati, kas `.env.local` failā |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | tā pati, kas `.env.local` failā |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.smaidudarbnica.lv` |
   | `RESEND_API_KEY` | (nav obligāts — sk. 5. soli) |
| `ORS_API_KEY` | (ieteicams — ceļa izdevumu aprēķinam, bezmaksas atslēga openrouteservice.org) |

5. **Deploy**. Pēc ~2 min būs adrese `…vercel.app` — pārbaudiet lapu un paneli `/admin`.

## 4. Domēns smaidudarbnica.lv

1. Vercel → projekts → **Settings → Domains** → pievienojiet `smaidudarbnica.lv` un `www.smaidudarbnica.lv`.
2. Vercel parādīs DNS ierakstus (parasti **A** ierakstu galvenajam domēnam un **CNAME** priekš `www`).
   Tie jāieraksta tur, kur domēns ir reģistrēts (DNS pārvaldībā).
   - Ja domēns pirkts caur **Webnode** — Webnode iestatījumos domēnam jāmaina DNS ieraksti
     (vai jāpārceļ domēns pie cita reģistratora, ja Webnode to neatļauj).
3. Izmaiņas stājas spēkā dažu minūšu līdz dažu stundu laikā. Vercel pats izveido drošo savienojumu (https).
4. Vecās Webnode saites (piem. `/rezervacijas`, `/musu-komanda`) jaunajā lapā automātiski pāradresējas.

## 5. E-pasta paziņojumi (nav obligāti)

1. **resend.com** → reģistrējieties ar `smaidudarbnica@gmail.com`.
2. **API Keys → Create API Key** → nokopējiet.
3. Vercel → **Settings → Environment Variables** → `RESEND_API_KEY` = atslēga → **Redeploy**.

Bez šī pieteikumi ir redzami tikai panelī.

### Apstiprinājuma e-pasts klientam

Kad panelī pieteikuma statusu nomaina uz **Apstiprināta**, klientam (ja viņš formā norādījis e-pastu)
automātiski aiziet e-pasts "Rezervācija apstiprināta" ar programmu, datumu, laiku un vietu.

Lai šie e-pasti aizietu klientiem, ar atslēgu vien nepietiek — Resend jāapstiprina jūsu domēns:

4. Resend → **Domains → Add Domain** → `smaidudarbnica.lv` → pievienojiet parādītos DNS ierakstus pie domēna reģistratora.
5. Vercel → Environment Variables → `NOTIFY_FROM` = `Smaidu Darbnīca <pieteikumi@smaidudarbnica.lv>` → **Redeploy**.

Kamēr domēns nav apstiprināts, Resend sūta tikai uz sava konta adresi, un klienti e-pastu nesaņem.

## Pārbaude pēc palaišanas

- [ ] `/admin` bez pieteikšanās pāradresē uz `/admin/login`
- [ ] Varat ielogoties un redzat pieteikumus
- [ ] Testa pieprasījums no `/kontakti` parādās panelī (un e-pastā, ja 5. solis izdarīts)
- [ ] Testa rezervācija no ballītes lapas parādās panelī
- [ ] Google Search Console: pievienojiet `https://www.smaidudarbnica.lv/sitemap.xml`
