import { NextResponse } from "next/server";
import { notifyUnconfirmed } from "@/lib/notify";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Ikdienas pārbaude (Vercel Cron, sk. vercel.json): rezervācijas, kuras klients 3 dienu laikā nav apstiprinājis.
 * Datubāzes funkcija `remind_unconfirmed_bookings` katru šādu rezervāciju atzīmē kā "atgādināts" un atgriež
 * tikai pasākumu datumus; komandai aiziet viens e-pasts. Atkārtots izsaukums neko nedara (katrai rezervācijai
 * atgādinājums ir vienreiz), tāpēc adresei nav vajadzīga parole.
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false });
  const { data, error } = await supabase.rpc("remind_unconfirmed_bookings");
  if (error) {
    console.error("[cron] remind_unconfirmed_bookings", error.message);
    return NextResponse.json({ ok: false });
  }
  const dates = ((data ?? []) as (string | null)[]).map((d) => d ?? "");
  if (dates.length > 0) await notifyUnconfirmed(dates);
  return NextResponse.json({ ok: true, reminded: dates.length });
}
