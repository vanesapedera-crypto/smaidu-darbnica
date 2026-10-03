import type { PriceGroup, TitledText } from "../types";

/**
 * Izklaides programmu saturs no esošās smaidudarbnica.lv lapas (2026. gada oktobris).
 * Pārraksta programs-legacy.ts vērtības, kur vecajā lapā informācija ir citāda vai pilnīgāka.
 * Teksti pārņemti no vecās lapas — bez izdomātām detaļām.
 */
type Override = {
  age?: string;
  duration?: string;
  intro?: string;
  body?: string;
  activities?: TitledText[];
  pricing?: PriceGroup[];
  note?: string;
  /** Dāvana / suvenīrs katram dalībniekam (programmas lapā izcelts) */
  gift?: string;
};

const a = (title: string, description = ""): TitledText => ({ title, description });

export const programOverrides: Record<string, Override> = {
  "glitteru-ballite": {
    duration: "2 stundas",
    age: "4+ gadi",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Mazā grupa (1–6 bērni)", price: 185 },
          { label: "Lielā grupa (7–15 bērni)", price: 285 },
          { label: "Katrs nākamais bērns", price: 8 },
        ],
      },
    ],
    activities: [
      a("Glitteru sejas apgleznošana un tetovējumi", "Mūsu ballīte sākas ar glitteru sejas apgleznošanu un glitteru tetovējumiem, lai bērni iejustos svētku noskaņā."),
      a("Krāsainās matu šķipsnas", "Tad ļaujamies pārvērtībām, pievienojot krāsainās matu šķipsnas, kas padara katru dalībnieku unikālu."),
      a("Aktivitātes un spēles", "Bērni iesaistās radošās un draudzību veicinošās aktivitātēs un jautrās spēlēs, kas nodrošina prieku un smieklus visiem."),
      a("Briļļu meistarklase", "Ballītes laikā tiek piedāvāta arī radošā darbnīca — briļļu meistarklase."),
    ],
    gift: "Katram dalībniekam — spīdīgie disko kociņi, lai svētki turpinātos arī mājās!",
  },

  "fejas-ballite": {
    duration: "1 stunda",
    age: "3+ gadi",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 135 },
          { label: "Katrs nākamais bērns", price: 5 },
        ],
      },
    ],
    activities: [
      a("Burvju nūjiņa", "Ļaujies iztēlei un izveido savu burvju nūjiņu."),
      a("Seju apgleznošana", "Glitteru spīdumi."),
      a("Burbuļi un dejas", "Brīvais laiks ar burbuļu aktivitātēm un dejām."),
      a("Feju medības", "Tematiskā meklēšanas spēle."),
      a("Spēle “Lidošanas sacensības”", "Jautras stafetes un uzdevumi."),
    ],
    body:
      "## Papildu iespējas\n- Virtuļu dekorēšana — 30 €\n- Rokassprādžu gatavošana — 35 €\n- Sejas apgleznošana — 50 €\n- Sausā ledus kokteiļi — 45 €",
  },

  "slaima-meistarklase": {
    duration: "1 stunda",
    age: "7+ gadi",
    pricing: [
      {
        title: "Meistarklase",
        options: [
          { label: "Mazā grupa (1–9 bērni)", price: 190 },
          { label: "Lielā grupa (10–15 bērni)", price: 285 },
        ],
      },
    ],
    intro: "Stundu garš radošs piedzīvojums, kur bērni paši gatavo savus krāsainos un spīdīgos slaimus! Šis ir ļoti ķepīgs pasākums — un tieši tas šeit ir pats foršākais.",
    activities: [
      a("Krāsas izvēle", "Katrs dalībnieks izvēlas sava slaima krāsu."),
      a("Slaima gatavošana", "Soli pa solim katrs pats sajauc savu slaimu un papildina to ar spīdumiem un dekorācijām."),
      a("Spēles ar slaimu", "Pūšam slaima burbuļus un sacenšamies, kurš savu slaimu izstieps visgarāk."),
    ],
    gift: "Ballītes noslēgumā katrs slaims tiks iepakots, lai bērns to var paņemt uz mājām",
  },

  "nerf-ballite": {
    duration: "1 stunda",
    age: "7+ gadi",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 175 },
          { label: "Katrs nākamais bērns", price: 5 },
        ],
      },
    ],
    activities: [
      a("Azartiska iesildīšanās", "Pirms katras nozīmīgas cīņas ir nepieciešama azartiska iesildīšanās."),
      a("Zvērests un kamuflāža", "Lai cīņa būtu godīga, visi svinīgi saka zvērestu un uzliek kamuflāžu."),
      a("Ieroču meklēšana", "Bet viss nebūt nav tik vienkārši, jo arī savus ieročus vēl ir jāatrod!"),
      a("Ballīte!", "Bet pēc tam gan — uzmanību, gatavību — ballīte!"),
    ],
    body:
      "Ballīte norisinās jūsu izvēlētā vietā — pagalmā, parkā, sporta zālē vai citur visā Latvijā.\n\n**Svarīgi:** ballīte notiek tikai piemērotos laikapstākļos. Lietus un stipra vēja gadījumā pasākums tiek atcelts, jo šādos apstākļos spēle nav tik aizraujoša un kvalitatīva, kā mēs to vēlamies.",
  },

  "wednesday-ballite": {
    duration: "1 stunda",
    age: "5+ gadi",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 135 },
          { label: "Katrs nākamais bērns", price: 5 },
        ],
      },
    ],
    activities: [
      a("Drosmes dzira", "Katram dalībniekam īpašā dzira, lai sagatavotos piedzīvojumiem kopā ar Wednesday!"),
      a("Bailes un izaicinājumi", "Kas ir Tavas bailes un kā tās pārvarēt? Uzzini to caur spēlēm!"),
      a("Baiļu kaste", "Saņem jautru izaicinājumu caur taustes, smaržas un garšas eksperimentiem. Kas slēpjas baiļu kastē?"),
      a("Skeleti", "Reakcijas spēle."),
      a("Degošā roka", "Piedalies eksperimentā, kas pārbaudīs Tavu drosmi!"),
      a("Kliedziens tumsā!", "Kad gaisma izdziest, tikai kliedzieni būs dzirdami… vai Tu izturēsi šo izaicinājumu?"),
      a("Nezināmās rokas", "Katram dalībniekam būs iespēja nopelnīt saldumu cimdiņu."),
    ],
    gift: "Katrs dalībnieks saņems tematisku tetovējumu, lai atcerētos šo neaizmirstamo dzimšanas dienas piedzīvojumu!",
  },

  "petnieku-ballite": {
    duration: "1 stunda",
    age: "3+ gadi",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 155 },
          { label: "Katrs nākamais bērns", price: 7 },
        ],
      },
    ],
    activities: [
      a("Skaņu, gaismu un lukturīšu efekts", "Sajūti, kā dinozauri atdzīvojas, un iepazīsties ar pētnieku!"),
      a("Dinozauru atpazīšanas spēles", "Vai tu proti atšķirt T-rexu no Triceratopsa?"),
      a("Izzinoši stāsti par dinozauriem", "Uzzini par šiem varenajiem dzīvniekiem, kas valdīja uz Zemes!"),
      a("Fosilijas un kauli", "Saliec savu dinozaura skeletu!"),
      a("Izaudzini savu dinozauru", "Olu meklēšana."),
      a("Mīļākā dinozaura portrets jubilāram"),
      a("Plēsīgie un mierīgie dinozauri", "Sacensības un izaicinājumi!"),
      a("Izkal un izpēti arheologa atradumus"),
    ],
    gift: "Katram dalībniekam tematiskie tetovējumi kā suvenīrs!",
  },

  "piratu-ballite": {
    duration: "1 stunda",
    intro:
      "Ielec piedzīvojumā, kur pārbaudīts tiks ikviens, kurš sevi sauc par īstu pirātu! Bet kas gan ir pirātu kuģis bez sava kapteiņa?",
    activities: [
      a("Kapteiņa iecelšana", "Iecelsim kuģa kapteini un dosim tam īstu pirātu vārdu."),
      a("Veiklība un attapība", "Pārbaudīsim katra jaunā pirāta veiklību un attapību — jo būt par pirātu nav nemaz tik viegli!"),
      a("Pirātu karte", "Lasīsim pirātu karti un meklēsim labākos maršrutus."),
      a("Pirātu zobeni", "Taisīsim paši savus zobenus, kas tos sargās katrā nākošajā piedzīvojumā."),
      a("Gala pārbaudījums", "Noskaidrosim, vai jaunie pirāti ir gatavi cīņai!"),
    ],
    body: "Katrs dalībnieks kļūs par īstu pirātu, kurš ir gatavs iekarot jūras un piedzīvot neaizmirstamu ballīti!",
  },

  "make-up-ballite": {
    duration: "Līdz 3 stundām (atkarīgs no bērnu skaita)",
    age: "10+ gadi",
    pricing: [
      {
        title: "Ballīte Smaidu Darbnīcā",
        options: [
          { label: "Mazā grupa (1–6 bērni)", price: 185 },
          { label: "Vidējā grupa (7–10 bērni)", price: 245 },
          { label: "Lielā grupa (11–15 bērni)", price: 285 },
          { label: "Katrs nākamais bērns", price: 8 },
        ],
      },
      {
        title: "Izbraukuma ballīte",
        options: [
          { label: "Mazā grupa (1–10 bērni)", price: 245 },
          { label: "Lielā grupa (11–15 bērni)", price: 285 },
          { label: "Katrs nākamais bērns", price: 8 },
        ],
      },
    ],
    activities: [
      a("Sejas kopšana", "Pārrunāsim, kā saglabāt seju pēc iespējas veselāku un mirdzošāku."),
      a("Kosmētikas maciņš", "Iepazīsim, kas noteikti jābūt ikvienas meitenes kosmētikas maciņā."),
      a("Otiņas", "Cik daudz un kādas tās ir, un kā pareizi tās lietot?"),
      a("Sejas formas", "Ielūkosimies un mācīsimies atpazīt savu un draudzeņu sejas formu."),
      a("Krāsas", "Krāsas un to nozīme."),
      a("Make-up pirmie soļi", "Praktiska apgūšana."),
      a("Pauze", "Dzēriens un veselīgie našķi."),
    ],
    gift: "Katra dalībniece saņem savu make-up otiņu komplektu, ko paņemt līdzi mājās",
  },

  "spa-ballite": {
    duration: "Līdz 3 stundām (atkarīgs no bērnu skaita)",
    age: "6+ gadi",
    pricing: [
      {
        title: "Ballīte Smaidu Darbnīcā",
        options: [
          { label: "Mazā grupa (1–6 bērni)", price: 195 },
          { label: "Vidējā grupa (7–10 bērni)", price: 255 },
          { label: "Lielā grupa (11–15 bērni)", price: 295 },
          { label: "Katrs nākamais bērns", price: 10 },
        ],
      },
      {
        title: "Izbraukuma ballīte",
        options: [
          { label: "Mazā grupa (1–9 bērni)", price: 265 },
          { label: "Lielā grupa (10–15 bērni)", price: 305 },
          { label: "Katrs nākamais bērns", price: 10 },
        ],
      },
    ],
    activities: [
      a("Sejas kopšana", "Sākam ar sejas tīrīšanu ar putiņām un nomierinošu sejas masku, turpinām ar aukstumbumbiņu brillēm acīm noguruma mazināšanai."),
      a("Relaksācija", "Mierpilna mūzika, atpūta ar gurķu šķēlītēm uz acīm, sejas atsvaidzināšana ar ziedūdeni."),
      a("Roku & pēdiņu mīļošana", "Rokām – ārstniecisko ziedu vanniņa un mitrinošs krēms; pēdiņām – mīkstinoša, aromātiska vanniņa."),
      a("Siltā pauze", "Silts kakao ar zefīriņiem."),
      a("Pēdu labsajūta", "Pēdu masāža ar akupunktūras bumbiņām + īsa lekcija par pēdu punktiem un to nozīmi."),
      a("Kulminācija", "Lielformāta bizes pīšana, padomi matu kopšanai."),
      a("DIY dāvaniņa", "Cukurskrubju meistarklase no dabīgām izejvielām – katra izveido savu unikālo dāvaniņu."),
    ],
    gift: "Cukura skrubis, ko katra dalībniece pagatavo pati",
  },

  "eksperimentu-ballite": {
    duration: "1 stunda",
    age: "4+ gadi",
    pricing: [
      {
        title: "Ballīte",
        options: [
          { label: "Mazā grupa (1–6 bērni)", price: 195 },
          { label: "Lielā grupa (7–15 bērni)", price: 285 },
          { label: "Katrs nākamais bērns", price: 8 },
        ],
      },
    ],
    intro: "Aicinām uz aizraujošu zinātnes piedzīvojumu, kur bērni paši kļūst par mazajiem pētniekiem!",
    activities: [
      a("Magnētu eksperimenti", "Atklāsim noslēpumaino spēku, kas pievelk un atgrūž!"),
      a("Rotācijas eksperiments ar šķīvīšiem", "Griezīsim, testēsim un atklāsim kustības burvību jautrā veidā."),
      a("Slāpekļa eksperimenti", "Sasaldēsim priekšmetus acu priekšā: kas notiek ar balonu un kā garšo kukurūza pēc sasaldēšanas?"),
      a("Krāsu šķidrumu eksperimenti", "Krāsas sajaucas, “sprāgst” un rada īstus zinātnes brīnumus."),
      a("UV gaismas iepazīšana", "Ieraudzīsim slepeno pasauli, kas redzama tikai īpašā gaismā."),
      a("Eksperimentāls apsveikums jubilāram", "Veidosim nokasāmās kartītes ar slepeniem sveicieniem."),
      a("Spēle “Jā vai Nē” par jubilāru", "Jautra iepazīšanās un smiekli garantēti."),
    ],
    body:
      "## Papildu iespējas\n- **Saldējuma eksperiments** — bērni paši gatavo savu saldējumu, vēro pārvērtības un izvēlas piedevas.\n- **Kokteiļu darbnīca** — katrs izveido savu krāsaino dzērienu.\n\n**Mazā grupa (1–6 bērni):**\n- Saldējuma eksperiments — 30 €\n- Kokteiļu darbnīca — 10 €\n\n**Lielā grupa (7–15 bērni):**\n- Saldējuma eksperiments — 40 €\n- Kokteiļu darbnīca — 20 €",
  },

  "gabbys-dollhouse-ballite": {
    duration: "1 stunda",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 135 },
          { label: "Katrs nākamais bērns", price: 5 },
        ],
      },
    ],
    activities: [
      a("Tikšanās ar Gabiju", "Tikšanās ar Gabiju pie kakao un iepazīšanās."),
      a("Pirmais noslēpums", "Pārsteiguma kastes atvēršana. Kas tajā paslēpies? To zina tikai Gabija!"),
      a("Ceļojums pa Gabijas māju", "Katrā istabā bērnus gaida jauns pārsteigums, spēle vai aktivitāte."),
      a("Gabijas bingo", "Smiekli skan Gabijas bingo laikā."),
      a("Radošā darbnīca", "Sirsnīgs klusums iestājas radošajā darbnīcā, kad tiek veidotas Gabijas draudzības rokassprādzes."),
      a("Kur paslēpušies kaķīši?", "Bērni dodas jautrā meklēšanā, lai atklātu visus mīļos draugus, kas paslēpušies apkārtējā vidē."),
    ],
    gift: "Gaviļniekam — mīksts un mīļš rotaļu kaķītis par piemiņu no ballītes",
  },

  "frozen-ballite": {
    duration: "1 stunda",
    pricing: [
      {
        title: "Izklaides programma",
        options: [
          { label: "Līdz 15 bērniem", price: 165 },
          { label: "Katrs nākamais bērns", price: 5 },
        ],
      },
    ],
    activities: [
      a("Karaļvalsts radošās darbnīcas", "Mazās princeses un prinči varēs radīt spožus kronīšus vai zīmēt savas unikālās sniegpārsliņas — viss, lai izpaustu sevi kā īstiem karaļvalsts iemītniekiem!"),
      a("Ledus rotaļas un ziemas izaicinājumi", "Smiekli un azarts pavadīs bērnus ledus statuju dejās, sniegavīru stafetēs un dzirkstošā dārguma medībā, meklējot Elzas noslēptos ledus kristālus."),
      a("Elzas burvju mirklis", "Noslēgumā Elza kopā ar bērniem izdejo ziemas deju."),
    ],
    gift: "Katram dalībniekam tematiskie tetovējumi kā suvenīrs!",
  },

  // Privātpersonu sadaļa — tikai ģimenes ballītes (uzņēmumu piedāvājums ir sadaļā "Uzņēmumiem")
  "putu-ballite": {
    duration: "1 stunda",
    intro: "Putu lielgabals rada putu kalnus, kuros bērni var skriet, lēkāt un rotaļāties.",
    note: "Putām vajadzīgs 1 m³ ūdens, kas nostāvējies āra temperatūrā — tieši no akas tas ir par aukstu. Ja šādu ūdeni nevarat sagādāt, par cenu vienosimies atsevišķi.",
    pricing: [
      {
        title: "Putu ballīte",
        options: [
          { label: "Putu ballīte 30 minūtes", price: 180 },
          { label: "Ceļa izdevumi (€/km)", price: 0.3 },
        ],
      },
    ],
    activities: [
      a("Putu ballīte", "30 minūšu aktīva putu ballīte ar putu lielgabalu."),
      a("Izklaide putās", "Pēc tam bērni var turpināt rotaļāties putās, kamēr tās izzūd — kopā līdz 1 stundai."),
      a("Izbraukuma pakalpojums", "Pakalpojums pieejams visā Latvijā. Ceļa izdevumi tiek aprēķināti 0,30 €/km."),
    ],
    body: "",
  },

  "parsteiguma-tels": {
    duration: "15 minūtes",
    age: "Visiem vecumiem",
    intro:
      "Izvēlieties vienu no mūsu lielformāta tēliem — tas ieradīsies svinībās kā pārsteigums gaviļniekam un viesiem.",
    pricing: [{ title: "Pārsteiguma tēls", options: [{ label: "15 minūtes", price: 45 }] }],
    body:
      "**Svarīgi:** lielformāta animatori nevada spēles vai citas aktivitātes.",
  },

  "sejas-apgleznosana": {
    duration: "~7 minūtes vienam bērnam (atkarīgs no dizaina)",
    intro: "Bērnu sejiņu apgleznošana piešķir svētkiem krāsas, prieku un neaizmirstamas emocijas.",
    pricing: [
      {
        title: "Sejas apgleznošana",
        options: [
          { label: "Līdz 10 bērniem (sākot no)", price: 50 },
          { label: "Katrs nākamais bērns", price: 3.5 },
        ],
      },
      {
        title: "Sejas apgleznošana + glittera tetovējumi",
        options: [
          { label: "Līdz 10 bērniem (sākot no)", price: 65 },
          { label: "Katrs nākamais bērns", price: 4.5 },
        ],
      },
    ],
    body:
      "",
  },
};
