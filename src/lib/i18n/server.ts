import "server-only";
import { cache } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { makeT, translateDeep, type Messages, type TFn } from "./translate";
import uiEn from "./messages/en.json";
import uiRu from "./messages/ru.json";
import contentEn from "./content/en.json";
import contentRu from "./content/ru.json";

/**
 * Pašreizējā valoda servera komponentēm (viena pieprasījuma ietvaros).
 * Katra lapa un izkārtojums sākumā izsauc setLocale(lang) — tad dziļāk esošās komponentes var izsaukt getLocale().
 */
const store = cache(() => ({ locale: DEFAULT_LOCALE as Locale }));

export function setLocale(locale: Locale) {
  store().locale = locale;
}

export function getLocale(): Locale {
  return store().locale;
}

/** Lapas tekstu vārdnīca (tiek nodota arī klienta komponentēm) */
export const UI_MESSAGES: Record<Locale, Messages | null> = { lv: null, en: uiEn, ru: uiRu };
/** Serverī — lapas teksti + datubāzes satura tulkojumi */
const ALL: Record<Locale, Messages | null> = {
  lv: null,
  en: { ...(contentEn as Messages), ...(uiEn as Messages) },
  ru: { ...(contentRu as Messages), ...(uiRu as Messages) },
};

/** Tulkošanas funkcija pašreizējā valodā: const t = getT(); t("Kontakti") */
export function getT(): TFn {
  // Valodu nolasa katrā izsaukumā (t var izveidot pirms setLocale)
  return (text, vars) => makeT(ALL[getLocale()])(text, vars);
}

/** Iztulko datubāzes satura objektu pašreizējā valodā (latviski — bez izmaiņām) */
export function localize<T>(value: T): T {
  const locale = getLocale();
  return locale === DEFAULT_LOCALE ? value : translateDeep(value, makeT(ALL[locale]));
}

/**
 * Lapas tekstu vārdnīca + tulkojumi dotajām datubāzes vērtībām — formām, kurām dati jāsaņem latviski
 * (pieteikums panelī nonāk latviski), bet lapā tie jārāda klienta valodā (t(p.title) formā).
 */
export function messagesWith(...values: unknown[]): Messages | null {
  const locale = getLocale();
  const all = ALL[locale];
  if (!all) return null;
  const out: Messages = { ...(UI_MESSAGES[locale] ?? {}) };
  const add = (s: string) => {
    if (all[s] !== undefined) out[s] = all[s];
    for (const line of s.split("\n")) {
      const m = line.trim().replace(/^(#{1,6}\s+|[-*•]\s+|\d+[.)]\s+|>\s*)/, "");
      if (m && all[m] !== undefined) out[m] = all[m];
    }
  };
  const walk = (v: unknown) => {
    if (typeof v === "string") add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  values.forEach(walk);
  return out;
}
