import { Download, FileText, Pencil, Plus, Search } from "lucide-react";
import { isManagerRole, requireMember } from "@/lib/auth";
import { saveScript, deleteScript } from "@/app/admin/team-actions";
import { SCRIPT_CATEGORIES, fileSize, type ScriptRow } from "@/lib/team/types";
import { missingTable, signedUrls } from "@/lib/team/files";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import FileField from "@/components/admin/team/FileField";
import DeleteButton from "@/components/admin/DeleteButton";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { adminInput, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Izrāžu scenāriji" };

type Props = { searchParams: Promise<{ q?: string; k?: string }> };

/**
 * Izrāžu scenāriju arhīvs: visa komanda var lasīt, lejupielādēt un pievienot jaunus;
 * labot — administratore un vadība; dzēst — tikai administratore.
 */
export default async function ScriptsPage({ searchParams }: Props) {
  const { db, role } = await requireMember();
  const { q = "", k = "" } = await searchParams;
  const canEdit = isManagerRole(role);
  const canDelete = role === "owner";

  let query = db.from("scripts").select("*").order("year", { ascending: false, nullsFirst: false }).order("title");
  if (k) query = query.eq("category", k);
  if (q.trim()) {
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(["title", "notes", "file_name"].map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  const { data, error } = await query;
  if (missingTable(error)) return <MigrationNotice title="Izrāžu scenāriji" />;
  const scripts = (data ?? []) as ScriptRow[];
  const urls = await signedUrls(db, scripts.map((s) => s.file_path));

  return (
    <>
      <PageHeader title="Izrāžu scenāriji" description="Arhīvs ar visu izrāžu scenārijiem — lai nākamreiz nav jāmeklē pa e-pastiem un datoriem." />

      {/* Pievienot var visa komanda */}
      <details className="mt-6 rounded-2xl bg-white ring-1 ring-line">
          <summary className={`${adminSecondary} m-4 cursor-pointer list-none border-0 [&::-webkit-details-marker]:hidden`}>
            <Plus className="size-4" aria-hidden /> Pievienot scenāriju
          </summary>
          <div className="border-t border-line p-5 sm:p-7">
            <TeamForm action={saveScript.bind(null, null)} submitLabel="Pievienot" resetOnSave>
              <ScriptFields />
            </TeamForm>
          </div>
      </details>

      <form className="mt-6 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Meklēt nosaukumā vai piezīmēs" className={`${adminInput} pl-9`} />
        </label>
        <select name="k" defaultValue={k} className={`${adminInput} w-auto`}>
          <option value="">Visas kategorijas</option>
          {SCRIPT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className={adminSecondary}>Meklēt</button>
      </form>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p>}

      <ul className="mt-5 space-y-3">
        {scripts.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">
            {q || k ? "Nekas netika atrasts." : "Arhīvs vēl ir tukšs."}
          </li>
        )}
        {scripts.map((s) => {
          const url = s.file_path ? urls.get(s.file_path) : undefined;
          return (
            <li key={s.id} className="rounded-2xl bg-white ring-1 ring-line">
              <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft">
                  <FileText className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{s.title}</p>
                  <p className="text-sm text-ink-soft">
                    {[s.category, s.year, s.file_name && `${s.file_name} ${fileSize(s.file_size)}`].filter(Boolean).join(" · ")}
                  </p>
                  {s.notes && <p className="mt-1 text-sm whitespace-pre-line">{s.notes}</p>}
                </div>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className={adminSecondary}>
                    <Download className="size-4" aria-hidden /> Atvērt
                  </a>
                )}
              </div>
              {canEdit && (
                <details className="border-t border-line">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                    <Pencil className="size-3.5" aria-hidden /> Labot
                  </summary>
                  <div className="space-y-4 px-5 pb-5">
                    <TeamForm action={saveScript.bind(null, s.id)}>
                      <ScriptFields s={s} current={{ name: s.file_name, url: url ?? null, size: s.file_size }} />
                    </TeamForm>
                    {canDelete && <DeleteButton action={deleteScript.bind(null, s.id)} label="Dzēst scenāriju" />}
                  </div>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ScriptFields({ s, current }: { s?: ScriptRow; current?: { name: string | null; url: string | null; size: number | null } }) {
  return (
    <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
      <label className="space-y-1.5 md:col-span-2">
        <span className="block text-sm font-bold">
          Izrādes nosaukums <span className="text-destructive">*</span>
        </span>
        <input name="title" required defaultValue={s?.title ?? ""} className={adminInput} />
      </label>
      <label className="space-y-1.5">
        <span className="block text-sm font-bold">Kategorija</span>
        <select name="category" defaultValue={s?.category ?? SCRIPT_CATEGORIES[0]} className={adminInput}>
          {SCRIPT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="block text-sm font-bold">Gads</span>
        <input name="year" type="number" min={2000} max={2100} defaultValue={s?.year ?? new Date().getFullYear()} className={adminInput} />
      </label>
      <label className="space-y-1.5 md:col-span-2">
        <span className="block text-sm font-bold">Piezīmes</span>
        <textarea name="notes" rows={3} defaultValue={s?.notes ?? ""} placeholder="Tēli, ilgums, rekvizīti, kur un kad izrādīta…" className={adminInput} />
      </label>
      <div className="md:col-span-2">
        <FileField folder="scenariji" current={current} label="Scenārija fails (PDF, Word…)" />
      </div>
    </div>
  );
}
