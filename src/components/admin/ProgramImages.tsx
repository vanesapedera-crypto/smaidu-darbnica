"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { addProgramImages, removeProgramImage, removeServiceAlbum, setServicePhotos } from "@/app/admin/actions";
import { uploadImage } from "./upload";

type Img = { id?: string; src: string };
type Uploaded = { src: string; width: number; height: number };

/**
 * Visas pakalpojuma / programmas lapā redzamās bildes vienuviet:
 *  1) lapas fotogalerija (albums ar lapas adresi) — pievienot / noņemt;
 *  2) uzņēmumiem — bilžu režģis (Iestatījumi → Uzņēmumiem → Pakalpojumu lapu bildes) — pievienot / noņemt;
 *  3) citi lapai pievienotie galerijas albumi — apskatei, var noņemt no šīs lapas.
 */
export default function ProgramImages({
  serviceId,
  slug,
  title,
  images,
  business = false,
  otherAlbums = [],
  gridPhotos = null,
}: {
  serviceId: string;
  slug: string;
  title: string;
  images: Img[];
  business?: boolean;
  otherAlbums?: { album: string; title: string; images: string[] }[];
  gridPhotos?: string[] | null;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ target: string; done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState("");

  async function upload(target: "gallery" | "grid", files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setProgress({ target, done: 0, total: files.length });
    const uploaded: Uploaded[] = [];
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
      const result =
        target === "gallery"
          ? await addProgramImages(slug, uploaded, title, business)
          : await setServicePhotos(slug, { add: uploaded.map((u) => u.src) });
      if (result?.error) setError(result.error);
    }
    setProgress(null);
    router.refresh();
  }

  function run(key: string, question: string, action: () => Promise<{ error?: string } | undefined>) {
    if (!confirm(question)) return;
    setBusy(key);
    start(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  const thumb = (src: string, key: string, onRemove?: () => void) => (
    <li key={key} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element -- priekšskatījums jebkuram URL */}
      <img src={src} alt="" className="size-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          aria-label="Noņemt attēlu"
          className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/90 text-destructive shadow hover:bg-white"
        >
          {pending && busy === key ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      )}
    </li>
  );

  const uploadButton = (target: "gallery" | "grid") => (
    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">
      {progress?.target === target ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
      {progress?.target === target ? `Augšupielādē… ${progress.done}/${progress.total}` : "Pievienot attēlus"}
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={Boolean(progress)}
        onChange={(e) => {
          upload(target, e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );

  const grid = "mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6";
  const sub = "mt-6 border-t border-line pt-5 text-sm font-extrabold";

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
      <h2 className="text-base font-extrabold">{business ? "Pakalpojuma attēli" : "Programmas attēli"}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Šeit redzamas visas bildes, kas rādās šajā lapā. Var izvēlēties vairākus attēlus uzreiz — tie tiek samazināti automātiski.
      </p>

      <h3 className={sub}>Fotogalerija</h3>
      {images.length > 0 ? (
        <ul className={grid}>{images.map((img) => thumb(img.src, img.id ?? img.src, img.id ? () => run(img.id!, "Noņemt šo attēlu?", () => removeProgramImage(img.id!)) : undefined))}</ul>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">Attēlu vēl nav.</p>
      )}
      {uploadButton("gallery")}

      {gridPhotos && (
        <>
          <h3 className={sub}>Bilžu režģis lapas lejasdaļā</h3>
          {gridPhotos.length > 0 ? (
            <ul className={grid}>{gridPhotos.map((src) => thumb(src, `grid:${src}`, () => run(`grid:${src}`, "Noņemt šo attēlu?", () => setServicePhotos(slug, { remove: src }))))}</ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Attēlu vēl nav.</p>
          )}
          {uploadButton("grid")}
        </>
      )}

      {otherAlbums.map((a) => (
        <div key={a.album}>
          <h3 className={`${sub} flex flex-wrap items-center justify-between gap-2`}>
            <span>
              No galerijas albuma “{a.title}” <span className="font-semibold text-ink-soft">({a.images.length})</span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(`album:${a.album}`, `Nerādīt albuma “${a.title}” bildes šajā lapā? (Galerijā tās paliek.)`, () => removeServiceAlbum(serviceId, a.album))}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-destructive ring-1 ring-line hover:bg-surface"
            >
              {pending && busy === `album:${a.album}` ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Noņemt no šīs lapas
            </button>
          </h3>
          {a.images.length > 0 ? (
            <ul className={grid}>{a.images.map((src) => thumb(src, `${a.album}:${src}`))}</ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Albumā nav bilžu.</p>
          )}
        </div>
      ))}

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
