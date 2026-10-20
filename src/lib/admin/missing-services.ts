import "server-only";
import type { AdminContext } from "@/lib/auth";
import { businessServices } from "@/lib/content/defaults/business-services";
import { privateServices } from "@/lib/content/defaults/private-services";

/** Pakalpojumi un programmas no projekta, kuru vēl nav datubāzē (pievienoti projektā pēc sākuma datu ievietošanas) */
export async function missingServices(db: AdminContext["db"]) {
  const { data, error } = await db.from("services").select("audience, slug");
  if (error) return [];
  const have = new Set((data ?? []).map((r: { audience: string; slug: string }) => `${r.audience}/${r.slug}`));
  return [...businessServices, ...privateServices].filter((s) => !have.has(`${s.audience}/${s.slug}`));
}
