/**
 * Satura tipi. Tie atbilst Supabase tabulām (sk. supabase/migrations),
 * bet lauku nosaukumi ir camelCase — pārveidošana notiek lib/content/mappers.ts.
 */

export type Audience = "business" | "private";

export type TitledText = { title: string; description: string };

export type PriceGroup = {
  title: string;
  options: { label: string; price: number | null }[];
};

export type Faq = { question: string; answer: string };

export type Service = {
  id?: string;
  slug: string;
  audience: Audience;
  title: string;
  /** Īss apraksts kartītēm un meta description */
  excerpt: string;
  /** Ievada rindkopa lapas augšā */
  intro: string;
  /** Garāks apraksts. Atbalsta rindkopas, "## virsrakstus" un "- sarakstus". */
  body: string;
  /** Galvenās priekšrocības / kas iekļauts */
  highlights: string[];
  /** Kam piemērots (uzņēmumi, skolas, pašvaldības…) */
  suitableFor: string[];
  /** Programmas gaita vai aktivitātes */
  activities: TitledText[];
  pricing: PriceGroup[];
  pricingNote: string;
  faq: Faq[];
  age: string;
  duration: string;
  participants: string;
  /** lucide ikonas nosaukums (sk. components/site/Icon.tsx) */
  icon: string;
  heroImage: string;
  /** Galerijas albumi (media.json vai gallery_images.album), no kuriem rādīt bildes */
  albums: string[];
  /** Sezonas lapā "Uzņēmumiem": ziema, vasara, visu-gadu */
  seasons: string[];
  sort: number;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

export type GalleryImage = {
  id?: string;
  src: string;
  alt: string;
  album: string;
  category: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  sort: number;
  published: boolean;
};

export type Testimonial = {
  id?: string;
  author: string;
  role: string;
  company: string;
  text: string;
  logo: string;
  sort: number;
  published: boolean;
};

export type Client = {
  id?: string;
  name: string;
  logo: string;
  url: string;
  sort: number;
  published: boolean;
};

export type TeamMember = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  sort: number;
  published: boolean;
};

export type PageSeo = {
  id?: string;
  path: string;
  title: string;
  description: string;
  ogImage: string;
  noindex: boolean;
};

/* ---------- Vietnes iestatījumi (site_settings tabula, key → value) ---------- */

export type ContactSettings = {
  company: string;
  address: string;
  city: string;
  postalCode: string;
  /** Uzņēmumu kontaktpersonas (Kristīnes) e-pasts — arī galvenais uzņēmuma e-pasts */
  email: string;
  /** Privātpersonu kontaktpersonas (Vanesas) e-pasts */
  emailPrivate: string;
  phoneBusiness: string;
  phoneBusinessPerson: string;
  phonePrivate: string;
  phonePrivatePerson: string;
  hours: string;
  mapQuery: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  /** Rekvizīti (rāda kontaktu lapā, ja aizpildīti) */
  legalName: string;
  legalAddress: string;
  regNr: string;
  vatNr: string;
  bank: string;
  iban: string;
};

export type HomeSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroAfter: string;
  heroText: string;
  /** Īsāka teksta versija telefonam (ja tukšs — telefonā rāda pilno tekstu) */
  heroTextMobile?: string;
  /** Galvenes fotokartītes (līdz 3) */
  heroPhotos: { src: string; caption: string }[];
  /** Sākumlapas fona video: YouTube saite vai .mp4 fails (bez skaņas, atkārtojas) */
  heroVideo: string;
  /** Attēls, ko rāda, kamēr video ielādējas (un ja video nav) */
  heroPoster: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  stats: { value: string; label: string }[];
  servicesTitle: string;
  servicesText: string;
  whyTitle: string;
  whyText: string;
  why: TitledText[];
  processTitle: string;
  process: TitledText[];
  galleryTitle: string;
  galleryText: string;
  /** Sākumlapas fotolentes attēli */
  galleryImages: string[];
  ctaTitle: string;
  ctaText: string;
  /** Sezonas bloks "Ziemassvētki" sākumlapā */
  xmasEnabled: boolean;
  xmasEyebrow: string;
  xmasTitle: string;
  xmasHighlight: string;
  xmasText: string;
  /** Īsais teksts sākumlapas reklāmai */
  xmasShort: string;
  xmasPoints: string[];
  xmasPhotos: { src: string; caption: string }[];
};

export type AboutSettings = {
  title: string;
  intro: string;
  image: string;
  story: string;
  values: TitledText[];
  teamTitle: string;
  teamText: string;
};

export type Video = {
  title: string;
  /** YouTube/Vimeo saite vai lokāls fails, piem. /media/video/izrade.mp4 */
  src: string;
  /** Vāciņa attēls (nav obligāts YouTube video) */
  poster: string;
  /** Izrādēm: ilgums, piem. "45 min" */
  duration?: string;
  /** Izrādēm: kam paredzēta, piem. "Visai ģimenei" */
  audience?: string;
  /** Izrādēm: īss apraksts (rāda blakus video) */
  description?: string;
};

/** Sadaļas "Uzņēmumiem" lapas teksti un video */
export type BusinessSettings = {
  heroTitle: string;
  heroHighlight: string;
  heroText: string;
  winterText: string;
  summerText: string;
  allYearText: string;
  showsTitle: string;
  showsText: string;
  photosTitle: string;
};

/** Sadaļa "Izrādes" */
export type ShowsSettings = {
  heroTitle: string;
  heroHighlight: string;
  heroText: string;
  videosTitle: string;
  videos: Video[];
  aboutTitle: string;
  body: string;
  highlights: string[];
  suitableFor: string[];
};

/** Sadaļa "Telpu noma" */
export type VenueSettings = {
  heroTitle: string;
  heroHighlight: string;
  heroAfter: string;
  heroText: string;
  aboutTitle: string;
  about: string;
  features: TitledText[];
  /** Kas iekļauts nomas cenā (katrs punkts atsevišķi) */
  included: string[];
  /** Telpu lietošanas noteikumi (atbalsta "## virsrakstus" un "- sarakstus") */
  rules: string;
};

/** Sadaļas "Izklaides programmas" lapas teksti */
export type ProgramsSettings = {
  heroTitle: string;
  heroHighlight: string;
  heroText: string;
  photosTitle: string;
};

export type SeoSettings = {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  ogImage: string;
};

export type SiteSettings = {
  contact: ContactSettings;
  home: HomeSettings;
  about: AboutSettings;
  business: BusinessSettings;
  shows: ShowsSettings;
  venue: VenueSettings;
  programs: ProgramsSettings;
  seo: SeoSettings;
};
