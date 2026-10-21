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
  /** Kad klientam nosūtīts atsauksmes pieprasījums (sk. migrāciju 20261012090000) */
  review_requested_at?: string | null;
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
export const FIXED_VENUES: Record<string, { name: string; address: string; hours: number }> = {
  "ziemassvetki-dobele": { name: "“Pilsētas māja” Dobelē", address: "“Pilsētas māja”, Dobele", hours: 1 },
};
export const fixedVenue = (program: string | null | undefined) => FIXED_VENUES[program ?? ""];
/** Norises vietas adrese, ja pieteikums ir kādā no FIXED_VENUES vietām; citādi undefined */
export const fixedVenueAddress = (location: string | null | undefined) =>
  Object.values(FIXED_VENUES).find((v) => v.name === location)?.address;
/** Programmas ilgums stundās, ja pieteikums ir kādā no FIXED_VENUES vietām (laikam rāda "09:00–10:00") */
export const fixedVenueHours = (location: string | null | undefined) =>
  Object.values(FIXED_VENUES).find((v) => v.name === location)?.hours;
/** Vai pieteikums ir mūsu telpās (Pasta iela 25) — nevis izbraukumā un nevis kādā no FIXED_VENUES vietām */
export const atStudio = (location: string | null | undefined) => location !== "Izbraukums" && !fixedVenueAddress(location);

/**
 * Programmas bērnu grupām (bērnudārziem, skolām) — ar savu lapu un rezervācijas formu: jānorāda iestādes vai grupas
 * nosaukums un bērnu skaits, gaviļnieka vecumu neprasa; kopējā ballīšu rezervācijas formā tās neparādās.
 */
/** "minioni-atklaj-manu-pasauli" — izrāde bērnudārziem: lapā ir pieprasījuma forma (nevis rezervācija) */
export const GROUP_PROGRAMS = [...INSTITUTION_PROGRAMS, "ziemassvetki-dobele", "minioni-atklaj-manu-pasauli"];
export const isGroupProgram = (program: string | null | undefined) => GROUP_PROGRAMS.includes(program ?? "");

/**
 * Nedēļas dienas, kurās programmu var rezervēt (0 — svētdiena, 1 — pirmdiena … 6 — sestdiena).
 * Programmām, kuru šeit nav, der jebkura diena.
 */
export const ALLOWED_WEEKDAYS: Record<string, number[]> = {};

/**
 * Konkrēti pieejamie laiki programmai (datums YYYY-MM-DD → sākuma laiki). Ja programmai tie ir norādīti,
 * formā datumu un laiku neievada, bet izvēlas no šiem laikiem; jau rezervētie laiki nav izvēlami
 * (sk. booked_program_slots datubāzē), un serveris citus laikus nepieņem. Jaunu laiku pievieno šeit.
 */
export const PROGRAM_SLOTS: Record<string, { date: string; times: string[] }[]> = {
  "ziemassvetki-dobele": [
    { date: "2026-12-14", times: ["09:30", "11:30"] },
    { date: "2026-12-15", times: ["09:30", "11:30"] },
    { date: "2026-12-16", times: ["09:30", "11:30"] },
  ],
};
export const programSlots = (program: string | null | undefined) => PROGRAM_SLOTS[program ?? ""];
export const SLOT_TAKEN_TEXT = "Šis laiks jau ir aizņemts — lūdzu, izvēlieties citu laiku.";
/** Vai datums un laiks ir starp programmas pieejamajiem laikiem (ja programmai tādi ir norādīti) */
export function isProgramSlot(program: string | null | undefined, date: string | null | undefined, time: string | null | undefined): boolean {
  const slots = programSlots(program);
  if (!slots) return true;
  return slots.some((s) => s.date === (date ?? "").slice(0, 10) && s.times.includes((time ?? "").slice(0, 5)));
}
export const WEEKDAY_TEXT = "Programma notiek no pirmdienas līdz ceturtdienai — lūdzu, izvēlieties citu datumu.";
export const WEEKDAY_HINT = "Rezervēt var pirmdienas–ceturtdienas.";
export const allowedWeekdays = (program: string | null | undefined) => ALLOWED_WEEKDAYS[program ?? ""];
export function isWeekdayBlocked(program: string | null | undefined, date: string | null | undefined): boolean {
  const days = allowedWeekdays(program);
  if (!days || !date) return false;
  return !days.includes(new Date(`${date.slice(0, 10)}T12:00:00Z`).getUTCDay());
}

