import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { BOOKING_STATUSES, type Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { notifyClientConfirmed } from "@/lib/notify";
import { VENUE_SLOTS } from "@/lib/pricing";

/**
 * Apstiprinājuma e-pasts klientam: sagatavo saprotamu programmas nosaukumu, laiku un vietu.
 * Uzņēmumu pieprasījumiem atbildes adrese un telefons ir uzņēmumu kontaktam, ballītēm — privātpersonu kontaktam.
 */
async function sendConfirmation(b: Booking) {
  const isBusiness = b.inquiry_type === "business";
  const [{ contact }, services] = await Promise.all([getSettings(), getServices(isBusiness ? "business" : "private")]);
  const slug = b.service_slug || b.program || "";
  const title = services.find((s) => s.slug === slug)?.title ?? slug;
  const date = b.event_date
    ? new Date(`${b.event_date}T12:00:00`).toLocaleDateString("lv-LV", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const time = VENUE_SLOTS.find((t) => t.value === b.event_time)?.label ?? b.event_time ?? "";
  const where =
    b.location === "Izbraukums" ? (b.address ?? "") : isBusiness ? (b.event_city ?? "") : `Smaidu Darbnīca, ${contact.address}, ${contact.city}`;
  await notifyClientConfirmed(b as unknown as Record<string, unknown>, {
    title,
    when: [date, time].filter(Boolean).join(", "),
    where,
    phone: isBusiness ? contact.phoneBusiness : contact.phonePrivate,
    replyTo: isBusiness ? contact.email : contact.emailPrivate,
  });
}

/** Pieteikuma statusa maiņa administrēšanas panelī. Pieejama tikai administratoram. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Nav autorizēts" }, { status: 401 });
  }

  try {
    const { status } = await request.json();
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

    // Apstiprinot pieteikumu, klientam aiziet e-pasts (ja viņš norādījis e-pastu un sūtīšana ir ieslēgta).
    // Sūtīšana notiek pēc atbildes — panelim nav jāgaida.
    let clientEmail: "sent" | "no-email" | "not-configured" | undefined;
    if (status === "Apstiprināta" && before && before.status !== "Apstiprināta") {
      if (!before.email) clientEmail = "no-email";
      else if (!process.env.RESEND_API_KEY) clientEmail = "not-configured";
      else {
        clientEmail = "sent";
        after(() => sendConfirmation(before));
      }
    }

    revalidatePath("/admin");
    return NextResponse.json({ success: true, clientEmail });
  } catch {
    return NextResponse.json({ success: false, error: "Servera kļūda" }, { status: 500 });
  }
}
