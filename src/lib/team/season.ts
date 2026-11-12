/** Sezona darbnīcām, aktivitātēm un izrādēm lapā "Salikt piedāvājumu": visu gadu, vasara vai Ziemassvētki */
export type Season = "all" | "summer" | "xmas";

export const SEASONS: { value: Season; label: string }[] = [
  { value: "all", label: "Visu gadu" },
  { value: "summer", label: "Vasara" },
  { value: "xmas", label: "Ziemassvētki" },
];

/** Teksts vai formas vērtība → sezona ("vasara", "summer" → summer; "Ziemassvētki", "xmas" → xmas; citādi — visu gadu) */
export function toSeason(v: unknown): Season {
  const t = String(v ?? "").toLowerCase();
  if (t === "summer" || t.startsWith("vasar")) return "summer";
  if (t === "xmas" || t.startsWith("ziem")) return "xmas";
  return "all";
}
