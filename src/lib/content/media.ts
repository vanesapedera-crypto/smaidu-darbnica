import manifest from "@/data/media.json";
import type { GalleryImage } from "./types";

/**
 * Lokālo (projekta mapē esošo) fotogrāfiju manifests.
 * Ģenerē `npm run images` (scripts/optimize-images.mjs).
 */

type ManifestImage = { src: string; width: number; height: number; blur: string };
type ManifestAlbum = {
  slug: string;
  title: string;
  category: string;
  hidden: boolean;
  images: ManifestImage[];
};

const albums = manifest.albums as ManifestAlbum[];

export const galleryCategories: Record<string, string> = manifest.categories;

const bySrc = new Map<string, ManifestImage>();
for (const album of albums) for (const img of album.images) bySrc.set(img.src, img);

/** Izmēri un blur priekšskatījums lokālam attēlam (ja tāds ir manifestā). */
export function mediaInfo(src: string): ManifestImage | undefined {
  return bySrc.get(src);
}

export function albumTitle(slug: string): string {
  return albums.find((a) => a.slug === slug)?.title ?? "";
}

/** Visi publiskās galerijas attēli no manifesta (noklusējuma galerija / seed). */
export function manifestGallery(): GalleryImage[] {
  return albums
    .filter((a) => !a.hidden)
    .flatMap((album) =>
      album.images.map((img, i) => ({
        src: img.src,
        alt: `${album.title} — Smaidu Darbnīca`,
        album: album.slug,
        category: album.category,
        width: img.width,
        height: img.height,
        blur: img.blur,
        sort: i,
        published: true,
      })),
    );
}

/** Galerijas attēli → fotolentes kartītes ar albuma nosaukumu kā parakstu. */
export function toReel(images: GalleryImage[]) {
  return images.map(({ src, alt, album, width, height, blur }) => ({
    src,
    alt,
    caption: albumTitle(album) || alt.replace(/ — Smaidu Darbnīca$/, ""),
    width,
    height,
    blur,
  }));
}
