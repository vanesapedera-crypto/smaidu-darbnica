import type { Booking } from "./bookings";

/**
 * Google kalendāra notikums no pieteikuma (administrēšanas panelī — poga "Pievienot kalendāram").
 *
 * Poga atver Google kalendāru ar jau aizpildītu notikumu; saglabājot Google pats izsūta ielūgumus viesiem.
 * Kam notikumu sūtīt, nosaka šie saraksti — mainot cilvēkus, pietiek izlabot e-pastus šeit.
 */

/** Saņem visus kalendāra notikumus */
export const CALENDAR_ALWAYS = ["smaidu.darbnica@gmail.com"];
/** Saņem notikumus, kas notiek mūsu telpās (telpu noma) — telpu uzkopšanai */
export const CALENDAR_VENUE = ["keitaplavina3@gmail.com"];
/** Izklaides programmu vadītājas — panelī pie pieteikuma izvēlas, kura vadīs */
export const CALENDAR_HOSTS = [
  { name: "Madara", email: "racemadara@gmail.com" },
  { name: "Agija", email: "balode.agija@gmail.com" },
];

/** Telpu nomas laika posma garums stundās (10:00–13:00 utt.) */
const SLOT_HOURS = 3;
const VENUE_ADDRESS = "Smaidu Darbnīca, Pasta iela 25, Tukums";

const pad = (n: number) => String(n).padStart(2, "0");
const day = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

export type CalendarEvent = { text: string; dates: string; details: string; location: string; guests: string[] };

/** Sagatavo notikuma datus; null, ja pieteikumam nav datuma. `title` — programmas vai pakalpojuma nosaukums. */
export function calendarEvent(b: Booking, title: string): CalendarEvent | null {
  if (!b.event_date) return null;
  const isBusiness = b.inquiry_type === "business";
  const inVenue = !isBusiness && b.location !== "Izbraukums";
  const date = new Date(`${b.event_date}T00:00:00Z`);

  // Ar laiku (telpu nomas posms) — notikums uz 3 stundām; bez laika — visas dienas notikums
  const time = b.event_time?.match(/^(\d{1,2}):(\d{2})/);
  let dates: string;
  if (time) {
    const h = Number(time[1]);
    dates = `${day(date)}T${pad(h)}${time[2]}00/${day(date)}T${pad(h + SLOT_HOURS)}${time[2]}00`;
  } else {
    dates = `${day(date)}/${day(new Date(date.getTime() + 24 * 60 * 60 * 1000))}`;
  }

  const who = b.company_name || b.parent_name || "";
  const details = [
    b.parent_name && `Kontaktpersona: ${b.parent_name}`,
    b.phone && `Telefons: ${b.phone}`,
    b.email && `E-pasts: ${b.email}`,
    b.children_count && `Bērnu skaits: ${b.children_count}`,
    b.child_age && `Gaviļnieka vecums: ${b.child_age}`,
    b.participants && `Dalībnieki: ${b.participants}`,
    b.travel_cost != null && `Ceļa izdevumi: ${b.travel_cost} € (${b.travel_km} km turp un atpakaļ)`,
    b.message && `\n${b.message}`,
    b.admin_notes && `\nPiezīmes: ${b.admin_notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    text: [title, who].filter(Boolean).join(" — "),
    dates,
    details,
    location: inVenue ? VENUE_ADDRESS : [b.address, b.event_city].filter(Boolean).join(", "),
    guests: [...CALENDAR_ALWAYS, ...(inVenue ? CALENDAR_VENUE : [])],
  };
}

/** Saite, kas atver Google kalendāru ar aizpildītu notikumu un viesiem */
export function calendarUrl(e: CalendarEvent, extraGuests: string[] = []): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.text,
    dates: e.dates,
    ctz: "Europe/Riga",
    details: e.details,
    location: e.location,
    add: [...e.guests, ...extraGuests].join(","),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
