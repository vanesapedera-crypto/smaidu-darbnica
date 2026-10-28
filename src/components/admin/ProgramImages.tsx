"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { addProgramImages, removeProgramImage } from "@/app/admin/actions";
import { uploadImage } from "./upload";

type Img = { id?: string; src: string };

/**
 * Programmas attēli (lapas sadaļa "Foto"): augšupielāde uzreiz vairākiem attēliem un noņemšana.
 * Attēli glabājas galerijā albumā ar programmas adresi (sk. addProgramImages).
 */
export default function ProgramImages({ slug, title, images, business = false }: { slug: string; title: string; images: Img[]; business?: boolean }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [removing, startRemove] = useTransition();
  const [removingId, setRemovingId] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setProgress({ done: 0, total: files.length });
    const uploaded: { src: string; width: number; height: number }[] = [];
    for (const file of Array.from(files)) {
      try {
        const res = await uploadImage(file, `programmas/${slug}`);
        uploaded.push({ src: res.url, width: res.width ?? 1600, height: res.height ?? 1200 });
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }
    if (uploaded.length) {
      const result = await addProgramImages(slug, uploaded, title, business);
      if (result?.error) setError(result.error);
    }
    setProgress(null);
    router.refresh();
  }

  function remove(id: string) {
    if (!confirm("Noņemt šo attēlu no programmas?")) return;
    setRemovingId(id);
    startRemove(async () => {
      const result = await removeProgramImage(id);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
      <h2 className="text-base font-extrabold">{business ? "Pakalpojuma attēli" : "Programmas attēli"}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Rāda šīs lapas fotogalerijā. Var izvēlēties vairākus attēlus uzreiz — tie tiek samazināti automātiski.
      </p>

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <li key={img.id ?? img.src} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element -- priekšskatījums jebkuram URL */}
              <img src={img.src} alt="" className="size-full object-cover" />
              {img.id && (
                <button
                  type="button"
                  onClick={() => remove(img.id!)}
                  disabled={removing}
                  aria-label="Noņemt attēlu"
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/90 text-destructive shadow hover:bg-white"
                >
                  {removing && removingId === img.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">Attēlu vēl nav.</p>
      )}

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">
        {progress ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
        {progress ? `Augšupielādē… ${progress.done}/${progress.total}` : "Pievienot attēlus"}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={Boolean(progress)}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
