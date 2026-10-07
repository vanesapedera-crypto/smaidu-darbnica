import PhotoReel from "./PhotoReel";
import VideoShowcase from "./VideoShowcase";
import { StageHeading, StageHero } from "./stage";
import { ButtonLink, Container } from "./ui";
import { SHOW_PHOTOS } from "@/lib/content/defaults/service-media";
import { mediaInfo } from "@/lib/content/media";
import { getServices, getSettings } from "@/lib/content/queries";

/** Lapas "Izrādes" saturs: galvene, izrāžu atskaņotājs un bilžu karuselis */
export default async function ShowsView() {
  const [{ shows }, services] = await Promise.all([getSettings(), getServices("business")]);
  // Bilžu karuselis lapas apakšā — bilžu saraksts no paneļa (Izrādes → "Bilžu karuselis").
  // Platums un augstums (bildes proporcijai): zināmajām bildēm no service-media.ts, pārējām no bilžu saraksta.
  const known = new Map(SHOW_PHOTOS.map((p) => [p.src, p]));
  const reel = shows.photos.map((src) => {
    const size = known.get(src) ?? mediaInfo(src);
    return { src, alt: "Smaidu Darbnīcas izrāde", blur: null, width: size?.width ?? null, height: size?.height ?? null };
  });

  // Rezervācija notiek pieprasījuma formā lapā "Kontakti" (ar priekšatlasītu pakalpojumu)
  const slug = services.some((s) => s.slug === "izrades") ? "izrades" : "";
  const bookHref = (show?: string) => {
    const q = new URLSearchParams();
    if (slug) q.set("pakalpojums", slug);
    if (show) q.set("izrade", show);
    const qs = q.toString();
    return `/kontakti${qs ? `?${qs}` : ""}#pieprasijums`;
  };

  return (
    <>
      <StageHero
        eyebrow="Izrādes · uzņēmumiem un pašvaldībām"
        title={shows.heroTitle}
        highlight={shows.heroHighlight}
        text={shows.heroText}
        crumbs={[{ name: "Izrādes", path: "/izrades" }]}
        photos={[{ src: shows.heroImage, caption: "Izrāde" }]}
      >
        <ButtonLink href="#video" size="lg" arrow>
          Skatīties video
        </ButtonLink>
        <ButtonLink href={bookHref()} size="lg" variant="ghostLight">
          Rezervēt izrādi
        </ButtonLink>
      </StageHero>

      {shows.videos.length > 0 && (
        <section id="video" className="scroll-mt-20 py-20 md:py-28">
          <Container>
            <StageHeading
              eyebrow={`${shows.videos.length} izrādes`}
              title={shows.videosTitle}
              highlight="izrādes"
              text="Noskatieties fragmentus un izvēlieties savam pasākumam piemērotāko."
              className="mb-14 md:mb-20"
            />
            <VideoShowcase videos={shows.videos} bookHref={shows.videos.map((v) => bookHref(v.title))} />
          </Container>
        </section>
      )}

      {/* Bilžu karuselis no izrādēm (ritināms ar bultām vai pirkstu; klikšķis atver lielu bildi) */}
      {reel.length > 0 && (
        <section className="overflow-hidden bg-surface pt-16 pb-12 md:pt-20">
          <Container>
            <StageHeading eyebrow="Foto" title="Mirkļi no" highlight="izrādēm" className="mb-8" />
          </Container>
          <PhotoReel images={reel} plain />
        </section>
      )}
    </>
  );
}
