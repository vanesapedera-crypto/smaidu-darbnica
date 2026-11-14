"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { costPerPerson, materialMap, money, packPrice, perPerson, type Material, type WorkshopItem } from "@/lib/team/workshops";
import { adminInput, adminSecondary } from "../styles";

type Row = { key: number; materialId: string; qty: string; name?: string; price?: number | null };

const toNum = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

/**
 * Darbnīcas materiāli: izvēlas izejmateriālu (cena par iepakojumu — fiksēta sadaļā "Izejmateriāli")
 * un ieraksta, cik bērniem pietiek viens iepakojums. Apakšā — tīrā pašizmaksa 1 personai un grupai.
 * Formā aiziet kā JSON laukā "items".
 */
export default function WorkshopItems({
  initial,
  materials,
  participants: initialParticipants,
  readOnly = false,
}: {
  initial: WorkshopItem[];
  materials: Material[];
  participants: number | null;
  readOnly?: boolean;
}) {
  const map = materialMap(materials);
  const [rows, setRows] = useState<Row[]>(() =>
    (initial.length ? initial : [{ materialId: null, qty: null }]).map((i, n) => ({
      key: n,
      materialId: i.materialId ?? "",
      qty: i.qty?.toString().replace(".", ",") ?? "",
      name: i.name,
      price: i.price,
    })),
  );
  const [participants, setParticipants] = useState(initialParticipants?.toString() ?? "");

  const items: WorkshopItem[] = rows.map((r) =>
    r.materialId ? { materialId: r.materialId, qty: toNum(r.qty) } : { materialId: null, qty: toNum(r.qty), name: r.name ?? "", price: r.price ?? null },
  );
  const total = costPerPerson(items, map);
  const people = toNum(participants);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const sorted = [...materials].sort((a, b) => a.name.localeCompare(b.name, "lv"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold">Materiāli</span>
        <Link href="/admin/darbnicas?materiali=1#izejmateriali" target="_blank" className="text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
          Izejmateriāli un to cenas
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="pb-2 font-semibold">Izejmateriāls</th>
              <th className="w-32 pb-2 font-semibold">Cena par iepakojumu</th>
              <th className="w-40 pb-2 font-semibold">
                Cik bērniem pietiek
                <span className="block text-xs font-normal">1 iepakojums</span>
              </th>
              <th className="w-32 pb-2 text-right font-semibold">Cena 1 personai</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, n) => {
              const m = r.materialId ? map.get(r.materialId) : undefined;
              const hasPrice = Boolean(r.materialId) || r.price != null;
              return (
                <tr key={r.key} className="border-t border-line">
                  <td className="py-1.5 pr-2">
                    {readOnly ? (
                      (m?.name ?? r.name ?? "—")
                    ) : (
                      <>
                        <select value={r.materialId} onChange={(e) => set(r.key, { materialId: e.target.value })} className={adminInput} aria-label="Izejmateriāls">
                          <option value="">{r.name ? `${r.name} (vecs ieraksts — izvēlieties no saraksta)` : "— izvēlieties —"}</option>
                          {sorted.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                              {x.pack ? ` (${x.pack})` : ""}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 whitespace-nowrap text-ink-soft">{hasPrice ? money(packPrice(items[n], map)) : "—"}</td>
                  <td className="py-1.5 pr-2">
                    {readOnly ? (
                      r.qty
                    ) : (
                      <input value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} inputMode="decimal" placeholder="20" className={adminInput} aria-label="Cik bērniem pietiek" />
                    )}
                  </td>
                  <td className="py-1.5 text-right font-semibold whitespace-nowrap">{hasPrice ? money(perPerson(items[n], map)) : "—"}</td>
                  {!readOnly && (
                    <td className="py-1.5 pl-1">
                      <button
                        type="button"
                        onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [{ key: Date.now(), materialId: "", qty: "" }]))}
                        className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Noņemt rindu"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setRows((rs) => [...rs, { key: Date.now(), materialId: "", qty: "" }])} className={adminSecondary}>
            <Plus className="size-4" aria-hidden /> Pievienot materiālu
          </button>
          {materials.length === 0 && <span className="text-sm text-ink-soft">Vispirms pievienojiet izejmateriālus ar cenām (saite augšā).</span>}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl bg-ink p-5 text-white sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Tīrā pašizmaksa 1 personai</p>
          <p className="mt-1 text-2xl font-extrabold text-brand">{money(total)}</p>
        </div>
        <label className="block">
          <span className="text-xs font-semibold tracking-wide text-white/60 uppercase">Dalībnieku skaits</span>
          {readOnly ? (
            <span className="mt-1 block text-2xl font-extrabold">{participants || "—"}</span>
          ) : (
            <input
              name="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              inputMode="numeric"
              placeholder="piem. 25"
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-lg font-bold text-white outline-none placeholder:text-white/40 focus:border-brand"
            />
          )}
        </label>
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Pašizmaksa visai grupai</p>
          <p className="mt-1 text-2xl font-extrabold">{people ? money(total * people) : "—"}</p>
        </div>
      </div>

      {!readOnly && <input type="hidden" name="items" value={JSON.stringify(items.filter((i) => i.materialId || i.name))} />}
    </div>
  );
}
