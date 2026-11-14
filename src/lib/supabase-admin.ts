import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase";

/**
 * Servera klients ar Supabase slepeno atslēgu (apiet RLS). Lieto TIKAI serverī darbībām bez pieteikušās
 * administratores — piem. kad klients pats atceļ rezervāciju, notikums jāizņem no Google kalendāra.
 * Vercel → Environment Variables: SUPABASE_SECRET_KEY (Supabase → Project Settings → API Keys → Secret key).
 * null — atslēga nav iestatīta.
 */
let admin: SupabaseClient | null | undefined;
export function supabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  admin = supabaseUrl && key ? createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  return admin;
}
