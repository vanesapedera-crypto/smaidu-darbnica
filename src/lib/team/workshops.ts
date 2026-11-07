/** Radošo darbnīcu pašizmaksas aprēķins. */

/** Izejmateriāls ar fiksētu cenu par iepakojumu/komplektu (tabula materials) */
export type Material = { id: string; name: string; price: number; pack: string | null };

/** Darbnīcas materiālu rinda: kurš izejmateriāls un cik bērniem pietiek 1 iepakojums */
export type WorkshopItem = {
  materialId: string | null;
  qty: number | null;
  /** Vecās rindas (pirms izejmateriālu saraksta) — nosaukums un cena tieši rindā */
  name?: string;
  price?: number | null;
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

export type MaterialMap = Map<string, Material>;
export const materialMap = (rows: Material[] | null | undefined): MaterialMap =>
  new Map((rows ?? []).map((m) => [m.id, { ...m, price: Number(m.price) || 0 }]));

/** Iepakojuma cena: no izejmateriālu saraksta (vecajām rindām — rindas cena) */
export const packPrice = (item: WorkshopItem, materials: MaterialMap) =>
  item.materialId ? (materials.get(item.materialId)?.price ?? 0) : (item.price ?? 0);

/** Cena vienai personai: iepakojuma cena / cik bērniem pietiek */
export function perPerson(item: WorkshopItem, materials: MaterialMap): number {
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  return packPrice(item, materials) / qty;
}

/** Tīrā pašizmaksa vienai personai */
export const costPerPerson = (items: WorkshopItem[], materials: MaterialMap) => items.reduce((sum, i) => sum + perPerson(i, materials), 0);

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
    .map((r) => {
      const materialId = typeof r.materialId === "string" && /^[0-9a-f-]{36}$/i.test(r.materialId) ? r.materialId : null;
      return materialId
        ? { materialId, qty: num(r.qty) }
        : { materialId: null, qty: num(r.qty), name: String(r.name ?? "").trim().slice(0, 200), price: num(r.price) };
    })
    .filter((i) => i.materialId || i.name || i.price !== null)
    .slice(0, 200);
}
