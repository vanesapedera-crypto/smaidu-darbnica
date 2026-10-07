import PhotoReel from "@/components/site/PhotoReel";
import VideoShowcase from "@/components/site/VideoShowcase";
import { XMAS_INQUIRY, XMAS_PAGE, XmasOffers } from "@/components/site/XmasFeature";
import { CtaBand } from "@/components/site/sections";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container } from "@/components/site/ui";
import { toReel } from "@/lib/content/media";
import { getAlbumImages, getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const TITLE = "Ziemassvētki uzņēmumiem";
/** Fotoalbumi lapas apakšā (panelī "Foto") */
const ALBUMS = ["ziemassvetki-2025"];

export async function generateMetadata() {
  const { business, home } = await getSettings();
  return pageMetadata({ path: XMAS_PAGE, title: TITLE, description: business.winterText, image: home.xmasPhotos[0]?.src });
}

/**
 * Atsevišķa lapa "Ziemassvētki uzņēmumiem" — lai meklētājos to var atrast pēc šiem vārdiem.
 * Jaunu tekstu šeit nav: viss saturs nāk no paneļa —
 *  galvene: Uzņēmumiem → ziemas teksts; piedāvājumi: Sākumlapa → Ziemassvētku bloka kartītes;
 *  izrādes: Izrādes → video (tikai Ziemassvētku izrādes); bildes: albums "Ziemassvētki".
 * Lapa ir pieejama visu gadu — arī tad, kad sezonas reklāma sākumlapā ir izslēgta.
 */
export default async function XmasBusinessPage() {
  const [settings, services, images] = await Promise.all([getSettings(), getServices("business"), getAlbumImages(ALBUMS, 16)]);
  const { business, contact, home, shows } = settings;

  const xmas = /ziemassvētk/i;
  const videos = shows.videos.filter((v) => xmas.test(v.title) || xmas.test(v.description ?? ""));
  const bookHref = (show: string) => `/kontakti?${new URLSearchParams({ pakalpojums: "izrades", izrade: show })}#pieprasijums`;

  return (
    <>
      <StageHero
        eyebrow={home.xmasEyebrow}
        title="Ziemassvētki"
        highlight="uzņēmumiem"
        text={business.winterText}
        crumbs={[
          { name: "Uzņēmumiem", path: "/uznemumiem" },
          { name: TITLE, path: XMAS_PAGE },
        ]}
        photos={home.xmasPhotos.slice(0, 1)}
      >
        <ButtonLink href={XMAS_INQUIRY} size="lg" arrow>
          Pieprasīt piedāvājumu
        </ButtonLink>
        <ButtonLink href="#piedavajumi" size="lg" variant="ghostLight">
          Ko piedāvājam
        </ButtonLink>
      </StageHero>

      <XmasOffers home={home} services={services} />

      {videos.length > 0 && (
        <section id="izrades" className="scroll-mt-20 py-20 md:py-28">
          <Container>
            <StageHeading
              eyebrow={`${videos.length} izrādes`}
              title="Ziemassvētku"
              highlight="izrādes"
              className="mb-14 md:mb-20"
            />
            <VideoShowcase videos={videos} bookHref={videos.map((v) => bookHref(v.title))} />
          </Container>
        </section>
      )}

      {images.length > 0 && (
        <section className="overflow-hidden bg-surface pt-20 pb-12 md:pt-28">
          <Container>
            <StageHeading eyebrow="Foto" title="No mūsu" highlight="pasākumiem" />
          </Container>
          <PhotoReel images={toReel(images)} />
        </section>
      )}

      <CtaBand
        title="Plānojat pasākumu?"
        text="Pastāstiet par savu ideju — ieteiksim piemērotāko programmu un sagatavosim piedāvājumu."
        contact={contact}
        href={XMAS_INQUIRY}
      />
    </>
  );
}
