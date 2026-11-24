"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : null;
};

/** Viena pasākuma algas: katram dalībniekam alga un ceļa izdevumi; var pievienot ārēju palīgu vai noņemt viņu */
export async function savePayroll(bookingId: string, form: FormData) {
  const { db } = await requireSection("kalendars", true);
  const persons = form.getAll("person").map(String);
  const rows = persons.map((p) => ({
    booking_id: bookingId,
    person: p,
    name: String(form.get(`name__${p}`) ?? p).slice(0, 120),
    pay: num(form.get(`pay__${p}`)),
    travel: null, // ceļa izdevumi — sadaļā "Transports" (vadītājam)
    updated_at: new Date().toISOString(),
  }));
  const extra = String(form.get("new_name") ?? "").trim().slice(0, 120);
  if (extra) rows.push({ booking_id: bookingId, person: `x:${extra}`, name: extra, pay: num(form.get("new_pay")), travel: null, updated_at: new Date().toISOString() });
  if (rows.length) await db.from("payroll").upsert(rows, { onConflict: "booking_id,person" });
  const remove = form.getAll("remove").map(String).filter((p) => p.startsWith("x:"));
  if (remove.length) await db.from("payroll").delete().eq("booking_id", bookingId).in("person", remove);
  revalidatePath("/admin/algas");
}

/** Standarta algas (vienam cilvēkam) pēc programmas */
export async function savePayRates(form: FormData) {
  const { db } = await requireSection("kalendars", true);
  const keys = form.getAll("rate_key").map(String);
  const rows = keys.map((k) => ({ key: k, title: String(form.get(`rate_title__${k}`) ?? k).slice(0, 200), amount: num(form.get(`rate__${k}`)), updated_at: new Date().toISOString() }));
  if (rows.length) await db.from("pay_rates").upsert(rows, { onConflict: "key" });
  revalidatePath("/admin/algas");
}

/**
 * Transports pasākumam: kurš brauc ar savu mašīnu un cik ceļa izdevumi viņam pienākas.
 * Saglabā visu sarakstu no jauna (tukšas rindas izmet). Parasti viena mašīna; lieliem pasākumiem — vairākas.
 */
export async function saveCars(bookingId: string, form: FormData) {
  const { db } = await requireSection("kalendars", true);
  const drivers = form.getAll("car_driver").map(String);
  const others = form.getAll("car_other").map(String);
  const amounts = form.getAll("car_amount");
  const notes = form.getAll("car_note").map(String);
  const { CALENDAR_HOSTS } = await import("@/lib/calendar");
  const rows = drivers
    .map((d, i) => {
      const other = (others[i] ?? "").trim().slice(0, 120);
      const host = CALENDAR_HOSTS.find((h) => h.email === d);
      const driver = host ? host.email : other ? `x:${other}` : "";
      const name = host ? host.name : other;
      return driver ? { booking_id: bookingId, driver, driver_name: name, amount: num(amounts[i] ?? null), note: (notes[i] ?? "").trim().slice(0, 200) || null } : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const { error } = await db.from("booking_cars").delete().eq("booking_id", bookingId);
  if (!error && rows.length) await db.from("booking_cars").insert(rows);
  revalidatePath("/admin/algas");
  revalidatePath("/admin/kalendars");
}
