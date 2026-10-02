import { NextResponse } from "next/server";
import { bookedSlots } from "@/lib/availability";

/**
 * Telpu nomas aizņemtie laiki izvēlētajā datumā: GET /api/availability?date=2026-11-14 → { taken: ["14:00"] }.
 * Rezervācijas forma pēc šī saraksta neļauj izvēlēties aizņemtu laiku.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  return NextResponse.json({ taken: await bookedSlots(date) }, { headers: { "Cache-Control": "no-store" } });
}
