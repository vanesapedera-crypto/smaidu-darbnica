import { requireMember } from "@/lib/auth";
import { changePassword } from "@/app/admin/team-actions";
import PageHeader from "@/components/admin/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import { adminInput } from "@/components/admin/styles";

export const metadata = { title: "Mainīt paroli" };

export default async function PasswordPage() {
  const { email } = await requireMember();
  return (
    <>
      <PageHeader title="Mainīt paroli" description={email} />
      <div className="mt-6 max-w-md rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        <TeamForm action={changePassword} submitLabel="Nomainīt paroli" resetOnSave>
          <input type="email" name="username" autoComplete="username" defaultValue={email} hidden readOnly />
          <label className="block space-y-1.5">
            <span className="block text-sm font-bold">Jaunā parole</span>
            <input name="password" type="password" minLength={10} required autoComplete="new-password" className={adminInput} />
            <span className="block text-xs text-ink-soft">Vismaz 10 zīmes.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="block text-sm font-bold">Atkārtojiet paroli</span>
            <input name="repeat" type="password" minLength={10} required autoComplete="new-password" className={adminInput} />
          </label>
        </TeamForm>
      </div>
    </>
  );
}
