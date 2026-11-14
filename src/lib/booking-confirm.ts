import "server-only";
import type { AdminContext } from "@/lib/auth";
import { atStudio, confirmPath, fixedVenueAddress, type Booking } from "@/lib/bookings";
import { CALENDAR_INVITES, calendarEvent } from "@/lib/calendar";
import { getServices, getSettings } from "@/lib/content/queries";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { notifyClientConfirmed, sendCalendarInvite } from "@/lib/notify";
import { whenLabel } from "@/lib/dates";
import { bookingCosts, bookingPrices, parseNotice } from "@/lib/pricing";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Kas notiek, kad pieteikumu apstiprina:
 *  1) klientam aiziet apstiprinājuma e-pasts (datums, laiks, vieta, izmaksas; telpu nomai — saite uz noteikumiem);
 *  2) komandai — kalendāra notikums: ja panelī ir savienots Google kalendārs, notikums tiek ielikts tieši tajā
 *     (to var labot Google kalendārā, viesi saņem ielūgumu no Google); citādi — .ics ielūgums, ko Google kalendārs ieliek automātiski.
 * Uzņēmumu pieprasījumiem atbildes adrese un telefons ir uzņēmumu kontaktam, ballītēm — privātpersonu kontaktam.
 */
export async function sendConfirmation(b: Booking, hosts: string[], db: AdminContext["db"], extraNotice?: string, updated = false) {
  const isBusiness = b.inquiry_type === "business";
  const [settings, services] = await Promise.all([getSettings(), getServices(isBusiness ? "business" : "private")]);
  const { contact } = settings;
  const slug = b.service_slug || b.program || "";
  const service = services.find((s) => s.slug === slug);
  const title = service?.title ?? slug;
  const inVenue = !isBusiness && atStudio(b.location);

  // Klientu gaidām 15 minūtes pirms sākuma (tikai mūsu telpās)
  const start = b.event_time?.slice(0, 5) ?? "";
  const [h, min] = start.split(":").map(Number);
  const arrival =
    inVenue && start ? `${String(Math.floor((h * 60 + min - 15) / 60)).padStart(2, "0")}:${String((h * 60 + min - 15) % 60).padStart(2, "0")}` : undefined;
  const phone = isBusiness ? contact.phoneBusiness : contact.phonePrivate;
  const confirm = confirmPath(b);
  // Uzņēmumiem cenu piedāvājums ir individuāls — izmaksas nerāda
  const costs = isBusiness ? null : bookingCosts(b, service, bookingPrices(settings));

  const client = b.email
    ? notifyClientConfirmed(b as unknown as Record<string, unknown>, {
        // Datums ar vārdiem un laiks: "6. oktobris plkst. 14:00–17:00" (izbraukumam — sākuma laiks)
        when: whenLabel(b.event_date, b.event_time, isBusiness ? null : b.location),
        arrival,
        place: inVenue ? undefined : (isBusiness ? b.event_city : (fixedVenueAddress(b.location) ?? b.address)) || undefined,
        // SMS numurs bez valsts koda un atstarpēm: "+371 28 193 386" → "28193386"
        smsPhone: phone.replace(/^\+371/, "").replace(/\s/g, ""),
        // Klienta atbildes uz apstiprinājumu vienmēr nāk uz rezervāciju e-pastu
        replyTo: contact.emailPrivate,
        costs,
        rulesUrl: inVenue ? absoluteUrl("/telpu-noma#noteikumi") : undefined,
        notice: [extraNotice, service ? parseNotice(service.body) : ""].filter(Boolean).join("\n\n") || undefined,
        logoUrl: absoluteUrl("/brand/logo-email-dark.png"),
        updated,
        // Poga "Apstiprinu rezervāciju" (ja datubāzē jau ir klienta apstiprinājuma lauki)
        confirmUrl: confirm ? absoluteUrl(confirm) : undefined,
        footer: {
          address: `${contact.address}, ${contact.city}`,
          phone,
          email: isBusiness ? contact.email : contact.emailPrivate,
          site: SITE_URL,
        },
      })
    : null;

  // Kalendāra ielūgumā ir tā pati informācija, ko saņem klients (laiks, izmaksas), plus klienta kontakti
  const event = calendarEvent(b, title || (inVenue ? "Telpu noma" : "Pieteikums"), costs);
  const guests = event && CALENDAR_INVITES ? [...new Set([...event.guests, ...hosts])] : [];
  // Ja Google kalendārs nestrādā — .ics ielūgums: komandai (ja ielūgumi ieslēgti) vai tikai administratorei kā rezerves kopija
  const fallback = CALENDAR_INVITES ? guests : [process.env.NOTIFY_EMAIL_PRIVATE || "smaidu.darbniica@gmail.com"];
  // Vispirms — savienotajā Google kalendārā (labojams); ja savienojuma nav vai neizdodas — .ics ielūgums
  const calendar = event
    ? upsertGoogleEvent(db, b.id, event, guests).then((ok) => (ok ? undefined : sendCalendarInvite(event, fallback, `rezervacija-${b.id}@smaidudarbnica.lv`)))
    : null;

  await Promise.all([client, calendar]);
}

