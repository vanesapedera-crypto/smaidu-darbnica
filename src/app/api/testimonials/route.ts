import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { notifyNewTestimonial } from "@/lib/notify";

/**
 * POST /api/testimonials — atsauksme no mājaslapas formas (/atsauksmes).
 * Tiek saglabāta nepublicēta; administrators to pārskata panelī (Atsauksmes) un publicē.
 * Ierobežojums: 5 atsauksmes / 10 min no vienas IP.
 */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > 5) return NextResponse.json({ ok: false, error: "Pārāk daudz mēģinājumu. Lūdzu, mēģiniet vēlāk." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  // Slēptais lauks robotiem — cilvēks to neaizpilda
  if (body.website) return NextResponse.json({ ok: true });

  const author = String(body.author ?? "").trim().slice(0, 120);
  const event = String(body.event ?? "").trim().slice(0, 120);
  const text = String(body.text ?? "").trim().slice(0, 3000);
  const rating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
  const errors: Record<string, string> = {};
  if (!author) errors.author = "Norādiet vārdu.";
  if (text.length < 5) errors.text = "Uzrakstiet atsauksmi.";
  if (!body.consent) errors.consent = "Nepieciešama piekrišana.";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: "Atsauksmes pašlaik nevar saglabāt." }, { status: 503 });

  const { error } = await supabase.from("testimonials").insert({ author, role: event, company: "", text, rating, logo: "", sort: 100, published: false });
  if (error) {
    console.error("[testimonials]", error.message);
    return NextResponse.json({ ok: false, error: "Atsauksmi neizdevās saglabāt. Lūdzu, mēģiniet vēlreiz." }, { status: 500 });
  }
  after(() => notifyNewTestimonial({ author, event, rating, text }));
  revalidatePath("/admin/atsauksmes");
  return NextResponse.json({ ok: true });
}
