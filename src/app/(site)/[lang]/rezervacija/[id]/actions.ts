"use server";

import { redirect } from "next/navigation";
import { clientBooking, type ClientBooking } from "@/lib/client-booking";
import { getServices } from "@/lib/content/queries";
import { fixedVenueAddress } from "@/lib/bookings";
import { whenLabel } from "@/lib/dates";
import { notifyClientAccepted, notifyClientCancelled } from "@/lib/notify";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { removeBookingFromCalendars } from "@/lib/calendar-cancel";
import type { Booking } from "@/lib/bookings";

/** Dati paziņojumam komandai */
async function summary(b: ClientBooking) {
  const programs = await getServices("private");
  return {
    name: b.name ?? "",
    when: whenLabel(b.event_date, b.event_time, b.location),
    title: programs.find((p) => p.slug === b.program)?.title ?? (b.program || "Telpu noma"),
    place: b.location === "Izbraukums" ? (b.address ?? "") : (fixedVenueAddress(b.location) ?? "Smaidu Darbnīca, Pasta iela 25, Tukums"),
  };
}

/** Klients nospiež "Apstiprinu rezervāciju": ieraksta apstiprinājumu un paziņo komandai (tikai pirmajā reizē). */
export async function confirmBooking(id: string, token: string) {
  const b = await clientBooking(id, token, "confirm");
  if (b?.found && b.did === "confirmed") await notifyClientAccepted(await summary(b));
  redirect(`/rezervacija/${id}?k=${token}`);
}

/**
 * Klients nospiež "Atcelt rezervāciju": rezervācija kļūst "Atcelta", notikums automātiski pazūd no kalendāriem
 * (savienotā Google kalendāra un komandas ielūgumiem) un komanda saņem paziņojumu.
 * Datubāze to pieļauj tikai, kamēr klients vēl nav pieņēmis lēmumu — pēc apstiprināšanas no saites atcelt vairs nevar.
 */
export async function cancelBooking(id: string, token: string) {
  const b = await clientBooking(id, token, "cancel");
  if (b?.found && b.did === "cancelled") {
    await Promise.all([notifyClientCancelled(await summary(b)), removeFromCalendars(id)]);
  }
  redirect(`/rezervacija/${id}?k=${token}`);
}

/** Izņem atcelto rezervāciju no kalendāriem. Vajag servera atslēgu (SUPABASE_SECRET_KEY), jo klients nav pieteicies. */
async function removeFromCalendars(id: string) {
  const db = supabaseAdmin();
  if (!db) {
    console.warn("[cancel] SUPABASE_SECRET_KEY nav iestatīts — notikums no kalendāra automātiski netiek izņemts");
    return;
  }
  try {
    const { data } = await db.from("bookings").select("*").eq("id", id).single();
    if (data) await removeBookingFromCalendars(db, data as Booking);
  } catch (e) {
    console.error("[cancel] calendar", e);
  }
}
