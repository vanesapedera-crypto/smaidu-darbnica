import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

type Props = { searchParams: Promise<{ q?: string; google?: string }> };

/**
 * Pieteikumi un kalendārs ir vienā vietā (2026-11-14): visi pieteikumi — /admin/kalendars
 * (augšā "Gaida apstiprinājumu", uzspiežot uz pasākuma — apstiprināšana, kas vada, labošana).
 * Šī adrese paliek, lai strādā vecās saites un Google savienojuma atgriešanās (?google=…).
 */
export default async function BookingsRedirect({ searchParams }: Props) {
  await requireAdmin();
  const { q, google } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (google) params.set("google", google);
  redirect(`/admin/kalendars${params.size ? `?${params}` : ""}`);
}
