import Photo from "@/components/site/Photo";
import { StageHeading, StageHero } from "@/components/site/stage";
import { Container, Section } from "@/components/site/ui";
import { getSettings, getTeam } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export const revalidate = 3600;

export async function generateMetadata() {
  const { about } = await getSettings();
  return pageMetadata({ path: "/par-mums", title: "Par mums", description: about.intro, image: about.image });
}


export default async function AboutPage() {
  const [{ about }, team] = await Promise.all([getSettings(), getTeam()]);

  return (
    <>
      <StageHero
        eyebrow="Par mums"
        title={about.title}
        text={about.intro}
        crumbs={[{ name: "Par mums", path: "/par-mums" }]}
        photos={[
          { src: about.image, caption: "Smaidu Darbnīcas komanda" },
          { src: "/media/smaidu-darbnica/smaidu-darbnica-07.webp", caption: "Tēli" },
          { src: "/media/ziemassvetki-2025/ziemassvetki-2025-23.webp", caption: "Izrādes" },
        ]}
      />

      {/* Komanda — fotokartītes */}
      {team.length > 0 && (
        <Section>
          <Container>
            <StageHeading eyebrow="Komanda" title={about.teamTitle} text={about.teamText} />
            <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {team.map((m, i) => (
                <li key={m.id ?? `${m.name}-${i}`} data-reveal style={{ "--reveal-delay": `${(i % 4) * 70}ms` } as React.CSSProperties}>
                  {/* Viss (foto, vārds, amats, apraksts) vienā kartītē; kartītes vienā rindā vienāda augstuma */}
                  <figure className={cn("tilt-card m-0 h-full rounded-[20px] bg-white p-2.5 pb-5 shadow-[0_24px_40px_-26px_rgba(31,41,55,0.55)]", TILT[i % TILT.length])}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[13px] bg-surface">
                      {m.photo && (
                        <Photo
                          src={m.photo}
                          alt={`${m.name}, ${m.role}`}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                          className="object-cover object-top"
                        />
                      )}
                    </div>
                    <figcaption className="mx-1.5 mt-3">
                      <span className="block font-display text-base font-bold uppercase">{m.name}</span>
                      <span className="text-sm font-semibold text-ink-soft">{m.role}</span>
                      {m.bio && (
                        <p className="mt-3 hidden border-t border-ink/10 pt-3 text-sm leading-6 text-ink-soft sm:block">{m.bio}</p>
                      )}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

    </>
  );
}
