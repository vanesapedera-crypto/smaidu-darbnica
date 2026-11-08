import { Building2, Pencil, Plus, Search } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { deleteHistory, saveHistory } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import { clientKey } from "@/lib/team/types";
import { money } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import DeleteButton from "@/components/admin/DeleteButton";
import { adminInput, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Klientu vēsture" };

type Row = { id: string; client_name: string; year: number | null; services: string | null; amount: number | null; notes: string | null };
type Props = { searchParams: Promise<{ q?: string }> };

/**
 * Klientu vēsture uzņēmumiem: katram klientam pa gadiem — kas ņemts (izrāde, radošās darbnīcas…) un cik samaksāts.
 * Lai nākamgad redzētu, ko šim klientam vairs nepiedāvāt un kāds bija budžets.
 */
export default async function ClientHistoryPage({ searchParams }: Props) {
  const { db, role } = await requireSection("klientu_vesture");
  const canEdit = isManagerRole(role);
  const { q = "" } = await searchParams;

  const { data, error } = await db.from("client_history").select("*").order("year", { ascending: false, nullsFirst: false });
  if (missingTable(error)) return <MigrationNotice title="Klientu vēsture" file="20261108100000_materials.sql" />;
  const rows = (data ?? []) as Row[];

  const groups = new Map<string, { name: string; rows: Row[]; total: number; last: number }>();
  for (const r of rows) {
    const key = clientKey(r.client_name) || r.client_name;
    const g = groups.get(key) ?? { name: r.client_name, rows: [], total: 0, last: 0 };
    g.rows.push(r);
    g.total += Number(r.amount) || 0;
    g.last = Math.max(g.last, r.year ?? 0);
    groups.set(key, g);
  }
  const term = q.trim().toLowerCase();
  const list = [...groups.values()]
    .filter((g) => !term || g.name.toLowerCase().includes(term) || g.rows.some((r) => r.services?.toLowerCase().includes(term)))
    .sort((a, b) => b.last - a.last || a.name.localeCompare(b.name, "lv"));
  const names = [...new Set(rows.map((r) => r.client_name))].sort((a, b) => a.localeCompare(b, "lv"));

  return (
    <>
      <PageHeader title="Klientu vēsture" description="Uzņēmumi un pašvaldības: kurā gadā kas ņemts un cik samaksāts — lai nākamreiz nepiedāvātu to pašu." />

      {canEdit && (
        <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <Plus className="size-4" aria-hidden /> Pievienot ierakstu
          </h2>
          <div className="mt-4">
            <TeamForm action={saveHistory.bind(null, null)} submitLabel="Pievienot" resetOnSave>
              <Fields names={names} />
            </TeamForm>
          </div>
        </section>
      )}

      <form className="mt-6 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Meklēt klientu, izrādi vai darbnīcu" className={`${adminInput} pl-9`} />
        </label>
        <button className={adminSecondary}>Meklēt</button>
      </form>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}

      <div className="mt-5 space-y-4">
        {list.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">{q ? "Nekas netika atrasts." : "Ierakstu vēl nav."}</p>}
        {list.map((g) => (
          <section key={g.name} className="rounded-2xl bg-white ring-1 ring-line">
            <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
              <span className="grid size-9 place-items-center rounded-lg bg-ink text-brand">
                <Building2 className="size-4" aria-hidden />
              </span>
              <h2 className="min-w-0 flex-1 font-extrabold">{g.name}</h2>
              {g.total > 0 && (
                <span className="text-sm">
                  <span className="text-ink-soft">Kopā samaksāts </span>
                  <b>{money(g.total)}</b>
                </span>
              )}
            </header>
            <ul className="divide-y divide-line">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <details>
                    <summary className="grid cursor-pointer list-none gap-x-6 gap-y-1 px-5 py-3 hover:bg-surface/60 sm:grid-cols-[70px_minmax(0,1fr)_auto_auto] [&::-webkit-details-marker]:hidden">
                      <span className="font-bold">{r.year ?? "—"}</span>
                      <span className="min-w-0 text-sm whitespace-pre-line">{r.services || "—"}</span>
                      <span className="text-sm font-bold whitespace-nowrap">{r.amount != null ? money(Number(r.amount)) : ""}</span>
                      {canEdit && <Pencil className="size-4 text-ink-soft" aria-hidden />}
                    </summary>
                    {r.notes && <p className="px-5 pb-3 text-sm text-ink-soft whitespace-pre-line">{r.notes}</p>}
                    {canEdit && (
                      <div className="space-y-4 border-t border-line p-5">
                        <TeamForm action={saveHistory.bind(null, r.id)}>
                          <Fields r={r} names={names} />
                        </TeamForm>
                        {role === "owner" && <DeleteButton action={deleteHistory.bind(null, r.id)} />}
                      </div>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function Fields({ r, names }: { r?: Row; names: string[] }) {
  const listId = r ? `clients-${r.id}` : "clients-new";
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1.6fr)_150px]">
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">
          Klients <span className="text-destructive">*</span>
        </span>
        <input name="client_name" required list={listId} defaultValue={r?.client_name ?? ""} placeholder="piem. SIA “Uzņēmums”" className={adminInput} />
        <datalist id={listId}>
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Gads</span>
        <input name="year" type="number" min={2000} max={2100} defaultValue={r?.year ?? new Date().getFullYear()} className={adminInput} />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Kas ņemts</span>
        <input name="services" defaultValue={r?.services ?? ""} placeholder="piem. Izrāde “Dāvanu prieks”, kroņu darbnīca" className={adminInput} />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Samaksa, €</span>
        <input name="amount" inputMode="decimal" defaultValue={r?.amount != null ? String(r.amount).replace(".", ",") : ""} className={adminInput} />
      </label>
      <label className="block space-y-1.5 md:col-span-4">
        <span className="block text-sm font-bold">Piezīmes</span>
        <input name="notes" defaultValue={r?.notes ?? ""} className={adminInput} />
      </label>
    </div>
  );
}
