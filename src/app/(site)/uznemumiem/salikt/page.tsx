import OfferConfigurator, { type ConfiguratorPrices } from "@/components/site/OfferConfigurator";
import { StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";
import { supabase } from "@/lib/supabase";

// Cenas mainās reti — lapa atjaunojas ik pēc 5 minūtēm
export const revalidate = 300;

export function generateMetadata() {
  return pageMetadata({
    path: "/uznemumiem/salikt",
    title: "Salikt pasākuma piedāvājumu",
    description: "Atzīmējiet radošās darbnīcas, aktivitātes un izrādi — uzreiz redzēsiet aptuveno cenu un varēsiet nosūtīt pieteikumu.",
    // Saite tikai klientiem, kuriem to nosūta — meklētājos nerāda
    noindex: true,
  });
}

/**
 * Publiskā lapa uzņēmumiem: klients pats saliek pasākumu (darbnīcas, aktivitātes, izrāde, ceļš)
 * un redz aptuveno cenu ar PVN. Cenas — no paneļa "💰 Cenas" (funkcija configurator_prices, sk. migrāciju 20261113100000).
 * Nosūtot pieteikums nonāk sadaļā "Pieteikumi" kā uzņēmuma pieprasījums.
 */
export default async function ConfiguratorPage() {
  const [{ data, error }, settings] = await Promise.all([supabase.rpc("configurator_prices"), getSettings()]);
  const prices = !error && data ? (data as ConfiguratorPrices) : null;
  const shows = settings.shows.videos ?? [];
  const ready = prices && (prices.workshops.length > 0 || prices.activities.length > 0 || shows.length > 0);

  return (
    <>
      <StageHero
        eyebrow="Uzņēmumiem · pašvaldībām · skolām"
        title="Salieciet savu"
        highlight="pasākumu"
        text="Atzīmējiet, ko vēlaties — aptuvenā cena parādās uzreiz. Nosūtiet pieteikumu, un mēs sazināsimies, lai precizētu detaļas."
        crumbs={[
          { name: "Uzņēmumiem", path: "/uznemumiem" },
          { name: "Salikt piedāvājumu", path: "/uznemumiem/salikt" },
        ]}
        photos={[{ src: settings.business.heroImage, caption: "Pasākums" }]}
      />
      <Section>
        <Container className="max-w-6xl">
          {ready ? (
            <OfferConfigurator prices={prices} shows={shows} games={(settings.business.games ?? []).filter((g) => g.name.trim())} />
          ) : (
            <div className="rounded-3xl bg-surface p-8 text-center">
              <p className="text-lg font-bold">Piedāvājuma salikšana šobrīd nav pieejama.</p>
              <p className="mt-2 text-ink-soft">Uzrakstiet mums — sagatavosim piedāvājumu jūsu pasākumam.</p>
              <ButtonLink href="/kontakti#pieprasijums" className="mt-6" arrow>
                Pieprasīt piedāvājumu
              </ButtonLink>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
