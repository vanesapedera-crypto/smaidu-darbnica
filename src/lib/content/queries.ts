import "server-only";
import { cache } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { defaultSettings } from "./defaults/settings";
import { businessServices } from "./defaults/business-services";
import { privateServices } from "./defaults/private-services";
import { defaultClients, defaultTeam, defaultTestimonials } from "./defaults/people";
import { emptyClient, emptyGalleryImage, emptyPageSeo, emptyService, emptyTeamMember, emptyTestimonial } from "./empty";
import { fromRow } from "./mappers";
import { manifestGallery } from "./media";
import type {
  Audience,
  Client,
  GalleryImage,
  PageSeo,
  Service,
  SiteSettings,
  TeamMember,
  Testimonial,
} from "./types";

/**
 * Publiskā satura nolasīšana no Supabase.
 *
 * Ja tabula vēl nav izveidota (migrācija nav palaista) vai datubāze nav sasniedzama,
 * tiek atgriezts noklusējuma saturs no lib/content/defaults — mājaslapa vienmēr strādā.
 * Tukša tabula NETIEK aizstāta ar noklusējumu: ja administrators visu izdzēsa, tā arī paliek.
 */
async function select<T extends object>(
  table: string,
  empty: T,
  fallback: T[],
  build: (q: ReturnType<typeof supabase.from>) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  // Bez datubāzes savienojuma (nav vides mainīgo) — uzreiz noklusējuma saturs, bez kļūdām būves laikā
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await build(supabase.from(table));
    if (error) throw error;
    return (data as Record<string, unknown>[]).map((row) => fromRow(row, empty));
  } catch (err) {
    console.warn(`[content] "${table}" nav pieejama, izmantoju noklusējuma saturu.`, (err as Error)?.message ?? err);
    return fallback;
  }
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await select<{ key: string; value: object }>(
    "site_settings",
    { key: "", value: {} },
    [],
    (q) => q.select("key, value"),
  );
  const settings = structuredClone(defaultSettings);
  for (const { key, value } of rows) {
    if (key in settings) {
      const k = key as keyof SiteSettings;
      // Datubāzes vērtības pārraksta noklusējumu; jauni lauki paliek no noklusējuma
      Object.assign(settings[k], value);
    }
  }
  return settings;
});

const defaultServices = [...businessServices, ...privateServices];

export const getServices = cache(async (audience: Audience): Promise<Service[]> =>
  select("services", emptyService, defaultServices.filter((s) => s.audience === audience), (q) =>
    q.select("*").eq("audience", audience).eq("published", true).order("sort"),
  ),
);

export const getService = cache(async (audience: Audience, slug: string): Promise<Service | undefined> => {
  const services = await getServices(audience);
  return services.find((s) => s.slug === slug);
});

export const getGallery = cache(async (): Promise<GalleryImage[]> =>
  select("gallery_images", emptyGalleryImage, manifestGallery(), (q) =>
    q.select("*").eq("published", true).order("sort").order("created_at"),
  ),
);

/** Attēli konkrētiem albumiem (piem. pakalpojuma lapas galerijai). */
export async function getAlbumImages(albums: string[], limit = 12): Promise<GalleryImage[]> {
  if (albums.length === 0) return [];
  const gallery = await getGallery();
  // Ņem pa kārtai no katra albuma, lai galerijā būtu dažādība
  const lists = albums.map((a) => gallery.filter((img) => img.album === a));
  const result: GalleryImage[] = [];
  for (let i = 0; result.length < limit && lists.some((l) => l[i]); i++) {
    for (const list of lists) if (list[i] && result.length < limit) result.push(list[i]);
  }
  return result;
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  select("testimonials", emptyTestimonial, defaultTestimonials, (q) =>
    q.select("*").eq("published", true).order("sort"),
  ),
);

export const getClients = cache(async (): Promise<Client[]> =>
  select("clients", emptyClient, defaultClients, (q) => q.select("*").eq("published", true).order("sort")),
);

export const getTeam = cache(async (): Promise<TeamMember[]> =>
  select("team_members", emptyTeamMember, defaultTeam, (q) =>
    q.select("*").eq("published", true).order("sort"),
  ),
);

export const getPageSeo = cache(async (path: string): Promise<PageSeo | undefined> => {
  const rows = await select("page_seo", emptyPageSeo, [], (q) => q.select("*").eq("path", path).limit(1));
  return rows[0];
});

/** Attēli sadaļas fotolentei pēc kategorijām — pa kārtai no katra albuma, lai lente būtu daudzveidīga. */
export async function getCategoryImages(categories: string[], limit = 16): Promise<GalleryImage[]> {
  const gallery = await getGallery();
  const albums = [...new Set(gallery.filter((g) => categories.includes(g.category)).map((g) => g.album))];
  return getAlbumImages(albums, limit);
}