/**
 * Vienīgie datumi, kuros programmu var rezervēt (YYYY-MM-DD). Ja programmai tie ir norādīti, formā datumu izvēlas
 * no šī saraksta (laiks — brīvi), un serveris citus datumus nepieņem. Pilnībā aizņemtie (FULLY_BOOKED_DATES) netiek piedāvāti.
 */
export const ALLOWED_DATES: Record<string, string[]> = {
  "ziemassvetki-bernudarza": ["2026-12-14", "2026-12-15", "2026-12-16", "2026-12-21", "2026-12-22"],
};
export const allowedDates = (program: string | null | undefined) => ALLOWED_DATES[program ?? ""];
export const isDateAllowed = (program: string | null | undefined, date: string | null | undefined) => {
  const dates = allowedDates(program);
  return !dates || !date || dates.includes(date.slice(0, 10));
};
/**
 * Īpaši nosacījumi konkrētām dienām: dienā pieejami tikai norādītie laika logi.
 * Logs: `from` — agrākais sākums, `until` — programmai jābeidzas līdz (ilgums — `minutes`),
 * `max` — cik komandu logā ir pieejams, `variants` — šajā logā pieejamie programmas varianti,
 * `cost` — cik komandas aizņem variants (ja nav norādīts — 1), `label` — nosaukums tekstā.
 */
export type DayWindow = { label: string; from?: string; until?: string; max?: number; variants?: string[]; cost?: Record<string, number> };
export const DAY_RULES: Record<string, { minutes: number; days: Record<string, DayWindow[]> }> = {
  "ziemassvetki-bernudarza": {
    // Laiks, ko komanda pavada programmā — 1 stunda
    minutes: 60,
    days: {
      "2026-12-14": [
        // Rītā — viena rezervācija: vai nu "Rūķis un Ziemassvētku vecītis", vai "Divi rūķi"
        { label: "rītā", until: "13:00", max: 1, variants: ["Rūķis un Ziemassvētku vecītis", "Divi rūķi"] },
        { label: "vakarā", from: "15:30", max: 1, variants: ["Divi rūķi"] },
      ],
      "2026-12-15": [
        // Pēc 14.00 — vai nu viena rezervācija "Divi rūķi" (aizņem abas komandas), vai divas "Rūķis un Ziemassvētku vecītis"
        { label: "vakarā", from: "14:00", max: 2, variants: ["Rūķis un Ziemassvētku vecītis", "Divi rūķi"], cost: { "Divi rūķi": 2 } },
      ],
      "2026-12-16": [
        // Rītā — vai nu viena rezervācija "Divi rūķi" (aizņem abas komandas), vai divas "Rūķis un Ziemassvētku vecītis"
        { label: "rītā", until: "13:00", max: 2, variants: ["Rūķis un Ziemassvētku vecītis", "Divi rūķi"], cost: { "Divi rūķi": 2 } },
        // Vakarā pēc 15.00 — tikai "Rūķis un Ziemassvētku vecītis"
        { label: "vakarā", from: "15:00", max: 1, variants: ["Rūķis un Ziemassvētku vecītis"] },
      ],
    },
  },
};
export const dayWindows = (program: string | null | undefined, date: string | null | undefined): DayWindow[] | undefined =>
  DAY_RULES[program ?? ""]?.days[(date ?? "").slice(0, 10)];
