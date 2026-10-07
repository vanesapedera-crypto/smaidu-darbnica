import type { Service } from "../types";

/**
 * Pakalpojumi uzņēmumiem un pašvaldībām (noklusējuma saturs / seed).
 * Astoņi konkrēti piedāvājumi; "izrades" kartīte ved uz lapu /izrades.
 * Tekstus var labot administrēšanas panelī sadaļā "Pakalpojumi".
 */

type Draft = Omit<
  Service,
  "audience" | "pricing" | "published" | "age" | "seoTitle" | "seoDescription"
> & Partial<Pick<Service, "pricing" | "age">>;

const INDIVIDUAL =
  "Cena atkarīga no dalībnieku skaita, ilguma un norises vietas. Sagatavosim individuālu piedāvājumu vienas darba dienas laikā.";

const drafts: Draft[] = [
  {
    slug: "lielformata-speles",
    title: "Lielformāta spēles",
    icon: "Dices",
    excerpt:
      "Party Trip ir lielformāta spēļu programma, kuru pielāgojam katra pasākuma vajadzībām, auditorijai un mērķim. Mēs nodrošinām visu pasākuma norisi — no spēļu uzstādīšanas un vadīšanas līdz punktu skaitīšanai un uzvarētāju paziņošanai.",
    intro: "", // ievads jau ir galvenē (excerpt)
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu pasākumi", "Komandu sacensības", "Pilsētu svētki un festivāli", "Ģimenes un sporta dienas"],
    // Īsi — ko mēs nodrošinām (lapā rāda kā kompaktu joslu virs spēlēm)
    activities: [
      { title: "Spēļu izvēle", description: "Kopā ar jums izvēlamies pasākumam piemērotāko spēļu kombināciju." },
      { title: "Uzstādīšana", description: "Atvedam un uzstādām spēles pasākuma vietā — telpās vai brīvā dabā." },
      { title: "Vadīšana un punkti", description: "Mūsu vadītāji skaidro noteikumus, vada spēles un skaita punktus." },
      { title: "Uzvarētāju paziņošana", description: "Noslēgumā apkopojam rezultātus un paziņojam uzvarētājus." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [
      { question: "Vai spēles der komandu sacensībām?", answer: "Jā — mūsu vadītāji vada spēles, skaita punktus un noslēgumā paziņo uzvarētājus." },
      { question: "Vai varam izvēlēties konkrētas spēles?", answer: "Jā. Kopā izveidojam spēļu kombināciju, kas der jūsu vietai, dalībnieku skaitam un pasākuma mērķim." },
    ],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/speles/jenga.webp",
    albums: ["lielformata-speles"],
    seasons: ["visu-gadu"],
    sort: 10,
  },
  {
    slug: "radosas-darbnicas",
    title: "Radošās darbnīcas",
    icon: "Palette",
    excerpt:
      "Radošās darbnīcas bērniem un pieaugušajiem — dalībnieki paši izgatavo suvenīru, ko paņemt līdzi.",
    intro: "",
    body: "",
    highlights: [],
    suitableFor: ["Pilsētu svētki un festivāli", "Uzņēmumu ģimenes dienas", "Klientu dienas", "Skolas pasākumi"],
    activities: [
      { title: "Sezonālie rotājumi", description: "Ziemassvētku, Lieldienu vai vasaras tēmas darbi." },
      { title: "Dabas materiāli", description: "Darbi no koka, sūnām, ziediem un citiem dabas materiāliem." },
      { title: "Rotaslietas", description: "Rokassprādzes, kaklarotas un matu rotas." },
      { title: "Slaims, tējnīcas un SPA zonas", description: "Krāsainais slaims un zinātnes eksperimenti, publiskas tējnīcas un SPA zonas." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [
      { question: "Cik cilvēku var piedalīties vienlaikus?", answer: "Parasti 10–20 pie viena galda, bet varam iekārtot vairākas darbnīcu vietas." },
    ],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/uznemumiem-radosas-darbnicas/radosas-darbnicas-07.webp",
    albums: ["valpurgu-nakts-tervete-2026", "ziemassvetki-2025", "stiga-meza-dienas"],
    seasons: ["visu-gadu", "ziema"], // rāda arī Ziemassvētku blokā
    sort: 20,
  },
  {
    slug: "pasakumu-organizesana",
    title: "Pasākumu vadīšana un organizēšana",
    icon: "Building2",
    excerpt:
      "Pasākuma organizēšana un vadīšana no idejas līdz noslēgumam — scenārijs, vadītājs, programma un viss nepieciešamais. Jums ir viens kontakts, kas koordinē visu pasākumu.",
    intro: "", // soļus rāda kā kompaktu joslu zem galvenes (tāpat kā "Lielformāta spēles")
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu jubilejas", "Klientu un partneru dienas", "Zīmola festivāli", "Atvēršanas svētki"],
    activities: [
      { title: "Koncepcija", description: "Kopā definējam mērķi, auditoriju un pasākuma noskaņu." },
      { title: "Programma", description: "Izveidojam dienas plānu ar šoviem, aktivitātēm un pauzēm." },
      { title: "Norise", description: "Mūsu komanda vada pasākumu, jūs baudāt svētkus kopā ar viesiem." },
      { title: "Noslēgums", description: "Sakārtojam vietu un pēc vēlēšanās nododam foto materiālus." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [
      { question: "Cik laicīgi jāpiesaka pasākums?", answer: "Ieteicams 3–6 nedēļas iepriekš, sezonas laikā (jūnijs, decembris) — agrāk." },
      { question: "Vai varat strādāt ar mūsu zīmolu?", answer: "Jā, dekorācijas, foto stūri un aktivitātes var veidot jūsu zīmola krāsās un tematikā." },
      { question: "Vai izrakstāt rēķinu uzņēmumam?", answer: "Jā, strādājam ar līgumu un rēķinu juridiskai personai." },
    ],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/pasakumu-organizesana/pasakums-09.webp",
    albums: ["vizium-jubileja"],
    seasons: ["visu-gadu", "ziema"], // rāda arī Ziemassvētku blokā
    sort: 30,
  },
  {
    slug: "mazulu-zona",
    title: "Mazuļu zona",
    icon: "Baby",
    excerpt:
      "Droša un aprīkota rotaļu vieta mazākajiem bērniem, lai vecāki uz mirkli var piesēst un uzelpot.",
    intro: "",
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu svētki", "Konferences un semināri", "Kāzas un banketi", "Festivāli"],
    activities: [
      { title: "Iglu kluči", description: "Mīkstie kluči būvēšanai un rotaļām." },
      { title: "Piepūšamā pils un atrakcijas", description: "Lēkāšanai un aktīvai rotaļai." },
      { title: "Milzu ziepju burbuļi", description: "Lieli burbuļi, ko bērni var ķert." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/uznemumiem-mazulu-zona/mazulu-zona-09.webp",
    albums: ["mazulu-sturitis", "tukuma-rozu-svetki-2025"],
    seasons: ["visu-gadu"],
    sort: 40,
  },
  {
    slug: "sejas-apgleznosana",
    title: "Sejas apgleznošana",
    icon: "Brush",
    excerpt:
      "Sejas apgleznošana un glitteru tetovējumi pasākumiem — ātri, krāsaini un ar drošām kosmētiskajām krāsām.",
    intro: "",
    body: "",
    highlights: [],
    suitableFor: ["Festivāli", "Uzņēmumu ģimenes dienas", "Pilsētu svētki", "Sporta pasākumi"],
    activities: [
      { title: "Sejas apgleznošana", description: "Klasiski un tematiski dizaini bērniem un pieaugušajiem." },
      { title: "Glitteru tetovējumi", description: "Pagaidu tetovējumi ar kosmētisko glitteru un krāsainas matu šķipsnas." },
      { title: "Droša kosmētika", description: "Sertificētas kosmētiskās krāsas un glitteri, kas ir droši bērnu ādai." },
      { title: "Lieliem pasākumiem", description: "Nodrošinām vairākus māksliniekus vienlaikus." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [
      { question: "Cik cilvēkus var apgleznot stundā?", answer: "Tas atkarīgs no dizainu sarežģītības. Mākslinieku skaitu un laiku saskaņojam ar jums pēc apmeklētāju skaita." },
    ],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/uznemumiem-sejas-apgleznosana/sejas-apgleznosana-19.webp",
    albums: ["sejas-apgleznosana", "tukuma-rozu-svetki-2025", "dobeles-pilsetas-svetki-2026"],
    seasons: ["visu-gadu"],
    sort: 50,
  },
  {
    slug: "putu-ballite",
    title: "Putu ballīte",
    icon: "Sparkles",
    excerpt:
      "Putu ballītes noma uzņēmumu, sabiedriskiem un ģimenes pasākumiem — aktīva ballīte putās ar mūziku.",
    intro: "",
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu ģimenes dienas", "Pilsētu svētki", "Festivāli", "Ģimenes svētki"],
    activities: [],
    pricingNote: INDIVIDUAL, // cena uzņēmumiem — individuāli
    faq: [],
    duration: "",
    participants: "",
    heroImage: "/media/putu-ballite/putu-ballite-01.webp",
    albums: ["putu-ballite"],
    seasons: ["visu-gadu"],
    sort: 60,
  },
  {
    slug: "sporta-speles",
    title: "Sporta spēles uzņēmumiem",
    icon: "Trophy",
    excerpt:
      "Sporta dienas un aktīvas stafetes uzņēmumiem, skolām un pašvaldībām — ar tiesnešiem, inventāru un apbalvošanu.",
    intro: "",
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu sporta dienas", "Skolas un bērnudārzi", "Pagastu un novadu svētki", "Ģimenes dienas"],
    activities: [
      { title: "Lielformāta spēles", description: "Sporta spēlēs iekļaujam arī mūsu lielformāta spēles." },
      { title: "Virvju trase", description: "Piedāvājam Baltijā vienīgo virvju trasi." },
      { title: "Tiesāšana un punkti", description: "Tiesājam disciplīnas un skaitām punktus." },
      { title: "Apbalvošana", description: "Noslēgumā apbalvojam uzvarētājus." },
    ],
    pricingNote: INDIVIDUAL,
    faq: [
      { question: "Vai jānodrošina inventārs?", answer: "Nē, visu nepieciešamo inventāru atvedam paši." },
      { question: "Cik dalībnieku var piedalīties?", answer: "Dalībnieku skaitu saskaņojam ar jums — programmu pielāgojam gan nelielām komandām, gan lieliem kolektīviem." },
    ],
    duration: "", // saskaņojam ar klientu
    participants: "", // saskaņojam ar klientu
    heroImage: "/media/uznemumiem-sporta-speles/sporta-speles-01.webp",
    albums: ["stiga-meza-dienas", "lielformata-speles"],
    seasons: ["visu-gadu"],
    sort: 70,
  },
  {
    slug: "izrades",
    title: "Izrādes",
    icon: "Drama",
    excerpt:
      "Ziemassvētku izrādes visai ģimenei — “Ziemassvētku faktors”, “Dāvanu prieks” un “Dāvanu recepte”. Noskatieties video.",
    intro:
      "Ziemassvētku izrādes visai ģimenei uzņēmumu, pašvaldību un kultūras centru pasākumiem.",
    body: "",
    highlights: [],
    suitableFor: ["Uzņēmumu svētki", "Pašvaldību pasākumi", "Kultūras centri"],
    activities: [],
    pricingNote: INDIVIDUAL,
    faq: [],
    duration: "",
    participants: "",
    heroImage: "/media/ziemassvetki-2025/ziemassvetki-2025-03.webp",
    albums: ["ziemassvetki-2025"],
    seasons: ["visu-gadu", "ziema"], // rāda arī Ziemassvētku blokā
    sort: 80,
  },
];

export const businessServices: Service[] = drafts.map((d) => ({
  audience: "business",
  pricing: [],
  age: "Visiem vecumiem",
  published: true,
  seoTitle: "",
  seoDescription: "",
  ...d,
}));
