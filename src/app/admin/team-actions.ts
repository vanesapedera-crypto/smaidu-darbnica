"use server";

import { seasonFromForm } from "@/lib/team/season";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canSee, isManagerRole, requireAdmin, requireMember, requireSection } from "@/lib/auth";
import { isSection, type Section } from "@/lib/team/sections";
import { parseItems } from "@/lib/team/workshops";
import { computeOffer, parseCalc, parseSettings, showPriceItem, type CostItemRow } from "@/lib/team/offer-calc";
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

const text = (form: FormData, key: string, max = 20000) => {
  const v = String(form.get(key) ?? "").trim().slice(0, max);
  return v || null;
};

/* ------------------------------ Faili ------------------------------ */

/** Vienreizēja augšupielādes adrese privātajā krātuvē (pārlūks augšupielādē failu tieši). */
export async function createTeamUploadUrl(folder: TeamFolder, fileName: string) {
  const member = await requireMember();
  const { db } = member;
  const safeFolder: TeamFolder = folder === "piedavajumi" || folder === "standarta" ? folder : "scenariji";
  // Scenāriju failus var augšupielādēt ikviens ar sadaļu "Scenāriji", piedāvājumu — tikai ar tiesībām labot
  const allowed =
    safeFolder === "scenariji"
      ? canSee(member, "scenariji")
      : isManagerRole(member.role) && (canSee(member, "piedavajumi") || canSee(member, "standarta"));
  if (!allowed) return { error: "Nav tiesību." };
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
  const { db, email, role } = await requireSection("scenariji");
  if (id && !isManagerRole(role)) return { error: "Labot scenārijus var tikai tie, kam ir tiesības labot." };
  const title = text(form, "title", 300);
  if (!title) return { error: "Ievadiet nosaukumu." };
  const year = Number(form.get("year"));

  const row: Record<string, unknown> = {
    title,
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
  const member = await requireMember();
  const { db, email } = member;
  const sectionOk = canSee(member, "piedavajumi") || (kind === "template" && canSee(member, "standarta"));
  if (!isManagerRole(member.role) || !sectionOk) return { error: "Nav tiesību labot piedāvājumus." };
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

/** Sadaļas no formas ķeksīšiem (name="sections") */
const sectionsFrom = (form: FormData): Section[] => [...new Set(form.getAll("sections").filter(isSection))];

/**
 * Piešķir vai maina komandas locekļa piekļuvi: kuras sadaļas redz (ķeksīši) un vai var labot.
 * Var administratore un tie, kam ir sadaļa "Komandas piekļuve".
 */
export async function grantAccess(_: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db } = await requireSection("piekluve");
  const email = text(form, "email", 200);
  if (!email || !email.includes("@")) return { error: "Ievadiet e-pastu." };
  const sections = sectionsFrom(form);
  if (!sections.length) return { error: "Atzīmējiet vismaz vienu sadaļu." };
  // "Var labot" → manager; citādi paliek esošā skatītāja loma (Keitai — viewer: kalendārs atveras ar telpu nomu)
  const current = String(form.get("current_role") ?? "");
  const role = form.get("can_edit") === "1" ? "manager" : current === "viewer" ? "viewer" : "animator";

  const { error } = await db.rpc("grant_team_access", { p_email: email, p_name: text(form, "name", 100) ?? "", p_role: role, p_sections: sections });
  if (error) {
    if (error.message.includes("LIETOTAJS_NAV_ATRASTS")) {
      return { error: "Šāds lietotājs vēl nav izveidots. Konts jāizveido Vanesai Supabase (sk. norādes zemāk)." };
    }
    if (error.message.includes("grant_team_access") || error.message.includes("function")) {
      return { error: "Datubāzē vēl nav jaunās piekļuves funkcijas — palaidiet migrāciju 20261107120000_team_sections.sql." };
    }
    return { error: error.message };
  }
  revalidatePath("/admin", "layout");
  return { ok: `Saglabāts: ${email}` };
}

export async function revokeAccess(userId: string) {
  const { db } = await requireSection("piekluve");
  await db.from("team_access").delete().eq("user_id", userId);
  revalidatePath("/admin", "layout");
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

/* ------------------------------ Radošās darbnīcas ------------------------------ */

export async function saveWorkshop(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db, email } = await requireSection("darbnicas", true);
  const title = text(form, "title", 300);
  if (!title) return { error: "Ievadiet darbnīcas nosaukumu." };
  let items: unknown = [];
  try {
    items = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "Neizdevās nolasīt materiālus." };
  }
  const participants = Number(form.get("participants"));
  const row = {
    title,
    description: text(form, "description", 5000),
    image: text(form, "image", 500),
    season: seasonFromForm(form),
    items: parseItems(items),
    participants: Number.isInteger(participants) && participants > 0 && participants < 100000 ? participants : null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await db.from("workshops").update(row).eq("id", id);
    if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
    revalidatePath("/admin/darbnicas");
    return { ok: "Saglabāts." };
  }
  const { data, error } = await db.from("workshops").insert({ ...row, created_by: email }).select("id").single();
  if (error || !data) return { error: `Neizdevās saglabāt: ${error?.message ?? ""}` };
  revalidatePath("/admin/darbnicas");
  redirect(`/admin/darbnicas/${data.id}?saglabats=1`);
}

