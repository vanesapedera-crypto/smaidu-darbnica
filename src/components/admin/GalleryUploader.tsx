"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, LoaderCircle } from "lucide-react";
import { addGalleryImages } from "@/app/admin/actions";
import { slugify } from "@/lib/admin/fields";
import { uploadImage } from "./upload";
import { adminInput } from "./styles";

/**
 * Vairāku attēlu augšupielāde uzreiz. Attēli pārlūkā tiek samazināti un
 * pārveidoti WebP formātā, tad saglabāti Supabase Storage un galerijas tabulā.
 */
export default function GalleryUploader({
  categories,
  albums,
}: {
  categories: { value: string; label: string }[];
  albums: string[];
}) {
  const router = useRouter();
  const [album, setAlbum] = useState("");
  const [category, setCategory] = useState(categories[0]?.value ?? "");
  const [alt, setAlt] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const albumSlug = slugify(album) || "galerija";
    setError("");
    setProgress({ done: 0, total: files.length });

    const uploaded: { src: string; width: number; height: number; alt: string }[] = [];
    for (const file of Array.from(files)) {
      try {
        const res = await uploadImage(file, `galerija/${albumSlug}`);
        uploaded.push({
          src: res.url,
          width: res.width ?? 1600,
          height: res.height ?? 1200,
          alt: alt || `${album || "Pasākums"} — Smaidu Darbnīca`,
        });
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }

    if (uploaded.length) {
      const result = await addGalleryImages(uploaded, albumSlug, category);
      if (result?.error) setError(result.error);
    }
    setProgress(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="font-extrabold">Pievienot attēlus</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="space-y-1.5 text-sm font-bold">
          Albums
          <input list="albumi" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="piem. ziemassvetki-2026" className={adminInput} />
          <datalist id="albumi">
            {albums.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>
        <label className="space-y-1.5 text-sm font-bold">
          Kategorija
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={adminInput}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-bold">
          Apraksts (alt teksts)
          <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="piem. Tukuma Rožu svētki 2026" className={adminInput} />
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-8 text-center transition-colors hover:border-ink">
        {progress ? (
          <>
            <LoaderCircle className="size-7 animate-spin" aria-hidden />
            <span className="font-bold">
              Augšupielādē {progress.done} / {progress.total}…
            </span>
          </>
        ) : (
          <>
            <ImageUp className="size-7" aria-hidden />
            <span className="font-bold">Izvēlieties vai ievelciet attēlus</span>
            <span className="text-sm text-ink-soft">JPG, PNG, WebP · attēli tiks automātiski optimizēti</span>
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={!!progress}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
