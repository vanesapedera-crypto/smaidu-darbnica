import PageHeader from "../PageHeader";

/** Rāda, ja datubāzē vēl nav komandas sadaļu tabulu */
export default function MigrationNotice({ title, file = "20261107090000_team_access.sql" }: { title: string; file?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="mt-6 rounded-2xl bg-white p-6 text-sm leading-6 ring-1 ring-line">
        <p className="font-bold">Šī sadaļa vēl nav pieslēgta datubāzei.</p>
        <p className="mt-1 text-ink-soft">
          Supabase → SQL Editor → ielīmējiet un palaidiet failu <code>supabase/migrations/{file}</code>.
        </p>
      </div>
    </>
  );
}
