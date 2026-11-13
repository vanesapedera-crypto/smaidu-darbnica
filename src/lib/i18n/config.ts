/**
 * Mājaslapas valodas. Latviešu — bez prefiksa (smaidudarbnica.lv/uznemumiem),
 * angļu un krievu — ar prefiksu (/en/uznemumiem, /ru/uznemumiem). Sk. src/proxy.ts.
 */
export const LOCALES = ["lv", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "lv";

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

export const LOCALE_LABEL: Record<Locale, string> = { lv: "LV", en: "EN", ru: "RU" };
/** Valodas kods HTML un Open Graph */
export const LOCALE_TAG: Record<Locale, string> = { lv: "lv-LV", en: "en-GB", ru: "ru-RU" };

/** Adreses, kurām valodas prefiksu nepievieno (panelis, API, faili u. c.) */
const UNPREFIXED = /^\/(admin|api|_next|r\/|piedavajums|media|brand|images|admin-app)(\/|$)|\.[a-z0-9]+$/i;

/** Iekšējā saite valodā: localePath("en", "/uznemumiem") → "/en/uznemumiem"; latviski — bez izmaiņām */
export function localePath(locale: Locale, href: string): string {
  if (locale === DEFAULT_LOCALE || !href.startsWith("/") || href.startsWith("//") || UNPREFIXED.test(href)) return href;
  if (LOCALES.some((l) => href === `/${l}` || href.startsWith(`/${l}/`) || href.startsWith(`/${l}?`) || href.startsWith(`/${l}#`))) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/** Adrese bez valodas prefiksa: "/en/uznemumiem" → "/uznemumiem" */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(en|ru|lv)(?=\/|$)/);
  return m ? pathname.slice(m[0].length) || "/" : pathname;
}

/** Adreses parametrs → valoda (nezināma — latviešu) */
export const asLocale = (v: string | undefined): Locale => (isLocale(v) ? v : DEFAULT_LOCALE);
