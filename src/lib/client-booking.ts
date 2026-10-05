import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Rezervācijas dati, ko klients redz savā lapā (no datubāzes funkcijas `client_booking_action`) */
export type ClientBooking = {
  found: boolean;
  status?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  /** Ko šis izsaukums izdarīja: "confirmed", "cancelled" vai "" (nekas — tikai nolasīts vai lēmums jau pieņemts) */
  did?: string;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  address?: string | null;
  program?: string | null;
  name?: string | null;
  children_count?: number | null;
  child_age?: string | null;
  message?: string | null;
  travel_km?: number | null;
  travel_cost?: number | null;
};

export type ClientAction = "view" | "confirm" | "cancel";

/**
 * Nolasa rezervāciju pēc saites (id + žetons) un, ja `action` ir "confirm" vai "cancel", ieraksta klienta lēmumu.
 * Lēmumu datubāze pieņem tikai vienreiz. Bez pareiza žetona datubāze neko neatgriež.
 * Ja funkciju vēl nav (migrācija nav palaista) — null.
 */
export async function clientBooking(id: string, token: string, action: ClientAction = "view"): Promise<ClientBooking | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{16,64}$/i.test(token)) return { found: false };
  const { data, error } = await supabase.rpc("client_booking_action", { p_id: id, p_token: token, p_action: action });
  if (!error) return data as ClientBooking;

  // Jaunākā funkcija vēl nav izveidota — izmanto iepriekšējo (tikai skatīšana un apstiprināšana, bez atcelšanas)
  if (action === "cancel") return null;
  const old = await supabase.rpc("client_booking", { p_id: id, p_token: token, p_confirm: action === "confirm" });
  if (old.error) {
    console.error("[client-booking]", error.message);
    return null;
  }
  const b = old.data as ClientBooking & { just_confirmed?: boolean };
  return { ...b, did: b.just_confirmed ? "confirmed" : "" };
}
