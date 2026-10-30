"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImageUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { FieldDef } from "@/lib/admin/fields";
import { uploadImage } from "./upload";
import { adminInput, adminSecondary } from "./styles";

/**
 * Lauki ar bildēm (bilžu saraksti, kartītes, spēles, tēli, video) — bildes redzamas kā bildes, nevis adreses.
 * Formai tiek nodots tas pats teksts kā agrāk ("a | b | c" rindā), tāpēc saglabāšana nemainās.
 */

type Col = { key: string; label: string; kind: "text" | "image" | "long" };

const LABELS: Record<string, string> = {
  tag: "Birka",
  title: "Virsraksts",
  name: "Nosaukums",
  text: "Teksts",
  image: "Bilde",
  href: "Saite",
};

/** Kurām laukiem rādīt vizuālo redaktoru un ar kādām kolonnām */
export function visualColumns(field: FieldDef): Col[] | null {
  if (field.type === "lines" && field.images) return [{ key: "src", label: "Bilde", kind: "image" }];
  if (field.type === "photos")
    return [
      { key: "src", label: "Bilde", kind: "image" },
      { key: "caption", label: "Paraksts", kind: "text" },
    ];
  if (field.type === "videos")
    return [
      { key: "title", label: "Nosaukums", kind: "text" },
      { key: "src", label: "YouTube saite", kind: "text" },
      { key: "poster", label: "Vāciņa bilde", kind: "image" },
      { key: "duration", label: "Ilgums", kind: "text" },
      { key: "audience", label: "Auditorija", kind: "text" },
      { key: "description", label: "Apraksts", kind: "long" },
    ];
  if (field.type === "table" && field.columns?.includes("image"))
    return field.columns.map((c, i) => ({
      key: c,
      label: field.columnLabels?.[i] ?? LABELS[c] ?? c,
      kind: c === "image" ? "image" : c === "text" ? "long" : "text",
    }));
  return null;
}

const toRows = (text: string, cols: Col[]) =>
  text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const cells = cols.length === 1 ? [l] : l.split("|").map((x) => x.trim());
      // pēdējā garā teksta kolonna var saturēt arī "|"
      if (cells.length > cols.length) cells.splice(cols.length - 1, cells.length, cells.slice(cols.length - 1).join(" | "));
      return cols.map((c, i) => {
        const v = cells[i] ?? "";
        return c.kind === "long" ? v.replace(/\s*¶\s*/g, "\n") : v;
      });
    });

const toText = (rows: string[][], cols: Col[]) =>
  rows
    .map((r) => {
      const cells = r.map((v, i) => (cols[i].kind === "long" ? v.trim().replace(/\n/g, " ¶ ") : v.replace(/\|/g, "/").trim()));
      while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
      return cells.join(" | ");
    })
    .filter((l) => l.replace(/[\s|]/g, ""))
    .join("\n");

export default function VisualRows({ field, cols, defaultValue, folder }: { field: FieldDef; cols: Col[]; defaultValue: string; folder: string }) {
  const [rows, setRows] = useState(() => toRows(defaultValue, cols));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const onlyImages = cols.length === 1;
  const imageCol = cols.findIndex((c) => c.kind === "image");

  const move = (i: number, d: number) =>
    setRows((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setRows((rs) => rs.filter((_, k) => k !== i));
  const setCell = (i: number, c: number, v: string) => setRows((rs) => rs.map((r, k) => (k === i ? r.map((x, n) => (n === c ? v : x)) : r)));

  async function upload(files: FileList | null, target: { row: number } | "new") {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    const urls: string[] = [];
    for (const [n, file] of list.entries()) {
      setBusy(list.length > 1 ? `${n + 1}/${list.length}` : "…");
      try {
        urls.push((await uploadImage(file, folder)).url);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBusy(null);
    if (!urls.length) return;
    if (target === "new") setRows((rs) => [...rs, ...urls.map((u) => cols.map((_, i) => (i === imageCol ? u : "")))]);
    else setCell(target.row, imageCol, urls[0]);
  }

  const picker = (label: string, target: { row: number } | "new", multiple: boolean) => (
    <label className={`${adminSecondary} cursor-pointer`}>
      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
      {busy ? `Augšupielādē ${busy}` : label}
      <input
        type="file"
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        className="sr-only"
        disabled={Boolean(busy)}
        onChange={(e) => {
          upload(e.target.files, target);
          e.target.value = "";
        }}
      />
    </label>
  );

  const iconBtn = "grid size-8 place-items-center rounded-full bg-white/90 text-ink shadow ring-1 ring-line hover:bg-white disabled:opacity-30";

  return (
    <div>
      <input type="hidden" name={field.name} value={toText(rows, cols)} />

      {onlyImages ? (
        // Tikai bildes — režģis
        rows.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {rows.map((r, i) => (
              <li key={`${r[0]}-${i}`} className="relative aspect-square overflow-hidden rounded-xl bg-surface ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- priekšskatījums jebkuram URL */}
                <img src={r[0]} alt="" className="size-full object-cover" />
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Pārvietot pa kreisi">
                    <ArrowLeft className="size-4" />
                  </button>
                  <button type="button" className={iconBtn} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Pārvietot pa labi">
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <button type="button" className={`${iconBtn} absolute top-1.5 right-1.5 text-destructive`} onClick={() => remove(i)} aria-label="Noņemt bildi">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">Bilžu vēl nav.</p>
        )
      ) : (
        // Kartītes ar bildi un tekstiem
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex flex-col gap-4 rounded-xl border border-line p-3 sm:flex-row">
              {imageCol >= 0 && (
                <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-surface ring-1 ring-line">
                    {r[imageCol] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- priekšskatījums jebkuram URL
                      <img src={r[imageCol]} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageUp className="size-6 text-ink/30" aria-hidden />
                    )}
                  </div>
                  {picker(r[imageCol] ? "Mainīt" : "Pievienot", { row: i }, false)}
                  {r[imageCol] && (
                    <button type="button" className="text-xs text-ink-soft underline" onClick={() => setCell(i, imageCol, "")}>
                      Noņemt bildi
                    </button>
                  )}
                </div>
              )}
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                {cols.map((c, n) =>
                  c.kind === "image" ? null : (
                    <label key={c.key} className={`block text-xs font-bold text-ink-soft ${c.kind === "long" ? "sm:col-span-2" : ""}`}>
                      {c.label}
                      {c.kind === "long" ? (
                        <textarea value={r[n]} rows={3} onChange={(e) => setCell(i, n, e.target.value)} className={`${adminInput} mt-1`} />
                      ) : (
                        <input value={r[n]} onChange={(e) => setCell(i, n, e.target.value)} className={`${adminInput} mt-1`} />
                      )}
                    </label>
                  ),
                )}
              </div>
              <div className="flex gap-1 sm:flex-col">
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Uz augšu">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" className={iconBtn} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Uz leju">
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" className={`${iconBtn} text-destructive`} onClick={() => remove(i)} aria-label="Dzēst">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {onlyImages ? (
          picker("Pievienot bildes", "new", true)
        ) : (
          <button type="button" className={adminSecondary} onClick={() => setRows((rs) => [...rs, cols.map(() => "")])}>
            <Plus className="size-4" aria-hidden /> Pievienot
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
      <p className="mt-2 text-xs text-ink-soft">Izmaiņas stājas spēkā pēc pogas “Saglabāt”.</p>
    </div>
  );
}
