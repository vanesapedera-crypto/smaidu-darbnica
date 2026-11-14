import { NextResponse } from "next/server";
import { notifyClientReminder, notifyUnconfirmed } from "@/lib/notify";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { confirmPath, type Booking } from "@/lib/bookings";
import { whenLabel } from "@/lib/dates";
import { getSettings } from "@/lib/content/queries";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Ikdienas pārbaude (Vercel Cron, sk. vercel.json): rezervācijas, kuras klients 3 dienu laikā nav apstiprinājis.
 * Katrai tādai — vienreiz (atzīme client_reminded_at):
 *  1) klientam automātiski aiziet atgādinājuma e-pasts ar pogu "Apstiprinu rezervāciju";
 *  2) administratorei un Kristīnei — viens kopsavilkuma e-pasts.
 * Atkārtots izsaukums neko nedara, tāpēc adresei nav vajadzīga parole.
 * Ja servera atslēgas (SUPABASE_SECRET_KEY) nav — kā līdz šim: tikai ziņa komandai.
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false });
  const admin = supabaseAdmin();

  if (admin) {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
    const { data, error } = await admin
      .from("bookings")
      .update({ client_reminded_at: new Date().toISOString() })
      .eq("status", "Apstiprināta")
      .is("client_confirmed_at", null)
      .is("client_reminded_at", null)
      .not("confirmation_sent_at", "is", null)
      .lt("confirmation_sent_at", threeDaysAgo)
      .or(`event_date.is.null,event_date.gte.${today}`)
      .select("*");
    if (error) {
      console.error("[cron] reminders", error.message);
      return NextResponse.json({ ok: false });
    }
    const due = (data ?? []) as Booking[];
    if (!due.length) return NextResponse.json({ ok: true, reminded: 0 });

    const { contact } = await getSettings();
    const results = await Promise.all(
      due.map((b) => {
        const path = confirmPath(b);
        if (!b.email || !path) return false;
        const isBusiness = b.inquiry_type === "business";
        return notifyClientReminder({
          to: b.email,
          name: b.parent_name ?? "",
          when: whenLabel(b.event_date, b.event_time, isBusiness ? null : b.location),
          confirmUrl: absoluteUrl(path),
          replyTo: contact.emailPrivate,
          logoUrl: absoluteUrl("/brand/logo-email-dark.png"),
          footer: {
            address: `${contact.address}, ${contact.city}`,
            phone: isBusiness ? contact.phoneBusiness : contact.phonePrivate,
            email: isBusiness ? contact.email : contact.emailPrivate,
            site: SITE_URL,
          },
        });
      }),
    );
    await notifyUnconfirmed(due.map((b) => b.event_date ?? ""), results.some(Boolean));
    return NextResponse.json({ ok: true, reminded: due.length, emailed: results.filter(Boolean).length });
  }

  const { data, error } = await supabase.rpc("remind_unconfirmed_bookings");
  if (error) {
    console.error("[cron] remind_unconfirmed_bookings", error.message);
    return NextResponse.json({ ok: false });
  }
  const dates = ((data ?? []) as (string | null)[]).map((d) => d ?? "");
  if (dates.length > 0) await notifyUnconfirmed(dates);
  return NextResponse.json({ ok: true, reminded: dates.length });
}