/** Dzēst var tikai administratore */
export async function deleteWorkshop(id: string) {
  const { db } = await requireAdmin();
  await db.from("workshops").delete().eq("id", id);
  revalidatePath("/admin/darbnicas");
  redirect("/admin/darbnicas?dzests=1");
}

/* ------------------------------ Prezentāciju foto ------------------------------ */

/** Augšupielādes adrese foto prezentācijām (publiskā krātuve media, mape prezentacijas/) — vadībai */
export async function createPresentationUploadUrl(fileName: string, _folder: string, ext: "webp" | "svg" = "webp") {
  const member = await requireMember();
  if (!isManagerRole(member.role) || !(canSee(member, "piedavajumi") || canSee(member, "darbnicas"))) return { error: "Nav tiesību." };
  const extension = ext === "svg" ? "svg" : "webp";
  const path = `prezentacijas/${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, "")) || "foto"}.${extension}`;
  const { data, error } = await member.db.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Neizdevās sagatavot augšupielādi." };
  const { data: pub } = member.db.storage.from("media").getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}

/* ------------------------------ Izmaksu katalogs ------------------------------ */

const UNITS = ["hour", "person", "piece", "fixed"] as const;
const numField = (form: FormData, key: string) => {
  const n = Number(String(form.get(key) ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export async function saveCostItem(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db } = await requireSection("piedavajumi", true);
  const title = text(form, "title", 200);
  if (!title) return { error: "Ievadiet nosaukumu." };
  const unit = String(form.get("unit") ?? "");
  const row = {
    title,
    kind: form.get("kind") === "expense" ? "expense" : "activity",
    unit: (UNITS as readonly string[]).includes(unit) ? unit : "hour",
    cost: Math.max(0, numField(form, "cost")),
    description: text(form, "description", 5000),
    image: text(form, "image", 500),
    season: seasonFromForm(form),
    updated_at: new Date().toISOString(),
  };
  const { error } = id ? await db.from("cost_items").update(row).eq("id", id) : await db.from("cost_items").insert(row);
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  revalidatePath("/admin/izmaksas");
  return { ok: id ? "Saglabāts." : "Pievienots." };
}

/** Dzēst var tikai administratore */
export async function deleteCostItem(id: string) {
  const { db } = await requireAdmin();
  await db.from("cost_items").delete().eq("id", id);
  revalidatePath("/admin/izmaksas");
}

/** Likmes (animatori, uzcenojums, PVN) — tikai administratore */
export async function saveCalcSettings(_: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db } = await requireAdmin();
  const data = {
    animatorHour: Math.max(0, numField(form, "animatorHour")),
    animatorFixed: Math.max(0, numField(form, "animatorFixed")),
    markup: numField(form, "markup"),
    vat: Math.max(0, numField(form, "vat")),
    perAnimator: Math.max(1, Math.round(numField(form, "perAnimator")) || 15),
    prepHour: Math.max(0, numField(form, "prepHour")),
    prepHours: Math.max(0, numField(form, "prepHours")),
    travelHour: Math.max(0, numField(form, "travelHour")),
    venueMin: Math.max(0, numField(form, "venueMin")),
    minTotal: Math.max(0, numField(form, "minTotal")),
    peakPercent: Math.max(0, numField(form, "peakPercent")),
    decorPerWorkshop: Math.max(0, numField(form, "decorPerWorkshop")),
  };
  const { error } = await db.from("calc_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  revalidatePath("/admin/izmaksas");
  revalidatePath("/admin/piedavajuma-izveide");
  return { ok: "Likmes saglabātas." };
}

/* ------------------------------ Piedāvājuma izveide ------------------------------ */

/**
 * Saglabā kalkulatora piedāvājumu: offers (kind client) ar aprēķinu offers.calc.
 * Jaunus izdevumus ar atzīmi "saglabāt katalogā" pievieno izmaksu katalogam.
 */
export async function saveCalcOffer(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const member = await requireSection("piedavajumi", true);
  const { db, email } = member;
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("calc") ?? "{}"));
  } catch {
    return { error: "Neizdevās nolasīt aprēķinu." };
  }
  const { data: s } = await db.from("calc_settings").select("data").eq("id", 1).maybeSingle();
  const calc = parseCalc(raw, parseSettings(s?.data), 0);
  if (!calc.client.trim()) return { error: "Ievadiet klientu." };
  if (!calc.workshops.length && !calc.items.length) return { error: "Atzīmējiet vismaz vienu darbnīcu vai aktivitāti." };
  const result = computeOffer(calc);

  // Jaunie izdevumi katalogā
  let toCatalog: { title: string; unit: string; unitCost: number; kind: string }[] = [];
  try {
    toCatalog = JSON.parse(String(form.get("to_catalog") ?? "[]"));
  } catch {
    toCatalog = [];
  }
  for (const c of toCatalog.slice(0, 20)) {
    if (!c?.title) continue;
    await db.from("cost_items").insert({
      title: String(c.title).slice(0, 200),
      kind: c.kind === "activity" ? "activity" : "expense",
      unit: (UNITS as readonly string[]).includes(c.unit) ? c.unit : "fixed",
      cost: Math.max(0, Number(c.unitCost) || 0),
    });
  }

  const euro = (n: number) => `${n.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const row = {
    kind: "client",
    client_name: calc.client.trim(),
    contact_person: calc.contactPerson || null,
    contact_email: calc.contactEmail || null,
    title: calc.title.trim() || `Piedāvājums: ${calc.client.trim()}`,
    offer_date: calc.date || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" }),
    services: [...calc.workshops.map((w) => w.title), ...calc.items.filter((i) => i.kind === "activity").map((i) => i.title)].join("\n"),
    price: `${euro(result.net)} + PVN (kopā ${euro(result.total)})`,
    calc,
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { error } = await db.from("offers").update(row).eq("id", id);
    if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  } else {
    const { data, error } = await db.from("offers").insert({ ...row, status: "Melnraksts", created_by: email }).select("id").single();
    if (error || !data) return { error: `Neizdevās saglabāt: ${error?.message ?? ""}` };
    savedId = data.id;
  }
  revalidatePath("/admin/piedavajumi");
  revalidatePath("/admin/izmaksas");
  redirect(`/admin/piedavajuma-izveide?id=${savedId}&saglabats=1`);
}

/* ------------------------------ Izejmateriāli ------------------------------ */

export async function saveMaterial(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db } = await requireSection("darbnicas", true);
  const name = text(form, "name", 200);
  if (!name) return { error: "Ievadiet nosaukumu." };
  const row = { name, pack: text(form, "pack", 200), price: Math.max(0, numField(form, "price")), updated_at: new Date().toISOString() };
  const { error } = id ? await db.from("materials").update(row).eq("id", id) : await db.from("materials").insert(row);
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  revalidatePath("/admin/izejmateriali");
  revalidatePath("/admin/darbnicas", "layout");
  return { ok: id ? "Saglabāts." : `Pievienots: ${name}` };
}

/** Dzēst var tikai administratore */
export async function deleteMaterial(id: string) {
  const { db } = await requireAdmin();
  await db.from("materials").delete().eq("id", id);
  revalidatePath("/admin/izejmateriali");
}

/* ------------------------------ Klientu vēsture ------------------------------ */

export async function saveHistory(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db, email } = await requireSection("klientu_vesture", true);
  const client = text(form, "client_name", 300);
  if (!client) return { error: "Ievadiet klientu." };
  const year = Number(form.get("year"));
  const amountRaw = String(form.get("amount") ?? "").trim();
  const row = {
    client_name: client,
    year: Number.isInteger(year) && year > 1990 && year < 2200 ? year : null,
    services: text(form, "services", 2000),
    amount: amountRaw ? Math.max(0, numField(form, "amount")) : null,
    notes: text(form, "notes", 2000),
    updated_at: new Date().toISOString(),
  };
  const { error } = id ? await db.from("client_history").update(row).eq("id", id) : await db.from("client_history").insert({ ...row, created_by: email });
  if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  revalidatePath("/admin/klientu-vesture");
  return { ok: id ? "Saglabāts." : `Pievienots: ${client}` };
}

/** Dzēst var tikai administratore */
export async function deleteHistory(id: string) {
  const { db } = await requireAdmin();
  await db.from("client_history").delete().eq("id", id);
  revalidatePath("/admin/klientu-vesture");
}

/** Aktivitātes/izdevuma cena tieši no piedāvājuma izveides saraksta (saglabājas katalogā) */
export async function setCostItemPrice(id: string, cost: number): Promise<{ error?: string }> {
  const { db } = await requireSection("piedavajumi", true);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isFinite(cost) || cost < 0) return { error: "Nepareiza cena." };
  const { error } = await db.from("cost_items").update({ cost, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/* ------------------------------ Prezentācijas ------------------------------ */

export async function savePresentation(id: string | null, _: TeamActionState, form: FormData): Promise<TeamActionState> {
  const { db, email } = await requireSection("piedavajumi", true);
  const client = text(form, "client_name", 300);
  if (!client) return { error: "Ievadiet klientu." };
  const uuid = (v: FormDataEntryValue) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
  const workshopIds = form.getAll("workshop_ids").map(uuid).filter(Boolean) as string[];
  const activityIds = form.getAll("activity_ids").map(uuid).filter(Boolean) as string[];
  if (!workshopIds.length && !activityIds.length) return { error: "Atzīmējiet vismaz vienu darbnīcu vai aktivitāti." };
  const date = text(form, "event_date", 10);
  const children = Number(form.get("children"));
  const hours = numField(form, "hours");
  const row = {
    client_name: client,
    title: text(form, "title", 300),
    event_date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    place: text(form, "place", 300),
    children: Number.isInteger(children) && children > 0 ? children : null,
    hours: hours > 0 ? hours : null,
    workshop_ids: workshopIds,
    activity_ids: activityIds,
    intro: text(form, "intro", 5000),
    updated_at: new Date().toISOString(),
  };
  let savedId = id;
  if (id) {
    const { error } = await db.from("presentations").update(row).eq("id", id);
    if (error) return { error: `Neizdevās saglabāt: ${error.message}` };
  } else {
    const { data, error } = await db.from("presentations").insert({ ...row, created_by: email }).select("id").single();
    if (error || !data) return { error: `Neizdevās saglabāt: ${error?.message ?? ""}` };
    savedId = data.id;
  }
  revalidatePath("/admin/prezentacijas");
  redirect(`/admin/prezentacijas-izveide?id=${savedId}&saglabats=1`);
}

/** Dzēst var tikai administratore */
export async function deletePresentation(id: string) {
  const { db } = await requireAdmin();
  await db.from("presentations").delete().eq("id", id);
  revalidatePath("/admin/prezentacijas");
  redirect("/admin/prezentacijas?dzests=1");
}

/** Lapa "Izrādes — cenas": izrādes izmaksas un sezona (cost_items aktivitāte ar fiksētu summu "Izrāde „…”") */
export async function saveShowPrice(form: FormData) {
  const { db } = await requireSection("piedavajumi", true);
  const show = text(form, "show", 200);
  if (!show) return;
  const { data } = await db.from("cost_items").select("*").eq("kind", "activity");
  const existing = showPriceItem((data ?? []) as CostItemRow[], show);
  const row = { cost: Math.max(0, numField(form, "cost")), season: seasonFromForm(form), updated_at: new Date().toISOString() };
  if (existing) await db.from("cost_items").update(row).eq("id", existing.id);
  else await db.from("cost_items").insert({ ...row, kind: "activity", unit: "fixed", title: `Izrāde „${show}”`, sort: 5 });
  revalidatePath("/admin/izrades-cenas");
  revalidatePath("/admin/izmaksas");
  revalidatePath("/piedavajums");
  redirect(`/admin/izrades-cenas?saglabats=${encodeURIComponent(show)}`);
}
