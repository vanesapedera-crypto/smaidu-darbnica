import { notFound, permanentRedirect } from "next/navigation";
import ServiceDetail from "@/components/site/ServiceDetail";
import { getAlbumImages, getService, getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

// Visas pakalpojumu lapas tiek ģenerētas iepriekš (statiski); jaunas — pēc pieprasījuma
export async function generateStaticParams() {
  const services = await getServices("business");
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = await getService("business", slug);
  if (!service) return {};
  return pageMetadata({
    path: `/uznemumiem/${slug}`,
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.excerpt,
    image: service.heroImage,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  // Izrādēm ir sava lapa
  if (slug === "izrades") permanentRedirect("/izrades");
  const [service, settings] = await Promise.all([getService("business", slug), getSettings()]);
  if (!service) notFound();

  const images = await getAlbumImages(service.albums, 12);

  return (
    <ServiceDetail
      service={service}
      images={images}
      contact={settings.contact}
    />
  );
}
