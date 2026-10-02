import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * Telpu nomas aizņemtie sākuma laiki izvēlētajā datumā (piem. ["14:00"]).
 * Nolasa ar datubāzes funkciju `booked_venue_slots`, kas atgriež tikai laikus — bez klientu datiem.
 * Ja funkcija vēl nav izveidota (migrācija nav palaista) vai rodas kļūda, atgriež tukšu sarakstu,
 * un forma strādā kā iepriekš (visi laiki izvēlami).
 */
export async function bookedSlots(date: string): Promise<string[]> {
  if (!isSupabaseConfigured || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const { data, error } = await supabase.rpc("booked_venue_slots", { day: date });
  if (error) {
    console.error("[availability]", error.message);
    return [];
  }
  return ((data ?? []) as string[]).map((t) => t.slice(0, 5));
}
