import type { Locale } from "./config";

/** Mājaslapas kopējie teksti (izvēlne, kājene, pogas) trīs valodās. */
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

const ru: Dict = {
  nav: {
    "/": "Главная",
    "/par-mums": "О нас",
    "/uznemumiem": "Для компаний",
    "/izrades": "Спектакли",
    "/izklaides-programmas": "Детские праздники",
    "/telpu-noma": "Аренда помещения",
    "/kontakti": "Контакты",
  },
  skipToContent: "Перейти к содержанию",
  mainNav: "Основная навигация",
  homeAria: "Smaidu Darbnīca — главная",
  requestOffer: "Запросить предложение",
  openMenu: "Открыть меню",
  closeMenu: "Закрыть меню",
  businessServices: "Услуги для компаний",
  xmasForBusiness: "Рождество для компаний",
  language: "Язык",
  footer: {
    business: "Для компаний",
    sections: "Разделы",
    contacts: "Контакты",
    forBusiness: "Для компаний",
    forPrivate: "Частным лицам",
    venueHire: "Аренда помещения",
    madeBy: "Сайт разработала",
    reviews: "Отзывы",
    privacy: "Политика конфиденциальности",
  },
};

const DICTS: Record<Locale, Dict> = { lv, en, ru };

/** Teksti izvēlētajā valodā */
export const dict = (locale: Locale): Dict => DICTS[locale] ?? lv;
