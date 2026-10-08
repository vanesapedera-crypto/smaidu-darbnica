import type { Service } from "../types";
import { programs } from "./programs-legacy";
import { programOverrides } from "./program-texts";
import { PROGRAM_IMAGE } from "./service-media";

/**
 * Bērnu ballīšu programmas (privātpersonām).
 * Saturs pārņemts no iepriekšējās versijas (programs-legacy.ts) un pārveidots
 * vienotajā Service formātā, lai to varētu glabāt un rediģēt `services` tabulā.
 */

// Noņem emocijzīmes no virsrakstiem — jaunajā dizainā tās aizstāj ikonas
const stripEmoji = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim();

// Programmas, kas sarakstos (kartītes, rezervācijas formas izvēlne) jārāda pirmās — pārējās paliek savā secībā
const FIRST = ["sejas-apgleznosana"];
const rank = (slug: string) => (FIRST.includes(slug) ? FIRST.indexOf(slug) : FIRST.length);
const ordered = [...programs].sort((a, b) => rank(a.slug) - rank(b.slug));

const partyPrograms: Service[] = ordered.map((p, i) => {
  // Vecās smaidudarbnica.lv lapas saturs (aktuālākais) pārraksta vecā koda vērtības
  const o = programOverrides[p.slug] ?? {};
  return {
  slug: p.slug,
  audience: "private",
  title: p.title,
  excerpt: p.shortDescription,
  intro: o.intro ?? (p.description || p.shortDescription),
  body: o.body ?? "",
  highlights: o.gift ? [`🎁 ${o.gift}`] : [],
  suitableFor: [],
  activities:
    o.activities ??
    p.activities.map((a) => ({
      title: stripEmoji(a.title),
      description: a.description,
    })),
  pricing: o.pricing ?? p.pricing,
  pricingNote:
    o.note ??
    p.note ??
    "", // tukšs → lapā rāda piezīmi par izbraukuma izmaksām ar paneļa cenām (sk. ServiceDetail)
  faq: [],
  age: o.age ?? p.age,
  duration: o.duration ?? p.duration,
  participants: "",
  icon: "PartyPopper",
  heroImage: PROGRAM_IMAGE[p.slug] ?? `/media/${p.slug}/${p.slug}-01.webp`,
  albums: [p.slug],
  seasons: [],
  sort: (i + 1) * 10,
  published: true,
  seoTitle: "",
  seoDescription: "",
  };
});

/**
 * "Ziemassvētki bērnudārzā" — izbraukuma programma iestādēm ar savu lapu un rezervācijas formu
 * (src/app/(site)/izklaides-programmas/ziemassvetki-bernudarza). Teksts — Smaidu Darbnīcas piedāvājums vārds vārdā.
 *  - `activities` — abi varianti ar aprakstu; nosaukumiem jāsakrīt ar cenu grupām `pricing` (pēc tiem forma rēķina cenu);
 *  - `highlights` — kas iekļauts (abos variantos), `suitableFor` — piezīmes zem šī saraksta; `body` — aicinājums rezervēt un sadaļa "## Svarīgi" (brīdinājums par kavēšanos —
 *    redzams lapā pie rezervācijas formas un apstiprinājuma e-pastā);
 *  - cenas ir bez PVN, un izbraukuma piemaksu nepiemēro (sk. INSTITUTION_PROGRAMS failā lib/bookings.ts).
 */
const kindergartenXmas: Service = {
  slug: "ziemassvetki-bernudarza",
  audience: "private",
  title: "Ziemassvētki bērnudārzā",
  excerpt: "Rūķis un Ziemassvētku vecītis jūsu bērnudārzā!",
  intro: "Uzdāviniet bērniem īstu Ziemassvētku piedzīvojumu!",
  body:
    "Decembra rezervācijas jau ir sākušās!\n\nRezervējiet sev ērtāko datumu savlaicīgi – populārākie laiki piepildās visātrāk.\n\n" +
    "## Svarīgi\n\n" +
    "Par programmas sākuma laiku tiek uzskatīts rezervētais laiks, kad programmai ir jāsākas. Līdz tam brīdim iepriekšējām aktivitātēm jābūt noslēgušās un viesiem jābūt gataviem programmas sākumam.\n\n" +
    "Ja programmas sākums kavējas klienta dēļ, programma netiek pagarināta, bet tiek saīsināta, lai iekļautos rezervētajā laikā. Mēs nevaram aizkavēt nākamās programmas, kas rezervētas citiem klientiem.",
  highlights: ["30 minūtes aktīvas Ziemassvētku programmas", "Dāvaniņu dalīšana", "Kopējais ciemošanās laiks – līdz 1 stundai"],
  // Piezīmes zem saraksta "kas iekļauts" (abiem variantiem)
  suitableFor: ["Dāvaniņas mēs nenodrošinām."],
  activities: [
    {
      title: "Rūķis un Ziemassvētku vecītis",
      description:
        "Rūķis un Ziemassvētku vecītis ieradīsies pie jums ar jautrām rotaļām, dejām, smiekliem un svētku noskaņu. Un noslēgumā – gaidītā dāvaniņu saņemšana!",
    },
    {
      title: "Tikai Rūķis",
      description: "Sirsnīga un jautra programma, kas lieliski piemērota arī pašām mazākajām grupiņām.",
    },
  ],
  pricing: [
    { title: "Rūķis un Ziemassvētku vecītis", options: [{ label: "Cena", price: 195 }] },
    { title: "Tikai Rūķis", options: [{ label: "Cena", price: 150 }] },
  ],
  pricingNote: "+ PVN + ceļa izdevumi",
  faq: [],
  age: "",
  duration: "30 minūtes",
  participants: "",
  icon: "TreePine",
  heroImage: "/media/ziemassvetki-bernudarza/ziemassvetki-bernudarza-01.webp",
  albums: ["ziemassvetki-bernudarza"],
  seasons: [],
  sort: 0,
  published: true,
  seoTitle: "Ziemassvētki bērnudārzā — Rūķis un Ziemassvētku vecītis",
  seoDescription:
    "Rūķis un Ziemassvētku vecītis jūsu bērnudārzā: 30 minūtes aktīvas Ziemassvētku programmas ar rotaļām un dejām, dāvaniņu dalīšana. Rezervējiet datumu tiešsaistē.",
};

// Secība sarakstos: sejas apgleznošana, tad Ziemassvētki bērnudārzā (sezonas piedāvājums), tad pārējās programmas
export const privateServices: Service[] = [partyPrograms[0], kindergartenXmas, ...partyPrograms.slice(1)].map((s, i) => ({
  ...s,
  sort: (i + 1) * 10,
}));
