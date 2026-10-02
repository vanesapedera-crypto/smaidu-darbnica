import type { Metadata } from "next";
import { getPageSeo, getSettings } from "@/lib/content/queries";

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
  const noindex = override?.noindex || input.noindex;

  return {
    // Sākumlapai (bez title) tiek izmantots pilnais noklusējuma virsraksts
    title: title ? title : { absolute: seo.defaultTitle },
    description,
    alternates: { canonical: absoluteUrl(input.path) },
    openGraph: {
      type: "website",
      locale: "lv_LV",
      siteName: seo.siteName,
      url: absoluteUrl(input.path),
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
