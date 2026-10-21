import { after, NextResponse } from "next/server";
import { bookedProgramSlots, bookedProgramVariants, bookedSlots } from "@/lib/availability";
import {
  FULLY_BOOKED_TEXT,
  DATE_NOT_ALLOWED_TEXT,
  isDateAllowed,
  dayWindows,
  windowsAt,
  freeWindows,
  freeVariantsAt,
  sameVariant,
  outsideWindowsText,
  variantNotFreeText,
  WINDOW_TAKEN_TEXT,
  SLOT_TAKEN_TEXT,
  WEEKDAY_TEXT,
  atStudio,
  fixedVenue,
  isFullyBooked,
  isGroupProgram,
  isProgramSlot,
  isWeekdayBlocked,
  needsHeadcount,
  programSlots,
} from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { notifyNewBooking } from "@/lib/notify";
import { timeLabel } from "@/lib/dates";
import { PRICE_UNKNOWN_TEXT, TRAVEL_UNKNOWN_TEXT, bookingCosts, bookingPrices } from "@/lib/pricing";
import { quoteTravel } from "@/lib/travel";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Validator } from "@/lib/validation";

/**
 * Jauns pieteikums (uzņēmuma pieprasījums vai privāta ballītes rezervācija).
 * Glabājas esošajā `bookings` tabulā, ko redz administrēšanas panelī.
 */

// Pieprasījuma formas papildu izvēles, kas nav pakalpojumu sarakstā (sk. kontakti/page.tsx)
const EXTRA_TITLES: Record<string, string> = {
  "ziemassvetku-piedavajums": "Ziemassvētku piedāvājums",
  "egles-iedegsana": "Egles iedegšana",
};

// Vienkāršs ātruma ierobežojums vienai servera instancei: 5 pieteikumi / 10 min no vienas IP
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

// Kolonnas, kas bija tabulā pirms 2026. gada migrācijas
const LEGACY_COLUMNS = [
  "program", "parent_name", "phone", "email", "children_count", "child_age",
  "event_date", "event_time", "address", "accept_travel_fee", "location", "message",
];

