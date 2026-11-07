"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FileUp, Paperclip, TriangleAlert } from "lucide-react";
import { createTeamUploadUrl } from "@/app/admin/team-actions";
import { TEAM_BUCKET, fileSize, type TeamFolder } from "@/lib/team/types";
import { useUploadBusy } from "./TeamForm";
import { adminInput } from "../styles";

let client: ReturnType<typeof createClient> | null = null;
const storage = () =>
  (client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  })).storage;

const MAX = 50 * 1024 * 1024;

/**
 * Faila lauks (PDF, Word u.c.): fails uzreiz augšupielādējas privātajā krātuvē,
 * formā aiziet tikai tā ceļš (file_path, file_name, file_size).
 */
export default function FileField({
  folder,
  current,
  label = "Fails",
}: {
  folder: TeamFolder;
  current?: { name: string | null; url: string | null; size: number | null } | null;
  label?: string;
}) {
  const setBusy = useUploadBusy();
  const [uploaded, setUploaded] = useState<{ path: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (file.size > MAX) {
      setError("Fails ir lielāks par 50 MB.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    setProgress(true);
    try {
      const target = await createTeamUploadUrl(folder, file.name);
      if ("error" in target) throw new Error(target.error);
      const { error: upErr } = await storage()
        .from(TEAM_BUCKET)
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw new Error(upErr.message);
      setUploaded({ path: target.path, name: file.name, size: file.size });
    } catch (err) {
      setError(err instanceof Error ? `Neizdevās augšupielādēt: ${err.message}` : "Neizdevās augšupielādēt.");
      setUploaded(null);
      e.target.value = "";
    } finally {
      setBusy(false);
      setProgress(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-bold">{label}</span>
      {current?.name && !uploaded && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Paperclip className="size-4 text-ink-soft" aria-hidden />
          {current.url ? (
            <a href={current.url} target="_blank" rel="noreferrer" className="font-semibold underline decoration-brand decoration-2 underline-offset-4">
              {current.name}
            </a>
          ) : (
            <span className="font-semibold">{current.name}</span>
          )}
          <span className="text-ink-soft">{fileSize(current.size)}</span>
          <label className="inline-flex items-center gap-2 text-ink-soft">
            <input type="checkbox" name="remove_file" value="1" className="size-4 accent-ink" /> Noņemt failu
          </label>
        </div>
      )}
      <label className="flex cursor-pointer items-center gap-3">
        <FileUp className="size-4 shrink-0 text-ink-soft" aria-hidden />
        <input type="file" onChange={onChange} className={`${adminInput} cursor-pointer py-2`} aria-label={label} />
      </label>
      {progress && <p className="text-xs text-ink-soft">Augšupielādē…</p>}
      {uploaded && (
        <p className="text-xs font-semibold text-emerald-700">
          Augšupielādēts: {uploaded.name} ({fileSize(uploaded.size)}) — nospiediet “Saglabāt”.
          {current?.name && " Iepriekšējais fails tiks aizstāts."}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-destructive">
          <TriangleAlert className="size-3.5" aria-hidden /> {error}
        </p>
      )}
      <input type="hidden" name="file_path" value={uploaded?.path ?? ""} />
      <input type="hidden" name="file_name" value={uploaded?.name ?? ""} />
      <input type="hidden" name="file_size" value={uploaded?.size ?? ""} />
    </div>
  );
}
