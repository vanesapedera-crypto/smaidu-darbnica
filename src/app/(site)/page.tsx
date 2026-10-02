import Photo from "@/components/site/Photo";
import { XmasBanner } from "@/components/site/XmasFeature";
import { DoorCard, LineTitle } from "@/components/site/motion";
import { heroLayoutClass } from "@/components/site/stage";
import { ButtonLink, Container } from "@/components/site/ui";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({ path: "/" });
}

const DOORS = [
  {
    href: "/uznemumiem",
    tag: "Uzņēmumiem",
    title: "Visu veidu pasākumi",
    text: "Uzņēmumu, pilsētu un skolu svētki, Ziemassvētku un vasaras pasākumi, radošās darbnīcas un lielformāta spēles.",
    image: "/media/smaidu-darbnica/uznemumiem-kartite-v2.webp",
  },
  {
    href: "/izrades",
    tag: "Izrādes",
    title: "Izrādes visai ģimenei",
    text: "Interaktīvas izrādes uz skatuves — Ziemassvētku un vasaras uzvedumi.",
    image: "/media/izrades/izrade-09.webp",
  },
  {
    href: "/izklaides-programmas",
    tag: "Privātpersonām",
    title: "Bērnu ballītes",
    text: "Tematiskas bērnu ballītes ar animatoriem mūsu telpās vai pie jums.",
    image: "/media/tukuma-rozu-svetki-2025/tukuma-rozu-svetki-2025-08.webp",
  },
  {
    href: "/telpu-noma",
    tag: "Tukums",
    title: "Telpu noma",
    text: "Bumbu baseins, disko zāle un virtuve Tukuma centrā.",
    image: "/media/telpas/telpas-03.webp",
  },
];

/**
 * Sākumlapa ("Skatuve" + 3D kustība):
 *  1) galvene ar vienu lielu fotogrāfiju pa visu platumu (parallakse ritinot);
 *  2) četras sadaļas — 3D kartītes;
 *  3) sezonas reklāma.
 */
export default async function HomePage() {
  const { home } = await getSettings();
  // Viena galvenes fotogrāfija (panelī: Sākumlapa → "Galvenes fotogrāfija")
  const photo = home.heroPoster ? { src: home.heroPoster } : home.heroPhotos[0];

  return (
    <>
      {/* 1. Galvene: viena liela fotogrāfija pa visu platumu, teksts virs tās */}
      <section data-scroll className={`home-hero relative isolate flex min-h-[600px] items-end overflow-hidden bg-ink text-white h-[calc(100svh-5rem)] max-h-[900px] ${heroLayoutClass}`}>
        {photo && (
          // Parallakse: bilde ritinot kustas lēnāk par lapu; viegla "ietālināšanās" ielādē
          // Bilde iet tikai 30 px pāri malām — jo mazāk to palielina, jo asāka tā ir
          <div className="hero-photo parallax absolute inset-x-0 -z-20" style={{ top: -30, bottom: -30, ...({ "--speed": "60px" } as React.CSSProperties) }}>
            <Photo src={photo.src} alt="" fill preload sizes="100vw" quality={85} className="animate-hero-zoom object-cover" />
          </div>
        )}
        <div aria-hidden className="hero-shade absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/55 to-ink/10" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-ink/80 to-transparent" />

        <Container className="pb-16 md:pb-24">
          <div className="max-w-3xl">
            <p className="fade-up mb-5 text-sm font-extrabold tracking-[0.14em] text-brand uppercase [--d:50ms]">
              {home.xmasEnabled ? `${home.xmasEyebrow} · rezervācijas atvērtas` : home.heroEyebrow}
            </p>
            <LineTitle
              className="text-[2.6rem] sm:text-6xl lg:text-7xl xl:text-[5.6rem]"
              lines={[
                home.heroTitle,
                <>
                  {home.heroHighlight && <span className="sticker-light">{home.heroHighlight}</span>} {home.heroAfter}
                </>,
              ]}
            />
            {/* Telefonā — īsākā teksta versija (ja tāda ir), lielākos ekrānos — pilnais teksts (sk. globals.css) */}
            <p className="fade-up mt-7 max-w-xl text-lg leading-8 text-white/85 [--d:550ms] md:text-xl md:leading-9">
              {home.heroTextMobile ? (
                <>
                  <span className="narrow-only">{home.heroTextMobile}</span>
                  <span className="wide-only">{home.heroText}</span>
                </>
              ) : (
                home.heroText
              )}
            </p>
            <div className="fade-up mt-9 flex flex-wrap gap-3 [--d:700ms]">
              <ButtonLink href="/uznemumiem" size="lg" arrow>
                Uzņēmumiem
              </ButtonLink>
              <ButtonLink href="/izklaides-programmas" size="lg" variant="ghostLight">
                Bērnu ballītes
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Sadaļas — 3D kartītes */}
      <section aria-labelledby="sadalas" className="py-16 md:py-24">
        <Container>
          <div data-reveal className="mb-12 md:mb-16">
            <p className="mb-4 text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase">Sadaļas</p>
            <h2 id="sadalas" className="display text-4xl sm:text-5xl md:text-6xl">
              Ko pie mums <span className="sticker">atradīsiet</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DOORS.map((d, i) => (
              <DoorCard key={d.href} {...d} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <XmasBanner home={home} />
    </>
  );
}
