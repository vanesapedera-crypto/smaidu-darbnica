import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createUserClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth-cookies";

/**
 * Administratora autentifikācija ar Supabase Auth.
 *
 * Sesija glabājas divās httpOnly sīkdatnēs (piekļuves un atjaunošanas žetons).
 * Žetona atjaunošanu veic src/proxy.ts, pirms pieprasījums sasniedz /admin lapas.
 * Administratora tiesības nosaka Supabase funkcija public.is_admin() (tabula public.admins),
 * tāpēc ar parastu Supabase lietotāju vien piekļuvi panelim iegūt nevar.
 */

export async function saveSession(session: Session) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, session.access_token, cookieOptions(session.expires_in));
  store.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export type AdminContext = {
  email: string;
  /** Supabase klients administratora vārdā (RLS atļauj rakstīt) */
  db: ReturnType<typeof createUserClient>;
};

/** Atgriež pašreizējo administratoru vai null. Rezultāts tiek kešots viena pieprasījuma ietvaros. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null; // datubāze nav pieslēgta — neviens nav autorizēts
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const db = createUserClient(token);
  const { data: isAdmin } = await db.rpc("is_admin");
  if (isAdmin !== true) return null;

  return { email: data.user.email ?? "", db };
});

/** Izmanto katrā admin lapā un servera darbībā. Neautorizētu lietotāju pāradresē uz pieteikšanos. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
