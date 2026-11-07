"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isManagerRole, requireAdmin, requireMember } from "@/lib/auth";
import { slugify } from "@/lib/admin/fields";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase";
import { OFFER_STATUSES, TEAM_BUCKET, type OfferKind, type TeamFolder } from "@/lib/team/types";

/**
 * Komandas sadaļu servera darbības: scenāriji, piedāvājumi, komandas piekļuve, parole.
 * Tiesības pārbauda gan šeit (requireMember/requireAdmin), gan Supabase RLS politikās.
 */

export type TeamActionState = { error?: string; ok?: string } | undefined;

const MANAGERS = ["owner", "manager"] as const;
const text = (form: FormData, key: string, max = 20000) => {
  const v = String(form.get(key) ?? "").trim().slice(0, max);
  return v || null;
};

/* ------------------------------ Faili ------------------------------ */

/** Vienreizēja augšupielādes adrese privātajā krātuvē (pārlūks augšupielādē failu tieši). */
export async function createTeamUploadUrl(folder: TeamFolder, fileName: string) {
  const { db, role } = await requireMember();
  const safeFolder: TeamFolder = folder === "piedavajumi" || folder === "standarta" ? folder : "scenariji";
  // Scenāriju failus var augšupielādēt visa komanda, piedāvājumu — tikai vadība
  if (safeFolder !== "scenariji" && !isManagerRole(role)) return { error: "Nav tiesību." };
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const base = slugify(dot > 0 ? fileName.slice(0, dot) : fileName) || "fails";
  const path = `${safeFolder}/${Date.now()}-${base}${ext ? `.${ext}` : ""}`;
  const { data, error } = await db.storage.from(TEAM_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Neizdevās sagatavot augšupielādi." };
  return { path, token: data.token };
}

type Db = Awaited<ReturnType<typeof requireMember>>["db"];

async function removeFile(db: Db, path: string | null | undefined) {
  if (path) await db.storage.from(TEAM_BUCKET).remove([path]);
}

/** Faila lauki no formas (aizpilda FileField pēc augšupielādes). "remove_file" — dzēst esošo. */
function fileFields(form: FormData) {
  const path = text(form, "file_path", 500);
  return {
    remove: form.get("remove_file") === "1",
    fields: path
      ? { file_path: path, file_name: text(form, "file_name", 300), file_size: Number(form.get("file_size")) || null }
      : null,
  };
}

/* ------------------------------ Scenāriji ------------------------------ */

/** Jaunu scenāriju var pievienot visa komanda; labot esošu — administratore un vadība. */
export async function saveScript(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db, email, role } = await requireMember();
  if (id && !isManagerRole(role)) return { error: "Labot scenārijus var tikai Vanesa un Kristīne." };
  const title = text(form, "title", 300);
  if (!title) return { error: "Ievadiet nosaukumu." };
  const year = Number(form.get("year"));

  const row: Record<string, unknown> = {
    title,
    category: text(form, "category", 100),
    year: Number.isInteger(year) && year > 1990 && year < 2200 ? year : null,
    notes: text(form, "notes"),
    updated_at: new Date().toISOString(),
  };

  const { remove, fields } = fileFields(form);
  let previous: string | null = null;
  if (id) {
    const { data } = await db.from("scripts").select("file_path").eq("id", id).single();
    previous = data?.file_path ?? null;
  }
  if (fields) Object.assign(row, fields);
  else if (remove) Object.assign(row, { file_path: null, file_name: null, file_size: null });

  const { error } = id
    ? await db.from("scripts").update(row).eq("id", id)
    : await db.from("scripts").insert({ ...row, created_by: email });
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  if (previous && (remove || (fields && fields.file_path !== previous))) await removeFile(db, previous);

  revalidatePath("/admin/scenariji");
  return { ok: id ? "Saglabāts." : "Scenārijs pievienots." };
}

/** Dzēst var tikai administratore */
export async function deleteScript(id: string) {
  const { db } = await requireAdmin();
  const { data } = await db.from("scripts").select("file_path").eq("id", id).single();
  await db.from("scripts").delete().eq("id", id);
  await removeFile(db, data?.file_path);
  revalidatePath("/admin/scenariji");
}

/* ------------------------------ Piedāvājumi ------------------------------ */

const offerBase = (kind: OfferKind) => (kind === "template" ? "/admin/standarta-piedavajumi" : "/admin/piedavajumi");

