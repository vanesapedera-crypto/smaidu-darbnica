import { UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { grantAccess, revokeAccess } from "@/app/admin/team-actions";
import { missingTable } from "@/lib/team/files";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import DeleteButton from "@/components/admin/DeleteButton";
import { adminInput } from "@/components/admin/styles";

export const metadata = { title: "Komandas piekļuve" };

const ROLES = [
  {
    value: "manager",
    label: "Vadība (Kristīne)",
    text: "Pieteikumi un kalendārs — skatīt. Piedāvājumi, standarta piedāvājumi, scenāriji, klientu vēsture — pievienot un labot. Dzēst nevar.",
  },
  {
    value: "viewer",
    label: "Telpas (Keita)",
    text: "Kalendārs (atveras ar telpu nomu) un standarta piedāvājumi — skatīt. Scenāriji — skatīt un pievienot.",
  },
  {
    value: "animator",
    label: "Animators",
    text: "Kalendārs un standarta piedāvājumi — skatīt. Scenāriji — skatīt un pievienot.",
  },
];

type Member = { user_id: string; email: string; name: string | null; role: string; created_at: string };

/** Kam ir piekļuve panelim un ar kādām tiesībām. Redz un maina tikai administratore. */
export default async function TeamAccessPage() {
  const { db, email } = await requireAdmin();
  const { data, error } = await db.from("team_access").select("*").order("created_at");
  if (missingTable(error)) return <MigrationNotice title="Komandas piekļuve" />;
  const members = (data ?? []) as Member[];

  return (
    <>
      <PageHeader title="Komandas piekļuve" description="Kas var ieiet panelī un ko katrs tur redz. Pieteikumus labot un mājaslapu mainīt varat tikai jūs." />

      <ul className="mt-6 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        <li className="flex flex-wrap items-center gap-3 px-5 py-4">
          <UserCog className="size-5 text-ink-soft" aria-hidden />
          <div className="flex-1">
            <p className="font-bold">{email}</p>
            <p className="text-sm text-ink-soft">Administratore — redz, maina un dzēš visu; vienīgā var mainīt cenas un lietotājus</p>
          </div>
        </li>
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <UserCog className="size-5 text-ink-soft" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{m.name ? `${m.name} · ` : ""}{m.email}</p>
              <p className="text-sm text-ink-soft">{ROLES.find((r) => r.value === m.role)?.label ?? m.role} — {ROLES.find((r) => r.value === m.role)?.text}</p>
            </div>
            <DeleteButton action={revokeAccess.bind(null, m.user_id)} label="Noņemt piekļuvi" />
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-lg font-extrabold">Pievienot vai mainīt lomu</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
          <li>
            Supabase → <b>Authentication → Users → Add user → Create new user</b>: e-pasts, pagaidu parole, atzīmējiet “Auto Confirm User”.
          </li>
          <li>Šeit ievadiet to pašu e-pastu un izvēlieties lomu.</li>
          <li>Pasakiet cilvēkam e-pastu un pagaidu paroli. Pēc pirmās ieiešanas viņš to nomaina sadaļā “Mainīt paroli”.</li>
        </ol>
        <div className="mt-5">
          <TeamForm action={grantAccess} submitLabel="Piešķirt piekļuvi" resetOnSave>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="block text-sm font-bold">E-pasts <span className="text-destructive">*</span></span>
                <input name="email" type="email" required className={adminInput} />
              </label>
              <label className="space-y-1.5">
                <span className="block text-sm font-bold">Vārds</span>
                <input name="name" placeholder="piem. Kristīne" className={adminInput} />
              </label>
              <fieldset className="space-y-2 md:col-span-2">
                <legend className="text-sm font-bold">Loma</legend>
                {ROLES.map((r, i) => (
                  <label key={r.value} className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-line has-checked:ring-2 has-checked:ring-ink">
                    <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="mt-1 size-4 accent-ink" />
                    <span>
                      <span className="block text-sm font-bold">{r.label}</span>
                      <span className="block text-sm text-ink-soft">{r.text}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          </TeamForm>
        </div>
      </section>
    </>
  );
}
