"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, clearSession, saveSession } from "@/lib/auth";
import { createUserClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getEntity } from "@/lib/admin/entities";
import { parse, slugify, setPath } from "@/lib/admin/fields";
import { settingsSchemas, type SettingsKey } from "@/lib/admin/settings-schema";
import type { Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { notifyReviewRequest } from "@/lib/notify";
import { calendarEvent, pickHosts } from "@/lib/calendar";
import { atStudio } from "@/lib/bookings";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { bookingCosts, bookingPrices, costsFromText, withCostOverride } from "@/lib/pricing";
import { reviewEmailText, reviewKind, reviewUrl } from "@/lib/review";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { manifestGallery } from "@/lib/content/media";
import { missingContent, missingGallery } from "@/lib/admin/missing-content";
import { toRow } from "@/lib/content/mappers";

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

/**
 * Rezervācijas labošana panelī: kontakti, programma, datums, laiks, bērni, vieta, ceļa izdevumi un izmaksas.
 * Pārbaudes par pieejamajiem laikiem šeit nav — administrators zina, ko dara.
 * Izmaksas: ja teksts atšķiras no automātiskā aprēķina, tās saglabājas kā labotas (sk. withCostOverride);
 * tukšs lauks — atkal automātiskais aprēķins.
 */
export async function saveBookingDetails(id: string, form: FormData) {
  const { db } = await requireAdmin();
  const { data: before } = await db.from("bookings").select("*").eq("id", id).single();
  const b = before as Booking | null;
  if (!b) return;

  const date = String(form.get("event_date") ?? "").trim();
  const time = String(form.get("event_time") ?? "").trim();
  const count = String(form.get("children_count") ?? "").trim();
  const row: Record<string, unknown> = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) row.event_date = date;
  row.event_time = /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, "0") : null;
  const n = Number(count);
  row.children_count = count && Number.isInteger(n) && n > 0 && n <= 1000 ? n : null;

  // Teksta lauki (ja formā ir) — kontakti, programma, vieta, adrese
  const text = (k: string, max = 200) => (form.has(k) ? String(form.get(k) ?? "").trim().slice(0, max) || null : undefined);
  for (const [k, max] of [["parent_name", 120], ["phone", 40], ["email", 160], ["company_name", 160], ["child_age", 40], ["address", 200], ["event_city", 120]] as const) {
    const v = text(k, max);
    if (v !== undefined) row[k] = v;
  }
  // Programma: no saraksta vai ar roku ierakstīts nosaukums (piem. izrāde, kas pieteikta caur citu formu)
  if (form.has("program")) row.program = text("program_custom", 120) || text("program", 120) || null;
  const location = text("location", 60);
  if (location) row.location = location;
  const loc = (row.location as string | undefined) ?? b.location;

  // Izbraukumam — ceļa izdevumi (ja adresi neizdevās aprēķināt automātiski)
  if (loc === "Izbraukums" && form.has("travel_km")) {
    const num = (k: string) => {
      const v = String(form.get(k) ?? "").replace(",", ".").trim();
      return v === "" || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v);
    };
    row.travel_km = num("travel_km");
    row.travel_cost = num("travel_cost");
  }

  // Programmas variants (piem. "Divi rūķi") — glabājas ziņojuma rindā "Izvēle: …"
  const variant = String(form.get("variant") ?? "").trim();
  if (variant) {
    const msg = String(b.message ?? "");
    row.message = /Izvēle:[^\n]*/.test(msg) ? msg.replace(/Izvēle:[^\n]*/, `Izvēle: ${variant}`) : [msg, `Izvēle: ${variant}`].filter(Boolean).join("\n\n");
  }

  // Izmaksas: ja teksts nemainīts — paliek automātiskais aprēķins; ja labots — saglabā kā labotas; tukšs — automātiski
  if (form.has("costs")) {
    const submitted = String(form.get("costs") ?? "").replace(/\r/g, "").trim();
    const shown = String(form.get("costs_shown") ?? "").replace(/\r/g, "").trim();
    const msg = (row.message as string | undefined) ?? b.message;
    if (!submitted) row.message = withCostOverride(msg, null);
    else if (submitted !== shown) row.message = withCostOverride(msg, costsFromText(submitted));
  }

  await db.from("bookings").update(row).eq("id", id);
  revalidatePath("/admin");
}

