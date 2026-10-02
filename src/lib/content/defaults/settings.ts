import type { SiteSettings } from "../types";
import { businessServices } from "./business-services";
import { GAMES } from "./games";
import { CHARACTERS, SERVICE_PHOTOS, SHOW_PHOTOS } from "./service-media";

// Ziemassvētku bloka kartītes: pakalpojuma nosaukums un īsais apraksts + Ziemassvētku bilde
const xmasCard = (slug: string, image: string) => {
  const s = businessServices.find((x) => x.slug === slug);
  return { title: s?.title ?? slug, text: s?.excerpt ?? "", image };
};

/**
 * Noklusējuma iestatījumi. Tiek izmantoti:
 *  1) kā sākuma dati (seed) site_settings tabulai;
 *  2) kā rezerves vērtības, ja datubāze nav pieejama vai laukam nav vērtības.
 */
export const defaultSettings: SiteSettings = {
  contact: {
    company: "SIA \"JUALEKS\"",
    address: "Pasta iela 25",
    city: "Tukums",
    postalCode: "LV-3101",
    email: "smaidu.darbnica@gmail.com",
    emailPrivate: "smaidu.darbniica@gmail.com",
    phoneBusiness: "+371 26 705 817",
    phoneBusinessPerson: "Kristīne",
    phonePrivate: "+371 28 193 386",
    phonePrivatePerson: "Vanesa",
    hours: "Katru dienu 9.00–16.00",
    heroImage: "/media/smaidu-darbnica/smaidu-darbnica-01.webp",
    mapQuery: "Pasta iela 25, Tukums, LV-3101",
    facebook: "https://www.facebook.com/smaidudarbnica",
    instagram: "https://www.instagram.com/smaidu_darbnica/",
    tiktok: "https://www.tiktok.com/@smaidudarbnica",
    legalName: "Sabiedrība ar ierobežotu atbildību \"JUALEKS\"",
    legalAddress: "Zemgales iela 8, Tukums, LV-3101",
    regNr: "40002054493",
    vatNr: "LV40002054493",
    bank: "",
    iban: "",
  },

  home: {
    heroEyebrow: "Pasākumu aģentūra uzņēmumiem un pašvaldībām",
    heroTitle: "Mūsu misija — radīt",
    heroHighlight: "smaidu",
    heroAfter: "",
    heroText:
      "Mēs parūpēsimies par Jūsu pasākumu organizēšanu no A līdz Ž! No idejas līdz pēdējam akcentam – mūsu komanda nodrošinās scenārija izstrādi, dekorācijas, tehnisko nodrošinājumu un visas citas nianses, lai Jūs varētu baudīt pasākumu bez raizēm.",
    heroTextMobile:
      "Mēs parūpēsimies par Jūsu pasākumu organizēšanu no A līdz Ž — no idejas līdz pēdējam akcentam, lai Jūs varētu baudīt pasākumu bez raizēm.",
    heroPhotos: [
      { src: "/media/vizium-jubileja/vizium-jubileja-09.webp", caption: "Burbuļu šovs" },
      { src: "/media/ziemassvetki-2025/ziemassvetki-2025-23.webp", caption: "Ziemassvētki" },
      { src: "/media/lielformata-speles/lielformata-speles-06.webp", caption: "Lielformāta spēles" },
    ],
    heroVideo: "",
    heroPoster: "/media/smaidu-darbnica/smaidu-darbnica-09.webp",
    heroCtaPrimary: "Pieprasīt piedāvājumu",
    heroCtaSecondary: "Apskatīt pakalpojumus",
    stats: [
      { value: "10+", label: "gadu pieredze" },
      { value: "45+", label: "tematiski tēli" },
      { value: "1", label: "kontaktpersona visam pasākumam" },
      { value: "Visa Latvija", label: "izbraucam pie jums" },
    ],
    servicesTitle: "Viss vienam veiksmīgam pasākumam",
    servicesText:
      "Izvēlieties atsevišķu aktivitāti vai uzticiet mums visu pasākumu — scenāriju, vadītājus, atrakcijas, dekorācijas un bērnu zonu.",
    whyTitle: "Kāpēc uzņēmumi izvēlas mūs",
    whyText:
      "Mēs zinām, ka pasākuma organizēšana ir papildu darbs jūsu ikdienā. Tāpēc uzņemamies atbildību no pirmā zvana līdz pēdējam viesim.",
    why: [
      {
        title: "Viens kontakts visam",
        description:
          "Personīgs projekta vadītājs, kas koordinē programmu, laikus un komandu. Jums nav jāorganizē desmit piegādātāji.",
      },
      {
        title: "10 gadu pieredze",
        description:
          "Esam strādājuši uzņēmumu jubilejās, pilsētu svētkos un festivālos ar simtiem un tūkstošiem dalībnieku.",
      },
      {
        title: "Programma pēc jūsu mērķa",
        description:
          "Pielāgojam saturu dalībnieku vecumam, skaitam, telpai un pasākuma formātam — iekštelpās vai ārā.",
      },
      {
        title: "Droši un profesionāli",
        description:
          "Pārbaudīts inventārs, pieredzējuši animatori un skaidri līgumi ar rēķinu uzņēmumam.",
      },
    ],
    processTitle: "Kā mēs strādājam",
    process: [
      { title: "Pieteikums", description: "Pastāstiet par pasākumu — datums, vieta, dalībnieku skaits un mērķis." },
      { title: "Piedāvājums", description: "Vienas darba dienas laikā sagatavojam programmu un izmaksu tāmi." },
      { title: "Sagatavošana", description: "Saskaņojam scenāriju, laikus un tehniskās detaļas ar jūsu komandu." },
      { title: "Pasākums", description: "Ierodamies laikus, vadām programmu un sakārtojam vietu pēc sevis." },
    ],
    galleryTitle: "No mūsu pasākumiem",
    galleryText: "Ieskats pasākumos, ko esam veidojuši uzņēmumiem, pašvaldībām un festivāliem.",
    galleryImages: [
      "/media/tukuma-rozu-svetki-2025/tukuma-rozu-svetki-2025-08.webp",
      "/media/ziemassvetki-2025/ziemassvetki-2025-03.webp",
      "/media/lielformata-speles/lielformata-speles-01.webp",
      "/media/valpurgu-nakts-tervete-2026/valpurgu-nakts-tervete-2026-10.webp",
      "/media/dobeles-pilsetas-svetki-2026/dobeles-pilsetas-svetki-2026-05.webp",
      "/media/stiga-meza-dienas/stiga-meza-dienas-02.webp",
      "/media/tukuma-rozu-svetki-2025/tukuma-rozu-svetki-2025-07.webp",
      "/media/vizium-jubileja/vizium-jubileja-07.webp",
      "/media/ziemassvetki-2025/ziemassvetki-2025-17.webp",
      "/media/mazulu-sturitis/mazulu-sturitis-01.webp",
      "/media/valpurgu-nakts-tervete-2026/valpurgu-nakts-tervete-2026-13.webp",
      "/media/lielformata-speles/lielformata-speles-09.webp",
    ],
    xmasEnabled: true,
    xmasEyebrow: "Ziemassvētki 2026",
    xmasTitle: "Svētku sezona",
    xmasHighlight: "tuvojas",
    xmasText:
      "Svētku programmas uzņēmumiem, pašvaldībām un skolām. Decembra nedēļas nogales aizpildās visātrāk — rezervējiet laicīgi.",
    xmasShort: "Izrādes, rūķi un Ziemassvētku vecītis jūsu uzņēmuma vai pilsētas svētkiem. Decembris aizpildās ātri — rezervējiet laicīgi.",
    xmasPoints: [], // piedāvājumi jau ir kartītēs zem teksta
    xmasPhotos: [
      { src: "/media/ziemassvetki-2025/ziemassvetki-2025-03.webp", caption: "Ziemassvētku izrāde" },
      { src: "/media/ziemassvetki-2025/ziemassvetki-2025-28.webp", caption: "Rūķi" },
      { src: "/media/ziemassvetki-2025/ziemassvetki-2025-17.webp", caption: "Radošās darbnīcas" },
    ],
    ctaTitle: "Plānojat pasākumu?",
    ctaText:
      "Pastāstiet mums par savu ideju — sagatavosim piedāvājumu vienas darba dienas laikā.",
    xmasCards: [
      xmasCard("izrades", "/media/ziemassvetki-2025/ziemassvetki-2025-09.webp"),
      xmasCard("radosas-darbnicas", "/media/ziemassvetki-2025/ziemassvetki-2025-18.webp"),
      xmasCard("pasakumu-organizesana", "/media/ziemassvetki-2025/pasakumu-vadisana.webp"),
      {
        title: "Egles iedegšana",
        text: "Pilsētu un pašvaldību egles iedegšanas svētki ar programmu visai ģimenei.",
        image: "/media/ziemassvetki-2025/egles-iedegsana.webp",
      },
    ],
    doors: [
      {
        tag: "Uzņēmumiem",
        title: "Visu veidu pasākumi",
        text: "Uzņēmumu, pilsētu un skolu svētki, Ziemassvētku un vasaras pasākumi, radošās darbnīcas un lielformāta spēles.",
        image: "/media/smaidu-darbnica/uznemumiem-kartite-v2.webp",
        href: "/uznemumiem",
      },
      {
        tag: "Izrādes",
        title: "Izrādes visai ģimenei",
        text: "Interaktīvas izrādes uz skatuves — Ziemassvētku un vasaras uzvedumi.",
        image: "/media/izrades/izrade-09.webp",
        href: "/izrades",
      },
      {
        tag: "Privātpersonām",
        title: "Bērnu ballītes",
        text: "Tematiskas bērnu ballītes ar animatoriem mūsu telpās vai pie jums.",
        image: "/media/tukuma-rozu-svetki-2025/tukuma-rozu-svetki-2025-08.webp",
        href: "/izklaides-programmas",
      },
      {
        tag: "Tukums",
        title: "Telpu noma",
        text: "Bumbu baseins, disko zāle un virtuve Tukuma centrā.",
        image: "/media/telpas/telpas-03.webp",
        href: "/telpu-noma",
      },
    ],
  },

  about: {
    title: "Radām smaidus jau vairāk nekā 10 gadus",
    intro:
      "Smaidu Darbnīca ir pasākumu aģentūra Tukumā, kas organizē izklaides programmas uzņēmumiem, pašvaldībām, skolām un ģimenēm visā Latvijā.",
    image: "/media/par-mums/par-mums-02.webp",
    story:
      "Mēs sākām ar bērnu ballītēm, un šodien mūsu komanda veido pilsētu svētkus, uzņēmumu jubilejas, Ziemassvētku pasākumus un festivālu bērnu zonas ar tūkstošiem apmeklētāju.\n\nNo idejas līdz pēdējam akcentam — izstrādājam scenāriju, sagatavojam dekorācijas, aktivitātes un muzikālos priekšnesumus. Programmu vienmēr pielāgojam dalībnieku vecumam, skaitam un pasākuma formātam.\n\nMūsu mērķis ir vienkāršs: lai jūs varat mierīgi baudīt svētkus, bet viesi aiziet mājās ar siltām atmiņām.",
    values: [
      { title: "Uzticamība", description: "Ierodamies laikā, turam solīto un vienmēr esam sazvanāmi." },
      { title: "Radošums", description: "Katram pasākumam — sava ideja, tēli un detaļas." },
      { title: "Drošība", description: "Pārbaudīts inventārs un pieredzējusi komanda, kas pieskata katru dalībnieku." },
      { title: "Prieks", description: "Smaids ir mūsu darba rezultāts — gan bērniem, gan pieaugušajiem." },
    ],
    teamTitle: "Komanda",
    teamText: "Pieredzējuši pasākumu vadītāji, animatori un radošie cilvēki, kas savu darbu dara ar sirdi.",
  },

  business: {
    heroTitle: "Pasākumi, kas",
    heroHighlight: "saliedē",
    heroText:
      "Lielformāta spēles, radošās darbnīcas, mazuļu zona, sejas apgleznošana, putu ballīte, sporta spēles un izrādes — kā arī pasākuma vadīšana un organizēšana.",
    winterText:
      "Ziemassvētku izrādes, rūķu programmas, Ziemassvētku vecītis un radošās darbnīcas darbinieku bērniem, klientiem un pilsētu svētkiem.",
    summerText:
      "Vasaras ballītes, ģimenes dienas un pilsētu svētki brīvā dabā — radošās darbnīcas, lielformāta spēles, burbuļu šovi un seju apgleznošana.",
    allYearText: "Komandas saliedēšana, uzņēmumu jubilejas un bērnu zonas jebkurā gadalaikā.",
    showsTitle: "Izrādes jūsu pasākumam",
    showsText:
      "Interaktīvas izrādes ar mūsu tēliem uz skatuves — Ziemassvētku un vasaras uzvedumi. Video un vairāk informācijas sadaļā “Izrādes”.",
    photosTitle: "No mūsu pasākumiem",
    heroImage: "/media/hero/pasakums-06.webp",
    games: GAMES,
    servicePhotos: SERVICE_PHOTOS,
  },

  shows: {
    heroTitle: "Izrādes, kas",
    heroHighlight: "aizrauj",
    heroText:
      "Interaktīvas izrādes bērniem un ģimenēm uzņēmumu pasākumos, pašvaldību svētkos, skolās un bērnudārzos. Skatītāji ne tikai skatās — viņi piedalās.",
    videosTitle: "Noskaties",
    videos: [
      {
        title: "Ziemassvētku faktors",
        src: "https://www.youtube.com/watch?v=Dtyuc4qDKtg",
        poster: "",
        duration: "45 min",
        audience: "Visai ģimenei",
        description:
          "**Ziemassvētku faktors – izrāde, kas aizrauj gan lielus, gan mazus!**\n\n" +
          "Kur slēpjas īstais Ziemassvētku brīnums – dziesmās, gaismiņās, dāvanās vai kopā būšanā?\n\n" +
          "Izrādē uzzināsim, kas patiesībā dara svētkus tik īpašus – un pat Grinčs būs spiests piekrist.",
      },
      {
        title: "Ziemassvētku izrāde “Dāvanu prieks”",
        src: "https://www.youtube.com/watch?v=jQU123jdLEw",
        poster: "",
        duration: "45 min",
        audience: "Visai ģimenei",
        description:
          "**Ziemassvētku laiks ir stāsts par prieku, ģimeni, kopā būšanu un dāvināšanu.** Tieši par to ir mūsu izrāde “Dāvanu prieks” – sirsnīgs un aizraujošs svētku piedzīvojums.\n\n" +
          "Izrāde apvieno Ziemassvētku noskaņu, humoru, aizraujošu stāstu un sirsnīgus mirkļus, kas uzrunā gan bērnus, gan pieaugušos.\n\n" +
          "Dāvanas var būt dažādas, bet visvērtīgākās ir tās, kas rada prieku un paliek atmiņā.",
      },
      {
        title: "Ziemassvētku izrāde “Dāvanu recepte”",
        src: "https://www.youtube.com/watch?v=ie-0zXLVs1E",
        poster: "",
        duration: "45 min",
        audience: "Visai ģimenei",
        description:
          "**Kāda ir īstā dāvanu recepte?** Paša gatavota, internetā nopirkta vai varbūt… kopā pavadītais laiks?\n\n" +
          "Trīs rūķi ar pavisam atšķirīgiem raksturiem un viens ļoti svarīgs uzdevums – sagatavot dāvanu pašam Ziemassvētku vecītim! Vai viņiem izdosies atrast īsto Dāvanu recepti?\n\n" +
          "Muzikāla izrāde ar skatītāju aktīvu iesaisti, dziesmām, dejām, jautrību un svētku sajūtu.",
      },
    ],
    aboutTitle: "Par izrādēm",
    body:
      "Mūsu izrādēs piedalās tēli, kurus bērni pazīst un mīl, un katrā izrādē skatītāji kļūst par daļu no stāsta. Izrādes spēlējam uz skatuves.\n\nZiemassvētku izrādes visai ģimenei — “Ziemassvētku faktors”, “Dāvanu prieks” un “Dāvanu recepte” — izvēlas uzņēmumi darbinieku bērnu svētkiem un pašvaldības svētku pasākumiem. Izrādi var papildināt ar Ziemassvētku vecīti, dāvanu pasniegšanu un radošajām darbnīcām.",
    highlights: [
      "Interaktīva — skatītāji piedalās",
      "Skatuvei vai telpai",
      "Tematiski tēli un kostīmi",
      "Var apvienot ar darbnīcām un dāvanām",
    ],
    suitableFor: ["Uzņēmumu svētki", "Pašvaldību pasākumi", "Skolas un bērnudārzi", "Ģimenes pasākumi"],
    heroImage: "/media/ziemassvetki-2025/ziemassvetki-2025-09.webp",
    photos: SHOW_PHOTOS.map((p) => p.src),
  },

  venue: {
    heroTitle: "Svētki",
    heroHighlight: "mūsu",
    heroAfter: "telpās",
    heroText: "Gaiša, mājīga un pilnībā aprīkota vieta dzimšanas dienām un ģimenes svētkiem Tukuma centrā.",
    aboutTitle: "Par telpām",
    about:
      "Smaidu Darbnīcas svinību telpas ir vieta, kur bērni var priecāties, rotaļāties un svinēt, bet pieaugušie – nesteidzīgi baudīt kopā būšanu.\n\nKamēr bērni izklaidējas rotaļu zonās, vecāki un viesi var ērti iekārtoties pie svētku galda. Telpas iespējams nomāt gan atsevišķi, gan kopā ar mūsu izklaides programmām, radot neaizmirstamus svētkus ikvienam.",
    features: [
      { title: "Bumbu baseins", description: "Tūkstošiem krāsainu bumbiņu." },
      { title: "Rotaļu istaba", description: "Veikaliņš, virtuvīte, leļļu māja, Montessori rotaļlietas un mašīnu trase." },
      { title: "Mazulīšu stūrītis", description: "Droša vieta mazākajiem bērniem ar iglu klučiem." },
      { title: "Disko zāle", description: "Gaismas efekti un JBL skaļrunis." },
      { title: "Aktivitātes", description: "Bolderinga siena, veiklības trase un gaisa hokejs." },
      { title: "Virtuves zona", description: "Kafijas automāts, elektriskā tējkanna, kafija, tējas, piens un trauki. Pie galdiem vietas līdz 18 pieaugušajiem." },
    ],
    included: [
      "3 stundas telpās",
      "Visas rotaļu zonas: bumbu baseins, rotaļu istaba, mazuļu stūrītis, bolderings, gaisa hokejs",
      "Disko zāle ar gaismām un JBL skaļruni",
      "Virtuves zona ar kafiju, tējām un pienu",
      "Trauki",
      "Galdi un krēsli līdz 18 pieaugušajiem",
    ],
    rules: "Laipni lūdzam Smaidu Darbnīcā! Lai svētki noritētu patīkami un bez raizēm, lūdzam ievērot šos noteikumus.\n\n## Ierašanās un izrakstīšanās\n- Viesi telpās var ierasties 15 minūtes pirms rezervētā laika.\n- Pēc rezervācijas beigām telpas obligāti jāatstāj un jānodod **ne vēlāk kā 15 minūšu laikā**.\n- Papildu stundu iespējams pieteikt tikai ballītēm, kas notiek no plkst. 18.00–21.00, vai ballītēm no pirmdienas līdz ceturtdienai.\n- Papildu laiks iepriekš jāsaskaņo ar administrāciju.\n\n## Telpu lietošana un drošība\n- Bērni telpās drīkst uzturēties tikai pieaugušo uzraudzībā.\n- Lūdzam saudzīgi izturēties pret rotaļlietām, inventāru un telpu aprīkojumu.\n- Nav atļauts izmantot inventāru neatbilstoši tā paredzētajam lietojumam.\n- Ja tiek pamanīti bojājumi vai drošības riski, lūdzam nekavējoties informēt administrāciju.\n\n## Inventāra bojājumi\n- Par bojātu vai salauztu inventāru tiek piemērota maksa atbilstoši remonta vai nomaiņas izmaksām.\n- JBL skaļruņa bojājuma vai apliešanas gadījumā klients sedz pilnu ierīces vērtību.\n- Disko bumbas vai apgaismojuma bojājumu gadījumā tiek segtas remonta vai nomaiņas izmaksas.\n- Par bojātiem, saplēstiem IGLU klučiem tiek segtas nomaiņas izmaksas.\n- Hokeja galda bojājumu gadījumā izmaksas tiek noteiktas atbilstoši bojājuma apmēram.\n\n## Tīrība un kārtība\n- Pēc pasākuma lūdzam savākt personīgās mantas un salikt visas bumbiņas atpakaļ bumbu baseinā.\n- Virtuves zonu un izmantotos traukus lūdzam atstāt kārtībā.\n\n## Ēdieni un dzērieni\n- Ēdienus un dzērienus aizliegts nest rotaļu zonā.\n\n## Svarīga informācija\n- Ja ballītes laikā rodas jautājumi vai tehniskas problēmas, lūdzam zvanīt uz tālruņa numuru 28193386.\n\n## Klienta atbildība\nVeicot rezervāciju un uzturoties telpās, klients apliecina, ka:\n- ir iepazinies ar telpu lietošanas noteikumiem;\n- ir saņēmis telpas un inventāru kārtīgā stāvoklī;\n- apņemas pēc pasākuma nodot telpas un inventāru tādā pašā stāvoklī;\n- apņemas segt remonta vai nomaiņas izmaksas, ja pēc pasākuma tiek konstatēti būtiski inventāra vai telpu bojājumi.\n\nPaldies par sapratni un sadarbību! Novēlam skaistus un prieka pilnus svētkus.",
    heroImage: "/media/telpas/telpas-26.webp",
    priceWeekday: 90,
    priceWeekend: 110,
    priceExtraHour: 20,
  },

  programs: {
    heroTitle: "Ballītes, kas",
    heroHighlight: "dzirkst",
    heroText:
      "Tematiskas bērnu ballītes ar animatoriem mūsu telpās vai pie jums mājās. Izvēlieties programmu un rezervējiet datumu.",
    photosTitle: "Mūsu ballītes",
    heroImage: "/media/gabbys-dollhouse-ballite/gabbys-dollhouse-ballite-01.webp",
    characters: CHARACTERS,
    travelSurcharge: 15,
    travelRate: 0.3,
    freeTravelKm: 10,
  },

  seo: {
    siteName: "Smaidu Darbnīca",
    defaultTitle: "Smaidu Darbnīca — pasākumi uzņēmumiem un pašvaldībām",
    defaultDescription:
      "Pasākumu aģentūra Tukumā: komandas saliedēšana, uzņēmumu pasākumi, pilsētu svētki, lielformāta spēles, burbuļu šovi un bērnu zonas visā Latvijā.",
    ogImage: "/media/ziemassvetki-2025/ziemassvetki-2025-03.webp",
  },
};
