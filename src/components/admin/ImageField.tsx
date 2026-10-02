"use client";

import { useRef, useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { uploadImage } from "./upload";
import { adminInput } from "./styles";

/**
 * Attēla lauks: augšupielāde uz Supabase Storage vai esoša attēla adrese
 * (piem. /media/ziemassvetki-2025/ziemassvetki-2025-03.webp).
 */
export default function ImageField({
  name,
  defaultValue,
  folder,
  required,
}: {
  name: string;
  defaultValue: string;
  folder: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await uploadImage(file, folder);
      setValue(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- priekšskatījums jebkuram URL
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageUp className="size-6 text-ink/30" aria-hidden />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          placeholder="/media/… vai https://…"
          className={adminInput}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-black">
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
            {busy ? "Augšupielādē…" : "Augšupielādēt attēlu"}
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button type="button" className="text-sm text-ink-soft underline" onClick={() => setValue("")}>
              Noņemt
            </button>
          )}
        </div>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
      </div>
    </div>
  );
}
