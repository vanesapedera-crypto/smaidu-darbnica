import Link from "next/link";
import { ChevronDown, Package, Palette, Pencil, Plus } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { missingTable } from "@/lib/team/files";
import { costPerPerson, materialMap, money, packPrice, parseItems, perPerson, type Material, type WorkshopRow } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import MaterialsSection from "@/components/admin/team/MaterialsSection";
import { adminPrimary, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Radošās darbnīcas" };

type Props = { searchParams: Promise<{ dzests?: string; materiali?: string }> };

/**
 * Radošās darbnīcas: saraksts — uzspiežot uz darbnīcas, atveras tās materiāli ar cenām un pašizmaksa.
 * Apakšā — izejmateriāli (atveras, uzspiežot): visi materiāli ar cenu par iepakojumu.
 */
export default async function WorkshopsPage({ searchParams }: Props) {
  const { db, role } = await requireSection("darbnicas");
  const { dzests, materiali } = await searchParams;
  const canEdit = isManagerRole(role);
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
        description="Uzspiediet uz darbnīcas — redzami tās materiāli, cenas un pašizmaksa vienai personai."
        notice={dzests ? "Darbnīca izdzēsta." : undefined}
        actions={
          canEdit && (
            <Link href="/admin/darbnicas/jauna" className={adminPrimary}>
              <Plus className="size-4" aria-hidden /> Jauna darbnīca
            </Link>
          )
        }
      />
      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}

      <ul className="mt-6 space-y-2">
        {workshops.length === 0 && <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Darbnīcu vēl nav.</li>}
        {workshops.map((w) => {
          const items = parseItems(w.items);
          const cost = costPerPerson(items, mats);
          return (
            <li key={w.id} className="rounded-2xl bg-white ring-1 ring-line">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft">
                    <Palette className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{w.title}</span>
                    <span className="block text-sm text-ink-soft">{items.length ? `${items.length} materiāli` : "materiāli nav ievadīti"}</span>
                  </span>
                  <span className="text-sm">
                    <span className="text-ink-soft">1 personai </span>
                    <b>{money(cost)}</b>
                  </span>
                  <ChevronDown className="size-5 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="border-t border-line p-5">
                  {items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="text-left text-ink-soft">
                            <th className="pb-2 font-semibold">Materiāls</th>
                            <th className="pb-2 font-semibold">Cena par iepakojumu</th>
                            <th className="pb-2 font-semibold">Pietiek bērniem</th>
                            <th className="pb-2 text-right font-semibold">1 personai</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((i, n) => {
                            const m = i.materialId ? mats.get(i.materialId) : undefined;
                            return (
                              <tr key={n} className="border-t border-line">
                                <td className="py-2 pr-3 font-semibold">
                                  {m?.name ?? i.name ?? "—"}
                                  {m?.pack && <span className="font-normal text-ink-soft"> · {m.pack}</span>}
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">{money(packPrice(i, mats))}</td>
                                <td className="py-2 pr-3">{i.qty ?? "—"}</td>
                                <td className="py-2 text-right font-semibold whitespace-nowrap">{money(perPerson(i, mats))}</td>
                              </tr>
                            );
                          })}
                          <tr className="border-t-2 border-ink">
                            <td className="pt-2 font-extrabold" colSpan={3}>
                              Pašizmaksa 1 personai
                            </td>
                            <td className="pt-2 text-right font-extrabold whitespace-nowrap">{money(cost)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-soft">Materiāli vēl nav pievienoti.</p>
                  )}
                  <Link href={`/admin/darbnicas/${w.id}`} className={`${adminSecondary} mt-4`}>
                    <Pencil className="size-4" aria-hidden /> {canEdit ? "Labot darbnīcu" : "Atvērt"}
                  </Link>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {/* Izejmateriāli — atveras, uzspiežot */}
      <details id="izejmateriali" open={materiali === "1" || undefined} className="group mt-8 scroll-mt-6 rounded-2xl bg-white ring-1 ring-line">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-brand">
            <Package className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Izejmateriāli</span>
            <span className="block text-sm text-ink-soft">{mats.size} materiāli ar cenām — uzspiediet, lai redzētu un labotu</span>
          </span>
          <ChevronDown className="size-5 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-line p-5">
          <MaterialsSection db={db} role={role} />
        </div>
      </details>
    </>
  );
}
