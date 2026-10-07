import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import BookingForm from "@/components/site/BookingForm";
import Photo from "@/components/site/Photo";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getAlbumImages, getService, getSettings } from "@/lib/content/queries";
import { bookingPrices, eur, parseNotice } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const SLUG = "ziemassvetki-bernudarza";
const PATH = `/izklaides-programmas/${SLUG}`;
/** Bilde lapas galvenē (albuma "Ziemassvētki bērnudārzā" trešā bilde) */
const HERO_IMAGE = "/media/ziemassvetki-bernudarza/ziemassvetki-bernudarza-03.webp";

export async function generateMetadata() {
  const program = await getService("private", SLUG);
  if (!program) return {};
  return pageMetadata({
    path: PATH,
    title: program.seoTitle || program.title,
    description: program.seoDescription || program.excerpt,
    image: program.heroImage,
  });
}

/**
 * Lapa "Ziemassvētki bērnudārzā": piedāvājums un rezervācijas forma vienā lapā.
 * Saturs nāk no programmas ieraksta (panelī "Pakalpojumi" vai defaults/private-services.ts):
 *  - `excerpt` — lielais virsraksts, `intro` — teksts zem tā;
 *  - `activities` — abi varianti (nosaukums + apraksts), cena no `pricing` grupas ar to pašu nosaukumu;
 *  - `highlights` — kas iekļauts (abos variantos), `suitableFor` — piezīme zem tā (dāvaniņas nenodrošinām), `pricingNote` — piezīme pie cenas ("+ PVN + ceļa izdevumi");
 *  - `body` — aicinājums virs rezervācijas formas (pirmā rindkopa ir virsraksts) un sadaļa "## Svarīgi" —
 *    brīdinājums par kavēšanos (rāda formā zem datuma un laika un apstiprinājuma e-pastā).
 * Rezervācija: forma iestādēm (sk. BookingForm `institution`) — tikai izbraukums, cena bez PVN, bez izbraukuma piemaksas.
 */
export default async function KindergartenXmasPage() {
  const [program, settings, photos] = await Promise.all([getService("private", SLUG), getSettings(), getAlbumImages([SLUG], 6)]);
  if (!program) notFound();
  // Variantu kartīšu fona bildes — albuma bildes bez tās, kas jau ir lapas galvenē
  const gallery = photos.filter((p) => p.src !== HERO_IMAGE);

  // Virsraksts: pēdējais vārds ("bērnudārzā!") — dzeltenajā uzlīmē
  const words = program.excerpt.trim().split(/\s+/);
  const title = words.slice(0, -1).join(" ");
  const highlight = words.slice(-1)[0];

  // Aicinājums — apraksta daļa līdz pirmajai "## " sadaļai; brīdinājums — sadaļa "## Svarīgi"
  const [callTitle = "", ...callText] = program.body.split(/\n##\s/)[0].trim().split(/\n{2,}/);
  const notice = parseNotice(program.body);
  const callWords = callTitle.trim().split(/\s+/);

  return (
    <>
      <StageHero
        eyebrow={settings.home.xmasEyebrow}
        title={title}
        highlight={highlight}
        text={program.intro}
        crumbs={[
          { name: "Izklaides programmas", path: "/izklaides-programmas" },
          { name: program.title, path: PATH },
        ]}
        photos={[{ src: HERO_IMAGE, caption: program.title }]}
      >
        <ButtonLink href="#rezervacija" size="lg" arrow>
          Rezervēt
        </ButtonLink>
        <ButtonLink href="#programma" size="lg" variant="ghostLight">
          Programma un cenas
        </ButtonLink>
      </StageHero>

      {/* Abi varianti: apraksts, kas iekļauts, cena. Fonā — bilde no albuma (pa vienai katram variantam):
          kartītes augšā tā ir redzama, uz leju pāriet tumšā pārklājumā, uz kura ir teksts */}
      <Section id="programma" className="scroll-mt-20">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            {program.activities.map((a, i) => {
              const price = program.pricing.find((g) => g.title === a.title)?.options[0]?.price ?? null;
              const photo = gallery[i];
              return (
                <article
                  key={a.title}
                  data-reveal
                  style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
                  className="relative isolate flex flex-col overflow-hidden rounded-[1.75rem] bg-ink p-7 pt-60 text-white sm:p-9 sm:pt-72"
                >
                  {photo && (
                    <div className="absolute inset-x-0 top-0 -z-20 h-72 sm:h-[22rem]">
                      <Photo src={photo.src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_42%]" />
                      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink via-ink/45 via-40% to-ink/5" />
                    </div>
                  )}
                  <h2 className="display text-2xl sm:text-3xl">{a.title}</h2>
                  <p className="mt-4 text-lg leading-8 text-white/85">{a.description}</p>
                  {program.highlights.length > 0 && (
                    <ul className="mt-6 space-y-3">
                      {program.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3 font-semibold">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-ink">
                            <Check className="size-4" strokeWidth={3} aria-hidden />
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {program.suitableFor.map((note) => (
                    <p key={note} className="mt-4 text-sm text-white/70">
                      {note}
                    </p>
                  ))}
                  {price !== null && (
                    <p className="mt-auto pt-8 text-white/80">
                      <span className="mr-2 font-display text-4xl font-extrabold text-brand">{eur(price)}</span>
                      {program.pricingNote}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Rezervācija tajā pašā lapā */}
      <Section id="rezervacija" className="scroll-mt-20 pt-0 md:pt-0">
        <Container>
          {callTitle && (
            <StageHeading
              title={callWords.slice(0, -1).join(" ")}
              highlight={callWords.slice(-1)[0]}
              text={callText.join(" ")}
              className="mb-10 md:mb-12"
            />
          )}
          <BookingForm
            defaultProgram={SLUG}
            institution={{ nameLabel: "Bērnudārza nosaukums", addressLabel: "Bērnudārza adrese" }}
            notice={notice}
            prices={bookingPrices(settings)}
            programs={[{ slug: program.slug, title: program.title, image: program.heroImage, pricing: program.pricing }]}
          />
        </Container>
      </Section>
    </>
  );
}
