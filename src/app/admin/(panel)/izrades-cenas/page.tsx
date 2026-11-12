import { Save } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { getSettings } from "@/lib/content/queries";
import { saveShowPrice } from "@/app/admin/team-actions";
import PageHeader from "@/components/admin/PageHeader";
import { adminInput, adminPrimary } from "@/components/admin/styles";
import SeasonChecks from "@/components/admin/team/SeasonChecks";
import { showPriceItem, type CostItemRow } from "@/lib/team/offer-calc";

export const metadata = { title: "Izrādes — cenas" };

type Props = { searchParams: Promise<{ saglabats?: string }> };

/**
 * Izrāžu cenas lapai "Salikt piedāvājumu": katrai izrādei (no lapas "Izrādes") — izmaksas un sezona.
 * Glabājas izmaksu katalogā (cost_items) kā aktivitāte ar fiksētu summu "Izrāde „Nosaukums”";
 * klientam cena — ar uzcenojumu un PVN, tāpat kā pārējiem pakalpojumiem.
 */
export default async function ShowPricesPage({ searchParams }: Props) {
  const { db } = await requireSection("piedavajumi", true);
  const { saglabats } = await searchParams;
  const [settings, { data }] = await Promise.all([getSettings(), db.from("cost_items").select("*").eq("kind", "activity")]);
  const items = (data ?? []) as CostItemRow[];
  const shows = (settings.shows.videos ?? []).filter((v) => v.title.trim());

  return (
    <>
      <PageHeader
        title="Izrādes — cenas"
        description="Cena klientam (bez PVN) un sezona katrai izrādei. Lapā “Salikt piedāvājumu” klients to redz ar PVN. Ja telpu nodrošinām mēs — pieskaita telpas nomu (no summas likmēs)."
      />
      {saglabats && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Saglabāts: {saglabats}</p>}

      {shows.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Izrāžu sarakstā vēl nav.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shows.map((v) => {
            const item = showPriceItem(items, v.title);
            return (
              <li key={v.title} className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
                <form action={saveShowPrice} className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                  <input type="hidden" name="show" value={v.title} />
                  <div className="min-w-0">
                    <p className="font-extrabold">{v.title}</p>
                    <p className="text-sm text-ink-soft">{[v.duration, v.audience].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="block text-sm font-bold">Cena bez PVN, €</span>
                    <input name="cost" inputMode="decimal" defaultValue={item ? String(item.cost).replace(".", ",") : ""} placeholder="0" className={adminInput} />
                  </label>
                  <SeasonChecks value={item?.season ?? v.season} />
                  <button type="submit" className={adminPrimary}>
                    <Save className="size-4" aria-hidden /> Saglabāt
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-sm text-ink-soft">
        Ja cena nav ievadīta, klients izrādi var atzīmēt, bet pie kopsummas būs “+ izrādes cena” — to precizēsiet sarunā.
      </p>
    </>
  );
}
