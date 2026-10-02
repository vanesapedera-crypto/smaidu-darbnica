import ServiceCard from "@/components/site/ServiceCard";
import { CtaBand, Partners } from "@/components/site/sections";
import { XmasFeature } from "@/components/site/XmasFeature";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getClients, getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";
import { businessHref } from "@/lib/utils";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    path: "/uznemumiem",
    title: "Pasākumi uzņēmumiem un pašvaldībām",
    description:
      "Lielformāta spēles, radošās darbnīcas, pasākumu vadīšana un organizēšana, mazuļu zona, sejas apgleznošana, putu ballīte, sporta spēles un izrādes uzņēmumiem visā Latvijā.",
  });
}

/** Ziemassvētku bloka izkārtojums: "tumsais" | "foto" | "saraksts" (sk. XmasFeature) */
const XMAS_LAYOUT = "tumsais" as const;

/**
 * Lapa "Uzņēmumiem": īsi un konkrēti — galvene, piedāvājumu kartītes (viens režģis),
 * klientu logotipi un kontakti. Pakalpojumi un to secība — panelī "Pakalpojumi".
 */
export default async function BusinessPage() {
  const [services, settings, clients] = await Promise.all([getServices("business"), getSettings(), getClients()]);
  const { business, contact, home } = settings;
  // Ziemassvētku blokā rāda pakalpojumus, kam panelī atzīmēta sezona "Ziema"
  // (izrādes — pirmās)
  const xmas = services
    .filter((s) => s.seasons.includes("ziema"))
    .sort((a, b) => Number(b.slug === "izrades") - Number(a.slug === "izrades"));

  return (
    <>
      <StageHero
        eyebrow="Uzņēmumiem · pašvaldībām · skolām"
        title={business.heroTitle}
        highlight={business.heroHighlight}
        text={business.heroText}
        crumbs={[{ name: "Uzņēmumiem", path: "/uznemumiem" }]}
        photos={[{ src: "/media/hero/pasakums-06.webp", caption: "Pasākums" }]}
      >
        <ButtonLink href="/kontakti#pieprasijums" size="lg" arrow>
          Pieprasīt piedāvājumu
        </ButtonLink>
        <ButtonLink href="#piedavajumi" size="lg" variant="ghostLight">
          Ko piedāvājam
        </ButtonLink>
      </StageHero>

      {/* Visi piedāvājumi vienā režģī */}
      <Section id="piedavajumi" className="scroll-mt-20">
        <Container>
          <StageHeading eyebrow={`${services.length} piedāvājumi`} title="Ko varam" highlight="piedāvāt" className="mb-12" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <ServiceCard key={s.slug} service={s} href={businessHref(s.slug)} index={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Ziemassvētki — atsevišķs bloks ar sezonas piedāvājumiem (pakalpojumi ar sezonu "Ziema" panelī) */}
      <XmasFeature home={home} services={xmas} variant={XMAS_LAYOUT} />

      <Partners items={clients} />

      <CtaBand
        title="Plānojat pasākumu?"
        text="Pastāstiet par savu ideju — ieteiksim piemērotāko programmu un sagatavosim piedāvājumu."
        contact={contact}
      />
    </>
  );
}
