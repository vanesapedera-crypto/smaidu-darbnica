import { NextResponse } from "next/server";
import { bookedProgramSlots, bookedProgramVariants, bookedSlots } from "@/lib/availability";
import { hasDayRules } from "@/lib/bookings";

/**
 * Aizņemtie laiki rezervācijas formai:
 *  - telpu noma izvēlētajā datumā: GET /api/availability?date=2026-11-14 → { taken: ["14:00"] };
 *  - programma ar konkrētiem laikiem (PROGRAM_SLOTS): GET /api/availability?program=ziemassvetki-dobele → { taken: ["2026-12-14 09:00"] }.
 * Forma pēc šī saraksta neļauj izvēlēties aizņemtu laiku.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const program = params.get("program");
  const taken = program ? await bookedProgramSlots(program) : await bookedSlots(params.get("date") ?? "");
  // Programmām ar laika logiem — arī izvēlētie varianti ("2026-12-14 10:00|2 rūķi")
  const variants = program && hasDayRules(program) ? await bookedProgramVariants(program) : undefined;
  return NextResponse.json({ taken, variants }, { headers: { "Cache-Control": "no-store" } });
}
