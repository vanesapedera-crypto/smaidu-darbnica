/** Pieteikumu statusi — tie paši, kas tika izmantoti iepriekšējā paneļa versijā. */
export const BOOKING_STATUSES = ["Jauns", "Apstiprināta", "Atcelta"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  created_at: string | null;
  inquiry_type: "business" | "private" | null;
  status: BookingStatus | null;
  parent_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  contact_role: string | null;
  program: string | null;
  service_slug: string | null;
  event_type: string | null;
  event_city: string | null;
  participants: number | null;
  budget_range: string | null;
  children_count: number | null;
  child_age: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  address: string | null;
  accept_travel_fee: boolean | null;
  /** Attālums turp un atpakaļ (km) un ceļa izdevumi (€) izbraukuma ballītēm */
  travel_km: number | null;
  travel_cost: number | null;
  message: string | null;
  admin_notes: string | null;
  /** Klienta apstiprinājums (sk. migrāciju 20261005090000): žetons saitei, kad nosūtīts e-pasts, kad klients apstiprināja */
  confirm_token?: string | null;
  confirmation_sent_at?: string | null;
  client_confirmed_at?: string | null;
  client_reminded_at?: string | null;
  /** Klients pats atcēla rezervāciju no savas saites (statuss tad ir "Atcelta") */
  client_cancelled_at?: string | null;
};

/**
 * Programmas, kurām bērnu skaitam nav nozīmes (cena no tā nav atkarīga) — formā bērnu skaits un vecums
 * nav obligāti, un apstiprinājumā nav lūguma paziņot par bērnu skaita izmaiņām. Tāpat ir telpu nomai bez programmas.
 */
export const NO_HEADCOUNT_PROGRAMS = ["parsteiguma-tels", "ziemassvetki-bernudarza"];
/** Vai rezervācijai ir svarīgs bērnu skaits (ir izklaides programma, un tā nav izņēmumu sarakstā) */
export const needsHeadcount = (program: string | null | undefined) => Boolean(program) && !NO_HEADCOUNT_PROGRAMS.includes(program as string);

/**
 * Programmas iestādēm (bērnudārziem) — notiek tikai izbraukumā, un tām ir sava lapa ar rezervācijas formu:
 * cena ir bez PVN ("+ PVN"), izbraukuma piemaksu nepiemēro (ceļa izdevumi par km — kā izbraukuma ballītēm),
 * un kopējā ballīšu rezervācijas formā tās neparādās.
 */
export const INSTITUTION_PROGRAMS = ["ziemassvetki-bernudarza"];
export const isInstitutionProgram = (program: string | null | undefined) => INSTITUTION_PROGRAMS.includes(program ?? "");

/**
 * Programmas, kas notiek noteiktā vietā (ne mūsu telpās, ne klienta adresē) — piem. "Ziemassvētki “Pilsētas mājā” Dobelē".
 * `name` — norises vieta (glabājas pieteikuma laukā `location`), `address` — kalendāram un apstiprinājumam.
 * Šīm programmām nav ne telpu nomas, ne ceļa izdevumu, un laiks ir brīvi izvēlams.
 */
export const FIXED_VENUES: Record<string, { name: string; address: string }> = {
  "ziemassvetki-dobele": { name: "“Pilsētas māja” Dobelē", address: "“Pilsētas māja”, Dobele" },
};
export const fixedVenue = (program: string | null | undefined) => FIXED_VENUES[program ?? ""];
/** Norises vietas adrese, ja pieteikums ir kādā no FIXED_VENUES vietām; citādi undefined */
export const fixedVenueAddress = (location: string | null | undefined) =>
  Object.values(FIXED_VENUES).find((v) => v.name === location)?.address;
/** Vai pieteikums ir mūsu telpās (Pasta iela 25) — nevis izbraukumā un nevis kādā no FIXED_VENUES vietām */
export const atStudio = (location: string | null | undefined) => location !== "Izbraukums" && !fixedVenueAddress(location);

/**
 * Programmas bērnu grupām (bērnudārziem, skolām) — ar savu lapu un rezervācijas formu: jānorāda iestādes vai grupas
 * nosaukums un bērnu skaits, gaviļnieka vecumu neprasa; kopējā ballīšu rezervācijas formā tās neparādās.
 */
export const GROUP_PROGRAMS = [...INSTITUTION_PROGRAMS, "ziemassvetki-dobele"];
export const isGroupProgram = (program: string | null | undefined) => GROUP_PROGRAMS.includes(program ?? "");

/**
 * Nedēļas dienas, kurās programmu var rezervēt (0 — svētdiena, 1 — pirmdiena … 6 — sestdiena).
 * Programmām, kuru šeit nav, der jebkura diena.
 */
export const ALLOWED_WEEKDAYS: Record<string, number[]> = {
  "ziemassvetki-dobele": [1, 2, 3, 4],
};
export const WEEKDAY_TEXT = "Programma notiek no pirmdienas līdz ceturtdienai — lūdzu, izvēlieties citu datumu.";
export const WEEKDAY_HINT = "Rezervēt var pirmdienas–ceturtdienas.";
export const allowedWeekdays = (program: string | null | undefined) => ALLOWED_WEEKDAYS[program ?? ""];
export function isWeekdayBlocked(program: string | null | undefined, date: string | null | undefined): boolean {
  const days = allowedWeekdays(program);
  if (!days || !date) return false;
  return !days.includes(new Date(`${date.slice(0, 10)}T12:00:00Z`).getUTCDay());
}

/**
 * Pilnībā aizņemtie datumi pa programmām (YYYY-MM-DD): šajos datumos programmu rezervēt nevar —
 * forma to neļauj, un serveris pieteikumu noraida. Pārējās programmas un telpu nomu tas neietekmē.
 * Jaunu datumu pievieno šeit.
 */
export const FULLY_BOOKED_DATES: Record<string, string[]> = {
  "ziemassvetki-bernudarza": ["2026-12-11", "2026-12-18"],
};
export const fullyBookedDates = (program: string | null | undefined) => FULLY_BOOKED_DATES[program ?? ""] ?? [];
export const isFullyBooked = (program: string | null | undefined, date: string | null | undefined) =>
  Boolean(date) && fullyBookedDates(program).includes((date as string).slice(0, 10));
export const FULLY_BOOKED_TEXT = "Šis datums ir pilnībā aizņemts — lūdzu, izvēlieties citu datumu.";

/** Pēc cik dienām bez klienta apstiprinājuma rezervāciju izceļ un atgādina (WhatsApp / SMS) */
export const CONFIRM_DAYS = 3;

/** Saite, ar kuru klients apstiprina rezervāciju; null, ja žetona vēl nav (migrācija nav palaista) */
export function confirmPath(b: Pick<Booking, "id" | "confirm_token">): string | null {
  return b.confirm_token ? `/rezervacija/${b.id}?k=${b.confirm_token}` : null;
}

/** Telefona numurs starptautiskā formātā bez "+" (WhatsApp saitei): 8 cipari → Latvijas numurs */
export function phoneDigits(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length === 8 ? `371${digits}` : digits;
}

/** Atgādinājuma teksts klientam (WhatsApp / SMS) ar apstiprināšanas saiti */
export function reminderText(when: string, url: string): string {
  return `Sveiki! Rakstām no Smaidu Darbnīcas. Jūsu rezervācija ${when} vēl gaida apstiprinājumu. Lūdzu, apstipriniet to šeit: ${url}`;
}
