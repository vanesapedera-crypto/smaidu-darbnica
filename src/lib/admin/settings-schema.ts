import type { SiteSettings } from "@/lib/content/types";
import type { FieldDef } from "./fields";

/** Vietnes iestatījumu formas (tabula site_settings, katra sadaļa — viens JSON ieraksts). */

export type SettingsKey = keyof SiteSettings;

const IMG_HELP = "Attēla adresi var nokopēt sadaļā “Foto” vai augšupielādēt jaunu attēlu turpat.";

export const settingsSchemas: Record<SettingsKey, { title: string; description: string; fields: FieldDef[] }> = {
  home: {
    title: "Sākums",
    description: "Sākumlapa: galvene, četras sadaļu kartītes un Ziemassvētku bloks.",
    fields: [
      { name: "h-hero", label: "Galvene", type: "heading" },
      { name: "heroEyebrow", label: "Mazais uzraksts virs virsraksta", type: "text", wide: true, help: "Rāda, ja Ziemassvētku reklāma ir izslēgta." },
      { name: "heroTitle", label: "Galvenais virsraksts", type: "text", wide: true },
      { name: "heroHighlight", label: "Izceltais vārds (dzeltenā uzlīmē)", type: "text" },
      { name: "heroAfter", label: "Virsraksta beigas", type: "text" },
      { name: "heroText", label: "Ievada teksts", type: "textarea", rows: 3, wide: true },
      { name: "heroTextMobile", label: "Ievada teksts telefonam (īsāks)", type: "textarea", rows: 2, wide: true, help: "Ja tukšs — telefonā rāda to pašu tekstu." },
      { name: "heroPoster", label: "Galvenes fotogrāfija", type: "image", wide: true, help: "Vislabāk horizontāla, vismaz 2000 px plata." },

      { name: "h-doors", label: "Sadaļu kartītes (“Ko pie mums atradīsiet”)", type: "heading" },
      {
        name: "doors",
        label: "Kartītes",
        type: "table",
        columns: ["tag", "title", "text", "image", "href"],
        rows: 6,
        wide: true,
        help: "Katrā rindā viena kartīte: Birka | Virsraksts | Teksts | Attēla adrese | Saite. Piem.: Izrādes | Izrādes visai ģimenei | Interaktīvas izrādes uz skatuves. | /media/izrades/izrade-09.webp | /izrades",
      },

      { name: "h-xmas", label: "Ziemassvētku bloks", type: "heading", help: "Reklāma sākumlapā un bloks lapā “Uzņēmumiem”." },
      { name: "xmasEnabled", label: "Rādīt Ziemassvētku reklāmu (sākumlapā un lapā “Uzņēmumiem”)", type: "checkbox" },
      { name: "xmasEyebrow", label: "Etiķete", type: "text", help: "Piem. Ziemassvētki 2026" },
      { name: "xmasTitle", label: "Virsraksts sākumlapā", type: "text" },
      { name: "xmasHighlight", label: "Izceltais vārds", type: "text" },
      { name: "xmasShort", label: "Teksts sākumlapā", type: "textarea", rows: 2, wide: true },
      { name: "xmasText", label: "Teksts lapā “Uzņēmumiem”", type: "textarea", rows: 3, wide: true },
      {
        name: "xmasPhotos",
        label: "Lielā fotogrāfija",
        type: "photos",
        rows: 2,
        wide: true,
        help: "Pirmajā rindā: attēla adrese | paraksts. " + IMG_HELP,
      },
      {
        name: "xmasCards",
        label: "Kartītes lapā “Uzņēmumiem”",
        type: "table",
        columns: ["title", "text", "image"],
        rows: 6,
        wide: true,
        help: "Katrā rindā viena kartīte: Nosaukums | Teksts | Attēla adrese. Kartītes ir tikai informācijai (bez saitēm).",
      },
    ],
  },
  about: {
    title: "Par mums",
    description: "Lapas “Par mums” galvene un teksti. Komandas dalībniekus rediģē sadaļā “Komanda”.",
    fields: [
      { name: "title", label: "Virsraksts", type: "text", wide: true },
      { name: "intro", label: "Ievads", type: "textarea", rows: 3, wide: true },
      { name: "image", label: "Galvenes fotogrāfija", type: "image", wide: true },
      { name: "teamTitle", label: "Komandas bloka virsraksts", type: "text" },
      { name: "teamText", label: "Komandas bloka teksts", type: "text" },
    ],
  },
  business: {
    title: "Uzņēmumiem",
    description:
      "Lapa “Uzņēmumiem”: galvene, Party Trip spēles un pakalpojumu lapu bildes. Pašus pakalpojumus rediģē sadaļā “Pakalpojumi”, Ziemassvētku bloku — sadaļā “Sākums”.",
    fields: [
      { name: "h-hero", label: "Galvene", type: "heading" },
      { name: "heroTitle", label: "Virsraksts", type: "text", wide: true },
      { name: "heroHighlight", label: "Izceltais vārds virsrakstā", type: "text" },
      { name: "heroText", label: "Ievada teksts", type: "textarea", rows: 3, wide: true },
      { name: "heroImage", label: "Galvenes fotogrāfija", type: "image", wide: true },

      { name: "h-games", label: "Party Trip spēles", type: "heading", help: "Spēļu režģis lapā “Lielformāta spēles”." },
      {
        name: "games",
        label: "Spēles",
        type: "table",
        columns: ["name", "image"],
        rows: 22,
        wide: true,
        help: "Katrā rindā viena spēle: Nosaukums | Attēla adrese. Bez attēla spēle rādās kā kartīte ar nosaukumu.",
      },

      { name: "h-photos", label: "Pakalpojumu lapu bildes", type: "heading", help: "Bilžu režģis katra pakalpojuma lapā. Viena attēla adrese rindā. " + IMG_HELP },
      { name: "servicePhotos.radosas-darbnicas", label: "Radošās darbnīcas", type: "lines", rows: 6, wide: true },
      { name: "servicePhotos.pasakumu-organizesana", label: "Pasākumu vadīšana un organizēšana", type: "lines", rows: 6, wide: true },
      { name: "servicePhotos.mazulu-zona", label: "Mazuļu zona", type: "lines", rows: 6, wide: true },
      { name: "servicePhotos.sejas-apgleznosana", label: "Sejas apgleznošana", type: "lines", rows: 6, wide: true },
      { name: "servicePhotos.putu-ballite", label: "Putu ballīte", type: "lines", rows: 6, wide: true },
      { name: "servicePhotos.sporta-speles", label: "Sporta spēles uzņēmumiem", type: "lines", rows: 6, wide: true },
    ],
  },
  shows: {
    title: "Izrādes",
    description: "Lapa “Izrādes”: galvene, video ar aprakstiem un bilžu karuselis.",
    fields: [
      { name: "h-hero", label: "Galvene", type: "heading" },
      { name: "heroTitle", label: "Virsraksts", type: "text", wide: true },
      { name: "heroHighlight", label: "Izceltais vārds virsrakstā", type: "text" },
      { name: "heroText", label: "Ievada teksts", type: "textarea", rows: 3, wide: true },
      { name: "heroImage", label: "Galvenes fotogrāfija", type: "image", wide: true },

      { name: "h-videos", label: "Izrādes", type: "heading" },
      { name: "videosTitle", label: "Bloka virsraksts", type: "text" },
      {
        name: "videos",
        label: "Izrādes un video",
        type: "videos",
        rows: 6,
        wide: true,
        help: "Katrā rindā: Izrādes nosaukums | YouTube saite | vāciņa attēls (var atstāt tukšu) | ilgums | auditorija | apraksts. Piem.: Dāvanu prieks | https://youtu.be/… |  | 45 min | Visai ģimenei | Apraksts. Aprakstā ¶ = jauna rinda, ¶ ¶ = jauna rindkopa, \"- \" rindas sākumā = saraksta punkts, **teksts** = treknraksts.",
      },

      { name: "h-photos", label: "Bilžu karuselis lapas apakšā", type: "heading" },
      { name: "photos", label: "Bildes", type: "lines", rows: 10, wide: true, help: "Viena attēla adrese rindā. " + IMG_HELP },
    ],
  },
  programs: {
    title: "Izklaides programmas",
    description:
      "Lapa “Izklaides programmas”: galvene, pārsteiguma tēli un izbraukuma ballīšu cenas. Pašas programmas rediģē sadaļā “Pakalpojumi”.",
    fields: [
      { name: "h-hero", label: "Galvene", type: "heading" },
      { name: "heroTitle", label: "Virsraksts", type: "text", wide: true },
      { name: "heroHighlight", label: "Izceltais vārds virsrakstā", type: "text" },
      { name: "heroText", label: "Ievada teksts", type: "textarea", rows: 3, wide: true },
      { name: "heroImage", label: "Galvenes fotogrāfija", type: "image", wide: true },

      { name: "h-travel", label: "Izbraukuma ballītes", type: "heading", help: "Šīs cenas izmanto rezervācijas forma un piezīme programmu lapās." },
      { name: "travelSurcharge", label: "Izbraukuma piemaksa, €", type: "number" },
      { name: "travelRate", label: "Ceļa izdevumi, € par km (turp un atpakaļ)", type: "number", help: "Piem. 0.3" },
      { name: "freeTravelKm", label: "Bez piemaksas un ceļa izdevumiem līdz, km", type: "number", help: "Attālums vienā virzienā no Smaidu Darbnīcas." },

      { name: "h-characters", label: "Pārsteiguma tēli", type: "heading", help: "Tēlu režģis programmas “Pārsteiguma tēls” lapā." },
      {
        name: "characters",
        label: "Tēli",
        type: "table",
        columns: ["name", "image"],
        rows: 10,
        wide: true,
        help: "Katrā rindā viens tēls: Vārds | Attēla adrese.",
      },
    ],
  },
  venue: {
    title: "Telpu noma",
    description: "Lapa “Telpu noma”: galvene, apraksts, aprīkojums, cenas un telpu lietošanas noteikumi.",
    fields: [
      { name: "h-hero", label: "Galvene", type: "heading" },
      { name: "heroTitle", label: "Virsraksts", type: "text" },
      { name: "heroHighlight", label: "Izceltais vārds", type: "text" },
      { name: "heroAfter", label: "Virsraksta beigas", type: "text" },
      { name: "heroText", label: "Ievada teksts", type: "textarea", rows: 3, wide: true },
      { name: "heroImage", label: "Galvenes fotogrāfija", type: "image", wide: true },

      { name: "h-prices", label: "Cenas", type: "heading", help: "Šīs cenas rāda lapā “Telpu noma” un izmanto rezervācijas forma." },
      { name: "priceWeekday", label: "Pirmdiena–ceturtdiena (3 stundas), €", type: "number" },
      { name: "priceWeekend", label: "Piektdiena–svētdiena (3 stundas), €", type: "number" },
      { name: "priceExtraHour", label: "Papildu stunda, €", type: "number" },

      { name: "h-about", label: "Apraksts un aprīkojums", type: "heading" },
      { name: "aboutTitle", label: "Apraksta virsraksts", type: "text" },
      { name: "about", label: "Par telpām", type: "textarea", rows: 5, wide: true, help: "Tukša rinda = jauna rindkopa" },
      { name: "features", label: "Aprīkojums", type: "pairs", rows: 7, wide: true, help: "Katrā rindā: Nosaukums | apraksts" },

      { name: "h-rules", label: "Noteikumi", type: "heading" },
      {
        name: "rules",
        label: "Telpu lietošanas noteikumi",
        type: "textarea",
        rows: 20,
        wide: true,
        help: "“## Virsraksts” sāk jaunu sadaļu, “- ” — saraksta punkts, **treknraksts**.",
      },
    ],
  },
  contact: {
    title: "Kontakti",
    description: "Kontaktinformācija tiek rādīta kājenē, lapā “Kontakti” un meklētāju datos.",
    fields: [
      { name: "h-people", label: "Kontaktpersonas", type: "heading" },
      { name: "phoneBusiness", label: "Telefons uzņēmumiem", type: "text" },
      { name: "phoneBusinessPerson", label: "Kontaktpersona uzņēmumiem", type: "text" },
      { name: "email", label: "E-pasts uzņēmumiem", type: "text" },
      { name: "phonePrivate", label: "Telefons privātpersonām", type: "text" },
      { name: "phonePrivatePerson", label: "Kontaktpersona privātpersonām", type: "text" },
      { name: "emailPrivate", label: "E-pasts privātpersonām", type: "text" },

      { name: "h-address", label: "Adrese un sociālie tīkli", type: "heading" },
      { name: "address", label: "Telpu adrese: iela, māja", type: "text" },
      { name: "city", label: "Pilsēta", type: "text" },
      { name: "postalCode", label: "Pasta indekss", type: "text" },
      { name: "mapQuery", label: "Adrese Google kartei", type: "text", wide: true },
      { name: "facebook", label: "Facebook saite", type: "text", wide: true },
      { name: "instagram", label: "Instagram saite", type: "text", wide: true },
      { name: "tiktok", label: "TikTok saite", type: "text", wide: true },
      { name: "heroImage", label: "Lapas “Kontakti” galvenes fotogrāfija", type: "image", wide: true },

      { name: "h-legal", label: "Rekvizīti", type: "heading" },
      { name: "company", label: "Uzņēmuma nosaukums", type: "text" },
      { name: "legalName", label: "Pilns juridiskais nosaukums", type: "text", wide: true },
      { name: "legalAddress", label: "Juridiskā adrese", type: "text", wide: true },
      { name: "regNr", label: "Reģistrācijas numurs", type: "text" },
      { name: "vatNr", label: "PVN numurs", type: "text" },
      { name: "bank", label: "Banka", type: "text" },
      { name: "iban", label: "Konta numurs (IBAN)", type: "text" },
    ],
  },
  seo: {
    title: "SEO iestatījumi",
    description: "Noklusējuma virsraksts un apraksts, ko izmanto sākumlapa un lapas bez sava apraksta.",
    fields: [
      { name: "siteName", label: "Vietnes nosaukums", type: "text" },
      { name: "defaultTitle", label: "Noklusējuma virsraksts", type: "text", wide: true },
      { name: "defaultDescription", label: "Noklusējuma apraksts", type: "textarea", rows: 3, wide: true },
      { name: "ogImage", label: "Noklusējuma attēls sociālajiem tīkliem", type: "image", wide: true },
    ],
  },
};
