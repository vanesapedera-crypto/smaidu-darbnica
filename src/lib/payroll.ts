import type { Booking } from "./bookings";
import { CALENDAR_VENUE, OWNER_STAFF_EMAIL, withVenueStaff } from "./calendar";

/** Administrēšana: Vanesai no katras privātpersonas izklaides programmas (ne telpu nomas, ne uzņēmumiem). */
export const ADMIN_FEE = 5;
/** Telpu tīrīšana: Keitai pie katras telpu nomas mūsu telpās. */
export const CLEANING_FEE = 20;

export type Bonus = { person: string; name: string; label: string; amount: number };

/** Automātiskās piemaksas konkrētam pasākumam (pieskaita algai; ar roku nav jāievada). */
export function bonusesFor(b: Pick<Booking, "inquiry_type" | "location" | "program" | "service_slug">, privateSlugs: Set<string>): Bonus[] {
  const out: Bonus[] = [];
  if (b.inquiry_type === "business") return out;
  const slug = b.program || b.service_slug || "";
  if (slug && privateSlugs.has(slug)) out.push({ person: OWNER_STAFF_EMAIL, name: "Vanesa", label: "administrēšana", amount: ADMIN_FEE });
  // Mūsu telpās (telpu noma) — Keita tīra telpas
  if (withVenueStaff(b, []).length) for (const e of CALENDAR_VENUE) out.push({ person: e, name: "Keita", label: "telpu tīrīšana", amount: CLEANING_FEE });
  return out;
}
