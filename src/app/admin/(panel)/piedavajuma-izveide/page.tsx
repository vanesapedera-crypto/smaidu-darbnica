import { requireSection } from "@/lib/auth";
import { saveCalcOffer } from "@/app/admin/team-actions";
import { getSettings } from "@/lib/content/queries";
import { missingTable } from "@/lib/team/files";
import { emptyCalc, parseCalc, parseSettings, type CostItemRow } from "@/lib/team/offer-calc";
import { costPerPerson, materialMap, parseItems, type Material } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import OfferBuilder from "@/components/admin/team/OfferBuilder";
import CostCatalog from "@/components/admin/team/CostCatalog";

export const metadata = { title: "Piedāvājuma izveide" };

type Props = { searchParams: Promise<{ id?: string; saglabats?: string; klients?: string; prezentacija?: string }> };

export default async function OfferBuilderPage({ searchParams }: Props) {
  const { db, role } = await requireSection("piedavajumi", true);
  const { id, saglabats, klients, prezentacija } = await searchParams;
  const offerId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;

  const [{ data: ws, error }, { data: items }, { data: s }, { data: names }, site, existing, { data: materials }] = await Promise.all([
    db.from("workshops").select("id, title, items, description").order("title"),
    db.from("cost_items").select("*").order("sort").order("title"),
    db.from("calc_settings").select("data").eq("id", 1).maybeSingle(),
    db.from("offers").select("client_name").eq("kind", "client"),
    getSettings(),
    offerId ? db.from("offers").select("calc, client_name, title").eq("id", offerId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("materials").select("id, name, price, pack"),
  ]);
  const mats = materialMap(materials as Material[] | null);
  if (missingTable(error) || items === null) return <MigrationNotice title="Piedāvājuma izveide" file="20261108090000_offer_builder.sql" />;

  const settings = parseSettings(s?.data);
  const travelRate = site.programs.travelRate;
  let initial = existing.data?.calc
    ? parseCalc(existing.data.calc, settings, travelRate)
    : { ...emptyCalc(settings, travelRate), client: klients ?? existing.data?.client_name ?? "" };

  // No prezentācijas: tie paši klients, datums, bērni un atzīmētās darbnīcas/aktivitātes
  if (!offerId && prezentacija && /^[0-9a-f-]{36}$/i.test(prezentacija)) {
    const { data: pr } = await db.from("presentations").select("*").eq("id", prezentacija).maybeSingle();
    if (pr) {
      const children = (pr.children as number | null) ?? initial.children;
      const hours = Number(pr.hours) || initial.hours;
      initial = {
        ...initial,
        client: pr.client_name as string,
        title: (pr.title as string | null) ?? "",
        date: (pr.event_date as string | null) ?? "",
        place: (pr.place as string | null) ?? "",
        children,
        hours,
        note: (pr.intro as string | null) ?? "",
        staff: initial.staff.map((x) => ({ ...x, hours })),
        workshops: ((pr.workshop_ids as string[]) ?? [])
          .map((wid) => (ws ?? []).find((w) => w.id === wid))
          .filter(Boolean)
          .map((w) => ({ id: w!.id as string, title: w!.title as string, costPerPerson: costPerPerson(parseItems(w!.items), mats), persons: children })),
        items: ((pr.activity_ids as string[]) ?? [])
          .map((aid) => ((items ?? []) as CostItemRow[]).find((i) => i.id === aid))
          .filter(Boolean)
          .map((i) => ({
            id: i!.id,
            kind: i!.kind,
            title: i!.title,
            unit: i!.unit,
            unitCost: Number(i!.cost),
            qty: i!.unit === "hour" ? hours : i!.unit === "person" ? children : 1,
          })),
      };
    }
  }
  const clientNames = [...new Set(((names ?? []) as { client_name: string | null }[]).map((n) => n.client_name).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "lv"),
  );

  return (
    <>
      <PageHeader
        title={offerId ? (existing.data?.title ?? "Piedāvājums") : "Piedāvājuma izveide"}
        description="Atzīmējiet, ko piedāvāt — cena saskaitās pati. Pēc saglabāšanas var lejupielādēt prezentāciju un piedāvājumu PDF formātā."
        notice={saglabats ? "Saglabāts. Tagad var veidot PDF." : undefined}
        actions={
          <a href="#cenas" className="text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
            Cenas un likmes
          </a>
        }
      />
      {offerId && !existing.data?.calc && existing.data && (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm">Šis piedāvājums veidots bez kalkulatora — saglabājot tas tiks papildināts ar aprēķinu.</p>
      )}
      <div className="mt-6">
        <OfferBuilder
          key={offerId ?? prezentacija ?? "jauns"}
          initial={initial}
          workshops={(ws ?? []).map((w) => ({
            id: w.id as string,
            title: w.title as string,
            costPerPerson: costPerPerson(parseItems(w.items), mats),
            hasDescription: Boolean((w.description as string | null)?.trim()),
          }))}
          catalog={((items ?? []) as CostItemRow[]).map((i) => ({ id: i.id, kind: i.kind, title: i.title, unit: i.unit, cost: Number(i.cost) }))}
          settings={settings}
          clientNames={clientNames}
          offerId={offerId}
          action={saveCalcOffer.bind(null, offerId)}
        />
      </div>

      {/* Aktivitāšu un izdevumu cenas, likmes — rediģē šeit pat */}
      <details id="cenas" className="mt-10 scroll-mt-6 rounded-2xl bg-surface p-1 ring-1 ring-line">
        <summary className="cursor-pointer rounded-xl bg-white px-5 py-4 text-base font-extrabold">Cenas un likmes — aktivitātes, citi izdevumi, animatori, uzcenojums</summary>
        <div className="p-4">
          <CostCatalog db={db} role={role} />
        </div>
      </details>
    </>
  );
}
