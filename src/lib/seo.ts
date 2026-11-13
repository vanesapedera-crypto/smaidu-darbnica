import type { Metadata } from "next";
import { getPageSeo, getSettings } from "@/lib/content/queries";
import { getLocale } from "@/lib/i18n/server";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/lib/i18n/config";

/**
 * Kamēr EN/RU lapu saturs vēl nav iztulkots, tās netiek rādītas Google (noindex).
 * Kad tulkojumi gatavi — nomainīt uz true (tad pievienojas arī hreflang saites).
 */
export const INDEX_TRANSLATIONS = false;

/** Publiskā adrese (bez slīpsvītras beigās). Iestatiet NEXT_PUBLIC_SITE_URL produkcijā. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.smaidudarbnica.lv").replace(/\/$/, "");

export const absoluteUrl = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

/** Saīsina tekstu līdz ~155 rakstzīmēm meta description vajadzībām (pa vārdiem). */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[,.;:–-]$/, "") + "…";
}

type PageMetaInput = {
  path: string;
  /** Lapas nosaukums bez zīmola — zīmolu pievieno title.template */
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
};

/**
 * Automātiski ģenerē metadatus lapai.
 * Prioritāte: page_seo ieraksts administrēšanas panelī → lapas dati → noklusējums.
 */
export async function pageMetadata(input: PageMetaInput): Promise<Metadata> {
  const [settings, override] = await Promise.all([getSettings(), getPageSeo(input.path)]);
  const seo = settings.seo;

  const title = override?.title || input.title;
  const description = truncate(override?.description || input.description || seo.defaultDescription);
  const image = override?.ogImage || input.image || seo.ogImage;
  const locale = getLocale();
  const url = absoluteUrl(localePath(locale, input.path));
  const noindex = override?.noindex || input.noindex || (locale !== DEFAULT_LOCALE && !INDEX_TRANSLATIONS);
  const languages = INDEX_TRANSLATIONS
    ? Object.fromEntries([...LOCALES.map((l) => [l, absoluteUrl(localePath(l, input.path))]), ["x-default", absoluteUrl(input.path)]])
    : undefined;

  return {
    // Sākumlapai (bez title) tiek izmantots pilnais noklusējuma virsraksts
    title: title ? title : { absolute: seo.defaultTitle },
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      locale: { lv: "lv_LV", en: "en_GB", ru: "ru_RU" }[locale],
      siteName: seo.siteName,
      url,
      title: title ? `${title} | ${seo.siteName}` : seo.defaultTitle,
      description,
      images: image ? [{ url: absoluteUrl(image) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${seo.siteName}` : seo.defaultTitle,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
