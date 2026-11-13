"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/config";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Valoda klienta komponentēm (Navbar, formas u. c.) */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
/** Iekšējā saite pašreizējā valodā */
export const useLocalePath = () => {
  const locale = useLocale();
  return (href: string) => localePath(locale, href);
};
