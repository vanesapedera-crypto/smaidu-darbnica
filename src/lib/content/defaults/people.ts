import type { Client, TeamMember, Testimonial } from "../types";

/** Komanda (noklusējuma saturs / seed). */
export const defaultTeam: TeamMember[] = [
  {
    name: "Kristīne",
    role: "Dibinātāja un pasākumu vadītāja",
    bio: "Smaidu Darbnīcas sirds un dzinējspēks. Kristīne atrod risinājumu jebkurā situācijā, iedvesmo komandu un rūpējas, lai katrs pasākums noritētu nevainojami.",
    photo: "/media/komanda/kristine.webp",
  },
  {
    name: "Madara",
    role: "Radošā projektu vadītāja",
    bio: "Ideju ģenerators un kvalitātes perfekcioniste. Atbild par pasākumu koncepcijām, dekorācijām un to, lai katra detaļa būtu savā vietā.",
    photo: "/media/komanda/madara-radosa.webp",
  },
  {
    name: "Gunta",
    role: "Vecākā animatore",
    bio: "Vairāk nekā 10 gadu pieredze un desmitiem iemīļotu tēlu. Gunta zina, kā aizraut jebkuru auditoriju.",
    photo: "/media/komanda/gunta.webp",
  },
  {
    name: "Agija",
    role: "Animatore",
    bio: "Mūsu komandas dzirkstelīte, kas katru pasākumu piepilda ar siltumu, zināšanām un pozitīvu enerģiju.",
    photo: "/media/komanda/agija.webp",
  },
  {
    name: "Madara",
    role: "Animatore",
    bio: "Enerģiska animatore ar pedagoga pieredzi, kas aizrauj ar spēlēm, dejām un piedzīvojumiem.",
    photo: "/media/komanda/madara-animatore.webp",
  },
  {
    name: "Vanesa",
    role: "Administratore",
    bio: "Parūpējas, lai viss ritētu gludi — no rezervācijām līdz mājaslapas tehniskajai pusei.",
    photo: "/media/komanda/vanesa.webp",
  },
  {
    name: "Keita",
    role: "Klientu uzņemšana",
    bio: "Pirmais smaids, kas sagaida viesus. Keita rūpējas par sirsnīgu uzņemšanu un kārtību.",
    photo: "/media/komanda/keita.webp",
  },
].map((m, i) => ({ ...m, sort: (i + 1) * 10, published: true }));

/**
 * Pasākumi un sadarbības partneri, kas minēti uzņēmuma iepriekšējā mājaslapā.
 * Logotipus var augšupielādēt administrēšanas panelī; bez logo tiek rādīts nosaukums.
 * Pirms logo publicēšanas pārliecinieties, ka klients tam piekrīt.
 */
// Klienti un sadarbības partneri (logo — public/media/klienti). Panelī: "Klienti".
export const defaultClients: Client[] = (
  [
    ["Stiga RM", "stiga-rm"],
    ["Vizium", "vizium"],
    ["Brabantia", "brabantia"],
    ["ANNELS uzņēmumu grupa", "annels"],
    ["CSK Steel", "csk-steel"],
    ["UPB", "upb"],
    ["Abavas ģimenes vīna darītava", "abavas"],
    ["Pilsētas māja", "pilsetas-maja"],
    ["Jaunmoku pils", "jaunmoku-pils"],
    ["Tukuma pilsētas Kultūras nams", "tukuma-kulturas-nams"],
    ["Bauskas Kultūras centrs", "bauskas-kulturas-centrs"],
    ["Dobeles novada Kultūras pārvalde", "dobeles-kulturas-parvalde"],
    ["Biedrība “Tavi draugi”", "tavi-draugi"],
  ] as const
).map(([name, file], i) => ({ name, logo: `/media/klienti/${file}.webp`, url: "", sort: (i + 1) * 10, published: true }));

/**
 * Atsauksmes netiek izdomātas — tās pievieno administrēšanas panelī,
 * izmantojot īstas klientu atsauksmes (ar viņu atļauju).
 */
export const defaultTestimonials: Testimonial[] = [];
