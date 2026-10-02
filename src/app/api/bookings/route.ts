import { after, NextResponse } from "next/server";
import { bookedSlots } from "@/lib/availability";
import { notifyNewBooking } from "@/lib/notify";
import { quoteTravel } from "@/lib/travel";
import { supabase } from "@/lib/supabase";
import { Validator } from "@/lib/validation";

/**
 * Jauns pieteikums (uzņēmuma pieprasījums vai privāta ballītes rezervācija).
 * Glabājas esošajā `bookings` tabulā, ko redz administrēšanas panelī.
 */

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
    email: v.email("email", isBusiness),
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

  if (!row.consent) v.errors.consent = "Nepieciešama piekrišana datu apstrādei";

  // Telpu noma: laiku, kas šajā datumā jau aizņemts, rezervēt nevar (forma to jau nerāda, šī ir pārbaude serverī)
  if (!isBusiness && row.location !== "Izbraukums" && row.event_date && row.event_time) {
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
  after(() => notifyNewBooking(record));

  return NextResponse.json({ success: true });
}
