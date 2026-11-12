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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase">Pasākuma piedāvājums</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">{client ? `Sveiki, ${client}!` : "Salieciet savu pasākumu"}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
        Atzīmējiet, ko vēlaties savā pasākumā — aptuvenā cena parādās uzreiz. Nosūtiet izvēli, un mēs sagatavosim prezentāciju ar
        visām detaļām.
      </p>
      <div className="mt-10">
        {prices ? (
          <OfferConfigurator prices={prices} shows={shows} games={(settings.business.games ?? []).filter((g) => g.name.trim())} clientName={client} />
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="text-lg font-bold">Piedāvājuma salikšana šobrīd nav pieejama.</p>
            <p className="mt-2 text-ink-soft">
              Zvaniet {settings.contact.phoneBusiness} vai rakstiet {settings.contact.email} — sagatavosim piedāvājumu jūsu pasākumam.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
