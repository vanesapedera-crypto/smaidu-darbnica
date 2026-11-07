import "server-only";
import type { AdminContext } from "./auth";
import type { Booking } from "./bookings";
import { CALENDAR_HOSTS, calendarEvent } from "./calendar";
import { cancelGoogleEvent } from "./google-calendar";
import { sendCalendarInvite } from "./notify";

/**
 * Izņem rezervācijas notikumu no visu iesaistīto kalendāriem.
 *  - Ja notikums ir savienotajā Google kalendārā — to izdzēš (Google pats izņem to arī viesiem).
 *  - Ja tur tāda nav (ielūgums agrāk aizgāja kā .ics e-pasts) vai savienojums nestrādā — komandai aiziet
 *    .ics atcelšana ar to pašu UID, un Google kalendārs notikumu izņem.
 * Atgriež true, ja kaut kas tika izdarīts.
 */
export async function removeBookingFromCalendars(db: AdminContext["db"], b: Booking): Promise<boolean> {
  const google = await cancelGoogleEvent(db, b.id);
  if (google === "deleted" || google === "gone") return true;
  const event = calendarEvent(b, b.service_slug || b.program || "Rezervācija");
  if (!event) return false;
  // Nav zināms, kuras vadītājas toreiz saņēma ielūgumu — atcelšana aiziet visām (kam tā nebija, tām nekas nemainās)
  const guests = [...new Set([...event.guests, ...CALENDAR_HOSTS.map((h) => h.email)])];
  await sendCalendarInvite(event, guests, `rezervacija-${b.id}@smaidudarbnica.lv`, true);
  return true;
}
