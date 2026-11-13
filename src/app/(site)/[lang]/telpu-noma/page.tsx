import { getT, setLocale } from "@/lib/i18n/server";
import { asLocale } from "@/lib/i18n/config";
import VenueView from "@/components/site/VenueView";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  const { venue } = await getSettings();
  return pageMetadata({
    path: "/telpu-noma",
    title: t("Telpu noma svētkiem Tukumā"),
    description: t("Telpu noma bērnu dzimšanas dienām un ģimenes svētkiem Tukumā: bumbu baseins, rotaļu istaba, disko zāle un virtuve. No {price} € par 3 stundām.", { price: venue.priceWeekday }),
  });
}

export default async function VenuePage({ params }: { params: Promise<{ lang: string }> }) {
  setLocale(asLocale((await params).lang));
  return <VenueView />;
}
