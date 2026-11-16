import { isSupabaseConfigured, supabase } from "./supabase";
import { PROGRAM_SLOTS } from "./bookings";
import { VENUE_TIMES } from "./pricing";

/** "14:00" → minūtes */
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
/** Vai laika posmi pārklājas (ilgumi stundās) */
const overlaps = (a: string, aHours: number, b: string, bHours: number) => mins(a) < mins(b) + bHours * 60 && mins(b) < mins(a) + aHours * 60;
/** Programmas mūsu telpās ar konkrētiem laikiem — to laikā telpu noma aizņemta, un otrādi */
const STUDIO_PROGRAMS: Record<string, number> = { "ziemassvetki-tukums": 2 };

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
  const starts = ((data ?? []) as string[]).map((t) => t.slice(0, 5));
  // Telpas aizņem arī programmas mūsu telpās (piem. Ziemassvētki klasēm 15:00–17:00 aizņem telpu nomu 14:00–17:00):
  // aizņemts ir katrs telpu nomas laiks, kas pārklājas ar kādu rezervāciju (piesardzīgi — katru skaitām 3 h)
  const overlapping = VENUE_TIMES.filter((t) => starts.some((s) => overlaps(t, 3, s, 3)));
  return [...new Set([...starts, ...overlapping])];
}

/**
 * Programmas jau rezervētie laiki (piem. ["2026-12-14 09:00"]) programmām ar konkrētiem laikiem (PROGRAM_SLOTS).
 * Nolasa ar datubāzes funkciju `booked_program_slots` (sk. migrāciju 20261014090000) — tikai laikus, bez klientu datiem.
 * Ja funkcijas vēl nav, atgriež tukšu sarakstu (visi laiki izvēlami).
 */
export async function bookedProgramSlots(program: string): Promise<string[]> {
  if (!isSupabaseConfigured || !/^[a-z0-9-]+$/.test(program)) return [];
  const { data, error } = await supabase.rpc("booked_program_slots", { prog: program });
  if (error) {
    console.error("[availability]", error.message);
    return [];
  }
  const own = ((data ?? []) as string[]).map((t) => t.slice(0, 16));
  // Programma mūsu telpās: laiks aizņemts arī tad, ja tajā laikā telpas jau rezervētas (telpu noma u. c.)
  const hours = STUDIO_PROGRAMS[program];
  if (!hours) return own;
  const extra: string[] = [];
  for (const d of PROGRAM_SLOTS[program] ?? []) {
    const { data: day } = await supabase.rpc("booked_venue_slots", { day: d.date });
    const starts = ((day ?? []) as string[]).map((t) => t.slice(0, 5));
    for (const t of d.times) if (starts.some((s) => overlaps(t, hours, s, 3))) extra.push(`${d.date} ${t}`);
  }
  return [...new Set([...own, ...extra])];
}

/**
 * Programmām ar laika logiem (DAY_RULES): rezervētie laiki ar variantu — "2026-12-14 10:00|Divi rūķi".
 * Ja datubāzē vēl nav funkcijas booked_program_variants, ņem laikus bez varianta (booked_program_slots).
 */
export async function bookedProgramVariants(program: string): Promise<string[]> {
  if (!isSupabaseConfigured || !/^[a-z0-9-]+$/.test(program)) return [];
  const { data, error } = await supabase.rpc("booked_program_variants", { prog: program });
  if (error) return (await bookedProgramSlots(program)).map((t) => `${t}|`);
  return (data ?? []) as string[];
}
