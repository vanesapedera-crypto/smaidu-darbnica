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
 * Lomu nosaka Supabase funkcija public.team_role(): "owner" (tabula public.admins),
 * "manager" vai "viewer" (tabula public.team_access). Ar parastu Supabase lietotāju vien
 * piekļuvi panelim iegūt nevar.
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

export type TeamRole = "owner" | "manager" | "viewer" | "animator";

export const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Administratore",
  manager: "Vadība",
  viewer: "Telpas",
  animator: "Animators",
};

export type MemberContext = {
  email: string;
  role: TeamRole;
  /** Supabase klients lietotāja vārdā (RLS nosaka, ko drīkst lasīt un rakstīt) */
  db: ReturnType<typeof createUserClient>;
};

/** Administratora konteksts — tāds pats kā komandas loceklim, bet vienmēr ar lomu "owner". */
export type AdminContext = MemberContext;

/** Vadība (Kristīne) un administratore: piedāvājumi, klientu vēsture, scenāriju labošana */
export const isManagerRole = (role: TeamRole) => role === "owner" || role === "manager";

/** Kur pēc pieteikšanās nonāk katra loma */
export const homeFor = (role: TeamRole) => (role === "owner" ? "/admin" : "/admin/kalendars");

/**
 * Nosaka lietotāja lomu. Ja datubāzē vēl nav funkcijas team_role() (migrācija 20261107090000
 * nav palaista), izmanto veco is_admin() — tad panelī var ieiet tikai administrators.
 */
export async function roleOf(db: ReturnType<typeof createUserClient>): Promise<TeamRole | null> {
  const { data, error } = await db.rpc("team_role");
  if (!error) return data === "owner" || data === "manager" || data === "viewer" || data === "animator" ? data : null;
  const { data: isAdmin } = await db.rpc("is_admin");
  return isAdmin === true ? "owner" : null;
}

/** Atgriež pašreizējo komandas locekli (jebkura loma) vai null. Kešots viena pieprasījuma ietvaros. */
export const getMember = cache(async (): Promise<MemberContext | null> => {
  if (!isSupabaseConfigured) return null; // datubāze nav pieslēgta — neviens nav autorizēts
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const db = createUserClient(token);
  const role = await roleOf(db);
  if (!role) return null;

  return { email: data.user.email ?? "", role, db };
});

/** Atgriež pašreizējo administratoru (loma "owner") vai null. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const member = await getMember();
  return member?.role === "owner" ? member : null;
});

/**
 * Izmanto administratora lapās un darbībās. Neautorizētu lietotāju pāradresē uz pieteikšanos,
 * komandas locekli bez administratora tiesībām — uz viņa sākumlapu (kalendāru).
 */
export async function requireAdmin(): Promise<AdminContext> {
  const member = await getMember();
  if (!member) redirect("/admin/login");
  if (member.role !== "owner") redirect(homeFor(member.role));
  return member;
}

/** Izmanto komandas lapās. `roles` — kuras lomas drīkst atvērt (pēc noklusējuma visas). */
export async function requireMember(roles?: TeamRole[]): Promise<MemberContext> {
  const member = await getMember();
  if (!member) redirect("/admin/login");
  if (roles && !roles.includes(member.role)) redirect(homeFor(member.role));
  return member;
}
