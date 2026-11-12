import { Pencil, Plus } from "lucide-react";
import { isManagerRole, type MemberContext } from "@/lib/auth";
import { deleteCostItem, saveCalcSettings, saveCostItem } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import { UNIT_LABEL, parseSettings, type CostItemRow, type Unit } from "@/lib/team/offer-calc";
import { money } from "@/lib/team/workshops";
import { getSettings } from "@/lib/content/queries";
import TeamForm from "./TeamForm";
import PhotoField from "./PhotoField";
import DeleteButton from "../DeleteButton";
import { adminInput, adminSecondary } from "../styles";

/**
 * Cenas un likmes piedāvājuma izveidei (rāda lapā "Piedāvājuma izveide"): papildu aktivitātes un citi izdevumi
 * ar mērvienību un pašizmaksu, kā arī likmes (animatori, uzcenojums, PVN) — likmes maina tikai administratore.
 */
export default async function CostCatalog({ db, role }: Pick<MemberContext, "db" | "role">) {
  const canEdit = isManagerRole(role);
  const [{ data, error }, { data: s }, site] = await Promise.all([
    db.from("cost_items").select("*").order("kind").order("sort").order("title"),
    db.from("calc_settings").select("data").eq("id", 1).maybeSingle(),
    getSettings(),
  ]);
  if (missingTable(error)) return null;
  const items = (data ?? []) as (CostItemRow & { description: string | null; image: string | null })[];
  const settings = parseSettings(s?.data);

  const group = (kind: "activity" | "expense", title: string, hint: string) => (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="text-sm text-ink-soft">{hint}</p>
      <ul className="mt-3 space-y-2">
        {items.filter((i) => i.kind === kind).length === 0 && <li className="rounded-2xl bg-white p-5 text-sm text-ink-soft ring-1 ring-line">Vēl nav.</li>}
        {items
          .filter((i) => i.kind === kind)
          .map((i) => (
            <li key={i.id} className="rounded-2xl bg-white ring-1 ring-line">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 font-bold">{i.title}</span>
                  <span className="text-sm">
                    {i.cost > 0 ? <b>{money(Number(i.cost))}</b> : <span className="font-semibold text-destructive">cena nav ievadīta</span>}{" "}
                    <span className="text-ink-soft">{UNIT_LABEL[i.unit]}</span>
                  </span>
                  {canEdit && <Pencil className="size-4 text-ink-soft" aria-hidden />}
                </summary>
                <div className="space-y-4 border-t border-line p-5">
                  {canEdit ? (
                    <TeamForm action={saveCostItem.bind(null, i.id)}>
                      <ItemFields item={i} />
                    </TeamForm>
                  ) : (
                    <p className="text-sm whitespace-pre-line">{i.description || "—"}</p>
                  )}
                  {role === "owner" && <DeleteButton action={deleteCostItem.bind(null, i.id)} />}
                </div>
              </details>
            </li>
          ))}
      </ul>
    </section>
  );

  return (
    <>
      <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-lg font-extrabold">Likmes</h2>
        {role === "owner" ? (
          <TeamForm action={saveCalcSettings} className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Num name="animatorHour" label="Animators — par stundu, €" value={settings.animatorHour} />
              <Num name="animatorFixed" label="Animators — par pasākumu, €" value={settings.animatorFixed} />
              <Num name="markup" label="Uzcenojums, %" value={settings.markup} />
              <Num name="vat" label="PVN, %" value={settings.vat} />
              <Num name="perAnimator" label="Darbnīcās 1 animators uz … dalībniekiem" value={settings.perAnimator} />
            </div>
            <p className="text-xs text-ink-soft">
              Ceļa izdevumi — {money(site.programs.travelRate)} par km (tā pati likme, ko izmanto rezervācijās). Katrā piedāvājumā likmes var arī mainīt.
            </p>
          </TeamForm>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            Animators: {money(settings.animatorHour)}/h vai {money(settings.animatorFixed)} par pasākumu · Uzcenojums {settings.markup}% · PVN {settings.vat}% · Ceļš{" "}
            {money(site.programs.travelRate)}/km. Likmes maina Vanesa.
          </p>
        )}
      </section>

      {group("activity", "Papildu aktivitātes", "Balonu locīšana, sejas apgleznošana, lielformāta spēles u.c. Ar foto un aprakstu tās parādās arī prezentācijā.")}
      {group("expense", "Citi izdevumi", "Piem. transports, telts, skaņa, papildu personāls — fiksēta summa vai pēc daudzuma.")}

      {canEdit && (
        <details className="mt-8 rounded-2xl bg-white ring-1 ring-line">
          <summary className={`${adminSecondary} m-4 cursor-pointer list-none border-0 [&::-webkit-details-marker]:hidden`}>
            <Plus className="size-4" aria-hidden /> Pievienot aktivitāti vai izdevumu
          </summary>
          <div className="border-t border-line p-5 sm:p-7">
            <TeamForm action={saveCostItem.bind(null, null)} submitLabel="Pievienot" resetOnSave>
              <ItemFields />
            </TeamForm>
          </div>
        </details>
      )}
    </>
  );
}

function Num({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-bold">{label}</span>
      <input name={name} inputMode="decimal" defaultValue={String(value).replace(".", ",")} className={adminInput} />
    </label>
  );
}

function ItemFields({ item }: { item?: CostItemRow & { description: string | null; image: string | null } }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <label className="block space-y-1.5 md:col-span-2">
        <span className="block text-sm font-bold">
          Nosaukums <span className="text-destructive">*</span>
        </span>
        <input name="title" required defaultValue={item?.title ?? ""} className={adminInput} />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">Veids</span>
        <select name="kind" defaultValue={item?.kind ?? "activity"} className={adminInput}>
          <option value="activity">Papildu aktivitāte</option>
          <option value="expense">Cits izdevums</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1.5">
          <span className="block text-sm font-bold">Pašizmaksa, €</span>
          <input name="cost" inputMode="decimal" defaultValue={item ? String(item.cost).replace(".", ",") : ""} className={adminInput} />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-sm font-bold">Mērvienība</span>
          <select name="unit" defaultValue={item?.unit ?? "hour"} className={adminInput}>
            {(Object.keys(UNIT_LABEL) as Unit[]).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1.5 md:col-span-3">
        <span className="block text-sm font-bold">Apraksts prezentācijai</span>
        <textarea name="description" rows={4} defaultValue={item?.description ?? ""} className={adminInput} />
      </label>
      <PhotoField value={item?.image ?? null} />
    </div>
  );
}
