import type { Booking } from "./bookings";
import { whenLabel } from "./dates";
import { costLinesText, type BookingCosts } from "./pricing";

/**
 * Google kalendāra notikums no pieteikuma.
 *
 * Automātiski: kad panelī pieteikumu apstiprina, visiem viesiem aiziet e-pasts ar kalendāra ielūgumu
 * (.ics pielikums) — Google kalendārs šādu ielūgumu pats ieliek kalendārā (sk. calendarIcs un lib/notify.ts).
 * Ar roku: poga "Pievienot kalendāram" atver Google kalendāru ar jau aizpildītu notikumu (rezerves variants).
 *
 * Kam notikumu sūtīt, nosaka šie saraksti — mainot cilvēkus, pietiek izlabot e-pastus šeit.
 */

/** Saņem visus kalendāra notikumus (Vanesa un Kristīne) */
export const CALENDAR_ALWAYS = ["smaidu.darbniica@gmail.com", "smaidu.darbnica@gmail.com"];
/** Saņem notikumus, kas notiek mūsu telpās (telpu noma) — telpu uzkopšanai */
export const CALENDAR_VENUE = ["keitaplavina3@gmail.com"];
/** Izklaides programmu vadītājas — panelī pie pieteikuma izvēlas, kura vadīs */
export const CALENDAR_HOSTS = [
  { name: "Madara", email: "racemadara@gmail.com" },
  { name: "Agija", email: "balode.agija@gmail.com" },
];

/** Telpu nomas laika posma garums stundās (10:00–13:00 utt.) */
const SLOT_HOURS = 3;
/** Izbraukuma ballītes garums kalendārā (stundās) — programmas parasti ilgst ap stundu */
const TRAVEL_HOURS = 1;
const VENUE_ADDRESS = "Smaidu Darbnīca, Pasta iela 25, Tukums";

const pad = (n: number) => String(n).padStart(2, "0");
const day = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

export type CalendarEvent = { text: string; dates: string; details: string; location: string; guests: string[] };

/**
 * Sagatavo notikuma datus; null, ja pieteikumam nav datuma. `title` — programmas vai pakalpojuma nosaukums.
 * Aprakstā ir viss, ko apstiprinājumā saņem klients (laiks, izmaksas, ierašanās laiks), plus klienta kontakti —
 * lai komandai kalendārā ir tā pati informācija. `costs` — izmaksu kopsavilkums (sk. bookingCosts).
 */
export function calendarEvent(b: Booking, title: string, costs?: BookingCosts | null): CalendarEvent | null {
  if (!b.event_date) return null;
  const isBusiness = b.inquiry_type === "business";
  const inVenue = !isBusiness && b.location !== "Izbraukums";
  const date = new Date(`${b.event_date}T00:00:00Z`);

  // Ar laiku: telpu nomas posms — 3 stundas, izbraukuma ballīte — 1 stunda; bez laika — visas dienas notikums
  const time = b.event_time?.match(/^(\d{1,2}):(\d{2})/);
  let dates: string;
  if (time) {
    const h = Number(time[1]);
    const hours = inVenue ? SLOT_HOURS : TRAVEL_HOURS;
    dates = `${day(date)}T${pad(h)}${time[2]}00/${day(date)}T${pad(h + hours)}${time[2]}00`;
  } else {
    dates = `${day(date)}/${day(new Date(date.getTime() + 24 * 60 * 60 * 1000))}`;
  }

  const who = b.company_name || b.parent_name || "";
  // Klientu gaidām 15 minūtes pirms sākuma (tikai mūsu telpās) — tāpat kā rakstīts klienta e-pastā
  const arrival = inVenue && time ? (() => {
    const minutes = Number(time[1]) * 60 + Number(time[2]) - 15;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  })() : "";
  const details = [
    `Datums: ${whenLabel(b.event_date, b.event_time, isBusiness ? null : b.location)}`,
    arrival && `Klients ierodas no plkst. ${arrival}`,
    b.parent_name && `\nKontaktpersona: ${b.parent_name}`,
    b.phone && `Telefons: ${b.phone}`,
    b.email && `E-pasts: ${b.email}`,
    b.children_count && `Bērnu skaits: ${b.children_count}`,
    b.child_age && `Gaviļnieka vecums: ${b.child_age}`,
    b.participants && `Dalībnieki: ${b.participants}`,
    costs
      ? `\nIZMAKSAS\n${costLinesText(costs).map((l) => (l.startsWith("Kopā") ? l : `• ${l}`)).join("\n")}`
      : b.travel_cost != null && `Ceļa izdevumi: ${b.travel_cost} € (${b.travel_km} km turp un atpakaļ)`,
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

/* ---------------- Kalendāra ielūgums (.ics) automātiskai pievienošanai ---------------- */

const TIME_ZONE = "Europe/Riga";

/** Rīgas laiks → UTC (ņem vērā vasaras / ziemas laiku) */
function rigaToUtc(ymd: string, hhmmss: string): Date {
  const guess = Date.UTC(
    Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)),
    Number(hhmmss.slice(0, 2)), Number(hhmmss.slice(2, 4)),
  );
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (wall - guess));
}

const utcStamp = (d: Date) => `${day(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
// Teksta vērtībās jāaizsargā \ ; , un rindu pārtraukumi (RFC 5545)
const icsText = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Rindas, kas garākas par 75 baitiem, jāsadala (turpinājums sākas ar atstarpi) */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  const encoder = new TextEncoder();
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/**
 * Kalendāra ielūgums (METHOD:REQUEST). `uid` — nemainīgs pieteikumam, lai atkārtots ielūgums atjauno to pašu notikumu.
 * `organizer` — sūtītāja e-pasts (tas pats, no kura aiziet e-pasts).
 */
export function calendarIcs(e: CalendarEvent, opts: { uid: string; organizer: string; attendees: string[] }): string {
  const [from, to] = e.dates.split("/");
  const timed = from.includes("T");
  const when = timed
    ? [
        `DTSTART:${utcStamp(rigaToUtc(from.slice(0, 8), from.slice(9)))}`,
        `DTEND:${utcStamp(rigaToUtc(to.slice(0, 8), to.slice(9)))}`,
      ]
    : [`DTSTART;VALUE=DATE:${from}`, `DTEND;VALUE=DATE:${to}`];
  const now = new Date();
  return [
    "BEGIN:VCALENDAR",
    "PRODID:-//Smaidu Darbnica//Rezervacijas//LV",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    // Secības numurs aug ar laiku — atkārtoti nosūtīts ielūgums aizstāj iepriekšējo
    `SEQUENCE:${Math.floor(now.getTime() / 1000)}`,
    `DTSTAMP:${utcStamp(now)}`,
    ...when,
    `SUMMARY:${icsText(e.text)}`,
    `DESCRIPTION:${icsText(e.details)}`,
    `LOCATION:${icsText(e.location)}`,
    `ORGANIZER;CN=Smaidu Darbnīca:mailto:${opts.organizer}`,
    ...opts.attendees.map((a) => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE:mailto:${a}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}
