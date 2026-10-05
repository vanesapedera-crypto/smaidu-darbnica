import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Rezervācijas dati, ko klients redz apstiprināšanas lapā (no datubāzes funkcijas `client_booking`) */
export type ClientBooking = {
  found: boolean;
  status?: string | null;
  confirmed_at?: string | null;
  just_confirmed?: boolean;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  address?: string | null;
  program?: string | null;
  name?: string | null;
};

/**
 * Nolasa rezervāciju pēc saites (id + žetons) un, ja `confirm`, atzīmē, ka klients to apstiprināja.
 * Bez pareiza žetona datubāze neko neatgriež. Ja funkcijas vēl nav (migrācija nav palaista) — null.
 */
export async function clientBooking(id: string, token: string, confirm = false): Promise<ClientBooking | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{16,64}$/i.test(token)) return { found: false };
  const { data, error } = await supabase.rpc("client_booking", { p_id: id, p_token: token, p_confirm: confirm });
  if (error) {
    console.error("[client-booking]", error.message);
    return null;
  }
  return data as ClientBooking;
}