export async function POST(request: Request) {
  // Datubāze nav pieslēgta (nav vides mainīgo) — skaidra atbilde, nevis servera kļūda
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { success: false, error: "Pieteikumu saņemšana šobrīd nav pieejama. Lūdzu, zvaniet mums." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Nepareizs pieprasījums" }, { status: 400 });
  }

  // Surogātpasta aizsardzība: slēptais lauks jāatstāj tukšs, forma jāaizpilda ilgāk par 3 s
  const startedAt = Number(body.startedAt);
  if (body.website || (startedAt && Date.now() - startedAt < 3000)) {
    return NextResponse.json({ success: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Pārāk daudz pieteikumu. Lūdzu, mēģiniet vēlāk vai zvaniet mums." },
      { status: 429 },
    );
  }

  const v = new Validator(body);
  const inquiryType = v.oneOf("inquiryType", ["business", "private"] as const, "private");
  const isBusiness = inquiryType === "business";

  const row = {
    inquiry_type: inquiryType,
    parent_name: v.text("parentName", { required: true, max: 120, label: "Vārds" }),
    phone: v.phone("phone"),
    // E-pasts ir obligāts: uz to aiziet rezervācijas apstiprinājums un notiek turpmākā saziņa
    email: v.email("email", true),
    company_name: v.text("companyName", { required: isBusiness, max: 160, label: "Uzņēmums" }) || null,
    contact_role: v.text("contactRole", { max: 120 }) || null,
    program: v.text("program", { max: 120 }) || null,
    service_slug: v.text("serviceSlug", { max: 120 }) || null,
    event_type: v.text("eventType", { max: 120 }) || null,
    event_city: v.text("eventCity", { max: 120 }) || null,
    participants: v.int("participants", { min: 1, max: 100000 }),
    budget_range: v.text("budgetRange", { max: 60 }) || null,
    children_count: v.int("childrenCount", { min: 1, max: 1000 }),
    child_age: v.text("childAge", { max: 40 }) || null,
    event_date: v.date("eventDate"),
    event_time: v.text("eventTime", { max: 10 }) || null,
    location: v.text("location", { max: 60 }) || null,
    address: v.text("address", { max: 200 }) || null,
    accept_travel_fee: v.bool("acceptTravelFee"),
    message: v.text("message", { max: 3000 }) || null,
    consent: v.bool("consent"),
    status: "Jauns",
  };

  // Programma noteiktā vietā (sk. FIXED_VENUES) — norises vietu nosaka programma, nevis forma
  const venue = !isBusiness ? fixedVenue(row.program) : undefined;
  if (venue) Object.assign(row, { location: venue.name, address: null });

  if (!row.consent) v.errors.consent = "Nepieciešama piekrišana datu apstrādei";

  // Rezervācijas formā visi lauki ir obligāti (forma to jau pārbauda; šī ir pārbaude serverī).
  // Bērnu skaits un vecums — tikai kopā ar izklaides programmu; izbraukumam vajag adresi un programmu, telpām — laiku.
  if (!isBusiness) {
    const need = (field: string, ok: unknown, text: string) => {
      if (!ok && !v.errors[field]) v.errors[field] = text;
    };
    const travelling = row.location === "Izbraukums";
    need("eventDate", row.event_date, "Izvēlieties datumu.");
    need("eventTime", row.event_time, travelling ? "Norādiet ballītes sākuma laiku." : "Izvēlieties laiku.");
    need("address", !travelling || row.address, "Norādiet ballītes adresi.");
    need("program", !travelling || row.program, "Izbraukuma ballītei izvēlieties izklaides programmu.");
    const group = isGroupProgram(row.program);
    need("childrenCount", !(needsHeadcount(row.program) || group) || row.children_count, "Norādiet bērnu skaitu.");
    need("childAge", !needsHeadcount(row.program) || group || row.child_age, "Norādiet gaviļnieka vecumu.");
    need("companyName", !group || row.company_name, "Norādiet nosaukumu.");
  }

  // Programmai pilnībā aizņemts datums (sk. FULLY_BOOKED_DATES) — forma to jau neļauj, šī ir pārbaude serverī
  if (!isBusiness && isFullyBooked(row.program, row.event_date)) v.errors.eventDate = FULLY_BOOKED_TEXT;
  // Programmai ir tikai noteikti datumi (sk. ALLOWED_DATES)
  if (!isBusiness && !isDateAllowed(row.program, row.event_date)) v.errors.eventDate = DATE_NOT_ALLOWED_TEXT;
  // Īpaši nosacījumi dienai (sk. DAY_RULES): dienā pieejami tikai noteikti laika logi, katrā — savs variants
  if (!isBusiness && row.program && row.event_date && dayWindows(row.program, row.event_date)) {
    const at = windowsAt(row.program, row.event_date, row.event_time);
    const booked = await bookedProgramVariants(row.program);
    const free = freeWindows(row.program, row.event_date, row.event_time, booked);
    const freeVariants = freeVariantsAt(row.program, row.event_date, row.event_time, booked);
    const chosen = String(row.message ?? "").match(/Izvēle: ([^\n]+)/)?.[1]?.trim();
    if (!at.length) v.errors.eventTime = outsideWindowsText(row.program, row.event_date);
    else if (!free.length) v.errors.eventTime = WINDOW_TAKEN_TEXT;
    else if (freeVariants.length && !freeVariants.some((f) => sameVariant(f, chosen))) v.errors.eventTime = variantNotFreeText(freeVariants);
  }
  // Programmai neder šī nedēļas diena (sk. ALLOWED_WEEKDAYS)
  if (!isBusiness && isWeekdayBlocked(row.program, row.event_date)) v.errors.eventDate = WEEKDAY_TEXT;
  // Programmai ar konkrētiem laikiem (sk. PROGRAM_SLOTS): laikam jābūt starp pieejamajiem un vēl brīvam
  if (!isBusiness && row.program && programSlots(row.program) && row.event_date && row.event_time) {
    if (!isProgramSlot(row.program, row.event_date, row.event_time)) v.errors.eventDate = "Lūdzu, izvēlieties kādu no pieejamajiem laikiem.";
    else if ((await bookedProgramSlots(row.program)).includes(`${row.event_date.slice(0, 10)} ${row.event_time.slice(0, 5)}`)) {
      v.errors.eventTime = SLOT_TAKEN_TEXT;
    }
  }

  // Telpu noma: laiku, kas šajā datumā jau aizņemts, rezervēt nevar (forma to jau nerāda, šī ir pārbaude serverī)
  if (!isBusiness && atStudio(row.location) && row.event_date && row.event_time) {
    const taken = await bookedSlots(row.event_date);
    if (taken.includes(row.event_time.slice(0, 5))) {
      v.errors.eventTime = "Šis laiks tikko tika aizņemts. Lūdzu, izvēlieties citu laiku vai datumu.";
    }
  }
  if (!v.ok) {
    return NextResponse.json({ success: false, errors: v.errors }, { status: 422 });
  }

  // Izbraukuma ballītēm ceļa izdevumus pārrēķinām serverī (formas vērtībai neuzticamies).
  // Ja kartes pakalpojums neatbild 6 s laikā, pieteikums tiek saglabāts bez aprēķina.
  let travel_km: number | null = null;
  let travel_cost: number | null = null;
  if (!isBusiness && row.location === "Izbraukums" && row.address) {
    const quote = await Promise.race([
      quoteTravel(row.address).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    if (quote) ({ roundTripKm: travel_km, cost: travel_cost } = quote);
  }
  const record = { ...row, travel_km, travel_cost };

  // Rezervāciju ar cenu "pēc vienošanās" nepieņem — programmas cenai un ceļa izdevumiem jābūt zināmiem
  if (!isBusiness && (row.program || row.location === "Izbraukums")) {
    const [settings, programs] = await Promise.all([getSettings(), getServices("private")]);
    const program = programs.find((p) => p.slug === row.program);
    const costs = bookingCosts(record, program, bookingPrices(settings));
    const unknown = costs?.lines.filter((l) => l.amount === null) ?? [];
    if (unknown.length) {
      const errors: Record<string, string> = {};
      if (unknown.some((l) => l.kind === "travel")) errors.address = TRAVEL_UNKNOWN_TEXT;
      if (unknown.some((l) => l.kind !== "travel")) errors[row.children_count ? "childrenCount" : "program"] = PRICE_UNKNOWN_TEXT;
      return NextResponse.json({ success: false, errors }, { status: 422 });
    }
  }

  let { error } = await supabase.from("bookings").insert(record);

  // Ja datubāzes migrācija vēl nav palaista, saglabājam pieteikumu vecajās kolonnās,
  // bet jaunos laukus pievienojam ziņojuma tekstam — pieteikums nepazūd.
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    const extra = [
      row.company_name && `Uzņēmums: ${row.company_name}`,
      row.contact_role && `Amats: ${row.contact_role}`,
      row.event_type && `Pasākuma veids: ${row.event_type}`,
      row.event_city && `Vieta: ${row.event_city}`,
      row.participants && `Dalībnieki: ${row.participants}`,
      row.budget_range && `Budžets: ${row.budget_range}`,
      travel_cost !== null && `Ceļa izdevumi: ${travel_cost} € (${travel_km} km turp un atpakaļ)`,
    ].filter(Boolean);
    const legacy = Object.fromEntries(
      Object.entries({ ...row, program: row.program ?? row.service_slug, message: [row.message, ...extra].filter(Boolean).join("\n") })
        .filter(([k]) => LEGACY_COLUMNS.includes(k)),
    );
    ({ error } = await supabase.from("bookings").insert(legacy));
  }

  if (error) {
    console.error("[bookings] insert failed", error);
    return NextResponse.json(
      { success: false, error: "Neizdevās nosūtīt pieteikumu. Lūdzu, zvaniet mums." },
      { status: 500 },
    );
  }

  // E-pasta paziņojums tiek sūtīts pēc atbildes nosūtīšanas — lietotājam nav jāgaida
  // E-pastā ir pilns pieteikums: programmas nosaukums, laika posms un izmaksas (tās pašas, ko klients redz formā)
  after(async () => {
    const [settings, services, others] = await Promise.all([getSettings(), getServices(isBusiness ? "business" : "private"), getServices(isBusiness ? "private" : "business")]);
    const slug = row.service_slug || row.program || "";
    // Pieprasījums var būt arī par izklaides programmu ar pieprasījuma formu (piem. izrāde bērnudārziem) — meklē abos sarakstos
    const service = services.find((s) => s.slug === slug) ?? others.find((s) => s.slug === slug);
    await notifyNewBooking(record, {
      title: service?.title ?? EXTRA_TITLES[slug] ?? slug,
      time: timeLabel(row.event_time, row.location),
      costs: isBusiness ? null : bookingCosts(record, service, bookingPrices(settings)),
    });
  });

  return NextResponse.json({ success: true });
}
