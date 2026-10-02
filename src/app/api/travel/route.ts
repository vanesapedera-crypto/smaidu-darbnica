import { NextResponse } from "next/server";
import { quoteTravel, TRAVEL_RATE } from "@/lib/travel";

/**
 * GET /api/travel?address=…  →  ceļa izdevumu aprēķins rezervācijas formai.
 * Ierobežojums: 20 pieprasījumi / 10 min no vienas IP (kartes pakalpojumu lietošanas noteikumu dēļ).
 */

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > LIMIT) {
    return NextResponse.json({ ok: false, error: "Pārāk daudz pieprasījumu. Mēģiniet vēlāk." }, { status: 429 });
  }

  const address = new URL(request.url).searchParams.get("address")?.slice(0, 200) ?? "";
  try {
    const quote = await quoteTravel(address);
    if (!quote) return NextResponse.json({ ok: false, error: "Adresi neizdevās atrast. Pārbaudiet ielu un pilsētu." });
    return NextResponse.json({ ok: true, rate: TRAVEL_RATE, ...quote });
  } catch (e) {
    console.error("[travel]", e);
    return NextResponse.json(
      { ok: false, error: "Ceļa izdevumus šobrīd neizdevās aprēķināt — tos aprēķināsim, apstiprinot rezervāciju." },
      { status: 503 },
    );
  }
}
