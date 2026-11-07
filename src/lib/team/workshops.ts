/** Radošo darbnīcu pašizmaksas aprēķins. */

export type WorkshopItem = {
  /** Materiāla nosaukums */
  name: string;
  /** Cik personām pietiek iepirktais daudzums (piem. iepakojumā 20 gab. → 20) */
  qty: number | null;
  /** Iepirkuma cena par visu daudzumu, € */
  price: number | null;
};

export type WorkshopRow = {
  id: string;
  title: string;
  notes: string | null;
  /** Prezentācijai */
  description?: string | null;
  image?: string | null;
  items: WorkshopItem[];
  participants: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Cena vienai personai: iepirkuma cena / daudzums (ja daudzums nav — visa cena uz vienu personu) */
export function perPerson(item: Pick<WorkshopItem, "qty" | "price">): number {
  const price = item.price ?? 0;
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  return price / qty;
}

/** Tīrā pašizmaksa vienai personai */
export const costPerPerson = (items: WorkshopItem[]) => items.reduce((sum, i) => sum + perPerson(i), 0);

export const money = (n: number) =>
  `${n.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Datubāzes jsonb → droši materiāli */
export function parseItems(raw: unknown): WorkshopItem[] {
  if (!Array.isArray(raw)) return [];
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
  };
  return raw
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ name: String(r.name ?? "").trim().slice(0, 200), qty: num(r.qty), price: num(r.price) }))
    .filter((i) => i.name || i.price !== null)
    .slice(0, 200);
}
