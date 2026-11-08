import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, ImageOff, Presentation } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { deletePresentation, savePresentation } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import type { PresentationRow } from "@/lib/team/presentations";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import DeleteButton from "@/components/admin/DeleteButton";
import { adminInput, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Prezentācijas izveide" };

type Props = { searchParams: Promise<{ id?: string; saglabats?: string }> };
type Option = { id: string; title: string; description: string | null; image: string | null };

/** Prezentācija klientam bez cenām: ķeksīši darbnīcām un aktivitātēm → PDF ar foto un aprakstiem. */
export default async function PresentationBuilderPage({ searchParams }: Props) {
  const { db, role } = await requireSection("piedavajumi", true);
  const { id, saglabats } = await searchParams;
  const pid = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  if (id && !pid) notFound();

  const [{ data: p, error }, { data: ws }, { data: acts }, { data: names }] = await Promise.all([
    pid ? db.from("presentations").select("*").eq("id", pid).maybeSingle() : db.from("presentations").select("id").limit(1),
    db.from("workshops").select("id, title, description, image").order("title"),
    db.from("cost_items").select("id, title, description, image").eq("kind", "activity").order("sort").order("title"),
    db.from("client_history").select("client_name"),
  ]);
  if (missingTable(error)) return <MigrationNotice title="Prezentācijas izveide" file="20261108110000_presentations.sql" />;
  const pres = pid ? (p as PresentationRow | null) : null;
  if (pid && !pres) notFound();
  const clientNames = [...new Set(((names ?? []) as { client_name: string }[]).map((n) => n.client_name))].sort((a, b) => a.localeCompare(b, "lv"));

  const options = (items: Option[], name: string, checked: string[]) => (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((o) => (
        <li key={o.id}>
          <label className="flex h-full cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ring-line has-checked:bg-brand-soft has-checked:ring-ink">
            <input type="checkbox" name={name} value={o.id} defaultChecked={checked.includes(o.id)} className="mt-0.5 size-4 shrink-0 accent-ink" />
            {o.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-ink-soft">
                <ImageOff className="size-4" aria-hidden />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-bold">{o.title}</span>
              <span className="line-clamp-2 block text-xs text-ink-soft">
                {o.description?.trim() || <span className="font-semibold text-destructive">nav apraksta</span>}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader
        title={pres ? pres.title || pres.client_name : "Prezentācijas izveide"}
        description="Atzīmējiet, ko piedāvāt — prezentācija ar foto un aprakstiem izveidojas pati. Bez cenām."
        notice={saglabats ? "Saglabāts. Prezentāciju var atvērt un lejupielādēt PDF." : undefined}
        actions={
          pres && (
            <>
              <Link href={`/admin/prezentacija-pdf/${pres.id}`} target="_blank" className={adminSecondary}>
                <Presentation className="size-4" aria-hidden /> Atvērt prezentāciju (PDF)
              </Link>
              <Link href={`/admin/piedavajuma-izveide?prezentacija=${pres.id}`} className={adminSecondary}>
                <Calculator className="size-4" aria-hidden /> Izveidot piedāvājumu ar cenu
              </Link>
            </>
          )
        }
      />

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        <TeamForm action={savePresentation.bind(null, pres?.id ?? null)} submitLabel={pres ? "Saglabāt" : "Saglabāt prezentāciju"}>
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-sm font-bold">
                  Klients <span className="text-destructive">*</span>
                </span>
                <input name="client_name" required list="pres-clients" defaultValue={pres?.client_name ?? ""} className={adminInput} />
                <datalist id="pres-clients">
                  {clientNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </label>
              <label className="block space-y-1.5">
                <span className="block text-sm font-bold">Nosaukums</span>
                <input name="title" defaultValue={pres?.title ?? ""} placeholder="piem. Ziemassvētku pasākums bērniem" className={adminInput} />
              </label>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:grid-cols-4">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold">Datums</span>
                  <input name="event_date" type="date" defaultValue={pres?.event_date ?? ""} className={adminInput} />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold">Vieta</span>
                  <input name="place" defaultValue={pres?.place ?? ""} className={adminInput} />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold">Bērnu skaits</span>
                  <input name="children" inputMode="numeric" defaultValue={pres?.children ?? ""} className={adminInput} />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold">Ilgums, h</span>
                  <input name="hours" inputMode="decimal" defaultValue={pres?.hours ? String(pres.hours).replace(".", ",") : ""} className={adminInput} />
                </label>
              </div>
            </div>

            <fieldset>
              <legend className="text-base font-extrabold">Radošās darbnīcas</legend>
              <div className="mt-3">{options((ws ?? []) as Option[], "workshop_ids", pres?.workshop_ids ?? [])}</div>
            </fieldset>

            <fieldset>
              <legend className="text-base font-extrabold">Papildu aktivitātes</legend>
              <div className="mt-3">{options((acts ?? []) as Option[], "activity_ids", pres?.activity_ids ?? [])}</div>
            </fieldset>

            <label className="block space-y-1.5">
              <span className="block text-base font-extrabold">Teksts klientam</span>
              <textarea name="intro" rows={4} defaultValue={pres?.intro ?? ""} placeholder="Parādās prezentācijas beigās pie kontaktiem" className={adminInput} />
            </label>
          </div>
        </TeamForm>
        <p className="mt-4 text-xs text-ink-soft">Aprakstus un foto maina sadaļā “Radošās darbnīcas” un “Pakalpojumi”.</p>
        {pres && role === "owner" && (
          <div className="mt-6 border-t border-line pt-5">
            <DeleteButton action={deletePresentation.bind(null, pres.id)} label="Dzēst prezentāciju" />
          </div>
        )}
      </div>
    </>
  );
}
