import { getT, setLocale } from "@/lib/i18n/server";
import { asLocale } from "@/lib/i18n/config";
import GoogleReviewsSection from "@/components/site/GoogleReviewsSection";
import ProgramCard from "@/components/site/ProgramCard";
import { reviewUrl } from "@/lib/review";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  return pageMetadata({
    path: "/izklaides-programmas",
    title: t("Izklaides programmas un bērnu ballītes"),
    description:
      t("Tematiskas bērnu ballītes ar animatoriem Tukumā un izbraukumā: glitteru, feju, pirātu, Nerf, SPA, Frozen, eksperimentu un citas programmas."),
  });
}

export default async function ProgramsPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  const [programs, settings] = await Promise.all([getServices("private"), getSettings()]);
  const { programs: page } = settings;

  return (
    <>
      <StageHero
        eyebrow={t("Izklaides programmas")}
        title={page.heroTitle}
        highlight={page.heroHighlight}
        text={page.heroText}
        crumbs={[{ name: t("Izklaides programmas"), path: "/izklaides-programmas" }]}
        photos={[
          { src: page.heroImage, caption: t("Bērnu ballīte") },
          { src: "/media/piratu-ballite/piratu-ballite-01.webp", caption: t("Pirātu ballīte") },
          { src: "/media/eksperimentu-ballite/eksperimentu-ballite-01.webp", caption: t("Eksperimenti") },
        ]}
      >
        <ButtonLink href="#programmas" size="lg" arrow>
          {t("Skatīt programmas")}
        </ButtonLink>
      </StageHero>

      <Section id="programmas" className="scroll-mt-20">
        <Container>
          <StageHeading eyebrow={t("{n} programmas", { n: programs.length })} title={t("Izvēlieties ballītes")} highlight={t("tēmu")} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p, i) => (
              <ProgramCard key={p.slug} program={p} index={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Google atsauksmes (ja ir GOOGLE_PLACES_API_KEY) */}
      <GoogleReviewsSection writeUrl={reviewUrl(settings.contact)} tone="surface" />
    </>
  );
}
