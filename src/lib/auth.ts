import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createUserClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth-cookies";
import { ALL_SECTIONS, SECTIONS, isSection, type Section } from "@/lib/team/sections";

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
  manager: "Var labot",
  viewer: "Tikai skatīt",
  animator: "Tikai skatīt",
};

export type MemberContext = {
  email: string;
  role: TeamRole;
  /** Sadaļas, kuras lietotājs redz (administratorei — visas) */
  sections: Section[];
  /** Supabase klients lietotāja vārdā (RLS nosaka, ko drīkst lasīt un rakstīt) */
  db: ReturnType<typeof createUserClient>;
};

/** Administratora konteksts — tāds pats kā komandas loceklim, bet vienmēr ar lomu "owner". */
export type AdminContext = MemberContext;

/** "Var labot": administratore un vadība (role = manager) — piedāvājumi, standarta piedāvājumi, scenāriju labošana */
export const isManagerRole = (role: TeamRole) => role === "owner" || role === "manager";

/** Vai lietotājs redz sadaļu */
export const canSee = (m: Pick<MemberContext, "role" | "sections">, section: Section) => m.role === "owner" || m.sections.includes(section);

/** Kur pēc pieteikšanās nonāk lietotājs: administratore — pieteikumi; pārējie — pirmā sadaļa, ko redz */
export function homeFor(m: Pick<MemberContext, "role" | "sections">): string {
  if (m.role === "owner") return "/admin";
  return SECTIONS.find((s) => !s.hidden && m.sections.includes(s.key))?.href ?? "/admin/parole";
}

/**
 * Nosaka lietotāja lomu un sadaļas. Ja datubāzē vēl nav funkcijas team_role() (migrācija 20261107090000
 * nav palaista), izmanto veco is_admin() — tad panelī var ieiet tikai administrators.
 * Ja nav kolonnas sections (migrācija 20261107120000 nav palaista) — sadaļas pēc lomas.
 */
export async function accessOf(db: ReturnType<typeof createUserClient>): Promise<Pick<MemberContext, "role" | "sections"> | null> {
  const { data, error } = await db.rpc("team_role");
  if (error) {
    const { data: isAdmin } = await db.rpc("is_admin");
    return isAdmin === true ? { role: "owner", sections: ALL_SECTIONS } : null;
  }
  if (data === "owner") return { role: "owner", sections: ALL_SECTIONS };
  if (data !== "manager" && data !== "viewer" && data !== "animator") return null;

  const { data: row, error: rowError } = await db.from("team_access").select("sections").maybeSingle();
  const sections = !rowError && Array.isArray(row?.sections)
    ? (row.sections as unknown[]).filter(isSection)
    : data === "manager"
      ? ALL_SECTIONS
      : (["kalendars", "standarta", "scenariji"] as Section[]);
  return { role: data, sections };
}

/** Atgriež pašreizējo komandas locekli (jebkura loma) vai null. Kešots viena pieprasījuma ietvaros. */
export const getMember = cache(async (): Promise<MemberContext | null> => {
  if (!isSupabaseConfigured) return null; // datubāze nav pieslēgta — neviens nav autorizēts
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const db = createUserClient(token);
  const access = await accessOf(db);
  if (!access) return null;

  return { email: data.user.email ?? "", ...access, db };
});

/** Atgriež pašreizējo administratoru (loma "owner") vai null. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const member = await getMember();
  return member?.role === "owner" ? member : null;
});

/**
 * Izmanto administratora lapās un darbībās. Neautorizētu lietotāju pāradresē uz pieteikšanos,
 * komandas locekli bez administratora tiesībām — uz viņa sākumlapu.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const member = await getMember();
  if (!member) redirect("/admin/login");
  if (member.role !== "owner") redirect(homeFor(member));
  return member;
}

/** Jebkurš komandas loceklis (piem. paroles maiņa). */
export async function requireMember(): Promise<MemberContext> {
  const member = await getMember();
  if (!member) redirect("/admin/login");
  return member;
}

/**
 * Komandas sadaļas lapa vai darbība: lietotājam jāredz sadaļa; `edit` — jābūt arī tiesībām labot.
 * Citādi — uz viņa sākumlapu.
 */
export async function requireSection(section: Section, edit = false): Promise<MemberContext> {
  const member = await requireMember();
  if (!canSee(member, section) || (edit && !isManagerRole(member.role))) redirect(homeFor(member));
  return member;
}
