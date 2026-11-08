import Link from "next/link";
import { History, Paperclip, Plus, Search } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { OFFER_SEASONS, type OfferRow } from "@/lib/team/types";
import { missingTable } from "@/lib/team/files";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { lvDate, statusTone } from "@/components/admin/team/offer-utils";
import { adminInput, adminPrimary, adminSecondary } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Piedāvājumi (arhīvs)" };

type Props = { searchParams: Promise<{ q?: string; s?: string; dzests?: string }> };

/**
 * Visi piedāvājumi klientiem — jaunākie augšā. Vēsture pa klientiem ir atsevišķā sadaļā "Klientu vēsture";
 * rediģējot piedāvājumu, sānā redzams, kas šim klientam piedāvāts iepriekš.
 */
export default async function OffersPage({ searchParams }: Props) {
  const { db, role } = await requireSection("piedavajumi");
  const canEdit = isManagerRole(role);
  const { q = "", s = "", dzests } = await searchParams;

  let query = db.from("offers").select("*").eq("kind", "client").order("offer_date", { ascending: false, nullsFirst: false });
  if (s) query = query.eq("season", s);
  if (q.trim()) {
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(["client_name", "title", "services", "contact_person"].map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  const { data, error } = await query;
  if (missingTable(error)) return <MigrationNotice title="Piedāvājumi (arhīvs)" />;
  const offers = (data ?? []) as OfferRow[];

  return (
    <>
      <PageHeader
        title="Piedāvājumi (arhīvs)"
        description="Visi piedāvājumi klientiem. Kas kuram klientam bijis iepriekš — sadaļā “Klientu vēsture”."
        notice={dzests ? "Piedāvājums izdzēsts." : undefined}
        actions={
          <>
            <Link href="/admin/klientu-vesture" className={adminSecondary}>
              <History className="size-4" aria-hidden /> Klientu vēsture
            </Link>
            <Link href="/admin/standarta-piedavajumi" className={adminSecondary}>Standarta piedāvājumi</Link>
            {canEdit && (
              <>
                <Link href="/admin/piedavajumi/jauns" className={adminSecondary}>
                  <Plus className="size-4" aria-hidden /> Bez aprēķina
                </Link>
                <Link href="/admin/piedavajuma-izveide" className={adminPrimary}>
                  <Plus className="size-4" aria-hidden /> Piedāvājuma izveide
                </Link>
              </>
            )}
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

      <ul className="mt-6 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {offers.length === 0 && (
          <li className="p-6 text-sm text-ink-soft">{q || s ? "Nekas netika atrasts." : "Piedāvājumu vēl nav."}</li>
        )}
        {offers.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/piedavajumi/${o.id}`}
              className="grid gap-x-6 gap-y-1 px-5 py-3 hover:bg-surface/60 md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            >
              <span className="text-sm text-ink-soft">{lvDate(o.offer_date) || "—"}</span>
              <span className="min-w-0 font-bold">{o.client_name}</span>
              <span className="min-w-0 text-sm">
                <span className="font-semibold">{o.title}</span>
                {o.file_name && <Paperclip className="ml-1.5 inline size-3.5 text-ink-soft" aria-label="Pievienots fails" />}
                {o.services && <span className="line-clamp-1 text-ink-soft">{o.services}</span>}
              </span>
              <span className="flex items-center gap-2 text-sm">
                {o.price && <span className="font-semibold">{o.price}</span>}
                {o.status && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", statusTone(o.status))}>{o.status}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
