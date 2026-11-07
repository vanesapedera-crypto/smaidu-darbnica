"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { costPerPerson, money, perPerson, type WorkshopItem } from "@/lib/team/workshops";
import { adminInput, adminSecondary } from "../styles";

type Row = { key: number; name: string; qty: string; price: string };

const toNum = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

/**
 * Materiālu tabula ar aprēķinu: katrai rindai — cena vienai personai,
 * apakšā — tīrā pašizmaksa vienai personai un visai grupai.
 * Formā aiziet kā JSON laukā "items".
 */
export default function WorkshopItems({
  initial,
  participants: initialParticipants,
  readOnly = false,
}: {
  initial: WorkshopItem[];
  participants: number | null;
  readOnly?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (initial.length ? initial : [{ name: "", qty: null, price: null }]).map((i, n) => ({
      key: n,
      name: i.name,
      qty: i.qty?.toString().replace(".", ",") ?? "",
      price: i.price?.toString().replace(".", ",") ?? "",
    })),
  );
  const [participants, setParticipants] = useState(initialParticipants?.toString() ?? "");

  const items: WorkshopItem[] = rows.map((r) => ({ name: r.name.trim(), qty: toNum(r.qty), price: toNum(r.price) }));
  const total = costPerPerson(items);
  const people = toNum(participants);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="pb-2 font-semibold">Nosaukums</th>
              <th className="w-36 pb-2 font-semibold">
                Daudzums
                <span className="block text-xs font-normal">cik personām pietiek</span>
              </th>
              <th className="w-36 pb-2 font-semibold">Iepirkuma cena, €</th>
              <th className="w-36 pb-2 text-right font-semibold">Cena 1 personai</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={r.key} className="border-t border-line">
                <td className="py-1.5 pr-2">
                  {readOnly ? (
                    r.name
                  ) : (
                    <input value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} placeholder="piem. Akrila krāsas" className={adminInput} aria-label="Nosaukums" />
                  )}
                </td>
                <td className="py-1.5 pr-2">
                  {readOnly ? (
                    r.qty
                  ) : (
                    <input value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} inputMode="decimal" placeholder="20" className={adminInput} aria-label="Daudzums" />
                  )}
                </td>
                <td className="py-1.5 pr-2">
                  {readOnly ? (
                    r.price && money(toNum(r.price) ?? 0)
                  ) : (
                    <input value={r.price} onChange={(e) => set(r.key, { price: e.target.value })} inputMode="decimal" placeholder="12,50" className={adminInput} aria-label="Iepirkuma cena" />
                  )}
                </td>
                <td className="py-1.5 text-right font-semibold whitespace-nowrap">{items[n].price !== null ? money(perPerson(items[n])) : "—"}</td>
                {!readOnly && (
                  <td className="py-1.5 pl-1">
                    <button
                      type="button"
                      onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [{ key: Date.now(), name: "", qty: "", price: "" }]))}
                      className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Noņemt rindu"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button type="button" onClick={() => setRows((rs) => [...rs, { key: Date.now(), name: "", qty: "", price: "" }])} className={adminSecondary}>
          <Plus className="size-4" aria-hidden /> Pievienot materiālu
        </button>
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

      {!readOnly && <input type="hidden" name="items" value={JSON.stringify(items.filter((i) => i.name || i.price !== null))} />}
    </div>
  );
}
