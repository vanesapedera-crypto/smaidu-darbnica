import "server-only";
import type { MemberContext } from "@/lib/auth";
import { TEAM_BUCKET } from "./types";

/** Lejupielādes saites privātajiem failiem (derīgas 1 stundu). Ceļš → saite. */
export async function signedUrls(db: MemberContext["db"], paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (!list.length) return map;
  const { data } = await db.storage.from(TEAM_BUCKET).createSignedUrls(list, 60 * 60, { download: false });
  for (const item of data ?? []) if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  return map;
}

/** Vai kļūda nozīmē, ka migrācija 20261107090000 vēl nav palaista */
export const missingTable = (error: { message?: string; code?: string } | null) =>
  Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? "")));
