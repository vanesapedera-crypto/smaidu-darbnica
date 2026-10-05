"use server";

import { redirect } from "next/navigation";
import { clientBooking } from "@/lib/client-booking";
import { getServices } from "@/lib/content/queries";
import { notifyClientAccepted } from "@/lib/notify";
import { VENUE_SLOTS } from "@/lib/pricing";

/** Klients nospiež "Apstiprinu rezervāciju": ieraksta apstiprinājumu un paziņo komandai (tikai pirmajā reizē). */
export async function confirmBooking(id: string, token: string) {
  const b = await clientBooking(id, token, true);
  if (b?.found && b.just_confirmed) {
    const programs = await getServices("private");
    const [y, m, d] = (b.event_date ?? "").split("-");
    const start = b.event_time?.slice(0, 5) ?? "";
    const slot = VENUE_SLOTS.find((t) => t.value === start)?.label ?? start;
    await notifyClientAccepted({
      name: b.name ?? "",
      when: [b.event_date ? `${Number(d)}.${m}.${y}.` : "", slot && `plkst. ${slot}`].filter(Boolean).join(" "),
      title: programs.find((p) => p.slug === b.program)?.title ?? (b.program || "Telpu noma"),
      place: b.location === "Izbraukums" ? (b.address ?? "") : "Smaidu Darbnīca, Pasta iela 25, Tukums",
    });
  }
  redirect(`/rezervacija/${id}?k=${token}`);
}
