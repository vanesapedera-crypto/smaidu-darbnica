"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, clearSession, saveSession } from "@/lib/auth";
import { createUserClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getEntity } from "@/lib/admin/entities";
import { parse, slugify, setPath } from "@/lib/admin/fields";
import { settingsSchemas, type SettingsKey } from "@/lib/admin/settings-schema";

/**
 * Administrēšanas paneļa servera darbības.
 * Katra darbība vispirms pārbauda administratora sesiju (requireAdmin),
 * un datubāzē raksta ar administratora žetonu, tāpēc papildus darbojas arī RLS.
 */

export type ActionState = { error?: string } | undefined;

/** Pēc satura izmaiņām pārģenerē visu publisko vietni (lapas ir kešotas). */
function refreshSite() {
  revalidatePath("/", "layout");
}

/* ------------------------------ Pieteikšanās ------------------------------ */

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Ievadiet e-pastu un paroli." };
  if (!isSupabaseConfigured) {
    return { error: "Datubāze nav pieslēgta: nav iestatīti NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: "Nepareizs e-pasts vai parole." };

  const { data: isAdmin, error: rpcError } = await createUserClient(data.session.access_token).rpc("is_admin");
  if (rpcError) return { error: "Datubāzē nav funkcijas is_admin() — palaidiet migrāciju (sk. supabase/README.md)." };
  if (isAdmin !== true) return { error: "Šim lietotājam nav administratora tiesību." };

  await saveSession(data.session);
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

/* ------------------------------ Pieteikumi ------------------------------ */

export async function saveBookingNotes(id: string, form: FormData) {
  const { db } = await requireAdmin();
  const notes = String(form.get("admin_notes") ?? "").slice(0, 5000);
  await db.from("bookings").update({ admin_notes: notes }).eq("id", id);
  revalidatePath("/admin");
}

/** Klients apstiprināja citā veidā (pa telefonu, WhatsApp) — atzīmē to panelī ar roku */
export async function markClientConfirmed(id: string) {
  const { db } = await requireAdmin();
  await db.from("bookings").update({ client_confirmed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

/* ------------------------------ Satura ieraksti ------------------------------ */

export async function saveEntity(key: string, id: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const { db } = await requireAdmin();
  const entity = getEntity(key);
  if (!entity) return { error: "Nezināms satura veids." };

  const row: Record<string, unknown> = {};
  for (const field of entity.fields) {
    if (field.type === "heading") continue;
    const value = parse(field, form);
    if (field.required && (value === "" || value === null || value === undefined)) {
      return { error: `Lauks “${field.label}” ir obligāts.` };
    }
    row[field.name] = value;
  }
  if (entity.slugFrom && "slug" in row && !row.slug) row.slug = slugify(String(row[entity.slugFrom] ?? ""));
  if ("slug" in row) row.slug = slugify(String(row.slug));
  // SEO ierakstiem adresi normalizē: "/uznemumiem/x/" → "/uznemumiem/x"
  if (key === "seo") row.path = `/${String(row.path).trim().replace(/^\/+|\/+$/g, "")}`;

  const { error } = id
    ? await db.from(entity.table).update(row).eq("id", id)
    : await db.from(entity.table).insert(row);

  if (error) {
    return {
      error: error.code === "23505" ? "Ieraksts ar šādu adresi (slug) jau eksistē." : `Neizdevās saglabāt: ${error.message}`,
    };
  }

  refreshSite();
  redirect(`/admin/${key}?saglabats=1`);
}

export async function deleteEntity(key: string, id: string) {
  const { db } = await requireAdmin();
  const entity = getEntity(key);
  if (!entity) return;
  await db.from(entity.table).delete().eq("id", id);
  refreshSite();
  redirect(`/admin/${key}?dzests=1`);
}

/** Galerijas masveida pievienošana pēc attēlu augšupielādes. */
export async function addGalleryImages(
  images: { src: string; width: number; height: number; alt: string }[],
  album: string,
  category: string,
) {
  const { db } = await requireAdmin();
  const rows = images.map((img, i) => ({ ...img, album, category, sort: 100 + i, published: true }));
  const { error } = await db.from("gallery_images").insert(rows);
  if (error) return { error: error.message };
  refreshSite();
  revalidatePath("/admin/galerija");
  return {};
}

/* ------------------------------ Iestatījumi ------------------------------ */

export async function saveSettings(key: SettingsKey, _: ActionState, form: FormData): Promise<ActionState> {
  const { db } = await requireAdmin();
  const schema = settingsSchemas[key];
  if (!schema) return { error: "Nezināma sadaļa." };

  const value: Record<string, unknown> = {};
  // Lauki ar punktu nosaukumā (piem. "servicePhotos.mazulu-zona") saglabājas kā iekļauti objekti
  for (const field of schema.fields) if (field.type !== "heading") setPath(value, field.name, parse(field, form));

  const { error } = await db.from("site_settings").upsert({ key, value });
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };

  refreshSite();
  redirect(`/admin/iestatijumi/${key}?saglabats=1`);
}

/* ------------------------------ Attēlu augšupielāde ------------------------------ */

/**
 * Izveido vienreizēju augšupielādes adresi Supabase Storage.
 * Pārlūks attēlu augšupielādē tieši krātuvē — tā netiek pārsniegts
 * servera darbību pieprasījuma izmēra ierobežojums.
 */
export async function createUploadUrl(fileName: string, folder: string, ext: "webp" | "svg" = "webp") {
  const { db } = await requireAdmin();
  const safeFolder = slugify(folder) || "uploads";
  const extension = ext === "svg" ? "svg" : "webp";
  const path = `${safeFolder}/${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, "")) || "attels"}.${extension}`;
  const { data, error } = await db.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Neizdevās sagatavot augšupielādi." };
  const { data: pub } = db.storage.from("media").getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}
