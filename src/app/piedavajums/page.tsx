import OfferConfigurator, { type ConfiguratorPrices } from "@/components/site/OfferConfigurator";
import { getSettings } from "@/lib/content/queries";
import { supabase } from "@/lib/supabase";

// Cenas mainās reti — lapa atjaunojas ik pēc 5 minūtēm (klienta vārds no adreses — katram savs)
export const revalidate = 300;
export const metadata = { title: "Jūsu pasākuma piedāvājums | Smaidu Darbnīca" };

type Props = { searchParams: Promise<{ klients?: string }> };

/**
 * Individuāls piedāvājums klientam: www.smaidudarbnica.lv/piedavajums?klients=STIGA
 * Klients atzīmē izrādes, darbnīcas, aktivitātes — redz aptuveno cenu un nosūta pieteikumu.
 * Cenas — no paneļa "💰 Cenas" (funkcija configurator_prices).
 */
export default async function OfferPage({ searchParams }: Props) {
  const { klients } = await searchParams;
  const client = (klients ?? "").trim().slice(0, 80);
  const [{ data, error }, settings] = await Promise.all([supabase.rpc("configurator_prices"), getSettings()]);
  const prices = !error && data ? (data as ConfiguratorPrices) : null;
  const shows = settings.shows.videos ?? [];

  return prices ? (
    <OfferConfigurator prices={prices} shows={shows} games={(settings.business.games ?? []).filter((g) => g.name.trim())}
      characters={(settings.programs.characters ?? []).filter((c) => c.name.trim())}
      clientName={client}
      contact={settings.contact}
    />
  ) : (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="display text-2xl">Piedāvājuma salikšana šobrīd nav pieejama.</p>
      <p className="mt-3 text-white/60">
        Zvaniet {settings.contact.phoneBusiness} vai rakstiet {settings.contact.email} — sagatavosim piedāvājumu jūsu pasākumam.
      </p>
    </div>
  );
}
