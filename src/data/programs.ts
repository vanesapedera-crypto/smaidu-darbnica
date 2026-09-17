export type Program = {
  id: number;
  slug: string;
  title: string;

  image: string;
  folder: string;

  shortDescription: string;
  description: string;

  age: string;
  duration: string;

  pricing: {
    title: string;
    options: {
      label: string;
      price: number;
    }[];
  }[];

  activities: {
    title: string;
    description: string;
  }[];

  note?: string;
};

export const programs: Program[] = [
  {
    id: 1,
  slug: "glitteru-ballite",

  title: "Glitteru ballīte",

  image: "/images/programs/glitter.jpg",
  folder: "glitter",

  shortDescription:
    "Glitteru sejas apgleznošana, tetovējumi, krāsainās matu šķipsnas, spēles un radošā darbnīca.",

  description:
    "Glitteru ballīte paredzēta bērniem no 4 gadu vecuma. Programmas laikā bērni piedalās radošās aktivitātēs, spēlēs un meistarklasē, kā arī saņem dāvanu, ko paņemt līdzi pēc ballītes.",

  age: "4+ gadi",

  duration: "2 stundas",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Mazā grupa (1–6 bērni)", price: 185 },
        { label: "Lielā grupa (7–15 bērni)", price: 285 },
        { label: "Katrs nākamais bērns", price: 8 },
      ],
    },
  ],

  activities: [
    {
      title: "Glitteru sejas apgleznošana",
      description:
        "Katrs bērns izvēlas glitteru dizainu sejas apgleznošanai.",
    },
    {
      title: "Glitteru tetovējumi",
      description:
        "Pagaidu glitteru tetovējumi pēc bērnu izvēles.",
    },
    {
      title: "Krāsainās matu šķipsnas",
      description:
        "Krāsainas matu šķipsnas svētku noskaņai.",
    },
    {
      title: "Spēles un konkursi",
      description:
        "Kopīgas kustību spēles un uzdevumi visiem dalībniekiem.",
    },
    {
      title: "Briļļu darbnīca",
      description:
        "Katrs bērns izgatavo un izrotā savas ballītes brilles.",
     },
],
},
{
  id: 2,
  slug: "fejas-ballite",
  title: "Fejas ballīte",

  image: "/images/programs/fejas.jpg",
    folder: "fejas",

  

  shortDescription:
    "Burvju nūjiņas, glitteri, burbuļi un maģiski piedzīvojumi.",

  description: "",

  age: "3+ gadi",

  duration: "60 minūtes",

  pricing: [
  {
    title: "Cena",
    options: [
      {
        label: "Līdz 15 bērniem",
        price: 135,
      },
      {
        label: "Katrs nākamais bērns",
        price: 5,
      },
    ],
  },
],
  activities: [
  {
    title: "Burvju nūjiņas darbnīca",
    description: "Katrs bērns izgatavo savu burvju nūjiņu.",
  },
  {
    title: "Feju tetovējumi",
    description: "Katrs bērns izvēlas feju tematikas pagaidu tetovējumu.",
  },
  {
    title: "Burbuļi un dejas",
    description: "Dejas un aktivitātes ar burbuļiem.",
  },
  {
    title: "Feju medības",
    description: "Tematiska meklēšanas spēle.",
  },
  {
    title: "Lidošanas sacensības",
    description: "Kustību spēles un stafetes.",
  },
],
},
{
  id: 3,

  slug: "petnieku-ballite",

  title: "Pētnieku ballīte",

  image: "/images/programs/eksperimentu.jpg",
    folder: "dino",


  shortDescription:
    "Dinozauru pētnieku piedzīvojums ar spēlēm, fosilijām, uzdevumiem un tematiskām aktivitātēm.",

  description:
    "Pētnieku ballīte paredzēta bērniem no 3 līdz 7 gadu vecumam. Programmas laikā bērni iepazīst dinozauru pasauli, piedalās izzinošās aktivitātēs, kustību spēlēs un pētnieku uzdevumos.",

  age: "3+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Līdz 15 bērniem", price: 155 },
        { label: "Katrs nākamais bērns", price: 7 },
      ],
    },
  ],

  activities: [
    {
      title: "🔦 Skaņu un gaismu efekti",
      description:
        "Iepazīšanās ar pētnieku un dinozauru pasauli.",
    },
    {
      title: "🦕 Dinozauru atpazīšanas spēles",
      description:
        "Spēles un uzdevumi par dažādiem dinozauriem.",
    },
    {
      title: "📚 Stāsti par dinozauriem",
      description:
        "Izzinoši stāsti par dinozauru dzīvi.",
    },
    {
      title: "🦴 Fosiliju izpēte",
      description:
        "Dinozaura skeleta salikšana un fosiliju iepazīšana.",
    },
    {
      title: "🥚 Dinozaura olu meklēšana",
      description:
        "Tematiska meklēšanas spēle.",
    },
    {
      title: "🎨 Dinozaura portrets jubilāram",
      description:
        "Radošs uzdevums jubilāram.",
    },
    {
      title: "🏃 Dinozauru izaicinājumi",
      description:
        "Kustību spēles un komandu sacensības.",
    },
    {
      title: "⛏️ Arheologa atradumu izpēte",
      description:
        "Izkal un izpēti arheologa atradumus.",
    },
    {
      title: "🎁 Tematiskie tetovējumi",
      description:
        "Katrs bērns saņem dinozauru tematikas pagaidu tetovējumu.",
     },
],
},
{
  id: 4,

  slug: "gabbys-dollhouse-ballite",

  title: "Gabby's Dollhouse ballīte",

  image: "/images/programs/gabby.jpg",
    folder: "gabby",


  shortDescription:
    "Ceļojums pa Gabijas māju ar spēlēm, radošām aktivitātēm un pārsteigumiem.",

  description:
    "Programma paredzēta bērniem, kuriem patīk Gabijas māja. Kopā ar Gabiju bērni dodas ceļojumā pa dažādām istabām, piedalās spēlēs, radošajās aktivitātēs un meklē paslēpušos kaķīšus.",

  age: "3+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Līdz 15 bērniem", price: 135 },
        { label: "Katrs nākamais bērns", price: 5 },
      ],
    },
  ],

  activities: [
    {
      title: "☕ Tikšanās ar Gabiju",
      description:
        "Iepazīšanās pie kakao un kopīgs ballītes sākums.",
    },
    {
      title: "🎁 Pārsteiguma kaste",
      description:
        "Noslēpumainas kastes atvēršana un pirmais uzdevums.",
    },
    {
      title: "🏠 Ceļojums pa Gabijas māju",
      description:
        "Katrā istabā bērnus sagaida jauna spēle vai aktivitāte.",
    },
    {
      title: "🎲 Gabijas bingo",
      description:
        "Tematiska bingo spēle visiem dalībniekiem.",
    },
    {
      title: "🎀 Draudzības rokassprādzes",
      description:
        "Radošā darbnīca, kur katrs izgatavo savu rokassprādzi.",
    },
    {
      title: "🐱 Kaķīšu meklēšana",
      description:
        "Tematiska meklēšanas spēle ar Gabijas draugiem.",
    },
    {
      title: "🎁 Dāvana jubilāram",
      description:
        "Ballītes noslēgumā jubilārs saņem mīkstu kaķīti.",
     },
],
},
{
  id: 5,

  slug: "spa-ballite",

  title: "SPA ballīte",

  image: "/images/programs/spa.jpg",
    folder: "spa",


  shortDescription:
    "SPA piedzīvojums ar sejas kopšanu, relaksāciju, kakao pauzi un radošo darbnīcu.",

  description:
    "SPA ballīte paredzēta bērniem no 6 gadu vecuma. Programmas laikā bērni iepazīst sejas un roku kopšanas rituālus, izbauda relaksācijas brīžus, piedalās radošajā darbnīcā un kopā pavada laiku mierpilnā gaisotnē.",

  age: "6+ gadi",

  duration: "2-3 stundas",

  pricing: [
    {
      title: "Ballīte SMAIDU DARBNĪCĀ",
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
    {
      title: "🫧 Sejas kopšana",
      description:
        "Sejas attīrīšana ar putiņām, sejas maska un aukstumbumbiņu brilles acīm.",
    },
    {
      title: "🌸 Relaksācija",
      description:
        "Mierīga mūzika, gurķu šķēlītes acīm un sejas atsvaidzināšana ar ziedūdeni.",
    },
    {
      title: "👐 Roku un pēdu kopšana",
      description:
        "Roku vanniņa ar ziediem, mitrinošs krēms un aromātiska pēdu vanniņa.",
    },
    {
      title: "☕ Kakao pauze",
      description:
        "Silts kakao ar zefīriem kopīgai atpūtai.",
    },
    {
      title: "🦶 Pēdu labsajūta",
      description:
        "Pēdu masāža ar akupunktūras bumbiņām un stāstījums par pēdu punktiem.",
    },
    {
      title: "💇 Bizes pīšana",
      description:
        "Lielformāta bizes pīšana un padomi matu kopšanai.",
    },
    {
      title: "🧴 Cukurskrubja darbnīca",
      description:
        "Katrs dalībnieks izgatavo savu cukurskrubi no dabīgām sastāvdaļām un paņem to līdzi.",
    },
],
},
{
  id: 6,

  slug: "make-up-ballite",

  title: "Make-up ballīte",

  image: "/images/programs/makeup.jpg",
  folder: "makeup",
  shortDescription:
    "Kosmētikas pamati, make-up nodarbība, praktiski padomi un kopā pavadīts laiks.",

  description:
    "Make-up ballīte paredzēta bērniem no 10 gadu vecuma. Programmas laikā dalībnieces iepazīst sejas kopšanas pamatus, kosmētikas piederumus un soli pa solim apgūst ikdienas make-up uzklāšanu.",

  age: "10+ gadi",

  duration: "2-3 stundas",

  pricing: [
    {
      title: "Ballīte SMAIDU DARBNĪCĀ",
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
    {
      title: "🧴 Sejas kopšana",
      description:
        "Saruna par ikdienas sejas kopšanu un veselīgas ādas pamatprincipiem.",
    },
    {
      title: "💄 Kosmētikas maciņš",
      description:
        "Iepazīšanās ar kosmētikas produktiem un to pielietojumu.",
    },
    {
      title: "🖌️ Otiņas",
      description:
        "Dažādu otiņu veidi un to pareiza lietošana.",
    },
    {
      title: "😊 Sejas formas",
      description:
        "Sejas formu iepazīšana un piemērotāko akcentu veidošana.",
    },
    {
      title: "🎨 Krāsu pasaule",
      description:
        "Krāsu izvēle un to saskaņošana ikdienas make-up.",
    },
    {
      title: "💋 Make-up meistarklase",
      description:
        "Praktiska ikdienas make-up uzklāšana soli pa solim.",
    },
    {
      title: "🥤 Pauze",
      description:
        "Dzēriens un veselīgi našķi kopīgai atpūtai.",
    },
],
},
{
  id: 7,

  slug: "wednesday-ballite",

  title: "Wednesday ballīte",

  image: "/images/programs/wednesday.jpg",
    folder: "wednesday",


  shortDescription:
    "Noslēpumaini uzdevumi, eksperimenti, drosmes pārbaudījumi un tematiskas spēles kopā ar Wednesday.",

  description:
    "Wednesday ballīte paredzēta bērniem no 4 līdz 7 gadu vecumam. Programmas laikā bērni piedalās drosmes pārbaudījumos, eksperimentos, kustību spēlēs un tematiskās aktivitātēs kopā ar Wednesday.",

  age: "4+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Līdz 15 bērniem", price: 135 },
        { label: "Katrs nākamais bērns", price: 5 },
      ],
    },
  ],

  activities: [
    {
      title: "🧪 Drosmes dzira",
      description:
        "Katrs dalībnieks saņem īpašu dziru, lai sagatavotos piedzīvojumiem kopā ar Wednesday.",
    },
    {
      title: "🕷️ Bailes un izaicinājumi",
      description:
        "Spēles un uzdevumi par drosmi un baiļu pārvarēšanu.",
    },
    {
      title: "📦 Baiļu kaste",
      description:
        "Taustes, smaržas un garšas eksperimenti ar pārsteigumiem.",
    },
    {
      title: "💀 Skeletu spēle",
      description:
        "Reakcijas spēle ar jautriem uzdevumiem.",
    },
    {
      title: "🔥 Degošā roka",
      description:
        "Tematisks eksperiments drosmes pārbaudīšanai.",
    },
    {
      title: "🌑 Kliedziens tumsā",
      description:
        "Uzdevums tumsā, kurā bērni pārbauda savu drosmi.",
    },
    {
      title: "🖐️ Nezināmās rokas",
      description:
        "Spēle, kurā dalībnieki var nopelnīt saldumu cimdiņu.",
    },
    {
      title: "🎁 Tematiskais tetovējums",
      description:
        "Katrs dalībnieks saņem Wednesday tematikas pagaidu tetovējumu.",
      },
],
},
{
  id: 8,

  slug: "frozen-ballite",

  title: "Frozen ballīte",

  image: "/images/programs/frozen.jpg",
    folder: "frozen",


  shortDescription:
    "Ledus spēles, radošās darbnīcas un tikšanās ar Elzu Arendellas noskaņās.",

  description:
    "Frozen ballīte paredzēta bērniem, kuriem patīk Elza, Anna un Arendellas pasaule. Programmas laikā bērni piedalās radošajās darbnīcās, tematiskās spēlēs un kopā ar Elzu dodas ziemas piedzīvojumā.",

  age: "3+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Līdz 15 bērniem", price: 165 },
        { label: "Katrs nākamais bērns", price: 5 },
      ],
    },
  ],

  activities: [
    {
      title: "👑 Karaļvalsts radošā darbnīca",
      description:
        "Kronīšu gatavošana vai sniegpārsliņu veidošana.",
    },
    {
      title: "❄️ Ledus rotaļas",
      description:
        "Tematiskas spēles un ziemas izaicinājumi.",
    },
    {
      title: "⛄ Sniegavīru stafetes",
      description:
        "Kustību spēles un komandu uzdevumi.",
    },
    {
      title: "💎 Ledus kristālu meklēšana",
      description:
        "Tematiska dārgumu meklēšanas spēle.",
    },
    {
      title: "✨ Elzas burvju mirklis",
      description:
        "Tikšanās ar Elzu, pārsteigumi un stāsts par draudzību un drosmi.",
    },
    {
      title: "🏰 Ceļojums uz Arendellu",
      description:
        "Noslēguma piedzīvojums Frozen pasaules noskaņās.",
    },
  ],
},
{
  id: 9,

  slug: "slaima-meistarklase",

  title: "Slaima meistarklase",

  image: "/images/programs/slaims.jpg",
  folder: "slaims",

  shortDescription:
    "Katrs dalībnieks izgatavo savu slaimu, izvēlas krāsas, spīdumus un dekorācijas.",

  description:
    "Slaima meistarklase paredzēta bērniem no 7 gadu vecuma. Programmas laikā bērni soli pa solim izgatavo savu slaimu, izvēlas tā krāsu un dekorācijas, piedalās spēlēs un gatavo slaimu, ko pēc tam paņem līdzi uz mājām.",

  age: "7+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Meistarklase",
      options: [
        { label: "Mazā grupa (1–9 bērni)", price: 190 },
        { label: "Lielā grupa (10–15 bērni)", price: 285 },
      ],
    },
  ],

  activities: [
    {
      title: "🎨 Slaima gatavošana",
      description:
        "Katrs dalībnieks soli pa solim izgatavo savu slaimu.",
    },
    {
      title: "🌈 Krāsu izvēle",
      description:
        "Katrs izvēlas sava slaima krāsu.",
    },
    {
      title: "✨ Dekorēšana",
      description:
        "Slaims tiek papildināts ar spīdumiem un dažādām dekorācijām.",
    },
    {
      title: "🎲 Spēles",
      description:
        "Jautras aktivitātes un kopīgas spēles meistarklases laikā.",
    },
    {
      title: "🎁 Slaims līdzi mājās",
      description:
        "Katrs dalībnieks iepako savu slaimu un paņem to līdzi.",
    },
],
},
 {
  id: 10,

  slug: "eksperimentu-ballite",

  title: "Eksperimentu ballīte",

image: "/images/programs/eksperimentu.jpg",
  folder: "eksperimentu",
  shortDescription:
    "Aizraujoši eksperimenti, pārsteidzošas reakcijas un bērnu līdzdalība katrā uzdevumā.",

  description:
    "Vai zinātne var būt aizraujoša? Mūsu eksperimentus bērni ne tikai vēro, bet arī paši piedalās dažādos eksperimentos. Kopā atklāsim interesantas reakcijas, pārbaudīsim dabas likumus un uzzināsim, cik pārsteidzoša var būt zinātne.",

  age: "5+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        {
          label: "Līdz 15 bērniem",
          price: 135,
        },
        {
          label: "Katrs nākamais bērns",
          price: +5,
        },
      ],
    },
  ],

  activities: [
    {
      title: "🧪 Iepazīšanās ar zinātnes pasauli",
      description:
        "Iepazīsim eksperimentu pasauli un sagatavosimies zinātniskiem pārsteigumiem.",
    },
    {
      title: "🌈 Krāsainie eksperimenti",
      description:
        "Dažādi eksperimenti ar krāsām un interesantām reakcijām.",
    },
    {
      title: "💨 Pārsteidzošas reakcijas",
      description:
        "Novērosim aizraujošus eksperimentus un atklāsim, kā darbojas zinātne.",
    },
    {
      title: "🙋 Bērnu līdzdalība",
      description:
        "Katram būs iespēja iesaistīties un kļūt par mazo zinātnieku.",
    },
    {
      title: "🎉 Lielais noslēguma eksperiments",
      description:
        "Programmas noslēgumā kopīgi veiksim iespaidīgu eksperimentu.",
    },
  ],
},
{
  id: 11,

  slug: "putu-ballite",

  title: "Putu ballīte",

  image: "/images/programs/putu-ballite.jpg",
    folder: "putu-ballite",


  shortDescription:
    "Putu ballīte ģimenes, uzņēmumu un publiskajiem pasākumiem.",

  description:
    "Putu ballīte ir piemērota dzimšanas dienām, ģimenes svētkiem, uzņēmumu pasākumiem, pilsētu svētkiem un citiem pasākumiem. Nodrošinām putu lielgabalu, putas un neaizmirstamu izklaidi dažāda lieluma pasākumiem.",

  age: "Visiem vecumiem",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ģimenes pasākumi",
      options: [
        {
          label: "30 minūšu putu ballīte",
          price: 180,
        },
        {
          label: "Ceļa izdevumi (€/km)",
          price: 0.30,
        },
      ],
    },
    {
      title: "Sabiedriskie un korporatīvie pasākumi",
      options: [
        {
          label: "60 minūšu putu ballīte (no)",
          price: 400,
        },
        {
          label: "Ceļa izdevumi (€/km)",
          price: 0.30,
        },
      ],
    },
  ],

  activities: [
    {
      title: "🫧 Putu ballīte",
      description:
        "30 vai 60 minūšu aktīva putu ballīte ar putu lielgabalu.",
    },
    {
      title: "🎉 Izklaide putās",
      description:
        "Pēc putu ražošanas beigām bērni var turpināt rotaļāties putās.",
    },
    {
      title: "🚗 Izbraukuma pakalpojums",
      description:
        "Pakalpojums pieejams visā Latvijā. Ceļa izdevumi tiek aprēķināti 0,30 €/km.",
     },
],
},
{
  id: 12,

  slug: "nerf-ballite",

  title: "Nerf ballīte",

  image: "/images/programs/nerf.jpg",
  folder: "nerf",
  shortDescription:
    "Nerf komandu spēles, izaicinājumi un kustību aktivitātes bērniem no 7 gadu vecuma.",

  description:
    "Nerf ballīte paredzēta bērniem no 7 līdz 12 gadu vecumam. Pirms spēles dalībnieki iziet sagatavošanos, meklē aprīkojumu un pēc tam piedalās dažādos komandu uzdevumos un Nerf izaicinājumos.",

  age: "7+ gadi",

  duration: "60 minūtes",

  pricing: [
    {
      title: "Ballīte",
      options: [
        { label: "Līdz 9 bērniem", price: 175 },
        { label: "No 10 līdz 15 bērniem", price: 225 },
        { label: "Katrs nākamais bērns", price: 5 },
      ],
    },
  ],

  activities: [
    {
      title: "🏃 Iesildīšanās",
      description:
        "Komandu iesildīšanās un gatavošanās spēlei.",
    },
    {
      title: "🤝 Komandas zvērests",
      description:
        "Dalībnieki dod komandas zvērestu un sagatavojas misijai.",
    },
    {
      title: "🪖 Kamuflāža",
      description:
        "Dalībnieki iegūst savu kaujas izskatu.",
    },
    {
      title: "🔫 Aprīkojuma meklēšana",
      description:
        "Spēles sākumā bērni meklē savu Nerf aprīkojumu.",
    },
    {
      title: "🎯 Nerf izaicinājumi",
      description:
        "Dažādas komandu spēles, uzdevumi un precizitātes pārbaudījumi.",
    },
    {
      title: "🏆 Fināla misija",
      description:
        "Noslēguma komandu izaicinājums visiem dalībniekiem.",
  },
],
},
{
  id: 13,

  slug: "parsteiguma-tels",

  title: "Pārsteiguma tēls",

  image: "/images/programs/parsteiguma-tels.jpg",
  folder: "parsteiguma-tels",

  shortDescription:
    "Pārsteiguma tēls ierodas svinībās, izdancina gaviļnieku un fotografējas ar viesiem.",

  description:
    "Pārsteiguma tēls negaidīti ierodas Jūsu svinībās, lai iepriecinātu gaviļnieku un viesus. Vizītes laikā tēls kopā ar bērniem dejo, fotografējas un rada svētku noskaņu.",

  age: "Visiem vecumiem",

  duration: "15 minūtes",

  pricing: [
    {
      title: "Pārsteiguma tēls",
      options: [
        { label: "Vizīte līdz 15 minūtēm", price: 45 },
      ],
    },
  ],

  activities: [
    {
      title: "🎉 Pārsteiguma ierašanās",
      description:
        "Tēls negaidīti ierodas svinību laikā.",
    },
    {
      title: "💃 Kopīga dejošana",
      description:
        "Jautra deja kopā ar gaviļnieku un viesiem.",
    },
    {
      title: "📸 Fotografēšanās",
      description:
        "Kopīgas fotogrāfijas ar gaviļnieku un viesiem.",
    },
  ],

  note:
    "Svarīgi! Lielformāta animatori nevada spēles, konkursus vai citas aktivitātes. Pakalpojums paredzēts īsai pārsteiguma vizītei, kopīgai dejošanai un fotografēšanai.",
     },
     {
  id: 14,

  slug: "sejas-apgleznosana",

  title: "Sejas apgleznošana",

  image: "/images/programs/sejas-apgleznosana.jpg",
  folder: "sejas-apgleznosana",

  shortDescription:
    "Sejas apgleznošana bērniem un pieaugušajiem privātos, korporatīvos un publiskos pasākumos.",

  description:
    "Sejas apgleznošana ir iecienīta aktivitāte gan bērniem, gan pieaugušajiem. Piedāvājam krāsainus dizainus, pasaku tēlus, dzīvniekus un festivālu grimu dažādiem pasākumiem visā Latvijā. Papildus iespējams izvēlēties arī glittera tetovējumus, lai svētki kļūtu vēl košāki.",

  age: "Visiem vecumiem",

  duration: "Pēc pasākuma apjoma",

  pricing: [
    {
      title: "Sejas apgleznošana",
      options: [
        {
          label: "Līdz 10 bērniem",
          price: 50,
        },
        {
          label: "Katrs nākamais bērns",
          price: +3.50,
        },
      ],
    },
    {
      title: "Sejas apgleznošana + glittera tetovējumi",
      options: [
        {
          label: "Līdz 10 bērniem",
          price: 65,
        },
        {
          label: "Katrs nākamais bērns",
          price: +4.50,
        },
      ],
    },
  ],

  activities: [
    {
      title: "🎨 Sejas apgleznošana",
      description:
        "Plaša dizainu izvēle bērniem un pieaugušajiem.",
    },
    {
      title: "🦁 Dzīvnieki un pasaku tēli",
      description:
        "Lauviņas, tīģeri, taureņi, princeses, supervaroņi un citi iecienīti tēli.",
    },
    {
      title: "✨ Glittera tetovējumi",
      description:
        "Noturīgi un krāsaini glittera tetovējumi dažādos dizainos.",
    },
  ],
},
{
  id: 15,

  slug: "piratu-ballite",

  title: "Pirātu ballīte",

  image: "/images/programs/pirates.jpg",
  folder: "pirates",

  shortDescription:
    "Dārgumu meklēšana, pirātu pārbaudījumi un komandu piedzīvojumi drosmīgākajiem jūrasbraucējiem.",

  description:
    "Ielec pirātu piedzīvojumā, kur ikviens dalībnieks kļūst par drosmīgas pirātu komandas daļu! Kopā pārbaudīsim veiklību, attapību un komandas garu, lasīsim dārgumu karti un noskaidrosim, vai jaunie pirāti ir gatavi iekarot jūras.",

  age: "4+ gadi",

  duration:  "60 minūtes" ,

  pricing: [
    {
      title: "Ballīte",
      options: [
        {
          label: "Līdz 15 bērniem",
          price: 135,
        },
        {
          label: "Katrs nākamais bērns",
          price: +5,
        },
      ],
    },
  ],

  activities: [
    {
      title: "🏴‍☠️ Kapteiņa ievēlēšana",
      description:
        "Izvēlēsimies kuģa kapteini un piešķirsim viņam īstu pirāta vārdu.",
    },
    {
      title: "⚓ Pirātu pārbaudījumi",
      description:
        "Veiklības, attapības un komandas uzdevumi topošajiem pirātiem.",
    },
    {
      title: "🗺️ Dārgumu kartes izpēte",
      description:
        "Sekosim norādēm un meklēsim apslēpto dārgumu.",
    },
    {
      title: "⚔️ Pirātu zobenu darbnīca",
      description:
        "Katrs izgatavos savu pirāta zobenu, ko ņemt līdzi turpmākajos piedzīvojumos.",
    },
    {
      title: "🏝️ Lielais pirātu izaicinājums",
      description:
        "Noslēguma pārbaudījums, kurā noskaidrosim, vai komanda ir gatava kļūt par īstiem pirātiem.",
    },
  ],
},
];