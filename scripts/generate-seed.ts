/**
 * Ģenerē supabase/seed.sql no noklusējuma satura (src/lib/content/defaults + media.json).
 *
 * Palaišana:  npx tsx scripts/generate-seed.ts
 * Pēc tam seed.sql saturu palaid Supabase SQL Editor.
 *
 * Seed ir drošs atkārtotai palaišanai: tas nepārraksta jau esošus ierakstus.
 */
import fs from "node:fs";
import path from "node:path";
import { defaultSettings } from "../src/lib/content/defaults/settings";
import { businessServices } from "../src/lib/content/defaults/business-services";
import { privateServices } from "../src/lib/content/defaults/private-services";
import { defaultClients, defaultTeam, defaultTestimonials } from "../src/lib/content/defaults/people";
import { manifestGallery } from "../src/lib/content/media";
import { toRow } from "../src/lib/content/mappers";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

function inserts(table: string, rows: Record<string, unknown>[], conflict: string) {
  if (rows.length === 0) return `-- ${table}: nav noklusējuma ierakstu\n`;
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => q(r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}\n${conflict};\n`;
}

/** Ievieto tikai tad, ja tabula ir tukša (tabulām bez unikālas atslēgas). */
function insertsIfEmpty(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return `-- ${table}: nav noklusējuma ierakstu\n`;
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => q(r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")})\nselect * from (values\n${values}\n) as v(${cols.join(", ")})\nwhere not exists (select 1 from public.${table});\n`;
}

const services = [...businessServices, ...privateServices].map((s) => toRow(s));
const settings = Object.entries(defaultSettings).map(([key, value]) => ({ key, value }));

const sql = [
  "-- Ģenerēts ar scripts/generate-seed.ts — nelabot manuāli.",
  "begin;",
  inserts("site_settings", settings, "on conflict (key) do nothing"),
  inserts("services", services, "on conflict (audience, slug) do nothing"),
  insertsIfEmpty("gallery_images", manifestGallery().map((g) => toRow(g))),
  insertsIfEmpty("team_members", defaultTeam.map((t) => toRow(t))),
  insertsIfEmpty("clients", defaultClients.map((c) => toRow(c))),
  insertsIfEmpty("testimonials", defaultTestimonials.map((t) => toRow(t))),
  "commit;",
].join("\n\n");

const out = path.join(process.cwd(), "supabase", "seed.sql");
fs.writeFileSync(out, sql);
console.log(`✓ ${path.relative(process.cwd(), out)} (${(sql.length / 1024).toFixed(0)} KB)`);
