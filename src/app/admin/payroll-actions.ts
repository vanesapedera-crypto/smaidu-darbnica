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
    travel: num(form.get(`travel__${p}`)),
    updated_at: new Date().toISOString(),
  }));
  const extra = String(form.get("new_name") ?? "").trim().slice(0, 120);
  if (extra) rows.push({ booking_id: bookingId, person: `x:${extra}`, name: extra, pay: num(form.get("new_pay")), travel: num(form.get("new_travel")), updated_at: new Date().toISOString() });
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
