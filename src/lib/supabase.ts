import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase savienojums.
 *
 * Klienti tiek izveidoti tikai tad, kad tos pirmoreiz izmanto — nevis faila ielādes brīdī.
 * Citādi `next build` laikā (piem. Vercel, kur vides mainīgie vēl nav ievadīti) `createClient`
 * izmet kļūdu "supabaseUrl is required" jau moduļa ielādē, un būve apstājas ar
 * "Failed to collect page data for /_not-found" — pirmo lapu, kas šo failu ielādē.
 *
 * Ja mainīgie nav iestatīti, publiskā lapa rāda noklusējuma saturu (sk. lib/content/queries.ts),
 * bet pieteikumi un administrēšanas panelis nestrādā, līdz tie tiek ievadīti.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Vai ir iestatīti NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY */
export const isSupabaseConfigured = Boolean(url && publishableKey);

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase nav konfigurēts: iestatiet NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local vai Vercel → Environment Variables).",
    );
  }
}

// Serverī sesiju neglabājam klienta atmiņā — to dara sīkdatnes (sk. lib/auth.ts).
const serverAuth = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

let publicClient: SupabaseClient | undefined;
const getPublicClient = () => {
  assertConfigured();
  return (publicClient ??= createClient(url, publishableKey, { auth: serverAuth }));
};

/**
 * Publiskais klients (anonīmā loma).
 * RLS atļauj tikai: lasīt publicēto saturu un iesniegt jaunu pieteikumu.
 * Īstais klients tiek izveidots pirmajā lietošanas reizē (sk. skaidrojumu faila sākumā).
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getPublicClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Klients administratora vārdā. Pieprasījumi tiek izpildīti ar lietotāja
 * piekļuves žetonu, tāpēc Supabase RLS politikas pārbauda, vai tas ir administrators.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  assertConfigured();
  return createClient(url, publishableKey, {
    auth: serverAuth,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export const supabaseUrl = url;
export const supabasePublishableKey = publishableKey;
