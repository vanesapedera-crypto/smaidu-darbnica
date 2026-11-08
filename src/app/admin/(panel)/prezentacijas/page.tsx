import Link from "next/link";
import { Plus, Presentation, Search } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { missingTable } from "@/lib/team/files";
import type { PresentationRow } from "@/lib/team/presentations";
import { lvDate } from "@/components/admin/team/offer-utils";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { adminInput, adminPrimary, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Prezentācijas (arhīvs)" };

type Props = { searchParams: Promise<{ q?: string; dzests?: string }> };

/** Visas izveidotās prezentācijas — jaunākās augšā. */
export default async function PresentationsPage({ searchParams }: Props) {
  const { db, role } = await requireSection("piedavajumi");
  const { q = "", dzests } = await searchParams;
  let query = db.from("presentations").select("*").order("created_at", { ascending: false });
  if (q.trim()) {
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(["client_name", "title", "place"].map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  const { data, error } = await query;
  if (missingTable(error)) return <MigrationNotice title="Prezentācijas" file="20261108110000_presentations.sql" />;
  const list = (data ?? []) as PresentationRow[];

  return (
    <>
      <PageHeader
        title="Prezentācijas (arhīvs)"
        description="Visas izveidotās prezentācijas klientiem."
        notice={dzests ? "Prezentācija izdzēsta." : undefined}
        actions={
          isManagerRole(role) && (
            <Link href="/admin/prezentacijas-izveide" className={adminPrimary}>
              <Plus className="size-4" aria-hidden /> Jauna prezentācija
            </Link>
          )
        }
      />
      <form className="mt-6 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Meklēt klientu vai nosaukumu" className={`${adminInput} pl-9`} />
        </label>
        <button className={adminSecondary}>Meklēt</button>
      </form>
      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}
      <ul className="mt-5 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {list.length === 0 && <li className="p-6 text-sm text-ink-soft">{q ? "Nekas netika atrasts." : "Prezentāciju vēl nav."}</li>}
        {list.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
            <Link href={`/admin/prezentacijas-izveide?id=${p.id}`} className="grid min-w-0 flex-1 gap-x-6 gap-y-1 hover:underline sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.2fr)]">
              <span className="text-sm text-ink-soft">{lvDate(p.created_at)}</span>
              <span className="truncate font-bold">{p.client_name}</span>
              <span className="truncate text-sm">
                {p.title || "—"}
                <span className="text-ink-soft">
                  {" "}
                  · {p.workshop_ids.length + p.activity_ids.length} poz.{p.event_date ? ` · pasākums ${lvDate(p.event_date)}` : ""}
                </span>
              </span>
            </Link>
            <Link href={`/admin/prezentacija-pdf/${p.id}`} target="_blank" className={adminSecondary}>
              <Presentation className="size-4" aria-hidden /> PDF
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
