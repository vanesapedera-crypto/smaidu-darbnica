import { requireSection } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import CostCatalog from "@/components/admin/team/CostCatalog";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import { missingTable } from "@/lib/team/files";

export const metadata = { title: "Pakalpojumi" };

/** Pakalpojumu (papildu aktivitāšu) un citu izdevumu cenas, personāla likmes, uzcenojums un PVN. */
export default async function ServicesPricesPage() {
  const { db, role } = await requireSection("piedavajumi");
  const { error } = await db.from("cost_items").select("id").limit(1);
  if (missingTable(error)) return <MigrationNotice title="Pakalpojumi" file="20261108090000_offer_builder.sql" />;
  return (
    <>
      <PageHeader
        title="Pakalpojumi"
        description="Fiksētās cenas: papildu aktivitātes (par stundu vai gabalu), citi izdevumi, personāla likmes. Piedāvājumā pēc tam jānorāda tikai daudzums."
      />
      <div className="mt-6">
        <CostCatalog db={db} role={role} />
      </div>
    </>
  );
}
