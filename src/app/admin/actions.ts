"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, clearSession, saveSession, accessOf, homeFor } from "@/lib/auth";
import { createUserClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getEntity } from "@/lib/admin/entities";
import { parse, slugify, setPath } from "@/lib/admin/fields";
import { settingsSchemas, type SettingsKey } from "@/lib/admin/settings-schema";
import type { Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { notifyClientRejected, notifyReviewRequest } from "@/lib/notify";
import { sendConfirmation } from "@/lib/booking-confirm";
import { ensureVenueStaff, syncStaff } from "@/lib/staff";
import { whenLabel } from "@/lib/dates";
import { CALENDAR_HOSTS, CALENDAR_INVITES, calendarEvent, hostNames, pickHosts, withVenueStaff } from "@/lib/calendar";
import { atStudio, hostsOf, withEditedMessage, withHostsLine } from "@/lib/bookings";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { removeBookingFromCalendars } from "@/lib/calendar-cancel";
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

  const access = await accessOf(createUserClient(data.session.access_token));
  if (!access) return { error: "Šim lietotājam nav piekļuves panelim." };

  await saveSession(data.session);
  redirect(homeFor(access));
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
  revalidatePath("/admin", "layout");
}

/** Atcelšanas iemesls (pie atceltajām rezervācijām) */
export async function saveCancelReason(id: string, form: FormData) {
  const { db } = await requireAdmin();
  const reason = String(form.get("cancel_reason") ?? "").trim().slice(0, 1000) || null;
  await db.from("bookings").update({ cancel_reason: reason }).eq("id", id);
  revalidatePath("/admin", "layout");
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

  // Ziņojums (pieteikuma teksts) — labots ar roku; sistēmas rindas (izmaksas, kas vada) saglabājas
  if (form.has("message_text")) {
    row.message = withEditedMessage(b.message, String(form.get("message_text") ?? "").replace(/\r/g, "").slice(0, 5000)) || null;
  }

  // Programmas variants (piem. "Divi rūķi") — glabājas ziņojuma rindā "Izvēle: …"
  const variant = String(form.get("variant") ?? "").trim();
  if (variant) {
    const msg = String((row.message as string | null | undefined) ?? b.message ?? "");
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

  // Kas vada programmu (izvēles rūtiņas "hosts"; "hosts_shown" — lauks bija formā)
  let hostEmails: string[] | null = null;
  if (form.has("hosts_shown")) {
    hostEmails = withVenueStaff({ ...b, ...row } as Booking, pickHosts(form.getAll("hosts").filter((v): v is string => typeof v === "string")));
    row.message = withHostsLine((row.message as string | undefined) ?? b.message, hostNames(hostEmails));
  }

  await db.from("bookings").update(row).eq("id", id);
  // Kas piedalās: jaunajiem — jautājums "Vai vari piedalīties?", noņemtajiem — ieraksts dzēsts
  if (hostEmails) await syncStaff(db, { ...b, ...row } as Booking, hostEmails).catch((e) => console.error("[staff]", e));
  revalidatePath("/admin", "layout");
}

/** Klients apstiprināja citā veidā (pa telefonu, WhatsApp) — atzīmē to panelī ar roku */
export async function markClientConfirmed(id: string) {
  const { db } = await requireAdmin();
  await db.from("bookings").update({ client_confirmed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
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
  // Komandas grafiks tiek apstiprināts sadaļā "Pieteikumi" — pēc saglabāšanas atpakaļ uz to
  redirect(key === "grafiks" ? "/admin" : `/admin/${key}?saglabats=1`);
}

/** Komandas grafika pasākums — apstiprināt (komanda to redz kalendārā). id tukšs — visus vēl neapstiprinātos */
export async function publishTeamEvent(id: string | null) {
  const { db } = await requireAdmin();
  const q = db.from("team_events").update({ published: true });
  await (id ? q.eq("id", id) : q.eq("published", false));
  revalidatePath("/admin", "layout");
}

/** Komandas grafika pasākums — atcelt (piem. ja dublējas): izdzēš to pavisam */
export async function cancelTeamEvent(id: string) {
  const { db } = await requireAdmin();
  await db.from("team_events").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function deleteEntity(key: string, id: string) {
  const { db } = await requireAdmin();
  const entity = getEntity(key);
  if (!entity) return;
  await db.from(entity.table).delete().eq("id", id);
  refreshSite();
  redirect(key === "grafiks" ? "/admin" : `/admin/${key}?dzests=1`);
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

/** Noņem citu galerijas albumu no pakalpojuma lapas (pašas bildes galerijā paliek) */
export async function removeServiceAlbum(serviceId: string, album: string) {
  const { db } = await requireAdmin();
  const { data } = await db.from("services").select("albums").eq("id", serviceId).maybeSingle();
  const albums = Array.isArray(data?.albums) ? (data.albums as string[]) : [];
  const { error } = await db.from("services").update({ albums: albums.filter((a) => a !== album) }).eq("id", serviceId);
  if (error) return { error: error.message };
  refreshSite();
  revalidatePath("/admin", "layout");
  return {};
}

/** Uzņēmumu pakalpojuma lapas bilžu režģis (Iestatījumi → Uzņēmumiem → Pakalpojumu lapu bildes) */
export async function setServicePhotos(slug: string, change: { add?: string[]; remove?: string }) {
  const { db } = await requireAdmin();
  const settings = await getSettings();
  const all = { ...settings.business.servicePhotos };
  let list = [...(all[slug] ?? [])];
  if (change.remove) list = list.filter((s) => s !== change.remove);
  if (change.add) list = [...list, ...change.add];
  all[slug] = list;
  const { data } = await db.from("site_settings").select("value").eq("key", "business").maybeSingle();
  const value = { ...((data?.value as Record<string, unknown>) ?? {}), servicePhotos: all };
  const { error } = await db.from("site_settings").upsert({ key: "business", value });
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
  revalidatePath("/admin", "layout");
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
  const picked = withVenueStaff(b, pickHosts(hosts));
  if (picked.length) {
    b.message = withHostsLine(b.message, hostNames(picked));
    await db.from("bookings").update({ message: b.message }).eq("id", id);
    await syncStaff(db, b, picked).catch((e) => console.error("[staff]", e));
    revalidatePath("/admin", "layout");
  }
  const ok = await pushToGoogle(db, b, picked);
  return ok ? { ok: true } : { error: "Neizdevās ielikt Google kalendārā. Pārbaudiet, vai Google kalendārs ir savienots, un mēģiniet vēlreiz." };
}

/** Atceltai rezervācijai — izņem notikumu no visu iesaistīto kalendāriem (sk. removeBookingFromCalendars) */
export async function removeFromCalendars(id: string): Promise<{ error?: string; ok?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  if (!b.event_date) return { error: "Pieteikumam nav datuma." };
  const ok = await removeBookingFromCalendars(db, b);
  return ok ? { ok: true } : { error: "Neizdevās. Mēģiniet vēlreiz." };
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
  return upsertGoogleEvent(db, b.id, event, CALENDAR_INVITES ? [...event.guests, ...hosts] : []);
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
  const list = (data ?? []) as Booking[];
  // Kas piedalās katrā pasākumā (bez tām, kas atbildēja "Nevaru"); ja ierakstu nav — vārdi no rindas "Piedalās"
  const { data: staff } = list.length
    ? await db.from("booking_staff").select("booking_id, email, status").in("booking_id", list.map((b) => b.id))
    : { data: [] };
  const rows = (staff ?? []) as { booking_id: string; email: string; status: string }[];
  let done = 0;
  let failed = 0;
  for (const b of list) {
    const mine = rows.filter((r) => r.booking_id === b.id && r.status !== "nevar").map((r) => r.email);
    const named = hostsOf(b.message).split(/,\s*/);
    const hosts = withVenueStaff(b, mine.length ? mine : CALENDAR_HOSTS.filter((h) => named.includes(h.name)).map((h) => h.email));
    if (await pushToGoogle(db, b, hosts)) done++;
    else failed++;
  }
  revalidatePath("/admin", "layout");
  return { done, failed };
}



/* ------------------------------ Nevaram uzņemt / nodrošināt programmu ------------------------------ */

/** Pieteikuma programmas nosaukums un vai tā ir telpu noma ar programmu */
async function programInfo(db: Awaited<ReturnType<typeof requireAdmin>>["db"], b: Booking) {
  const slug = b.program || b.service_slug || "";
  const services = await getServices(b.inquiry_type === "business" ? "business" : "private");
  return { slug, title: services.find((s) => s.slug === slug)?.title ?? slug, venue: b.inquiry_type !== "business" && atStudio(b.location) };
}

/**
 * Telpas varam, programmu — nē (piem. visas animatores citā pasākumā): programmu noņem, izmaksas pārrēķinās
 * (tikai telpu noma), rezervāciju apstiprina un klientam aiziet parastais apstiprinājums ar piebildi par programmu.
 */
export async function approveWithoutProgram(id: string): Promise<{ error?: string; ok?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  const { slug, title, venue } = await programInfo(db, b);
  if (!venue || !slug) return { error: "Šis nav telpu nomas pieteikums ar izklaides programmu." };

  const note = `Izklaides programmu “${title}” nevarējām nodrošināt — apstiprināta tikai telpu noma.`;
  const message = [b.message?.trim(), note].filter(Boolean).join("\n\n");
  const now = new Date().toISOString();
  const update = { program: null, service_slug: null, message, status: "Apstiprināta", confirmation_sent_at: b.email ? now : null, client_confirmed_at: null, client_reminded_at: null, client_cancelled_at: null };
  const { error } = await db.from("bookings").update(update).eq("id", id);
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };

  const updated = { ...b, ...update } as Booking;
  await sendConfirmation(updated, [], db, `Diemžēl izklaides programmu “${title}” izvēlētajā laikā nevaram nodrošināt — visas mūsu animatores jau ir aizņemtas. Telpas jums ir rezervētas. Ja vēlaties citu programmu vai citu laiku, sazinieties ar mums.`).catch((e) =>
    console.error("[approveWithoutProgram]", e),
  );
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * Atteikt pieteikumu: statuss "Atcelta" (pieteikums nepazūd — atceltajos), klientam — pieklājīgs e-pasts.
 * Ja rezervācija jau bija apstiprināta — notikumu izņem no kalendāriem.
 */
export async function rejectBooking(id: string): Promise<{ error?: string; ok?: boolean; emailed?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  const { slug, title } = await programInfo(db, b);
  const { error } = await db.from("bookings").update({ status: "Atcelta" }).eq("id", id);
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  if (b.status === "Apstiprināta" && b.event_date) await removeBookingFromCalendars(db, b).catch(() => false);

  let emailed = false;
  if (b.email) {
    const { contact } = await getSettings();
    const isBusiness = b.inquiry_type === "business";
    const when = whenLabel(b.event_date, b.event_time, isBusiness ? null : b.location);
    emailed = await notifyClientRejected({
      to: b.email,
      name: b.parent_name ?? "",
      subject: "Par jūsu pieteikumu — Smaidu Darbnīca",
      paragraphs: [
        `Paldies par jūsu pieteikumu${slug ? ` (“${title}”)` : ""}${when ? ` ${when}` : ""}!`,
        slug
          ? "Diemžēl izvēlētajā datumā un laikā nevaram nodrošināt izklaides programmu — visas mūsu animatores jau ir aizņemtas citā pasākumā."
          : "Diemžēl izvēlētajā datumā un laikā nevaram jūs uzņemt.",
        "Ja jums der cits datums vai laiks, ļoti priecāsimies palīdzēt — atbildiet uz šo e-pastu vai zvaniet mums.",
      ],
      replyTo: contact.emailPrivate,
      logoUrl: absoluteUrl("/brand/logo-email-dark.png"),
      footer: {
        address: `${contact.address}, ${contact.city}`,
        phone: isBusiness ? contact.phoneBusiness : contact.phonePrivate,
        email: isBusiness ? contact.email : contact.emailPrivate,
        site: SITE_URL,
      },
    });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, emailed };
}


/* ------------------------------ Vispirms komanda, tad klients ------------------------------ */

/** "Jautāt komandai": saglabā, kas piedalās, un atzīmētajām aiziet jautājums. Klientam vēl nekas netiek sūtīts. */
export async function askStaff(id: string, emails: string[]): Promise<{ error?: string; ok?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  const picked = withVenueStaff(b, pickHosts(emails));
  if (!picked.length) return { error: "Atzīmējiet vismaz vienu." };
  const message = withHostsLine(b.message, hostNames(picked));
  await db.from("bookings").update({ message }).eq("id", id);
  await syncStaff(db, { ...b, message }, picked);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * "Apstiprināt un nosūtīt klientam": statuss "Apstiprināta", klientam — apstiprinājuma e-pasts ar pogu,
 * komandai (tām, kas atbildēja "Varu") — kalendāra notikums.
 */
export async function approveAndNotify(id: string): Promise<{ error?: string; ok?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  if (b.status === "Apstiprināta") return { error: "Jau apstiprināta." };
  const { data: staff } = await db.from("booking_staff").select("email, status").eq("booking_id", id);
  const hosts = ((staff ?? []) as { email: string; status: string }[]).filter((r) => r.status === "var").map((r) => r.email);
  const now = new Date().toISOString();
  const update = { status: "Apstiprināta", confirmation_sent_at: b.email ? now : null, client_confirmed_at: null, client_reminded_at: null, client_cancelled_at: null };
  const { error } = await db.from("bookings").update(update).eq("id", id);
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  await sendConfirmation({ ...b, ...update } as Booking, hosts, db).catch((e) => console.error("[approveAndNotify]", e));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * "Nosūtīt klientam atjaunotu apstiprinājumu" — pēc izmaiņām (datums, laiks, bērnu skaits u.c.):
 * klientam aiziet atjaunots e-pasts ar visu aktuālo informāciju un pogu apstiprināt vēlreiz,
 * Google kalendārā tas pats notikums tiek atjaunots (nevis izveidots jauns).
 */
export async function resendUpdatedConfirmation(id: string): Promise<{ error?: string; ok?: boolean; emailed?: boolean }> {
  const { db } = await requireAdmin();
  const { data } = await db.from("bookings").select("*").eq("id", id).single();
  const b = data as Booking | null;
  if (!b) return { error: "Pieteikums nav atrasts." };
  if (b.status !== "Apstiprināta") return { error: "Atjaunotu apstiprinājumu var sūtīt tikai apstiprinātām rezervācijām." };
  const { data: staff } = await db.from("booking_staff").select("email, status").eq("booking_id", id);
  const fromStaff = ((staff ?? []) as { email: string; status: string }[]).filter((r) => r.status !== "nevar").map((r) => r.email);
  const named = hostsOf(b.message).split(/,\s*/);
  const hosts = withVenueStaff(b, fromStaff.length ? fromStaff : CALENDAR_HOSTS.filter((h) => named.includes(h.name)).map((h) => h.email));
  // Klients apstiprina vēlreiz (jaunā informācija); atgādinājums pēc 3 dienām — no jauna
  const update = { confirmation_sent_at: b.email ? new Date().toISOString() : b.confirmation_sent_at, client_confirmed_at: null, client_reminded_at: null };
  await db.from("bookings").update(update).eq("id", id);
  await sendConfirmation({ ...b, ...update } as Booking, hosts, db, undefined, true).catch((e) => console.error("[resendUpdated]", e));
  revalidatePath("/admin", "layout");
  return { ok: true, emailed: Boolean(b.email) };
}

/* ------------------------------ Rezervācija, ko administratore pievieno pati (piem. pa telefonu) ------------------------------ */

/**
 * "Pievienot rezervāciju": jauns pieteikums ar statusu "Jauns" — tālāk tāpat kā no mājaslapas
 * (kas piedalās → "Jautāt komandai" → "Apstiprināt un nosūtīt klientam"). Uzreiz arī Google kalendārā kā "🆕 JAUNS".
 */
export async function createManualBooking(form: FormData) {
  const { db } = await requireAdmin();
  const str = (k: string) => String(form.get(k) ?? "").trim() || null;
  const num = (k: string) => {
    const n = Number(String(form.get(k) ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const isBusiness = form.get("inquiry_type") === "business";
  const slug = str("program");
  const location = isBusiness ? null : (str("location") ?? "Smaidu Darbnīcā");
  const row: Record<string, unknown> = {
    id: crypto.randomUUID(),
    status: "Jauns",
    inquiry_type: isBusiness ? "business" : "private",
    parent_name: str("parent_name"),
    phone: str("phone"),
    email: str("email"),
    company_name: isBusiness ? str("company_name") : null,
    program: isBusiness ? null : slug,
    service_slug: isBusiness ? slug : null,
    event_date: str("event_date"),
    event_time: str("event_time"),
    location,
    address: str("address"),
    event_city: isBusiness ? str("event_city") : null,
    children_count: isBusiness ? null : num("children_count"),
    participants: isBusiness ? num("children_count") : null,
    child_age: isBusiness ? null : str("child_age"),
    message: str("message"),
    admin_notes: [str("admin_notes"), "Pievienots panelī (pa telefonu)"].filter(Boolean).join("\n"),
  };
  // Kas piedalās (izvēles rūtiņas) + telpu nomā vienmēr Keita
  const hosts = withVenueStaff(row as unknown as Booking, pickHosts(form.getAll("hosts").filter((v): v is string => typeof v === "string")));
  if (hosts.length) row.message = withHostsLine(row.message as string | null, hostNames(hosts));
  const approveNow = form.get("approve") === "1";
  if (!row.parent_name && !row.company_name) redirect("/admin/kalendars/jauns?kluda=vards");
  if (!row.event_date) redirect("/admin/kalendars/jauns?kluda=datums");

  // Izbraukumam — ceļa izdevumi (ja karte neatbild, tos var ievadīt vēlāk sadaļā "Labot informāciju")
  if (!isBusiness && location === "Izbraukums" && row.address) {
    const { quoteTravel } = await import("@/lib/travel");
    const quote = await Promise.race([quoteTravel(String(row.address)).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 12000))]);
    if (quote) Object.assign(row, { travel_km: quote.roundTripKm, travel_cost: quote.cost });
  }

  // Tāda pati rezervācija pēdējo 10 minūšu laikā jau saglabāta (piem. poga nospiesta vairākas reizes) — otro neveido
  {
    let dup = db
      .from("bookings")
      .select("id")
      .eq("event_date", String(row.event_date))
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1);
    dup = row.company_name ? dup.eq("company_name", String(row.company_name)) : dup.eq("parent_name", String(row.parent_name));
    dup = row.event_time ? dup.eq("event_time", String(row.event_time)) : dup.is("event_time", null);
    const { data: existing } = await dup;
    if (existing?.length) redirect("/admin/kalendars?pievienots=1");
  }

  const { error } = await db.from("bookings").insert(row);
  if (error) redirect(`/admin/kalendars/jauns?kluda=${encodeURIComponent(error.message)}`);

  // Uzreiz apstiprināta (piem. jau sarunāts pa telefonu) — klientam e-pastu nesūta
  if (approveNow) {
    const { error: upd } = await db.from("bookings").update({ status: "Apstiprināta" }).eq("id", row.id as string);
    if (!upd) row.status = "Apstiprināta";
  }
  const b = row as unknown as Booking;

  // Google kalendārā: apstiprinātai — parasts notikums (viesus pievieno pēc atbildes "Varu"), citādi — "🆕 JAUNS" dublējums
  try {
    if (b.status === "Apstiprināta") await pushToGoogle(db, b, withVenueStaff(b, []));
    else {
      const services = await getServices(isBusiness ? "business" : "private");
      const title = services.find((s) => s.slug === slug)?.title ?? "";
      const event = calendarEvent(b, title || (atStudio(b.location) ? "Telpu noma" : isBusiness ? "Pasākums" : "Pieteikums"));
      if (event) await upsertGoogleEvent(db, b.id, { ...event, text: `🆕 JAUNS · ${event.text}` }, []);
    }
  } catch (e) {
    console.error("[manual booking] google", e);
  }
  // Atzīmētajām — jautājums "Vai vari piedalīties?" (Keitai telpu nomā — uzreiz "Varu")
  if (hosts.length) await syncStaff(db, b, hosts).catch((e) => console.error("[manual booking] staff", e));
  else await ensureVenueStaff(db, b).catch((e) => console.error("[manual booking] staff", e));
  revalidatePath("/admin", "layout");
  redirect("/admin/kalendars?pievienots=1");
}

/**
 * "Pievienot meitenes": ar roku ievadītu izbraukumu (tabula team_events, piem. "Olaines egles iedegšana")
 * pārvērš par rezervāciju — tad tai var atzīmēt, kas piedalās, jautāt "Varu/Nevaru", sūtīt atgādinājumus un Google ielūgumus.
 * Klientam nekas netiek sūtīts. Vārdi no lauka "Piedalās" tiek atzīmēti automātiski (jautājumu sūta poga "Jautāt komandai").
 */
export async function convertTeamEvent(id: string) {
  const { db } = await requireAdmin();
  const title = await convertOne(db, id);
  revalidatePath("/admin", "layout");
  redirect(title ? `/admin/kalendars?q=${encodeURIComponent(title)}` : "/admin/kalendars");
}

/** Visus ar roku ievadītos izbraukumus uzreiz pārvērš par rezervācijām — tad visus pasākumus labo vienādi */
export async function convertAllTeamEvents() {
  const { db } = await requireAdmin();
  const { data } = await db.from("team_events").select("id");
  for (const r of (data ?? []) as { id: string }[]) await convertOne(db, r.id);
  revalidatePath("/admin", "layout");
  redirect("/admin/kalendars?parverstie=1");
}

async function convertOne(db: Awaited<ReturnType<typeof requireAdmin>>["db"], id: string): Promise<string | null> {
  const { data: e } = await db.from("team_events").select("*").eq("id", id).maybeSingle();
  if (!e) return null;
  const ev = e as { event_date: string; time: string | null; title: string; place: string | null; team: string | null; details: string | null };
  const m = /(\d{1,2})[.:](\d{2})/.exec(ev.time ?? "");
  const time = m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
  const norm = (t: string) => t.toLowerCase().replace(/[.(),]/g, " ").replace(/\s+/g, " ").trim();
  const team = ` ${norm(ev.team ?? "")} `;
  const named = CALENDAR_HOSTS.filter((h) => team.includes(` ${norm(h.name)} `));
  const message = withHostsLine(
    [ev.details, ev.time && ev.time !== time ? `Laiks: ${ev.time}` : "", ev.team ? `Komanda (no izbraukuma ieraksta): ${ev.team}` : ""].filter(Boolean).join("\n\n"),
    hostNames(named.map((h) => h.email)),
  );
  // Datubāze ļauj ievietot tikai statusā "Jauns" (RLS) — tāpēc vispirms "Jauns", tad uzreiz "Apstiprināta"
  const newId = crypto.randomUUID();
  const { error } = await db.from("bookings").insert({
    id: newId,
    status: "Jauns",
    inquiry_type: "business",
    company_name: ev.title,
    event_date: String(ev.event_date).slice(0, 10),
    event_time: time,
    address: ev.place,
    message,
    admin_notes: "Pārvērsts no izbraukuma ieraksta",
  });
  if (error) {
    console.error("[convert team event]", error.message);
    return null;
  }
  const { error: upd } = await db.from("bookings").update({ status: "Apstiprināta" }).eq("id", newId);
  if (upd) {
    console.error("[convert team event] status", upd.message);
    return null;
  }
  await db.from("team_events").delete().eq("id", id);
  return ev.title;
}
