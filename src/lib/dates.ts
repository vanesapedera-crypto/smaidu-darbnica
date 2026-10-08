import { atStudio } from "./bookings";
import { VENUE_SLOTS } from "./pricing";

/**
 * Datuma un laika pieraksts klientiem un komandai (e-pasti, apstiprināšanas lapa, kalendārs, WhatsApp / SMS).
 * Datumu raksta ar vārdiem: "6. oktobris"; ja gads nav šis gads — "2027. gada 9. janvāris".
 */

const MONTHS = [
  "janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs",
  "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris",
];

/** "2026-10-06" → "6. oktobris" (vai "2027. gada 9. janvāris", ja cits gads). Nepareizam datumam — "". */
export function dateWords(iso: unknown, now: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof iso === "string" ? iso : "");
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  if (!m || !month) return "";
  const text = `${Number(m[3])}. ${month}`;
  return Number(m[1]) === now.getFullYear() ? text : `${m[1]}. gada ${text}`;
}

/**
 * Laiks: rezervācijām mūsu telpās — 3 stundu posms ("14:00–17:00"), izbraukuma ballītēm un programmām citās vietās — sākuma laiks ("15:00").
 * `location` — pieteikuma norises vieta ("Izbraukums" vai mūsu telpas).
 */
export function timeLabel(time: string | null | undefined, location: string | null | undefined): string {
  const start = (time ?? "").slice(0, 5);
  if (!start) return "";
  return !atStudio(location) ? start : (VENUE_SLOTS.find((t) => t.value === start)?.label ?? start);
}

/** Datums un laiks vienā rindā: "6. oktobris plkst. 14:00–17:00" */
export function whenLabel(date: unknown, time: string | null | undefined, location: string | null | undefined): string {
  const t = timeLabel(time, location);
  return [dateWords(date), t && `plkst. ${t}`].filter(Boolean).join(" ");
}
