import type { MetadataRoute } from "next";
import { getServices } from "@/lib/content/queries";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** Automātiski ģenerēta vietnes karte — iekļauj visas publicētās pakalpojumu un programmu lapas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [business, privateServices] = await Promise.all([getServices("business"), getServices("private")]);
  const now = new Date();

  const pages: [string, number][] = [
    ["/", 1],
    ["/uznemumiem", 0.9],
    ["/kontakti", 0.8],
    ["/par-mums", 0.7],
    ["/izklaides-programmas", 0.7],
    ["/izrades", 0.7],
    ["/telpu-noma", 0.6],
    ["/izklaides-programmas/pieteikt", 0.4],
    ["/privatuma-politika", 0.2],
  ];

  return [
    ...pages.map(([path, priority]) => ({ url: absoluteUrl(path), lastModified: now, priority })),
    ...business.filter((s) => s.slug !== "izrades").map((s) => ({ url: absoluteUrl(`/uznemumiem/${s.slug}`), lastModified: now, priority: 0.8 })),
    ...privateServices.map((s) => ({ url: absoluteUrl(`/izklaides-programmas/${s.slug}`), lastModified: now, priority: 0.5 })),
  ];
}
