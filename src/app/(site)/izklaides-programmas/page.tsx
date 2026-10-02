import ProgramCard from "@/components/site/ProgramCard";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    path: "/izklaides-programmas",
    title: "Izklaides programmas un bērnu ballītes",
    description:
      "Tematiskas bērnu ballītes ar animatoriem Tukumā un izbraukumā: glitteru, feju, pirātu, Nerf, SPA, Frozen, eksperimentu un citas programmas.",
  });
}

export default async function ProgramsPage() {
  const [programs, settings] = await Promise.all([getServices("private"), getSettings()]);
  const { programs: page } = settings;

  return (
    <>
      <StageHero
        eyebrow="Izklaides programmas"
        title={page.heroTitle}
        highlight={page.heroHighlight}
        text={page.heroText}
        crumbs={[{ name: "Izklaides programmas", path: "/izklaides-programmas" }]}
        photos={[
          { src: page.heroImage, caption: "Bērnu ballīte" },
          { src: "/media/piratu-ballite/piratu-ballite-01.webp", caption: "Pirātu ballīte" },
          { src: "/media/eksperimentu-ballite/eksperimentu-ballite-01.webp", caption: "Eksperimenti" },
        ]}
      >
        <ButtonLink href="#programmas" size="lg" arrow>
          Skatīt programmas
        </ButtonLink>
      </StageHero>

      <Section id="programmas" className="scroll-mt-20">
        <Container>
          <StageHeading eyebrow={`${programs.length} programmas`} title="Izvēlieties ballītes" highlight="tēmu" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p, i) => (
              <ProgramCard key={p.slug} program={p} index={i} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
