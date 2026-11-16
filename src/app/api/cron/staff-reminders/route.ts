import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pushToEmails } from "@/lib/push";
import { notifyStaffReminder } from "@/lib/notify";
import { getServices } from "@/lib/content/queries";
import { timeLabel, whenLabel } from "@/lib/dates";
import { atStudio, type Booking } from "@/lib/bookings";
import type { MemberContext } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = { booking_id: string; email: string; name: string; status: string; reminded_day_at: string | null; reminded_3h_at: string | null };

/** Rīgas laiks kā "YYYY-MM-DDTHH:MM" → minūtes (salīdzināšanai) */
const rigaNow = () => new Date().toLocaleString("sv-SE", { timeZone: "Europe/Riga" }).slice(0, 16).replace(" ", "T");
const minutes = (local: string) => Date.parse(`${local}:00Z`) / 60000;

/**
 * Atgādinājumi tiem, kas piedalās pasākumā (atbildējuši "Varu" vai vēl nav atbildējuši; "Nevaru" — ne):
 *  • ~24 stundas pirms sākuma — "Rīt: …" (ja pasākums apstiprināts vēlāk — "Šodien: …");
 *  • ~3 stundas pirms sākuma — "Pēc 3 stundām: …".
 * Telefonā (ja ieslēgti paziņojumi); kam paziņojumu nav — e-pastā. Katrs atgādinājums tikai vienreiz.
 * Izsauc Supabase ik pēc 15 min (sk. migrāciju 20261115090000_staff_reminders.sql); atkārtots izsaukums neko nedubulto.
 */
export async function GET() {
  const db = supabaseAdmin() as MemberContext["db"] | null;
  if (!db) return NextResponse.json({ ok: false, error: "no-key" });

  const now = rigaNow();
  const today = now.slice(0, 10);
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);

  const { data: bookings, error } = await db
    .from("bookings")
    .select("*")
    .in("event_date", [today, tomorrow])
    .eq("status", "Apstiprināta");
  if (error) return NextResponse.json({ ok: false, error: error.message });
  const list = (bookings ?? []) as Booking[];
  if (!list.length) return NextResponse.json({ ok: true, sent: 0 });

  const { data: staffData, error: staffErr } = await db
    .from("booking_staff")
    .select("booking_id, email, name, status, reminded_day_at, reminded_3h_at")
    .in("booking_id", list.map((b) => b.id))
    .neq("status", "nevar");
  if (staffErr) return NextResponse.json({ ok: false, error: staffErr.message });
  const staff = (staffData ?? []) as Row[];
  if (!staff.length) return NextResponse.json({ ok: true, sent: 0 });

  const { data: subs } = await db.from("push_subscriptions").select("email");
  const hasPush = new Set(((subs ?? []) as { email: string }[]).map((s) => s.email.toLowerCase()));
  const [privateS, businessS] = await Promise.all([getServices("private"), getServices("business")]);
  const titles = new Map([...privateS, ...businessS].map((s) => [s.slug, s.title]));

  let sent = 0;
  for (const b of list) {
    const start = (b.event_time ?? "").slice(0, 5);
    const day = String(b.event_date).slice(0, 10);
    // Bez laika — skaitām no 9:00
    const until = minutes(`${day}T${/^\d{2}:\d{2}$/.test(start) ? start : "09:00"}`) - minutes(now);
    const slug = b.program || b.service_slug || "";
    const program = titles.get(slug) ?? "";
    const isBusiness = b.inquiry_type === "business";
    const title = isBusiness ? program || b.company_name || "Pasākums" : [atStudio(b.location) && "Telpu noma", program].filter(Boolean).join(" + ") || "Pasākums";
    const place = atStudio(b.location) ? "Smaidu Darbnīcā" : [b.address, b.event_city].filter(Boolean).join(", ") || b.location || "";
    const time = timeLabel(b.event_time, isBusiness ? null : b.location);

    for (const r of staff.filter((s) => s.booking_id === b.id)) {
      // ~3 h pirms (arī, ja pasākums sākas agrāk nekā pēc 3 h un atgādinājuma vēl nav bijis)
      const due3h = /^\d{2}:\d{2}$/.test(start) && until > 0 && until <= 180 && !r.reminded_3h_at;
      const dueDay = !due3h && until > 180 && until <= 24 * 60 && !r.reminded_day_at;
      if (!due3h && !dueDay) continue;

      const headline = due3h ? (until > 150 ? "Pēc 3 stundām" : `Pēc ${Math.max(1, Math.round(until / 60))} h`) : day === today ? "Šodien" : "Rīt";
      const payload = {
        title: `${headline}: ${title}`,
        body: [time && `plkst. ${time}`, place].filter(Boolean).join(" · "),
        url: "/admin/kalendars",
        tag: `atgadinajums-${b.id}`,
      };
      const pushed = hasPush.has(r.email.toLowerCase()) ? await pushToEmails(db, [r.email], payload).catch(() => 0) : 0;
      if (!pushed) {
        await notifyStaffReminder({ to: r.email, name: r.name, headline, title, when: whenLabel(b.event_date, b.event_time, isBusiness ? null : b.location), place }).catch(() => undefined);
      }
      const stamp = new Date().toISOString();
      await db
        .from("booking_staff")
        .update(due3h ? { reminded_3h_at: stamp, reminded_day_at: r.reminded_day_at ?? stamp } : { reminded_day_at: stamp })
        .eq("booking_id", r.booking_id)
        .eq("email", r.email);
      sent++;
    }
  }
  return NextResponse.json({ ok: true, sent });
}
