import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/admin/fields";
import { settingsSchemas, type SettingsKey } from "@/lib/admin/settings-schema";
import { defaultSettings } from "@/lib/content/defaults/settings";
import { saveSettings } from "../../../actions";
import AdminForm from "@/components/admin/AdminForm";
import PageHeader from "@/components/admin/PageHeader";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ saglabats?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const schema = settingsSchemas[(await params).key as SettingsKey];
  return { title: schema?.title ?? "Iestatījumi" };
}

/** Vietnes iestatījumu rediģēšana (sākumlapa, par mums, kontakti, SEO). */
export default async function SettingsPage({ params, searchParams }: Props) {
  const [{ key }, { saglabats }] = await Promise.all([params, searchParams]);
  const schema = settingsSchemas[key as SettingsKey];
  if (!schema) notFound();
  const settingsKey = key as SettingsKey;

  const { db } = await requireAdmin();
  const { data, error } = await db.from("site_settings").select("value").eq("key", settingsKey).maybeSingle();
  // Saglabātās vērtības pārraksta noklusējumu
  const current = { ...defaultSettings[settingsKey], ...((data?.value as object) ?? {}) } as Record<string, unknown>;

  const values = Object.fromEntries(
    schema.fields.map((f) => [f.name, f.type === "checkbox" ? current[f.name] === true : serialize(f.type, current[f.name])]),
  );

  return (
    <>
      <PageHeader
        title={schema.title}
        description={schema.description}
        notice={saglabats ? "Izmaiņas saglabātas un mājaslapa atjaunota." : undefined}
      />
      {error && (
        <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          Neizdevās nolasīt iestatījumus: {error.message}
        </p>
      )}
      <div className="mt-6 max-w-4xl">
        <AdminForm fields={schema.fields} values={values} action={saveSettings.bind(null, settingsKey)} folder="lapas" />
      </div>
    </>
  );
}