export async function saveOffer(kind: OfferKind, id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db, email } = await requireMember([...MANAGERS]);
  const title = text(form, "title", 300);
  if (!title) return { error: "Ievadiet piedāvājuma nosaukumu." };
  const client = text(form, "client_name", 300);
  if (kind === "client" && !client) return { error: "Ievadiet klienta nosaukumu." };
  const date = text(form, "offer_date", 10);
  const status = text(form, "status", 50);

  const row: Record<string, unknown> = {
    kind,
    title,
    client_name: kind === "client" ? client : null,
    contact_person: kind === "client" ? text(form, "contact_person", 200) : null,
    contact_email: kind === "client" ? text(form, "contact_email", 200) : null,
    offer_date: kind === "client" && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    season: text(form, "season", 100),
    services: text(form, "services", 5000),
    price: text(form, "price", 500),
    status: kind === "client" && status && OFFER_STATUSES.includes(status) ? status : null,
    body: text(form, "body", 50000),
    notes: text(form, "notes"),
    template_id: text(form, "template_id", 40),
    updated_at: new Date().toISOString(),
  };

  const { remove, fields } = fileFields(form);
  let previous: string | null = null;
  if (id) {
    const { data } = await db.from("offers").select("file_path").eq("id", id).single();
    previous = data?.file_path ?? null;
  }
  if (fields) Object.assign(row, fields);
  else if (remove) Object.assign(row, { file_path: null, file_name: null, file_size: null });

  let savedId = id;
  if (id) {
    const { error } = await db.from("offers").update(row).eq("id", id);
    if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  } else {
    const { data, error } = await db.from("offers").insert({ ...row, created_by: email }).select("id").single();
    if (error || !data) return { error: `Neizdevās saglabāt: ${error?.message ?? ""}` };
    savedId = data.id;
  }
  if (previous && (remove || (fields && fields.file_path !== previous))) await removeFile(db, previous);

  revalidatePath(offerBase(kind));
  if (!id) redirect(`${offerBase(kind)}/${savedId}?saglabats=1`);
  return { ok: "Saglabāts." };
}

/** Dzēst var tikai administratore */
export async function deleteOffer(kind: OfferKind, id: string) {
  const { db } = await requireAdmin();
  const { data } = await db.from("offers").select("file_path").eq("id", id).single();
  await db.from("offers").delete().eq("id", id);
  await removeFile(db, data?.file_path);
  revalidatePath(offerBase(kind));
  redirect(`${offerBase(kind)}?dzests=1`);
}

/* ------------------------------ Komandas piekļuve ------------------------------ */

export async function grantAccess(_: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db } = await requireAdmin();
  const email = text(form, "email", 200);
  const role = String(form.get("role") ?? "");
  if (!email || !email.includes("@")) return { error: "Ievadiet e-pastu." };
  if (role !== "manager" && role !== "viewer" && role !== "animator") return { error: "Izvēlieties lomu." };

  const { error } = await db.rpc("grant_team_access", { p_email: email, p_name: text(form, "name", 100) ?? "", p_role: role });
  if (error) {
    if (error.message.includes("LIETOTAJS_NAV_ATRASTS")) {
      return { error: "Šāds lietotājs vēl nav izveidots. Vispirms izveidojiet to Supabase (sk. norādes zemāk)." };
    }
    if (error.message.includes("grant_team_access")) {
      return { error: "Datubāzē vēl nav komandas tabulu — palaidiet migrāciju 20261107090000_team_access.sql." };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/komandas-piekluve");
  return { ok: `Piekļuve piešķirta: ${email}` };
}

export async function revokeAccess(userId: string) {
  const { db } = await requireAdmin();
  await db.from("team_access").delete().eq("user_id", userId);
  revalidatePath("/admin/komandas-piekluve");
}

/* ------------------------------ Parole ------------------------------ */

export async function changePassword(_: TeamActionState, form: FormData): Promise<TeamActionState> {
  await requireMember();
  const password = String(form.get("password") ?? "");
  const repeat = String(form.get("repeat") ?? "");
  if (password.length < 10) return { error: "Parolei jābūt vismaz 10 zīmes garai." };
  if (password !== repeat) return { error: "Paroles nesakrīt." };

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { msg?: string; message?: string } | null;
    return { error: `Neizdevās nomainīt paroli${body?.msg || body?.message ? `: ${body.msg ?? body.message}` : "."}` };
  }
  return { ok: "Parole nomainīta." };
}
