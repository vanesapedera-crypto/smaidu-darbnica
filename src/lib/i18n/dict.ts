import type { Locale } from "./config";

/** Mājaslapas kopējie teksti (izvēlne, kājene, pogas) divās valodās. */
const lv = {
  nav: {
    "/": "Sākums",
    "/par-mums": "Par mums",
    "/uznemumiem": "Uzņēmumiem",
    "/izrades": "Izrādes",
    "/izklaides-programmas": "Izklaides programmas",
    "/telpu-noma": "Telpu noma",
    "/kontakti": "Kontakti",
  } as Record<string, string>,
  skipToContent: "Pāriet uz saturu",
  mainNav: "Galvenā navigācija",
  homeAria: "Smaidu Darbnīca — sākumlapa",
  requestOffer: "Pieprasīt piedāvājumu",
  openMenu: "Atvērt izvēlni",
  closeMenu: "Aizvērt izvēlni",
  businessServices: "Pakalpojumi uzņēmumiem",
  xmasForBusiness: "Ziemassvētki uzņēmumiem",
  language: "Valoda",
  footer: {
    business: "Uzņēmumiem",
    sections: "Sadaļas",
    contacts: "Kontakti",
    forBusiness: "Uzņēmumiem",
    forPrivate: "Privātpersonām",
    venueHire: "Telpu noma",
    madeBy: "Mājaslapu izstrādāja",
    reviews: "Atsauksmes",
    privacy: "Privātuma politika",
  },
};

export type Dict = typeof lv;

const en: Dict = {
  nav: {
    "/": "Home",
    "/par-mums": "About us",
    "/uznemumiem": "For businesses",
    "/izrades": "Shows",
    "/izklaides-programmas": "Kids' parties",
    "/telpu-noma": "Venue hire",
    "/kontakti": "Contact",
  },
  skipToContent: "Skip to content",
  mainNav: "Main navigation",
  homeAria: "Smaidu Darbnīca — home",
  requestOffer: "Request an offer",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  businessServices: "Services for businesses",
  xmasForBusiness: "Christmas for businesses",
  language: "Language",
  footer: {
    business: "For businesses",
    sections: "Sections",
    contacts: "Contact",
    forBusiness: "Businesses",
    forPrivate: "Private clients",
    venueHire: "Venue hire",
    madeBy: "Website by",
    reviews: "Reviews",
    privacy: "Privacy policy",
  },
};

const DICTS: Record<Locale, Dict> = { lv, en };

/** Teksti izvēlētajā valodā */
export const dict = (locale: Locale): Dict => DICTS[locale] ?? lv;
