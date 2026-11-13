import { getAlbumImages } from "@/lib/content/queries";
import { toReel } from "@/lib/content/media";
import PhotoReel from "./PhotoReel";
import { StageHeading } from "./stage";
import { Container } from "./ui";
import { getT } from "@/lib/i18n/server";

/**
 * Programmas lapas sadaļa "Foto" — attēli, kas panelī pievienoti pie programmas (albums ar programmas adresi).
 * Ja attēlu nav, sadaļa netiek rādīta. `exclude` — attēli, kas lapā jau redzami (piem. galvenē).
 */
export default async function ProgramPhotos({ slug, exclude = [], className = "bg-surface" }: { slug: string; exclude?: string[]; className?: string }) {
  const t = getT();
  const images = (await getAlbumImages([slug], 16)).filter((i) => !exclude.includes(i.src));
  if (images.length === 0) return null;
  return (
    <section className={`overflow-hidden pt-20 pb-12 md:pt-28 ${className}`}>
      <Container>
        <StageHeading eyebrow={t("Foto")} title={t("No mūsu")} highlight={t("pasākumiem")} />
      </Container>
      <PhotoReel images={toReel(images)} />
    </section>
  );
}
