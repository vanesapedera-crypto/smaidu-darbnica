import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { BOOKING_STATUSES, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS, calendarEvent } from "@/lib/calendar";
import { getServices, getSettings } from "@/lib/content/queries";
import { notifyClientConfirmed, sendCalendarInvite } from "@/lib/notify";
import { VENUE_SLOTS, bookingCosts, bookingPrices } from "@/lib/pricing";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Kas notiek, kad pieteikumu apstiprina:
 *  1) klientam aiziet apstiprinājuma e-pasts (datums, laiks, vieta, izmaksas; telpu nomai — saite uz noteikumiem);
 *  2) komandai aiziet kalendāra ielūgums, ko Google kalendārs ieliek kalendārā automātiski.
 * Uzņēmumu pieprasījumiem atbildes adrese un telefons ir uzņēmumu kontaktam, ballītēm — privātpersonu kontaktam.
 */
async function onConfirmed(b: Booking, host: string | null) {
  const isBusiness = b.inquiry_type === "business";
  const [settings, services] = await Promise.all([getSettings(), getServices(isBusiness ? "business" : "private")]);
  const { contact } = settings;
  const slug = b.service_slug || b.program || "";
  const service = services.find((s) => s.slug === slug);
  const title = service?.title ?? slug;
  const inVenue = !isBusiness && b.location !== "Izbraukums";

  // Datums un laiks kā ierastajā apstiprinājumā: "5.09.2026. plkst. 14:00–17:00"
  const [y, m, d] = (b.event_date ?? "").split("-");
  const date = b.event_date ? `${Number(d)}.${m}.${y}.` : "";
  const start = b.event_time?.slice(0, 5) ?? "";
  const slot = VENUE_SLOTS.find((t) => t.value === start)?.label ?? start;
  // Klientu gaidām 15 minūtes pirms sākuma (tikai mūsu telpās)
  const [h, min] = start.split(":").map(Number);
  const arrival =
    inVenue && start ? `${String(Math.floor((h * 60 + min - 15) / 60)).padStart(2, "0")}:${String((h * 60 + min - 15) % 60).padStart(2, "0")}` : undefined;
  const phone = isBusiness ? contact.phoneBusiness : contact.phonePrivate;

  const client = b.email
    ? notifyClientConfirmed(b as unknown as Record<string, unknown>, {
        when: [date, slot && `plkst. ${slot}`].filter(Boolean).join(" "),
        arrival,
        place: inVenue ? undefined : (isBusiness ? b.event_city : b.address) || undefined,
        // SMS numurs bez valsts koda un atstarpēm: "+371 28 193 386" → "28193386"
        smsPhone: phone.replace(/^\+371/, "").replace(/\s/g, ""),
        replyTo: isBusiness ? contact.email : contact.emailPrivate,
        // Uzņēmumiem cenu piedāvājums ir individuāls — izmaksas e-pastā nerāda
        costs: isBusiness ? null : bookingCosts(b, service, bookingPrices(settings)),
        rulesUrl: inVenue ? absoluteUrl("/telpu-noma#noteikumi") : undefined,
        logoUrl: absoluteUrl("/brand/logo-email-dark.png"),
        footer: {
          address: `${contact.address}, ${contact.city}`,
          phone,
          email: isBusiness ? contact.email : contact.emailPrivate,
          site: SITE_URL,
        },
      })
    : null;

  const event = calendarEvent(b, title || (inVenue ? "Telpu noma" : "Pieteikums"));
  const calendar = event ? sendCalendarInvite(event, [...event.guests, ...(host ? [host] : [])], `rezervacija-${b.id}@smaidudarbnica.lv`) : null;

  await Promise.all([client, calendar]);
}

/** Pieteikuma statusa maiņa administrēšanas panelī. Pieejama tikai administratoram. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Nav autorizēts" }, { status: 401 });
  }

  try {
    const { status, host: hostInput } = await request.json();
    // Programmas vadītāja (izvēlas panelī apstiprinot) — pieņem tikai adreses no saraksta
    const host = CALENDAR_HOSTS.find((h) => h.email === hostInput)?.email ?? null;
    const { id } = await params;

    if (!BOOKING_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Nederīgs statuss" }, { status: 400 });
    }

    // Pieteikums pirms izmaiņām — lai zinātu, vai statuss tiešām mainās uz "Apstiprināta"
    const { data: before } = await admin.db.from("bookings").select("*").eq("id", id).maybeSingle<Booking>();

    const { error } = await admin.db.from("bookings").update({ status }).eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Apstiprinot pieteikumu, klientam aiziet e-pasts un komandai — kalendāra ielūgums.
    // Sūtīšana notiek pēc atbildes — panelim nav jāgaida.
    let clientEmail: "sent" | "no-email" | "not-configured" | undefined;
    let calendar: "sent" | "no-date" | "not-configured" | undefined;
    if (status === "Apstiprināta" && before && before.status !== "Apstiprināta") {
      const configured = Boolean(process.env.RESEND_API_KEY);
      clientEmail = !before.email ? "no-email" : configured ? "sent" : "not-configured";
      calendar = !before.event_date ? "no-date" : configured ? "sent" : "not-configured";
      if (configured) after(() => onConfirmed(before, host));
    }

    revalidatePath("/admin");
    return NextResponse.json({ success: true, clientEmail, calendar });
  } catch {
    return NextResponse.json({ success: false, error: "Servera kļūda" }, { status: 500 });
  }
}
