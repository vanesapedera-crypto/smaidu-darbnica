/**
 * Pārveido Supabase rindas (snake_case) uz lietotnes objektiem (camelCase) un otrādi.
 * Tukšās (null) vērtības aizstāj ar noklusējumu, lai komponentēm nebūtu jāpārbauda null.
 */

const toCamelKey = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toSnakeKey = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

type Row = Record<string, unknown>;

export function fromRow<T extends object>(row: Row, empty: T): T {
  const out: Row = { ...(empty as Row) };
  for (const [key, value] of Object.entries(row)) {
    const camel = toCamelKey(key);
    if (!(camel in out) && camel !== "id") continue; // ignorē nezināmas kolonnas
    if (value !== null && value !== undefined) out[camel] = value;
  }
  return out as T;
}

export function toRow(obj: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "id" || value === undefined) continue;
    out[toSnakeKey(key)] = value;
  }
  return out;
}
