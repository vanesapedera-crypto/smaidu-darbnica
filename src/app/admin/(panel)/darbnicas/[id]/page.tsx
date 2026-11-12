import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isManagerRole, requireSection } from "@/lib/auth";
import { deleteWorkshop, saveWorkshop } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import { parseItems, type Material, type WorkshopRow } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import WorkshopItems from "@/components/admin/team/WorkshopItems";
import PhotoField from "@/components/admin/team/PhotoField";
import SeasonChecks from "@/components/admin/team/SeasonChecks";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import DeleteButton from "@/components/admin/DeleteButton";
import { adminInput } from "@/components/admin/styles";

export const metadata = { title: "Radošā darbnīca" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saglabats?: string }> };

export default async function WorkshopPage({ params, searchParams }: Props) {
  const { db, role } = await requireSection("darbnicas");
  const [{ id }, { saglabats }] = await Promise.all([params, searchParams]);
  const isNew = id === "jauna";
  const canEdit = isManagerRole(role);
  if (isNew && !canEdit) redirect("/admin/darbnicas");
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let w: WorkshopRow | null = null;
  if (!isNew) {
    const { data, error } = await db.from("workshops").select("*").eq("id", id).maybeSingle();
    if (missingTable(error)) return <MigrationNotice title="Radošās darbnīcas" file="20261107130000_workshops.sql" />;
    if (!data) notFound();
    w = data as WorkshopRow;
  }
  const items = parseItems(w?.items);
  const { data: materials } = await db.from("materials").select("id, name, price, pack").order("name");
  const mats = ((materials ?? []) as Material[]).map((m) => ({ ...m, price: Number(m.price) || 0 }));

  return (
    <>
      <Link href="/admin/darbnicas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Radošās darbnīcas
      </Link>
      <div className="mt-3">
        <PageHeader title={isNew ? "Jauna darbnīca" : w!.title} notice={saglabats ? "Saglabāts." : undefined} />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        {canEdit ? (
          <TeamForm action={saveWorkshop.bind(null, isNew ? null : id)} submitLabel={isNew ? "Saglabāt darbnīcu" : "Saglabāt"}>
            <div className="space-y-5">
              <label className="block max-w-xl space-y-1.5">
                <span className="block text-sm font-bold">
                  Darbnīcas nosaukums <span className="text-destructive">*</span>
                </span>
                <input name="title" required defaultValue={w?.title ?? ""} placeholder="piem. Ziemassvētku rotājumu darbnīca" className={adminInput} />
              </label>
              <SeasonChecks value={(w as { season?: string } | null)?.season} />
              <WorkshopItems initial={items} materials={mats} participants={w?.participants ?? null} />
              <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-[1fr_auto]">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold">Apraksts prezentācijai</span>
                  <textarea
                    name="description"
                    rows={5}
                    defaultValue={w?.description ?? ""}
                    placeholder="Ko bērni darīs, ko paņems līdzi uz mājām, cik ilgi ilgst…"
                    className={adminInput}
                  />
                  <span className="block text-xs text-ink-soft">Šis teksts un foto parādās klientam sūtāmajā prezentācijā.</span>
                </label>
                <PhotoField value={w?.image ?? null} />
              </div>
            </div>
          </TeamForm>
        ) : (
          <div className="space-y-5">
            <WorkshopItems initial={items} materials={mats} participants={w?.participants ?? null} readOnly />
          </div>
        )}
        {!isNew && role === "owner" && (
          <div className="mt-6 border-t border-line pt-5">
            <DeleteButton action={deleteWorkshop.bind(null, id)} label="Dzēst darbnīcu" />
          </div>
        )}
      </div>
    </>
  );
}
