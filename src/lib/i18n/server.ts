import "server-only";
import { cache } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";

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
