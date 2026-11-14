import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { BOOKING_STATUSES, withHostsLine, type Booking } from "@/lib/bookings";
import { hostNames, pickHosts } from "@/lib/calendar";
import { removeBookingFromCalendars } from "@/lib/calendar-cancel";
import { sendConfirmation } from "@/lib/booking-confirm";
import { syncStaff } from "@/lib/staff";

/** Pieteikuma statusa maiņa administrēšanas panelī. Pieejama tikai administratoram. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Nav autorizēts" }, { status: 401 });
  }

  try {
    const { status, hosts: hostsInput, host: hostInput } = await request.json();
    // Programmas vadītājas (izvēlas panelī apstiprinot, var vairākas) — pieņem tikai adreses no saraksta
    const hosts = pickHosts(hostsInput ?? hostInput);
    const { id } = await params;

    if (!BOOKING_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Nederīgs statuss" }, { status: 400 });
    }

    // Pieteikums pirms izmaiņām — lai zinātu, vai statuss tiešām mainās uz "Apstiprināta"
    const { data: before } = await admin.db.from("bookings").select("*").eq("id", id).maybeSingle<Booking>();

    // Apstiprinot ar izvēlētām programmas vadītājām — tās saglabā pieteikumā (rinda "Vada: …"; redzams kalendārā)
    const message = status === "Apstiprināta" && hosts.length && before ? withHostsLine(before.message, hostNames(hosts)) : undefined;
    const { error } = await admin.db.from("bookings").update(message !== undefined ? { status, message } : { status }).eq("id", id);
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
      if (configured) after(() => sendConfirmation(before, hosts, admin.db));
      // Atzīmētajām — jautājums "Vai vari piedalīties?" (telefonā un e-pastā)
      if (hosts.length) after(() => syncStaff(admin.db, before, hosts));
      // No šī brīža skaita 3 dienas līdz atgādinājumam; iepriekšējo klienta apstiprinājumu (ja bija) notīra.
      // Atsevišķs pieprasījums — ja lauku datubāzē vēl nav (migrācija nav palaista), statusa maiņa tāpat ir notikusi.
      if (clientEmail === "sent") {
        await admin.db
          .from("bookings")
          .update({ confirmation_sent_at: new Date().toISOString(), client_confirmed_at: null, client_reminded_at: null })
          .eq("id", id);
        await admin.db.from("bookings").update({ client_cancelled_at: null }).eq("id", id);
      }
    }

    // Atceļot apstiprinātu rezervāciju — notikums savienotajā Google kalendārā tiek atcelts (viesi saņem paziņojumu)
    // (arī tie, kas agrāk aizgāja kā .ics ielūgumi — sk. removeBookingFromCalendars)
    if (status === "Atcelta" && before?.status === "Apstiprināta") after(() => removeBookingFromCalendars(admin.db, before));

    revalidatePath("/admin", "layout");
    return NextResponse.json({ success: true, clientEmail, calendar });
  } catch {
    return NextResponse.json({ success: false, error: "Servera kļūda" }, { status: 500 });
  }
}
