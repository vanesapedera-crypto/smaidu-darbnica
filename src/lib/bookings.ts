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
export const NO_HEADCOUNT_PROGRAMS = ["parsteiguma-tels"];
/** Vai rezervācijai ir svarīgs bērnu skaits (ir izklaides programma, un tā nav izņēmumu sarakstā) */
export const needsHeadcount = (program: string | null | undefined) => Boolean(program) && !NO_HEADCOUNT_PROGRAMS.includes(program as string);

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
