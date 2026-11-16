import "server-only";
import type { MemberContext } from "@/lib/auth";
import { CALENDAR_HOSTS, CALENDAR_INVITES, CALENDAR_VENUE, OWNER_STAFF_EMAIL, calendarEvent, withVenueStaff } from "@/lib/calendar";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { atStudio, googleManaged } from "@/lib/bookings";
import { type Booking } from "@/lib/bookings";
import { whenLabel } from "@/lib/dates";
import { getServices } from "@/lib/content/queries";
import { notifyStaffAssigned, notifyStaffDeclined, notifyStaffReady } from "@/lib/notify";
import { pushToAdmin, pushToEmails } from "@/lib/push";

/** Kas piedalās pasākumā un ko atbildēja (tabula booking_staff) */
export type StaffStatus = "gaida" | "var" | "nevar";
export type StaffRow = { booking_id: string; email: string; name: string; status: StaffStatus; responded_at: string | null };

async function describe(b: Booking) {
  const services = await getServices(b.inquiry_type === "business" ? "business" : "private");
  const slug = b.program || b.service_slug || "";
  const title = services.find((s) => s.slug === slug)?.title ?? (slug || (b.inquiry_type === "business" ? b.company_name || "Pasākums" : "Telpu noma"));
  return { title, when: whenLabel(b.event_date, b.event_time, b.inquiry_type === "business" ? null : b.location), place: b.location === "Izbraukums" ? (b.address ?? "") : (b.location ?? "") };
}

/**
 * Saglabā, kas piedalās (administratores izvēle): jaunajiem — ieraksts "gaida" + paziņojums telefonā un e-pastā,
 * noņemtajiem — ieraksts dzēsts. Tiem, kas jau bija, atbilde saglabājas.
 * Ja tabulas vēl nav (migrācija nav palaista) — nekas nenotiek.
 */
export async function syncStaff(db: MemberContext["db"], b: Booking, emails: string[]) {
  const wanted = CALENDAR_HOSTS.filter((h) => emails.map((e) => e.toLowerCase()).includes(h.email));
  const { data, error } = await db.from("booking_staff").select("email").eq("booking_id", b.id);
  if (error) return;
  const have = new Set((data ?? []).map((r: { email: string }) => r.email.toLowerCase()));
  const added = wanted.filter((h) => !have.has(h.email));
  const removed = [...have].filter((e) => !wanted.some((h) => h.email === e));

  if (removed.length) await db.from("booking_staff").delete().eq("booking_id", b.id).in("email", removed);
  if (!added.length) return;
  // Telpu kopēja (Keita) telpu nomā piedalās vienmēr — uzreiz "Varu", bez jautājuma
  // Vanesa (administratore) pati sevi pievieno — arī uzreiz "Varu"
  const venue = (h: { email: string }) => h.email === OWNER_STAFF_EMAIL || (CALENDAR_VENUE.includes(h.email) && withVenueStaff(b, []).includes(h.email));
  await db.from("booking_staff").insert(added.map((h) => ({ booking_id: b.id, email: h.email, name: h.name, status: venue(h) ? "var" : "gaida", responded_at: venue(h) ? new Date().toISOString() : null })));
  const ask = added.filter((h) => !venue(h));
  if (!ask.length) return;

  const d = await describe(b);
  const url = `/admin/kalendars?atbildet=${b.id}`;
  await Promise.allSettled(
    ask.flatMap((h) => [
      pushToEmails(db, [h.email], { title: "Vai vari piedalīties?", body: `${d.title} · ${d.when}`, url, tag: `staff-${b.id}` }),
      notifyStaffAssigned({ to: h.email, name: h.name, when: d.when, title: d.title, place: d.place, bookingId: b.id }),
    ]),
  );
}

