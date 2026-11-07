/** Komandas sadaļu (scenāriji, piedāvājumi) datu tipi un konstantes. */

export type ScriptRow = {
  id: string;
  title: string;
  category: string | null;
  year: number | null;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OfferKind = "client" | "template";

export type OfferRow = {
  id: string;
  kind: OfferKind;
  client_name: string | null;
  contact_person: string | null;
  contact_email: string | null;
  title: string;
  offer_date: string | null;
  season: string | null;
  services: string | null;
  price: string | null;
  status: string | null;
  body: string | null;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const OFFER_SEASONS = ["Ziemassvētki", "Vasara", "Visu gadu"];
export const OFFER_STATUSES = ["Melnraksts", "Nosūtīts", "Pieņemts", "Noraidīts"];

/** Krātuve: scenariji/… un standarta/… redz visa komanda, piedavajumi/… — tikai vadība */
export const TEAM_BUCKET = "team-files";
export type TeamFolder = "scenariji" | "piedavajumi" | "standarta";

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Klienta nosaukums salīdzināšanai: bez lielajiem burtiem, pēdiņām, SIA/AS un liekām atstarpēm */
export function clientKey(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/["'“”„«»]/g, "")
    .replace(/\b(sia|as|pa|biedrība|nodibinājums)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
