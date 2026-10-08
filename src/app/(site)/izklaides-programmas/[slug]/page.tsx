import { notFound } from "next/navigation";
import ServiceDetail from "@/components/site/ServiceDetail";
import { isGroupProgram } from "@/lib/bookings";
import { getAlbumImages, getService, getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const programs = await getServices("private");
  // Programmām iestādēm ir sava lapa (piem. izklaides-programmas/ziemassvetki-bernudarza)
  return programs.filter((p) => !isGroupProgram(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const program = await getService("private", slug);
  if (!program) return {};
  return pageMetadata({
    path: `/izklaides-programmas/${slug}`,
    title: program.seoTitle || `${program.title} — izklaides programma`,
    description: program.seoDescription || program.excerpt,
    image: program.heroImage,
  });
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const [program, settings] = await Promise.all([getService("private", slug), getSettings()]);
  if (!program) notFound();

  const images = await getAlbumImages(program.albums, 16);

  return (
    <ServiceDetail
      service={program}
      images={images}
      settings={settings}
    />
  );
}
