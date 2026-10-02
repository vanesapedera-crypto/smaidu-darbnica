import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Serverī sesiju neglabājam klienta atmiņā — to dara sīkdatnes (sk. lib/auth.ts).
const serverAuth = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/**
 * Publiskais klients (anonīmā loma).
 * RLS atļauj tikai: lasīt publicēto saturu un iesniegt jaunu pieteikumu.
 */
export const supabase = createClient(url, publishableKey, { auth: serverAuth });

/**
 * Klients administratora vārdā. Pieprasījumi tiek izpildīti ar lietotāja
 * piekļuves žetonu, tāpēc Supabase RLS politikas pārbauda, vai tas ir administrators.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(url, publishableKey, {
    auth: serverAuth,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export const supabaseUrl = url;
export const supabasePublishableKey = publishableKey;