export const hasDayRules = (program: string | null | undefined) => Boolean(DAY_RULES[program ?? ""]);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hm = (t: string) => `${Number(t.slice(0, 2))}.${t.slice(3, 5)}`;
/** Laika logi, kuros iekļaujas programma ar šo sākuma laiku */
export function windowsAt(program: string | null | undefined, date: string | null | undefined, time: string | null | undefined): DayWindow[] {
  const windows = dayWindows(program, date);
  if (!windows || !time || !/^\d{1,2}:\d{2}/.test(time)) return [];
  const start = toMin(time.padStart(5, "0"));
  const end = start + (DAY_RULES[program ?? ""]?.minutes ?? 0);
  return windows.filter((w) => (!w.from || start >= toMin(w.from)) && (!w.until || end <= toMin(w.until)));
}
/** Variantu nosaukumus salīdzina bez lielo/mazo burtu un atstarpju atšķirībām ("Divi Rūķi" = "Divi rūķi") */
export const sameVariant = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("lv") === (b ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("lv");
const costOf = (w: DayWindow, variant: string) =>
  Object.entries(w.cost ?? {}).find(([k]) => sameVariant(k, variant))?.[1] ?? 1;
/** Cik komandu logā jau aizņemts. `booked` — "YYYY-MM-DD HH:MM|variants" (sk. booked_program_variants) */
function usedIn(program: string | null | undefined, date: string, w: DayWindow, booked: string[]): number {
  const day = date.slice(0, 10);
  return booked.reduce((sum, b) => {
    const [when, raw = ""] = b.split("|");
    if (!when.startsWith(day) || !windowsAt(program, day, when.slice(11, 16)).includes(w)) return sum;
    const variant = raw.trim();
    // Ja variants nav zināms (datubāzē nav booked_program_variants), pieņem, ka logs ir pilns
    if (!variant && w.cost) return sum + (w.max ?? 1);
    return sum + costOf(w, variant);
  }, 0);
}
/** Varianti, ko logā vēl var rezervēt */
export function windowFreeVariants(program: string | null | undefined, date: string, w: DayWindow, booked: string[]): string[] {
  const left = (w.max ?? Infinity) - usedIn(program, date, w, booked);
  return (w.variants ?? [""]).filter((v) => costOf(w, v) <= left);
}
export function isWindowFull(program: string | null | undefined, date: string, w: DayWindow, booked: string[]): boolean {
  return windowFreeVariants(program, date, w, booked).length === 0;
}
/** Brīvie logi šajā laikā (ja laiks nav norādīts — visi brīvie logi dienā) */
export function freeWindows(program: string | null | undefined, date: string, time: string | null | undefined, booked: string[]): DayWindow[] {
  const ws = time ? windowsAt(program, date, time) : (dayWindows(program, date) ?? []);
  return ws.filter((w) => !isWindowFull(program, date, w, booked));
}
/** Varianti, ko šajā laikā vēl var rezervēt (tukšs saraksts — logiem nav variantu ierobežojuma vai nav brīvu) */
export function freeVariantsAt(program: string | null | undefined, date: string, time: string | null | undefined, booked: string[]): string[] {
  return [...new Set(freeWindows(program, date, time, booked).flatMap((w) => windowFreeVariants(program, date, w, booked)).filter(Boolean))];
}
/** Vai dienā visi logi ir aizņemti */
export function isDayFull(program: string | null | undefined, date: string, booked: string[]): boolean {
  const windows = dayWindows(program, date);
  return Boolean(windows?.length) && freeWindows(program, date, null, booked).length === 0;
}
const hhmm = (min: number) => `${Math.floor(min / 60)}.${String(min % 60).padStart(2, "0")}`;
/**
 * Logi sagrupēti pēc laika — pa rindai, piem.
 * "Rītā (sākums līdz plkst. 12.00): Rūķis un Ziemassvētku vecītis vai Divi rūķi"
 */
function windowLines(program: string | null | undefined, windows: DayWindow[], variantsOf: (w: DayWindow) => string[] = (w) => w.variants ?? []): string[] {
  const minutes = DAY_RULES[program ?? ""]?.minutes ?? 0;
  const groups = new Map<string, DayWindow[]>();
  for (const w of windows) {
    const when = [w.from && `no plkst. ${hm(w.from)}`, w.until && `līdz plkst. ${hhmm(toMin(w.until) - minutes)}`].filter(Boolean).join(" ");
    const key = `${w.label.charAt(0).toUpperCase()}${w.label.slice(1)} (sākums ${when})`;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  return [...groups].map(([k, ws]) => {
    const variants = [...new Set(ws.flatMap(variantsOf))];
    return `${k}${variants.length ? `: ${variants.join(" vai ")}` : ""}`;
  });
}
/** Brīvie laiki dienā pa rindai (rāda zem datuma) */
export function dayRuleLines(program: string | null | undefined, date: string | null | undefined, booked: string[] = []): string[] {
  const free = freeWindows(program, date ?? "", null, booked);
  return windowLines(program, free, (w) => windowFreeVariants(program, date ?? "", w, booked));
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- vienots paraksts ar pārējām teksta funkcijām
export const outsideWindowsText = (program: string | null | undefined, date: string | null | undefined) =>
  "Šajā laikā programma nav pieejama — lūdzu, izvēlieties kādu no pieejamajiem laikiem (sk. augstāk).";
export const variantNotFreeText = (variants: string[]) =>
  `Šajā laikā pieejams tikai ${variants.map((v) => `“${v}”`).join(" vai ")}.`;
export const WINDOW_TAKEN_TEXT = "Šis laiks jau ir aizņemts — lūdzu, izvēlieties citu laiku vai datumu.";
export const DAY_FULL_TEXT = "Šis datums jau ir aizņemts — lūdzu, izvēlieties citu datumu.";

export const DATE_NOT_ALLOWED_TEXT = "Lūdzu, izvēlieties kādu no pieejamajiem datumiem.";

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
