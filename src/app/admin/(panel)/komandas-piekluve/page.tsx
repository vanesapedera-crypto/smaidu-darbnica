import { ChevronDown, UserCog } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { grantAccess, revokeAccess } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import { VISIBLE_SECTIONS } from "@/lib/team/sections";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import DeleteButton from "@/components/admin/DeleteButton";
import { adminInput } from "@/components/admin/styles";

export const metadata = { title: "Komandas piekļuve" };

type Member = { user_id: string; email: string; name: string | null; role: string; sections: string[] | null; created_at: string };

/**
 * Kas var ieiet panelī un kuras sadaļas katrs redz (ķeksīši). Maina administratore
 * un tie, kam atzīmēta sadaļa "Komandas piekļuve" (piem. Kristīne).
 */
export default async function TeamAccessPage() {
  const { db, role } = await requireSection("piekluve");
  const { data, error } = await db.from("team_access").select("*").order("created_at");
  if (missingTable(error)) return <MigrationNotice title="Komandas piekļuve" />;
  const members = (data ?? []) as Member[];
  const needsMigration = members.length > 0 && members.every((m) => m.sections === undefined);

  return (
    <>
      <PageHeader
        title="Komandas piekļuve"
        description="Ar ķeksīšiem izvēlieties, kuras sadaļas katrs redz. Pieteikumus labot, mājaslapu mainīt un ierakstus dzēst var tikai Vanesa."
      />
      {needsMigration && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Ķeksīši vēl nestrādā: Supabase jāpalaiž migrācija 20261107120000_team_sections.sql.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {members.map((m) => (
          <li key={m.user_id} className="rounded-2xl bg-white ring-1 ring-line">
            {/* Sākumā aizvērts — uzspiežot uz vārda atveras ķeksīši */}
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <UserCog className="size-5 text-ink-soft" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{m.name || m.email}</span>
                  <span className="block text-sm text-ink-soft">
                    {m.name ? `${m.email} · ` : ""}
                    {m.role === "manager" ? "var labot" : "tikai skatīt"} ·{" "}
                    {(m.sections ?? []).map((k) => VISIBLE_SECTIONS.find((x) => x.key === k)?.label).filter(Boolean).join(", ") || "nav sadaļu"}
                  </span>
                </span>
                <ChevronDown className="size-5 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="space-y-5 border-t border-line p-5">
                <TeamForm action={grantAccess}>
                  <input type="hidden" name="email" value={m.email} />
                  <input type="hidden" name="current_role" value={m.role} />
                  <AccessFields name={m.name} sections={m.sections ?? []} canEdit={m.role === "manager"} />
                </TeamForm>
                <DeleteButton action={revokeAccess.bind(null, m.user_id)} label="Noņemt piekļuvi" />
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-lg font-extrabold">Pievienot cilvēku</h2>
        {role === "owner" ? (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
            <li>
              Supabase → <b>Authentication → Users → Add user → Create new user</b>: e-pasts, pagaidu parole, “Auto Confirm User”.
            </li>
            <li>Šeit ievadiet to pašu e-pastu un atzīmējiet sadaļas.</li>
            <li>Pasakiet cilvēkam e-pastu un pagaidu paroli — pēc ieiešanas viņš to nomaina sadaļā “Mainīt paroli”.</li>
          </ol>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Jaunu kontu (e-pastu un pagaidu paroli) izveido Vanesa. Kad konts ir izveidots, šeit ievadiet e-pastu un atzīmējiet sadaļas.
          </p>
        )}
        <div className="mt-5">
          <TeamForm action={grantAccess} submitLabel="Pievienot" resetOnSave>
            <label className="block max-w-md space-y-1.5">
              <span className="block text-sm font-bold">
                E-pasts <span className="text-destructive">*</span>
              </span>
              <input name="email" type="email" required className={adminInput} />
            </label>
            <AccessFields name={null} sections={["kalendars", "scenariji"]} canEdit={false} />
          </TeamForm>
        </div>
      </section>
    </>
  );
}

function AccessFields({ name, sections, canEdit }: { name: string | null; sections: string[]; canEdit: boolean }) {
  return (
    <div className="space-y-4">
      <label className="block max-w-md space-y-1.5">
        <span className="block text-sm font-bold">Vārds</span>
        <input name="name" defaultValue={name ?? ""} placeholder="piem. Kristīne" className={adminInput} />
      </label>
      <fieldset>
        <legend className="text-sm font-bold">Redz sadaļas</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VISIBLE_SECTIONS.map((s) => (
            <label key={s.key} className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-line has-checked:bg-brand-soft has-checked:ring-ink">
              <input type="checkbox" name="sections" value={s.key} defaultChecked={sections.includes(s.key)} className="mt-0.5 size-4 shrink-0 accent-ink" />
              <span>
                <span className="block text-sm font-bold">{s.label}</span>
                <span className="block text-xs text-ink-soft">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {/* Paslēptās sadaļas (piem. standarta piedāvājumi), kas jau ir atzīmētas, saglabājas */}
      {sections.filter((x) => !VISIBLE_SECTIONS.some((s) => s.key === x)).map((x) => (
        <input key={x} type="hidden" name="sections" value={x} />
      ))}
      <label className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-line has-checked:bg-brand-soft has-checked:ring-ink sm:max-w-xl">
        <input type="checkbox" name="can_edit" value="1" defaultChecked={canEdit} className="mt-0.5 size-4 shrink-0 accent-ink" />
        <span>
          <span className="block text-sm font-bold">Var labot</span>
          <span className="block text-xs text-ink-soft">
            Pievienot un labot piedāvājumus, standarta piedāvājumus un scenārijus (tajās sadaļās, kuras redz). Dzēst nevar.
          </span>
        </span>
      </label>
    </div>
  );
}