/** Klients apstiprināja citā veidā (pa telefonu, WhatsApp) — atzīmē to panelī ar roku */
export async function markClientConfirmed(id: string) {
  const { db } = await requireAdmin();
  await db.from("bookings").update({ client_confirmed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

/**
 * Poga "Pieprasīt atsauksmi" — nosūta klientam e-pastu ar aicinājumu atstāt atsauksmi Google
 * (teksts pēc tā, vai bija telpu noma vai izklaides programma — sk. lib/review.ts) un atzīmē, kad tas nosūtīts.
 */
export async function sendReviewRequest(id: string): Promise<ActionState> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b?.email) return { error: "Pieteikumā nav e-pasta." };

  const [settings, programs] = await Promise.all([getSettings(), getServices("private")]);
  const { contact } = settings;
  const kind = reviewKind(b);
  const program = programs.find((p) => p.slug === b.program)?.title;
  const text = reviewEmailText(kind, program);
  const sent = await notifyReviewRequest({
    to: b.email,
    name: b.parent_name ?? "",
    ...text,
    // Saite uzreiz uz Google atsauksmes logu
    url: reviewUrl(contact),
    replyTo: contact.emailPrivate,
    logoUrl: absoluteUrl("/brand/logo-email-dark.png"),
    footer: { address: `${contact.address}, ${contact.city}`, phone: contact.phonePrivate, email: contact.emailPrivate, site: SITE_URL },
  });
  if (!sent) return { error: "E-pastu neizdevās nosūtīt. Mēģiniet vēlreiz vai izmantojiet WhatsApp." };

  // Ja datubāzē vēl nav kolonnas review_requested_at (migrācija nav palaista), e-pasts tik un tā ir nosūtīts
  await db.from("bookings").update({ review_requested_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
  return undefined;
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

/* ------------------------------ Trūkstošie pakalpojumi ------------------------------ */

/** Poga "Pievienot sarakstam" — ieliek datubāzē projekta saturu, kura tur vēl nav (esošos ierakstus nemaina) */
export async function importMissing(key: string) {
  const { db } = await requireAdmin();
  const missing =
    key === "galerija" ? await missingGallery(db).then((m) => m && { ...m, table: "gallery_images" }) : await missingContent(key, db);
  if (missing?.rows.length) {
    const { error } = await db.from(missing.table).insert(missing.rows);
    if (error) redirect(`/admin/${key}?kluda=${encodeURIComponent(error.message)}`);
  }
  refreshSite();
  redirect(`/admin/${key}?pievienoti=1`);
}

/* ------------------------------ Programmu attēli ------------------------------ */

/** Galerijas kategorija programmas attēliem (lai tie parādās arī attiecīgajās fotolentēs) */
const programCategory = (slug: string) => (slug.includes("ziemassvetki") ? "ziemassvetki" : "bernu-ballites");

/**
 * Programmas lapā "Pakalpojumi" pievienotie attēli — glabājas galerijā albumā ar programmas adresi (slug),
 * un programmas lapa tos rāda sadaļā "Foto". Ja albumā līdz šim bija tikai projekta bildes (nav datubāzē),
 * tās vispirms ieliek datubāzē — citādi pēc pirmās augšupielādes tās lapā vairs nerādītos.
 */
export async function addProgramImages(slug: string, images: { src: string; width: number; height: number }[], title: string, business = false) {
  const { db } = await requireAdmin();
  if (!slug) return { error: "Programmai nav adreses (slug)." };
  const { count } = await db.from("gallery_images").select("id", { count: "exact", head: true }).eq("album", slug);
  if (!count) {
    const local = manifestGallery().filter((g) => g.album === slug);
    if (local.length) await db.from("gallery_images").insert(local.map((g) => toRow(g as unknown as Record<string, unknown>)));
  }
  const { data: last } = await db.from("gallery_images").select("sort").eq("album", slug).order("sort", { ascending: false }).limit(1);
  const start = ((last?.[0]?.sort as number | undefined) ?? 0) + 1;
  const rows = images.map((img, i) => ({
    ...img,
    alt: `${title} — Smaidu Darbnīca`,
    album: slug,
    category: business ? "uznemumu-pasakumi" : programCategory(slug),
    sort: start + i,
    published: true,
  }));
  const { error } = await db.from("gallery_images").insert(rows);
  if (error) return { error: error.message };
  refreshSite();
  revalidatePath("/admin", "layout");
  return {};
}

/** Noņem attēlu no programmas (galerijas ieraksts tiek dzēsts; pats fails krātuvē paliek) */
export async function removeProgramImage(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("gallery_images").delete().eq("id", id);
  if (error) return { error: error.message };
  refreshSite();
  revalidatePath("/admin", "layout");
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

/* ------------------------------ Google kalendārs ------------------------------ */

/** Atvieno Google kalendāru — turpmāk notikumi atkal aiziet kā .ics ielūgumi */
export async function disconnectGoogle() {
  const { db } = await requireAdmin();
  await db.from("google_calendar").delete().eq("id", 1);
  revalidatePath("/admin");
}

/**
 * Poga "Ielikt Google kalendārā" — jau apstiprinātu rezervāciju (piem. apstiprinātu pirms Google kalendāra savienošanas)
 * ieliek savienotajā Google kalendārā kā labojamu notikumu. Klientam nekas netiek sūtīts; viesi (komanda) saņem ielūgumu no Google.
 * Atkārtoti spiežot, tiek atjaunots tas pats notikums (nevis izveidots jauns).
 */
export async function addToGoogleCalendar(id: string, hosts: string[]): Promise<{ error?: string; ok?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  if (b.status !== "Apstiprināta") return { error: "Kalendārā var ielikt tikai apstiprinātas rezervācijas." };

  if (!b.event_date) return { error: "Pieteikumam nav datuma." };
  const ok = await pushToGoogle(db, b, pickHosts(hosts));
  return ok ? { ok: true } : { error: "Neizdevās ielikt Google kalendārā. Pārbaudiet, vai Google kalendārs ir savienots, un mēģiniet vēlreiz." };
}

/** Ieliek (vai atjauno) rezervācijas notikumu savienotajā Google kalendārā un nosūta ielūgumus visiem viesiem */
async function pushToGoogle(db: Awaited<ReturnType<typeof requireAdmin>>["db"], b: Booking, hosts: string[] = []): Promise<boolean> {
  const isBusiness = b.inquiry_type === "business";
  const [settings, services] = await Promise.all([getSettings(), getServices(isBusiness ? "business" : "private")]);
  const slug = b.service_slug || b.program || "";
  const service = services.find((s) => s.slug === slug);
  const inVenue = !isBusiness && atStudio(b.location);
  const costs = isBusiness ? null : bookingCosts(b, service, bookingPrices(settings));
  const event = calendarEvent(b, service?.title ?? (slug || (inVenue ? "Telpu noma" : "Pieteikums")), costs);
  if (!event) return false;
  return upsertGoogleEvent(db, b.id, event, [...event.guests, ...hosts]);
}

/**
 * Poga "Nosūtīt ielūgumus vēlreiz" — visas apstiprinātās rezervācijas no šodienas uz priekšu ieliek (vai atjauno)
 * Google kalendārā, un visi viesi (Kristīne, telpu kopēja u. c.) saņem ielūgumu vēlreiz. Klientiem nekas netiek sūtīts.
 * Google kalendārā ar roku pievienotie viesi (piem. animatores) saglabājas.
 */
export async function resendAllToGoogle(): Promise<{ error?: string; done?: number; failed?: number }> {
  const { db } = await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db.from("bookings").select("*").eq("status", "Apstiprināta").gte("event_date", today).order("event_date");
  if (error) return { error: error.message };
  let done = 0;
  let failed = 0;
  for (const b of (data ?? []) as Booking[]) {
    if (await pushToGoogle(db, b)) done++;
    else failed++;
  }
  return { done, failed };
}
