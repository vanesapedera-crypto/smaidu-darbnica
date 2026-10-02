import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeOff, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getEntity } from "@/lib/admin/entities";
import PageHeader from "@/components/admin/PageHeader";
import { adminPrimary } from "@/components/admin/styles";

type Props = {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ saglabats?: string; dzests?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const entity = getEntity((await params).entity);
  return { title: entity?.title ?? "Saturs" };
}

const AUDIENCE: Record<string, string> = { business: "Uzņēmumiem", private: "Izklaides programma" };

/** Universāls satura saraksts (pakalpojumi, atsauksmes, klienti, komanda, SEO). */
export default async function EntityListPage({ params, searchParams }: Props) {
  const [{ entity: key }, flags] = await Promise.all([params, searchParams]);
  const entity = getEntity(key);
  if (!entity) notFound();

  const { db } = await requireAdmin();
  let query = db.from(entity.table).select("*");
  for (const o of entity.order) query = query.order(o.column, { ascending: o.ascending ?? true });
  const { data, error } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <PageHeader
        title={entity.title}
        description={entity.description}
        notice={flags.saglabats ? "Izmaiņas saglabātas un mājaslapa atjaunota." : flags.dzests ? "Ieraksts izdzēsts." : undefined}
        actions={
          <Link href={`/admin/${key}/jauns`} className={adminPrimary}>
            <Plus className="size-4" aria-hidden /> Pievienot
          </Link>
        }
      />

      {error && (
        <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          Neizdevās nolasīt datus: {error.message}. Pārliecinieties, ka datubāzes migrācija un sākuma dati (seed) ir palaisti.
        </p>
      )}

      {!error && rows.length === 0 && (
        <p className="mt-6 rounded-2xl bg-white p-10 text-center text-ink-soft ring-1 ring-line">Ierakstu vēl nav.</p>
      )}

      {rows.length > 0 && (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {rows.map((row) => {
            const image = entity.listImage ? (row[entity.listImage] as string) : "";
            const subtitle = entity.listSubtitle ? String(row[entity.listSubtitle] ?? "") : "";
            return (
              <li key={String(row.id)}>
                <Link href={`/admin/${key}/${row.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface sm:px-5">
                  {entity.listImage && (
                    <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element -- neliels priekšskatījums
                        <img src={image} alt="" className="size-full object-cover" loading="lazy" />
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{String(row[entity.listTitle] || "—")}</span>
                    {subtitle && <span className="block truncate text-sm text-ink-soft">{AUDIENCE[subtitle] ?? subtitle}</span>}
                  </span>
                  {row.published === false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
                      <EyeOff className="size-3.5" aria-hidden /> Paslēpts
                    </span>
                  )}
                  <Pencil className="size-4 shrink-0 text-ink-soft" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
