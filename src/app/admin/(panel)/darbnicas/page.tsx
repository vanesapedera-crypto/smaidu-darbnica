import Link from "next/link";
import { Palette, Plus } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { missingTable } from "@/lib/team/files";
import { costPerPerson, materialMap, money, parseItems, type Material, type WorkshopRow } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { adminPrimary } from "@/components/admin/styles";

export const metadata = { title: "Radošās darbnīcas" };

type Props = { searchParams: Promise<{ dzests?: string }> };

/** Radošās darbnīcas: katrai — materiāli un tīrā pašizmaksa vienai personai. */
export default async function WorkshopsPage({ searchParams }: Props) {
  const { db, role } = await requireSection("darbnicas");
  const { dzests } = await searchParams;
  const [{ data, error }, { data: materials }] = await Promise.all([
    db.from("workshops").select("*").order("title"),
    db.from("materials").select("id, name, price, pack"),
  ]);
  const mats = materialMap(materials as Material[] | null);
  if (missingTable(error)) return <MigrationNotice title="Radošās darbnīcas" file="20261107130000_workshops.sql" />;
  const workshops = (data ?? []) as WorkshopRow[];

  return (
    <>
      <PageHeader
        title="Radošās darbnīcas"
        description="Materiāli un tīrā pašizmaksa vienai personai katrai darbnīcai."
        notice={dzests ? "Darbnīca izdzēsta." : undefined}
        actions={
          isManagerRole(role) && (
            <Link href="/admin/darbnicas/jauna" className={adminPrimary}>
              <Plus className="size-4" aria-hidden /> Jauna darbnīca
            </Link>
          )
        }
      />
      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {workshops.length === 0 && <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line sm:col-span-2 xl:col-span-3">Darbnīcu vēl nav.</li>}
        {workshops.map((w) => {
          const items = parseItems(w.items);
          const cost = costPerPerson(items, mats);
          return (
            <li key={w.id}>
              <Link href={`/admin/darbnicas/${w.id}`} className="flex h-full items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-line hover:ring-ink">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft">
                  <Palette className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{w.title}</span>
                  <span className="block text-sm text-ink-soft">{items.length} materiāli</span>
                  <span className="mt-2 block text-sm">
                    Pašizmaksa 1 personai: <b>{money(cost)}</b>
                  </span>
                  {w.participants && (
                    <span className="block text-sm text-ink-soft">
                      {w.participants} pers. — {money(cost * w.participants)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