/** Komandas loceklis atbild; "Nevaru" — administratorei paziņojums */
export async function answerStaff(db: MemberContext["db"], bookingId: string, email: string, status: "var" | "nevar"): Promise<{ error?: string; ok?: boolean }> {
  const { data, error } = await db
    .from("booking_staff")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .eq("email", email.toLowerCase())
    // Atbildi var dot tikai vienreiz — ja vēlāk nevar, jārunā ar Vanesu
    .eq("status", "gaida")
    .select("name")
    .maybeSingle();
  if (error) return { error: "Neizdevās saglabāt atbildi." };
  if (!data) return { error: "Atbilde jau ir dota. Ja kaut kas mainījies — sazinies ar Vanesu." };
  // Visas pievienotās atbildējušas "Varu" — administratorei: var apstiprināt klientam
  if (status === "var") {
    const { data: rows } = await db.from("booking_staff").select("status").eq("booking_id", bookingId);
    const all = (rows ?? []) as { status: StaffStatus }[];
    const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    // Rezervācija jau apstiprināta (piem. aizvietotāja) — Google kalendāra notikumam pievieno arī šo cilvēku
    if (b && (b as Booking).status === "Apstiprināta") await addToGoogleGuests(b as Booking, email).catch((e) => console.error("[staff] google", e));
    if (b && all.length && all.every((r) => r.status === "var") && (b as Booking).status === "Jauns") {
      const d = await describe(b as Booking);
      await Promise.allSettled([
        pushToAdmin(db, { title: "Komanda gatava ✓", body: `${d.title} · ${d.when} — var apstiprināt klientam`, url: "/admin/kalendars", tag: `gatavs-${bookingId}` }),
        notifyStaffReady({ when: d.when, title: d.title }),
      ]);
    }
  }
  if (status === "nevar") {
    const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (b) {
      const d = await describe(b as Booking);
      await Promise.allSettled([
        pushToAdmin(db, { title: `${data.name} nevar piedalīties`, body: `${d.title} · ${d.when} — jāmeklē cits`, url: "/admin/kalendars", tag: `nevar-${bookingId}` }),
        notifyStaffDeclined({ name: data.name, when: d.when, title: d.title, bookingId }),
      ]);
    }
  }
  return { ok: true };
}

/** Apstiprinātas rezervācijas Google notikumam pievieno vēl vienu viesi (kas atbildēja "Varu") */
async function addToGoogleGuests(b: Booking, email: string) {
  const admin = supabaseAdmin() as MemberContext["db"] | null;
  if (!admin || !CALENDAR_INVITES || !googleManaged(b)) return;
  const d = await describe(b);
  const event = calendarEvent(b, d.title || (atStudio(b.location) ? "Telpu noma" : "Pieteikums"));
  if (!event) return;
  const { data } = await admin.from("booking_staff").select("email, status").eq("booking_id", b.id);
  const yes = ((data ?? []) as { email: string; status: string }[]).filter((r) => r.status === "var").map((r) => r.email);
  await upsertGoogleEvent(admin, b.id, event, [...new Set([...event.guests, ...withVenueStaff(b, [...yes, email.toLowerCase()])])]);
}

/**
 * Telpu nomā (un Ziemassvētku programmā mūsu telpās) Keita piedalās vienmēr: pievieno viņu uzreiz ar "Varu"
 * (bez jautājuma), lai viņai kalendārā ir "Tu piedalies" un pienāk atgādinājumi. Citus neaiztiek.
 * `db` — administratores vai servera (SUPABASE_SECRET_KEY) savienojums.
 */
export async function ensureVenueStaff(db: MemberContext["db"], b: Booking) {
  const emails = withVenueStaff(b, []);
  if (!emails.length || b.status === "Atcelta") return;
  const { data } = await db.from("booking_staff").select("email").eq("booking_id", b.id);
  const have = new Set(((data ?? []) as { email: string }[]).map((r) => r.email.toLowerCase()));
  const add = CALENDAR_HOSTS.filter((h) => emails.includes(h.email) && !have.has(h.email));
  if (!add.length) return;
  await db.from("booking_staff").insert(add.map((h) => ({ booking_id: b.id, email: h.email, name: h.name, status: "var", responded_at: new Date().toISOString() })));
}
