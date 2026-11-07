"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { createPresentationUploadUrl } from "@/app/admin/team-actions";
import { uploadImage } from "../upload";
import { useUploadBusy } from "./TeamForm";

/** Foto prezentācijai: augšupielāde (samazina un pārveido WebP), priekšskatījums, noņemšana. Formā — lauks "image". */
export default function PhotoField({ value, label = "Foto prezentācijai" }: { value: string | null; label?: string }) {
  const setBusy = useUploadBusy();
  const [url, setUrl] = useState(value ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setLoading(true);
    setBusy(true);
    try {
      const res = await uploadImage(file, "prezentacijas", createPresentationUploadUrl);
      setUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās augšupielādēt.");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-bold">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          <span className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-24 w-36 rounded-lg object-cover ring-1 ring-line" />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-ink text-white"
              aria-label="Noņemt foto"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ) : (
          <span className="grid h-24 w-36 place-items-center rounded-lg bg-surface text-xs text-ink-soft ring-1 ring-line">Nav foto</span>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-ink">
          {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {url ? "Mainīt foto" : "Pievienot foto"}
          <input type="file" accept="image/*" onChange={onChange} className="sr-only" />
        </label>
      </div>
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
      <input type="hidden" name="image" value={url} />
    </div>
  );
}
