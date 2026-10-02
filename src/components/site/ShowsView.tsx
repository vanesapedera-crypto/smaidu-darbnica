import PhotoReel from "./PhotoReel";
import VideoShowcase, { type ShowcaseVariant } from "./VideoShowcase";
import { StageHeading, StageHero } from "./stage";
import { ButtonLink, Container } from "./ui";
import { SHOW_PHOTOS } from "@/lib/content/defaults/service-media";
import { getServices, getSettings } from "@/lib/content/queries";

/** Lapas saturs (atsevišķi, lai priekšskatījumā var salīdzināt izkārtojumus) */
export default async function ShowsView({ variant }: { variant: ShowcaseVariant }) {
  const [{ shows }, services] = await Promise.all([getSettings(), getServices("business")]);
  // Bilžu karuselis lapas apakšā — bildes no mapes public/media/izrades (saraksts: service-media.ts)
  const reel = SHOW_PHOTOS.map((p) => ({ ...p, alt: "Smaidu Darbnīcas izrāde", blur: null }));

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
        photos={[{ src: "/media/ziemassvetki-2025/ziemassvetki-2025-09.webp", caption: "Ziemassvētku izrāde" }]}
      >
        <ButtonLink href="#video" size="lg" arrow>
          Skatīties video
        </ButtonLink>
        <ButtonLink href={bookHref()} size="lg" variant="ghostLight">
          Rezervēt izrādi
        </ButtonLink>
      </StageHero>

      {shows.videos.length > 0 && (
        // "Kino" izkārtojumam — tumšs fons
        <section
          id="video"
          className={`scroll-mt-20 py-20 md:py-28 ${variant === "kino" ? "bg-ink text-white" : variant === "kartites" ? "bg-surface" : ""}`}
        >
          <Container>
            <StageHeading
              eyebrow={`${shows.videos.length} izrādes`}
              title={shows.videosTitle}
              highlight="izrādes"
              text="Noskatieties fragmentus un izvēlieties savam pasākumam piemērotāko."
              light={variant === "kino"}
              className="mb-14 md:mb-20"
            />
            <VideoShowcase
              variant={variant}
              videos={shows.videos}
              bookHref={shows.videos.map((v) => bookHref(v.title))}
            />
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
