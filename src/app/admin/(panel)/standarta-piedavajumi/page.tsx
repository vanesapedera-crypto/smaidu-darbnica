import Link from "next/link";
import { CopyPlus, FileStack, Paperclip, Plus } from "lucide-react";
import { isManagerRole, requireMember } from "@/lib/auth";
import type { OfferRow } from "@/lib/team/types";
import { missingTable } from "@/lib/team/files";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { adminPrimary, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Standarta piedāvājumi" };

type Props = { searchParams: Promise<{ dzests?: string }> };

/** Standarta piedāvājumi — sagataves, no kurām ātri izveidot piedāvājumu konkrētam klientam. Visa komanda redz, labo vadība. */
export default async function TemplatesPage({ searchParams }: Props) {
  const { db, role } = await requireMember();
  const canEdit = isManagerRole(role);
  const { dzests } = await searchParams;
  const [{ data, error }, { data: used }] = await Promise.all([
    db.from("offers").select("*").eq("kind", "template").order("season").order("title"),
    canEdit ? db.from("offers").select("template_id").eq("kind", "client").not("template_id", "is", null) : Promise.resolve({ data: [] }),
  ]);
  if (missingTable(error)) return <MigrationNotice title="Standarta piedāvājumi" />;
  const templates = (data ?? []) as OfferRow[];
  const count = new Map<string, number>();
  for (const u of used ?? []) count.set(u.template_id, (count.get(u.template_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Standarta piedāvājumi"
        description={
          canEdit
            ? "Sagataves ar tekstu, aktivitātēm un cenu. Poga “Izmantot klientam” izveido no tās jaunu piedāvājumu."
            : "Gatavu piedāvājumu bibliotēka — piemēram, Ziemassvētki bērnudārzā, izlaidumi."
        }
        notice={dzests ? "Standarta piedāvājums izdzēsts." : undefined}
        actions={
          canEdit && (
            <Link href="/admin/standarta-piedavajumi/jauns" className={adminPrimary}>
              <Plus className="size-4" aria-hidden /> Jauns standarta piedāvājums
            </Link>
          )
        }
      />
      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {templates.length === 0 && <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line md:col-span-2">Standarta piedāvājumu vēl nav.</li>}
        {templates.map((t) => (
          <li key={t.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft">
                <FileStack className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <Link href={`/admin/standarta-piedavajumi/${t.id}`} className="font-bold hover:underline">{t.title}</Link>
                <p className="text-sm text-ink-soft">
                  {[t.season, t.price, count.get(t.id) ? `izmantots ${count.get(t.id)}×` : null].filter(Boolean).join(" · ")}
                  {t.file_name && <Paperclip className="ml-1.5 inline size-3.5" aria-label="Pievienots fails" />}
                </p>
              </div>
            </div>
            {t.services && <p className="mt-3 line-clamp-4 text-sm whitespace-pre-line">{t.services}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {canEdit ? (
                <>
                  <Link href={`/admin/piedavajumi/jauns?no=${t.id}`} className={adminPrimary}>
                    <CopyPlus className="size-4" aria-hidden /> Izmantot klientam
                  </Link>
                  <Link href={`/admin/standarta-piedavajumi/${t.id}`} className={adminSecondary}>Labot</Link>
                </>
              ) : (
                <Link href={`/admin/standarta-piedavajumi/${t.id}`} className={adminSecondary}>Skatīt</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
