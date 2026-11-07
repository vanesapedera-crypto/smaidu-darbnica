import Link from "next/link";
import { Building2, Paperclip, Plus, Search } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { OFFER_SEASONS, clientKey, type OfferRow } from "@/lib/team/types";
import { missingTable } from "@/lib/team/files";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { lvDate, statusTone } from "@/components/admin/team/offer-utils";
import { adminInput, adminPrimary, adminSecondary } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Piedāvājumi klientiem" };

type Props = { searchParams: Promise<{ q?: string; s?: string; dzests?: string }> };

/**
 * Visi piedāvājumi, sagrupēti pa klientiem: pirms jauna piedāvājuma uzreiz redzams,
 * kas šim klientam piedāvāts iepriekšējos gados.
 */
export default async function OffersPage({ searchParams }: Props) {
  const { db } = await requireMember(["owner", "manager"]);
  const { q = "", s = "", dzests } = await searchParams;

  let query = db.from("offers").select("*").eq("kind", "client").order("offer_date", { ascending: false, nullsFirst: false });
  if (s) query = query.eq("season", s);
  if (q.trim()) {
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(["client_name", "title", "services", "contact_person"].map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  const { data, error } = await query;
  if (missingTable(error)) return <MigrationNotice title="Piedāvājumi klientiem" />;
  const offers = (data ?? []) as OfferRow[];

  // Grupas pa klientiem; klients ar jaunāko piedāvājumu — augšā
  const groups = new Map<string, { name: string; items: OfferRow[] }>();
  for (const o of offers) {
    const key = clientKey(o.client_name) || "—";
    const g = groups.get(key) ?? { name: o.client_name ?? "—", items: [] };
    g.items.push(o);
    groups.set(key, g);
  }

  return (
    <>
      <PageHeader
        title="Piedāvājumi klientiem"
        description="Kas, kad un par kādu cenu piedāvāts katram klientam — lai nākamajos gados nepiedāvātu to pašu."
        notice={dzests ? "Piedāvājums izdzēsts." : undefined}
        actions={
          <>
            <Link href="/admin/standarta-piedavajumi" className={adminSecondary}>Standarta piedāvājumi</Link>
            <Link href="/admin/piedavajumi/jauns" className={adminPrimary}>
              <Plus className="size-4" aria-hidden /> Jauns piedāvājums
            </Link>
          </>
        }
      />

      <form className="mt-6 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Meklēt klientu, piedāvājumu vai izrādi" className={`${adminInput} pl-9`} />
        </label>
        <select name="s" defaultValue={s} className={`${adminInput} w-auto`}>
          <option value="">Visas sezonas</option>
          {OFFER_SEASONS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className={adminSecondary}>Meklēt</button>
      </form>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}

      <div className="mt-6 space-y-5">
        {groups.size === 0 && (
          <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">{q || s ? "Nekas netika atrasts." : "Piedāvājumu vēl nav."}</p>
        )}
        {[...groups.values()].map((g) => (
          <section key={g.name} className="rounded-2xl bg-white ring-1 ring-line">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-3 font-extrabold">
                <span className="grid size-9 place-items-center rounded-lg bg-ink text-brand">
                  <Building2 className="size-4" aria-hidden />
                </span>
                {g.name}
                <span className="text-sm font-semibold text-ink-soft">{g.items.length}</span>
              </h2>
              <Link href={`/admin/piedavajumi/jauns?klients=${encodeURIComponent(g.name)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
                <Plus className="size-3.5" aria-hidden /> Jauns šim klientam
              </Link>
            </header>
            <ul className="divide-y divide-line">
              {g.items.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/piedavajumi/${o.id}`} className="grid gap-x-6 gap-y-1 px-5 py-3 hover:bg-surface/60 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
                    <span className="text-sm text-ink-soft">{lvDate(o.offer_date) || "—"}</span>
                    <span className="min-w-0 font-semibold">
                      {o.title}
                      {o.file_name && <Paperclip className="ml-1.5 inline size-3.5 text-ink-soft" aria-label="Pievienots fails" />}
                    </span>
                    <span className="line-clamp-2 text-sm text-ink-soft">{o.services}</span>
                    <span className="flex items-center gap-2 text-sm">
                      {o.price && <span className="font-semibold">{o.price}</span>}
                      {o.status && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", statusTone(o.status))}>{o.status}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
