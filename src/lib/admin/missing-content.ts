import "server-only";
import type { AdminContext } from "@/lib/auth";
import { businessServices } from "@/lib/content/defaults/business-services";
import { privateServices } from "@/lib/content/defaults/private-services";
import { defaultClients, defaultTeam, defaultTestimonials } from "@/lib/content/defaults/people";
import { toRow } from "@/lib/content/mappers";
import { albumTitle, manifestGallery } from "@/lib/content/media";

type Row = Record<string, unknown>;

/**
 * Saturs, kas ir projektā (mājaslapā), bet vēl nav datubāzē — tāpēc panelī nav redzams un nav labojams.
 * Salīdzina pēc atslēgas (pakalpojumiem — sadaļa + adrese, komandai un klientiem — vārds, atsauksmēm — autors).
 */
const SOURCES: Record<string, { table: string; key: (r: Row) => string; title: (r: Row) => string; rows: () => Row[] }> = {
  pakalpojumi: {
    table: "services",
    key: (r) => `${r.audience}/${r.slug}`,
    title: (r) => String(r.title),
    rows: () => [...businessServices, ...privateServices].map((s) => toRow(s as unknown as Row)),
  },
  komanda: { table: "team_members", key: (r) => `${r.name}/${r.photo}`, title: (r) => String(r.name), rows: () => defaultTeam.map((t) => toRow(t as unknown as Row)) },
  klienti: { table: "clients", key: (r) => String(r.name), title: (r) => String(r.name), rows: () => defaultClients.map((c) => toRow(c as unknown as Row)) },
  atsauksmes: {
    table: "testimonials",
    key: (r) => String(r.author),
    title: (r) => String(r.author),
    rows: () => defaultTestimonials.map((t) => toRow(t as unknown as Row)),
  },
};

export async function missingContent(key: string, db: AdminContext["db"]): Promise<{ titles: string[]; rows: Row[]; table: string } | null> {
  const src = SOURCES[key];
  if (!src) return null;
  const { data, error } = await db.from(src.table).select("*");
  if (error) return null;
  const have = new Set((data ?? []).map((r: Row) => src.key(r)));
  const rows = src.rows().filter((r) => !have.has(src.key(r)));
  return { titles: rows.map(src.title), rows, table: src.table };
}

/**
 * Galerijas albumi, kas mājaslapā redzami no projekta mapes, bet nav datubāzē (tāpēc nav redzami sadaļā "Foto").
 * Ņem tikai albumus, kuru datubāzē nav nemaz — ja albumā kāda bilde jau ir datubāzē, mājaslapa rāda tikai tās.
 */
export async function missingGallery(db: AdminContext["db"]): Promise<{ titles: string[]; rows: Row[] } | null> {
  const { data, error } = await db.from("gallery_images").select("album");
  if (error) return null;
  const have = new Set((data ?? []).map((r: Row) => String(r.album)));
  const images = manifestGallery().filter((g) => !have.has(g.album));
  const albums = [...new Set(images.map((g) => g.album))];
  return {
    titles: albums.map((a) => `${albumTitle(a) || a} (${images.filter((g) => g.album === a).length})`),
    rows: images.map((g) => toRow(g as unknown as Row)),
  };
}
