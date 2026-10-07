import VenueView from "@/components/site/VenueView";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  const { venue } = await getSettings();
  return pageMetadata({
    path: "/telpu-noma",
    title: "Telpu noma svētkiem Tukumā",
    description: `Telpu noma bērnu dzimšanas dienām un ģimenes svētkiem Tukumā: bumbu baseins, rotaļu istaba, disko zāle un virtuve. No ${venue.priceWeekday} € par 3 stundām.`,
  });
}

export default async function VenuePage() {
  return <VenueView />;
}
