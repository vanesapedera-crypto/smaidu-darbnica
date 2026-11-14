import { isManagerRole, type MemberContext } from "@/lib/auth";
import { deleteMaterial, saveMaterial } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import { money, parseItems, type Material } from "@/lib/team/workshops";
import TeamForm from "./TeamForm";
import DeleteButton from "../DeleteButton";
import { adminInput } from "../styles";

/**
 * Izejmateriāli ar fiksētu cenu par iepakojumu/komplektu. Darbnīcās tos tikai izvēlas un norāda,
 * cik bērniem pietiek viens iepakojums — mainot cenu šeit, pārrēķinās visas darbnīcas.
 */
export default async function MaterialsSection({ db, role }: Pick<MemberContext, "db" | "role">) {
  const canEdit = isManagerRole(role);
  const [{ data, error }, { data: ws }] = await Promise.all([
    db.from("materials").select("*").order("name"),
    db.from("workshops").select("title, items"),
  ]);
  if (missingTable(error)) return <p className="text-sm text-ink-soft">Izejmateriālu tabula vēl nav izveidota (migrācija 20261108100000_materials.sql).</p>;
  const materials = (data ?? []) as Material[];
  // Kurās darbnīcās materiāls izmantots
  const usedIn = new Map<string, string[]>();
  for (const w of (ws ?? []) as { title: string; items: unknown }[]) {
    for (const i of parseItems(w.items)) if (i.materialId) usedIn.set(i.materialId, [...(usedIn.get(i.materialId) ?? []), w.title]);
  }

  return (
    <>
      <p className="text-sm text-ink-soft">Cena par vienu iepakojumu vai komplektu. Darbnīcā tikai izvēlas materiālu un norāda, cik bērniem tas pietiek — mainot cenu šeit, pārrēķinās visas darbnīcas.</p>

      {canEdit && (
        <section className="mt-4 rounded-2xl bg-surface p-5 sm:p-6">
          <h2 className="text-base font-extrabold">Pievienot izejmateriālu</h2>
          <div className="mt-4">
            <TeamForm action={saveMaterial.bind(null, null)} submitLabel="Pievienot" resetOnSave>
              <Fields />
            </TeamForm>
          </div>
        </section>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}
      <ul className="mt-6 space-y-2">
        {materials.length === 0 && <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Izejmateriālu vēl nav.</li>}
        {materials.map((m) => (
          <li key={m.id} className="rounded-2xl bg-white ring-1 ring-line">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="font-bold">{m.name}</span>
                  {m.pack && <span className="text-sm text-ink-soft"> · {m.pack}</span>}
                  {usedIn.get(m.id) && <span className="block text-xs text-ink-soft">Darbnīcās: {usedIn.get(m.id)!.join(", ")}</span>}
                </span>
                <b className="text-sm">{money(Number(m.price) || 0)}</b>
              </summary>
              {canEdit && (
                <div className="space-y-4 border-t border-line p-5">
                  <TeamForm action={saveMaterial.bind(null, m.id)}>
                    <Fields m={m} />
                  </TeamForm>
                  {role === "owner" && !usedIn.get(m.id) && <DeleteButton action={deleteMaterial.bind(null, m.id)} />}
                </div>
              )}
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}

function Fields({ m }: { m?: Material }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">
          Nosaukums <span className="text-destructive">*</span>
        </span>
        <input name="name" required defaultValue={m?.name ?? ""} placeholder="piem. Akrila krāsas" className={adminInput} />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Iepakojums</span>
        <input name="pack" defaultValue={m?.pack ?? ""} placeholder="piem. 12 tūbiņas × 75 ml" className={adminInput} />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Cena par iepakojumu, €</span>
        <input name="price" inputMode="decimal" defaultValue={m ? String(m.price).replace(".", ",") : ""} className={adminInput} />
      </label>
    </div>
  );
}
