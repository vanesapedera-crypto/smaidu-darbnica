import "server-only";
import type { MemberContext } from "@/lib/auth";
import { CALENDAR_HOSTS } from "@/lib/calendar";
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
  const title = services.find((s) => s.slug === slug)?.title ?? (slug || "Telpu noma");
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
  await db.from("booking_staff").insert(added.map((h) => ({ booking_id: b.id, email: h.email, name: h.name, status: "gaida" })));

  const d = await describe(b);
  const url = `/admin/kalendars?atbildet=${b.id}`;
  await Promise.allSettled(
    added.flatMap((h) => [
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
    .select("name")
    .maybeSingle();
  if (error || !data) return { error: "Neizdevās saglabāt atbildi." };
  // Visas pievienotās atbildējušas "Varu" — administratorei: var apstiprināt klientam
  if (status === "var") {
    const { data: rows } = await db.from("booking_staff").select("status").eq("booking_id", bookingId);
    const all = (rows ?? []) as { status: StaffStatus }[];
    const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
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
