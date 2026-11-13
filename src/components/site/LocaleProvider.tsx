"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, localePath, LOCALE_TAG, type Locale } from "@/lib/i18n/config";
import { makeT, type Messages } from "@/lib/i18n/translate";

const LocaleContext = createContext<{ locale: Locale; messages: Messages | null }>({ locale: DEFAULT_LOCALE, messages: null });

/** Valoda un tulkojumi klienta komponentēm (Navbar, formas u. c.) */
export function LocaleProvider({ locale, messages = null, children }: { locale: Locale; messages?: Messages | null; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext).locale;
/** Datumu/skaitļu formāts pašreizējā valodā (lv-LV, en-GB, ru-RU) */
export const useLocaleTag = () => LOCALE_TAG[useLocale()];
/** Tulkošanas funkcija: const t = useT(); t("Nosūtīt") */
export function useT() {
  const { messages } = useContext(LocaleContext);
  return useMemo(() => makeT(messages), [messages]);
}
/** Iekšējā saite pašreizējā valodā */
export const useLocalePath = () => {
  const locale = useLocale();
  return (href: string) => localePath(locale, href);
};
