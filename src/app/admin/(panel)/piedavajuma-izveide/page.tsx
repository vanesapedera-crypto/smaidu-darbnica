import Link from "next/link";
import { Archive, ChevronDown, Paperclip } from "lucide-react";
import type { OfferRow } from "@/lib/team/types";
import { lvDate, statusTone } from "@/components/admin/team/offer-utils";
import { adminSecondary } from "@/components/admin/styles";
import { cn } from "@/lib/utils";
import { requireSection } from "@/lib/auth";
import { saveCalcOffer } from "@/app/admin/team-actions";
import { getSettings } from "@/lib/content/queries";
import { missingTable } from "@/lib/team/files";
import { emptyCalc, parseCalc, parseSettings, type CostItemRow } from "@/lib/team/offer-calc";
import { materialMap, workshopCost, type Material } from "@/lib/team/workshops";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import OfferBuilder from "@/components/admin/team/OfferBuilder";

export const metadata = { title: "Piedāvājuma izveide" };

type Props = { searchParams: Promise<{ id?: string; saglabats?: string; klients?: string; prezentacija?: string }> };

export default async function OfferBuilderPage({ searchParams }: Props) {
  const { db } = await requireSection("piedavajumi", true);
  const { id, saglabats, klients, prezentacija } = await searchParams;
  const offerId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;

  const [{ data: ws, error }, { data: items }, { data: s }, { data: names }, site, existing, { data: materials }, { data: archiveData }] = await Promise.all([
    db.from("workshops").select("*").order("title"),
    db.from("cost_items").select("*").order("sort").order("title"),
    db.from("calc_settings").select("data").eq("id", 1).maybeSingle(),
    db.from("offers").select("client_name").eq("kind", "client"),
    getSettings(),
    offerId ? db.from("offers").select("calc, client_name, title").eq("id", offerId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("materials").select("id, name, price, pack"),
    db.from("offers").select("*").eq("kind", "client").order("offer_date", { ascending: false, nullsFirst: false }),
  ]);
  const archive = (archiveData ?? []) as OfferRow[];
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
          .map((w) => ({ id: w!.id as string, title: w!.title as string, costPerPerson: workshopCost(w as { items: unknown; fixed_cost?: number | null }, mats), persons: children })),
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
          <>
            <a href="#arhivs" className={adminSecondary}>
              <Archive className="size-4" aria-hidden /> Arhīvs ({archive.length})
            </a>
            <Link href="/admin/izmaksas" className="text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
              💰 Pakalpojumu cenas
            </Link>
          </>
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
            costPerPerson: workshopCost(w as { items: unknown; fixed_cost?: number | null }, mats),
            hasDescription: Boolean((w.description as string | null)?.trim()),
          }))}
          catalog={((items ?? []) as CostItemRow[]).map((i) => ({ id: i.id, kind: i.kind, title: i.title, unit: i.unit, cost: Number(i.cost) }))}
          settings={settings}
          clientNames={clientNames}
          offerId={offerId}
          action={saveCalcOffer.bind(null, offerId)}
        />
      </div>

      {/* Arhīvs — visi piedāvājumi klientiem (jaunākie augšā) */}
      <details id="arhivs" className="group/a mt-8 rounded-2xl bg-white ring-1 ring-line open:ring-ink">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <Archive className="size-4" aria-hidden />
          <span className="flex-1 text-base font-extrabold">Arhīvs ({archive.length})</span>
          <ChevronDown className="size-4 text-ink-soft transition-transform group-open/a:rotate-180" aria-hidden />
        </summary>
        <ul className="divide-y divide-line border-t border-line">
          {archive.length === 0 && <li className="p-5 text-sm text-ink-soft">Piedāvājumu vēl nav.</li>}
          {archive.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/piedavajumi/${o.id}`}
                className={cn("grid gap-x-6 gap-y-1 px-5 py-3 hover:bg-surface/60 md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.4fr)_auto]", o.id === offerId && "bg-brand-soft")}
              >
                <span className="text-sm text-ink-soft">{lvDate(o.offer_date) || "—"}</span>
                <span className="min-w-0 font-bold">{o.client_name}</span>
                <span className="min-w-0 text-sm">
                  <span className="font-semibold">{o.title}</span>
                  {o.file_name && <Paperclip className="ml-1.5 inline size-3.5 text-ink-soft" aria-label="Pievienots fails" />}
                  {o.services && <span className="line-clamp-1 text-ink-soft">{o.services}</span>}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  {o.price && <span className="font-semibold">{o.price}</span>}
                  {o.status && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", statusTone(o.status))}>{o.status}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
